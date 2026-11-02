// Testes de integração (node --test). Usam um db temporário, nunca o db.json real.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "savestate-"));
process.env.DB_PATH = path.join(tmp, "db.json");
process.env.SEGREDO = "segredo-de-teste";

const store = await import("../store.js");
const { createApp } = await import("../app.js");

let server;
let base;

const address = {
  postal_code: "20271-110",
  street: "Av. Maracanã",
  number: "229",
  complement: "",
  neighborhood: "Maracanã",
  city: "Rio de Janeiro",
  state: "RJ",
};

async function call(method, url, { token, body } = {}) {
  const res = await fetch(base + url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

async function signup(handle) {
  const email = `${handle.toLowerCase()}@cefet.br`;
  const reg = await call("POST", "/usuarios", {
    body: { handle, email, password: "segredo123", shipping_address: address },
  });
  const login = await call("POST", "/login", { body: { email, password: "segredo123" } });
  return { id: reg.body.id, token: login.body.token, reg };
}

let ana;
let bruno;

before(async () => {
  store.reset({
    games: [
      { id: "game-gta6", title: "GTA VI", platform: "PS5 (DISC)" },
      { id: "game-002", title: "Chrono Trigger", platform: "SNES (CART)" },
    ],
  });
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://localhost:${server.address().port}`;
  ana = await signup("Ana");
  bruno = await signup("Bruno");
});

after(() => {
  server?.close();
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("aceite 01: cadastro responde 201 sem a senha e grava hash", () => {
  assert.equal(ana.reg.status, 201);
  assert.equal(ana.reg.body.password, undefined);
  assert.equal(ana.reg.body.password_hash, undefined);
  const saved = store.get("profiles", ana.id);
  assert.match(saved.password_hash, /^\$2[aby]\$/);
});

test("cadastro com e-mail repetido responde 409", async () => {
  const res = await call("POST", "/usuarios", {
    body: { handle: "Outra", email: "ana@cefet.br", password: "segredo123", shipping_address: address },
  });
  assert.equal(res.status, 409);
});

test("aceite 02: login certo devolve token; errado responde 401", async () => {
  assert.ok(ana.token);
  const bad = await call("POST", "/login", { body: { email: "ana@cefet.br", password: "errada" } });
  assert.equal(bad.status, 401);
});

test("aceite 03: lista protegida sem Bearer responde 401; token adulterado também", async () => {
  assert.equal((await call("GET", "/offers")).status, 401);
  assert.equal((await call("GET", "/offers", { token: ana.token + "x" })).status, 401);
});

test("perfil público não expõe e-mail, endereço nem hash", async () => {
  const res = await call("GET", "/profiles");
  const pub = res.body.find((p) => p.id === ana.id);
  assert.equal(pub.email, undefined);
  assert.equal(pub.shipping_address, undefined);
  assert.equal(pub.password_hash, undefined);
});

test("anúncio: dono vem do token; outro usuário toma 403; id inexistente 404", async () => {
  const created = await call("POST", "/products", {
    token: ana.token,
    body: { game_id: "game-002", price: 300, seller_id: bruno.id },
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.seller_id, ana.id);
  assert.equal(created.body.title, "Chrono Trigger");

  const alheio = await call("PATCH", `/products/${created.body.id}`, { token: bruno.token, body: { price: 1 } });
  assert.equal(alheio.status, 403);
  const inexistente = await call("PATCH", "/products/nao-existe", { token: bruno.token, body: { price: 1 } });
  assert.equal(inexistente.status, 404);
});

test("aceite 04/05: cada pessoa vê as próprias notificações; item alheio responde 403", async () => {
  const offer = store.list("products")[0];
  const res = await call("POST", "/offers", { token: bruno.token, body: { product_id: offer.id, offered_price: 250 } });
  assert.equal(res.status, 201);

  const anaNotes = await call("GET", "/notifications", { token: ana.token });
  const brunoNotes = await call("GET", "/notifications", { token: bruno.token });
  assert.ok(anaNotes.body.length >= 1);
  assert.equal(brunoNotes.body.length, 0);

  const alheia = await call("PATCH", `/notifications/${anaNotes.body[0].id}`, { token: bruno.token, body: { read: true } });
  assert.equal(alheia.status, 403);
  assert.equal((await call("POST", "/notifications", { token: ana.token, body: {} })).status, 403);
});

test("negociação: não aceita a própria proposta; dono não negocia consigo", async () => {
  const offer = store.list("offers")[0];
  const self = await call("PATCH", `/offers/${offer.id}`, { token: bruno.token, body: { status: "ACCEPTED" } });
  assert.equal(self.status, 403);
  const own = await call("POST", "/offers", { token: ana.token, body: { product_id: offer.product_id, offered_price: 10 } });
  assert.equal(own.status, 403);
  const ok = await call("PATCH", `/offers/${offer.id}`, { token: ana.token, body: { status: "ACCEPTED" } });
  assert.equal(ok.status, 200);
  const closed = await call("POST", "/messages", { token: bruno.token, body: { offer_id: offer.id, text: "oi" } });
  assert.equal(closed.status, 409);
});

test("alerta por título: GTA VI até R$ 200 dispara com anúncio de 'G.T.A. VI' a R$ 199", async () => {
  const alert = await call("POST", "/price_alerts", { token: bruno.token, body: { title: "G.T.A. VI", target_price: 200 } });
  assert.equal(alert.status, 201);
  assert.equal(alert.body.active, true);

  await call("POST", "/products", { token: ana.token, body: { game_id: "game-gta6", price: 250 } });
  assert.equal(store.get("price_alerts", alert.body.id).active, true);

  const cheap = await call("POST", "/products", { token: ana.token, body: { game_id: "game-gta6", price: 199 } });
  const fired = store.get("price_alerts", alert.body.id);
  assert.equal(fired.active, false);
  assert.equal(fired.triggered_product_id, cheap.body.id);
  const notes = await call("GET", "/notifications", { token: bruno.token });
  assert.ok(notes.body.some((n) => n.type === "PRICE_ALERT"));
});

test("pedido: servidor calcula total, só o comprador aprova e o anúncio sai do catálogo", async () => {
  const product = store.list("products").find((p) => p.title === "GTA VI" && p.price === 250);
  const order = await call("POST", "/orders", {
    token: bruno.token,
    body: { items: [{ product_id: product.id, quantity: 1 }], total: 1, buyer_id: ana.id },
  });
  assert.equal(order.status, 201);
  assert.equal(order.body.total, 250);
  assert.equal(order.body.buyer_id, bruno.id);

  const sellerTry = await call("PATCH", `/orders/${order.body.id}`, { token: ana.token, body: { status: "approved" } });
  assert.equal(sellerTry.body.status, "pending");
  const approved = await call("PATCH", `/orders/${order.body.id}`, { token: bruno.token, body: { status: "approved" } });
  assert.equal(approved.body.status, "approved");
  assert.equal(store.get("products", product.id), null);

  const again = await call("PATCH", `/orders/${order.body.id}`, { token: bruno.token, body: { status: "approved" } });
  assert.equal(again.status, 409);
});

test("reembolso: vendedor cancela entrega, conta bloqueia e libera ao pagar", async () => {
  const order = store.list("orders")[0];
  const refund = await call("POST", "/refunds", { token: ana.token, body: { order_id: order.id, amount: 1 } });
  assert.equal(refund.status, 201);
  assert.equal(refund.body.amount, 250);
  assert.equal(store.get("profiles", ana.id).account_status, "refund_pending");

  const blocked = await call("POST", "/products", { token: ana.token, body: { game_id: "game-002", price: 10 } });
  assert.equal(blocked.status, 403);
  const buyerTry = await call("POST", "/refunds", { token: bruno.token, body: { order_id: order.id } });
  assert.equal(buyerTry.status, 403);

  const paid = await call("PATCH", `/refunds/${refund.body.id}`, { token: ana.token, body: { status: "paid" } });
  assert.equal(paid.status, 200);
  assert.equal(store.get("profiles", ana.id).account_status, "active");
});

test("PATCH /usuarios/me ignora account_status vindo do cliente", async () => {
  store.update("profiles", bruno.id, { account_status: "refund_pending" });
  const res = await call("PATCH", "/usuarios/me", { token: bruno.token, body: { account_status: "active" } });
  assert.equal(res.body.account_status, "refund_pending");
  store.update("profiles", bruno.id, { account_status: "active" });
});

test("alerta: jogo do catálogo não aceita plataforma em que não existe", async () => {
  const bad = await call("POST", "/price_alerts", {
    token: bruno.token,
    body: { title: "Chrono Trigger", platform: "PS2 (DISC)", target_price: 50 },
  });
  assert.equal(bad.status, 400);
  assert.equal(bad.body.field, "platform");
  const ok = await call("POST", "/price_alerts", {
    token: bruno.token,
    body: { title: "Jogo Fora Do Catalogo", platform: "PS2 (DISC)", target_price: 50 },
  });
  assert.equal(ok.status, 201);
});
