// Testes de integração (node --test). Usam um db temporário, nunca o db.json real.
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "savestate-"));
process.env.DB_PATH = path.join(tmp, "db.json");
process.env.SEGREDO = "segredo-de-teste-com-pelo-menos-32-caracteres";

const store = await import("../store.js");
const { createApp } = await import("../app.js");
const { resetLoginLimiter, problemaDoSegredo } = await import("../auth.js");
const { garantirAdmin, migrate } = await import("../migrate.js");
const { resetConsultaTicketLimiter } = await import("../resources.js");
const { resetAllLimiters } = await import("../rateLimit.js");

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
let admin;

before(async () => {
  store.reset({
    games: [
      { id: "game-gta6", title: "GTA VI", platform: "PS5 (DISC)" },
      { id: "game-002", title: "Chrono Trigger", platform: "SNES (CART)" },
    ],
  });
  await garantirAdmin();
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://localhost:${server.address().port}`;
  ana = await signup("Ana");
  bruno = await signup("Bruno");
  const adminLogin = await call("POST", "/login", { body: { email: "admin", password: "admin" } });
  admin = { token: adminLogin.body.token };
});

// Os limites por IP (cadastro, tickets de visitante, login) valem para o arquivo todo, já que
// todas as requisições saem do mesmo IP; cada cenário começa com os contadores zerados.
beforeEach(() => resetAllLimiters());

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

test("reembolso: vendedor confirma o pagamento, mas só o admin libera a conta", async () => {
  const order = store.list("orders")[0];
  const refund = await call("POST", "/refunds", { token: ana.token, body: { order_id: order.id, amount: 1 } });
  assert.equal(refund.status, 201);
  assert.equal(refund.body.amount, 250);
  assert.equal(store.get("profiles", ana.id).account_status, "refund_pending");

  const blocked = await call("POST", "/products", { token: ana.token, body: { game_id: "game-002", price: 10 } });
  assert.equal(blocked.status, 403);
  const buyerTry = await call("POST", "/refunds", { token: bruno.token, body: { order_id: order.id } });
  assert.equal(buyerTry.status, 403);

  // Admin não libera reembolso ainda pendente.
  const cedo = await call("PATCH", `/admin/refunds/${refund.body.id}/liberar`, { token: admin.token });
  assert.equal(cedo.status, 409);
  assert.equal(cedo.body.message, "Só é possível liberar reembolsos já confirmados pelo vendedor.");

  const paid = await call("PATCH", `/refunds/${refund.body.id}`, { token: ana.token, body: { status: "paid" } });
  assert.equal(paid.status, 200);
  assert.equal(paid.body.status, "paid");
  assert.equal(store.get("profiles", ana.id).account_status, "refund_pending");
  const aindaBloqueada = await call("POST", "/products", { token: ana.token, body: { game_id: "game-002", price: 10 } });
  assert.equal(aindaBloqueada.status, 403);
  const avisoVendedor = await call("GET", "/notifications", { token: ana.token });
  assert.ok(avisoVendedor.body.some((n) => /aguarda a liberação do administrador/.test(n.body)));

  // Duplicidade por pedido continua barrada, mesmo depois de pago.
  const denovo = await call("POST", "/refunds", { token: ana.token, body: { order_id: order.id } });
  assert.equal(denovo.status, 409);

  const comum = await call("PATCH", `/admin/refunds/${refund.body.id}/liberar`, { token: ana.token });
  assert.equal(comum.status, 403);
  const inexistente = await call("PATCH", "/admin/refunds/nao-existe/liberar", { token: admin.token });
  assert.equal(inexistente.status, 404);

  const lista = await call("GET", "/admin/refunds", { token: admin.token });
  assert.ok(lista.body.some((r) => r.id === refund.body.id));

  const liberado = await call("PATCH", `/admin/refunds/${refund.body.id}/liberar`, { token: admin.token });
  assert.equal(liberado.status, 200);
  assert.equal(liberado.body.status, "released");
  assert.ok(liberado.body.released_at);
  assert.equal(store.get("profiles", ana.id).account_status, "active");

  const duasVezes = await call("PATCH", `/admin/refunds/${refund.body.id}/liberar`, { token: admin.token });
  assert.equal(duasVezes.status, 409);
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

// ---------------------------------------------------------------- Correções do relatório 2026-11-03

test("avaliação: sem transação responde 403; com pedido aprovado responde 201 (nas duas direções)", async () => {
  const carla = await signup("Carla");
  const davi = await signup("Davi");

  const semTroca = await call("POST", "/profile_reviews", {
    token: carla.token,
    body: { profile_id: davi.id, rating: 1, comment: "Nunca negociei com ele." },
  });
  assert.equal(semTroca.status, 403);
  assert.equal(semTroca.body.message, "Você só pode avaliar usuários com quem concluiu uma transação.");

  // Pedido só pendente ainda não conta.
  const product = await call("POST", "/products", { token: davi.token, body: { game_id: "game-002", price: 120 } });
  const order = await call("POST", "/orders", { token: carla.token, body: { items: [{ product_id: product.body.id, quantity: 1 }] } });
  assert.equal(order.status, 201);
  const pendente = await call("POST", "/profile_reviews", {
    token: carla.token,
    body: { profile_id: davi.id, rating: 5, comment: "Ainda não paguei." },
  });
  assert.equal(pendente.status, 403);

  await call("PATCH", `/orders/${order.body.id}`, { token: carla.token, body: { status: "approved" } });
  const compradora = await call("POST", "/profile_reviews", {
    token: carla.token,
    body: { profile_id: davi.id, rating: 5, comment: "Entrega perfeita." },
  });
  assert.equal(compradora.status, 201);
  assert.equal(compradora.body.badge, "[VERIFIED_TRADE]");
  assert.equal(compradora.body.author_id, carla.id);

  const vendedor = await call("POST", "/profile_reviews", {
    token: davi.token,
    body: { profile_id: carla.id, rating: 4, comment: "Pagou rápido." },
  });
  assert.equal(vendedor.status, 201);

  // Terceiro sem transação também não edita avaliação legada sem troca.
  const legada = store.insert("profile_reviews", {
    id: "REV-legada", profile_id: davi.id, author_id: ana.id, rating: 2, comment: "Antiga", badge: "[VERIFIED_TRADE]",
  });
  const editLegada = await call("PATCH", `/profile_reviews/${legada.id}`, { token: ana.token, body: { rating: 1 } });
  assert.equal(editLegada.status, 403);
  store.remove("profile_reviews", legada.id);
});

test("ticket: visitante precisa de contact_email válido; logado não precisa", async () => {
  const ticket = {
    category: "PAGAMENTO",
    priority: "LOW",
    subject: "Dúvida sobre PIX",
    description: "Não entendi como funciona o pagamento.",
  };
  const semEmail = await call("POST", "/tickets", { body: ticket });
  assert.equal(semEmail.status, 400);
  assert.equal(semEmail.body.field, "contact_email");

  const emailRuim = await call("POST", "/tickets", { body: { ...ticket, contact_email: "nao-e-email" } });
  assert.equal(emailRuim.status, 400);
  assert.equal(emailRuim.body.field, "contact_email");

  const visitante = await call("POST", "/tickets", { body: { ...ticket, contact_email: " Visitante@Exemplo.com " } });
  assert.equal(visitante.status, 201);
  assert.equal(visitante.body.contact_email, "visitante@exemplo.com");
  assert.equal(store.get("tickets", visitante.body.id).contact_email, "visitante@exemplo.com");

  const logado = await call("POST", "/tickets", { token: ana.token, body: ticket });
  assert.equal(logado.status, 201);
  assert.equal(logado.body.author_id, ana.id);
});

test("negociação aceita não pode ser excluída (409); a outra parte ainda toma 403 antes", async () => {
  const accepted = store.find("offers", (o) => o.status === "ACCEPTED")[0];
  assert.ok(accepted);
  const intruso = await signup("Intruso");
  const alheio = await call("DELETE", `/offers/${accepted.id}`, { token: intruso.token });
  assert.equal(alheio.status, 403);
  const inexistente = await call("DELETE", "/offers/nao-existe", { token: ana.token });
  assert.equal(inexistente.status, 404);
  const res = await call("DELETE", `/offers/${accepted.id}`, { token: ana.token });
  assert.equal(res.status, 409);
  assert.equal(res.body.message, "Negociações aceitas não podem ser excluídas.");
  assert.ok(store.get("offers", accepted.id));
});

test("_limit inválido é ignorado em vez de esvaziar a lista", async () => {
  const todos = await call("GET", "/products");
  assert.ok(todos.body.length > 0);
  for (const limit of ["abc", "0", "-1"]) {
    const res = await call("GET", `/products?_limit=${limit}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.length, todos.body.length);
  }
  const um = await call("GET", "/products?_limit=1");
  assert.equal(um.body.length, 1);
});

test("login: 429 na 6ª falha seguida; sucesso zera o contador", async () => {
  resetLoginLimiter();
  const user = await signup("Limite");
  const email = "limite@cefet.br";
  try {
    for (let i = 0; i < 4; i += 1) {
      assert.equal((await call("POST", "/login", { body: { email, password: "errada" } })).status, 401);
    }
    // Sucesso antes da 5ª falha zera o contador.
    assert.equal((await call("POST", "/login", { body: { email, password: "segredo123" } })).status, 200);
    for (let i = 0; i < 5; i += 1) {
      assert.equal((await call("POST", "/login", { body: { email: "LIMITE@cefet.br", password: "errada" } })).status, 401);
    }
    const bloqueado = await call("POST", "/login", { body: { email, password: "errada" } });
    assert.equal(bloqueado.status, 429);
    assert.equal(bloqueado.body.message, "Muitas tentativas de login. Tente novamente em alguns minutos.");
    // Durante a janela, nem a senha certa entra; outro e-mail segue normal.
    assert.equal((await call("POST", "/login", { body: { email, password: "segredo123" } })).status, 429);
    assert.equal((await call("POST", "/login", { body: { email: "ana@cefet.br", password: "segredo123" } })).status, 200);
    assert.ok(user.token);
  } finally {
    resetLoginLimiter();
  }
});

test("SEGREDO ausente, de exemplo ou curto é recusado", () => {
  assert.match(problemaDoSegredo(""), /não definido/);
  assert.match(problemaDoSegredo("troque-por-um-segredo"), /valor de exemplo/);
  assert.match(problemaDoSegredo("curto"), /pelo menos 32/);
  assert.equal(problemaDoSegredo("x".repeat(32)), null);
});

// ---------------------------------------------------------------- Admin, denúncias e #17

test("admin: entra com admin/admin; role vem no /usuarios/me e some do perfil público", async () => {
  assert.ok(admin.token);
  const me = await call("GET", "/usuarios/me", { token: admin.token });
  assert.equal(me.body.role, "admin");
  assert.equal(me.body.password_hash, undefined);
  const publicos = await call("GET", "/profiles");
  assert.ok(publicos.body.every((p) => p.role === undefined));
  // garantirAdmin é idempotente.
  assert.equal(await garantirAdmin(), false);
  assert.equal(store.find("profiles", (p) => p.role === "admin").length, 1);
});

test("admin: cliente não consegue se promover a admin", async () => {
  const reg = await call("POST", "/usuarios", {
    body: { handle: "Esperto", email: "esperto@cefet.br", password: "segredo123", shipping_address: address, role: "admin" },
  });
  assert.equal(reg.status, 201);
  assert.equal(store.get("profiles", reg.body.id).role, undefined);
  const login = await call("POST", "/login", { body: { email: "esperto@cefet.br", password: "segredo123" } });
  const patch = await call("PATCH", "/usuarios/me", { token: login.body.token, body: { role: "admin" } });
  assert.equal(patch.body.role, undefined);
  const viaProfiles = await call("PATCH", `/profiles/${reg.body.id}`, { token: login.body.token, body: { role: "admin" } });
  assert.equal(viaProfiles.body.role, undefined);
  assert.equal((await call("GET", "/admin/tickets", { token: login.body.token })).status, 403);
});

test("admin: sem token 401; usuário comum 403 em /admin/*", async () => {
  for (const [method, url] of [
    ["GET", "/admin/tickets"],
    ["PATCH", "/admin/tickets/x"],
    ["GET", "/admin/refunds"],
    ["PATCH", "/admin/refunds/x/liberar"],
    ["GET", "/admin/reports"],
    ["PATCH", "/admin/reports/x"],
    ["DELETE", "/admin/products/x"],
  ]) {
    assert.equal((await call(method, url)).status, 401, `${method} ${url} sem token`);
    const comum = await call(method, url, { token: bruno.token, body: method === "GET" ? undefined : {} });
    assert.equal(comum.status, 403, `${method} ${url} usuário comum`);
    assert.equal(comum.body.message, "Acesso restrito ao administrador.");
  }
});

test("admin: responde ticket, troca status e notifica o autor logado", async () => {
  const ticket = await call("POST", "/tickets", {
    token: bruno.token,
    body: { category: "PAGAMENTO", priority: "HIGH", subject: "PIX não caiu", description: "Paguei o PIX e o pedido segue pendente." },
  });
  const todos = await call("GET", "/admin/tickets", { token: admin.token });
  assert.ok(todos.body.some((t) => t.id === ticket.body.id));
  assert.ok(todos.body.some((t) => t.author_id === "GUEST_SESSION" && t.contact_email));

  const vazio = await call("PATCH", `/admin/tickets/${ticket.body.id}`, { token: admin.token, body: {} });
  assert.equal(vazio.status, 400);
  const ruim = await call("PATCH", `/admin/tickets/${ticket.body.id}`, { token: admin.token, body: { status: "XYZ" } });
  assert.equal(ruim.status, 400);
  assert.equal(ruim.body.field, "status");
  const sumido = await call("PATCH", "/admin/tickets/nao-existe", { token: admin.token, body: { status: "CLOSED" } });
  assert.equal(sumido.status, 404);

  const resp = await call("PATCH", `/admin/tickets/${ticket.body.id}`, {
    token: admin.token,
    body: { status: "IN_PROGRESS", admin_reply: "Estamos verificando com o banco." },
  });
  assert.equal(resp.status, 200);
  assert.equal(resp.body.status, "IN_PROGRESS");
  assert.equal(resp.body.admin_reply, "Estamos verificando com o banco.");
  assert.ok(resp.body.replied_at);
  assert.ok(resp.body.updated_at);

  const fechado = await call("PATCH", `/admin/tickets/${ticket.body.id}`, { token: admin.token, body: { status: "CLOSED" } });
  assert.equal(fechado.body.status, "CLOSED");

  const notas = await call("GET", "/notifications", { token: bruno.token });
  assert.ok(notas.body.some((n) => n.type === "TICKET" && n.body.includes("Estamos verificando")));
});

test("denúncia: 201, 403 no próprio anúncio, 409 duplicada, 404 inexistente, 400 motivo inválido", async () => {
  const prod = await call("POST", "/products", { token: bruno.token, body: { game_id: "game-002", price: 90 } });
  assert.equal(prod.status, 201);

  assert.equal((await call("POST", "/reports", { body: { product_id: prod.body.id, reason: "GOLPE" } })).status, 401);

  const ok = await call("POST", "/reports", {
    token: ana.token,
    body: { product_id: prod.body.id, reason: "FALSIFICADO", details: "Cartucho com etiqueta impressa.", reporter_id: bruno.id },
  });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.status, "OPEN");
  assert.equal(ok.body.reporter_id, ana.id);
  assert.equal(ok.body.reporter_handle, "@Ana");
  assert.equal(ok.body.seller_id, bruno.id);
  assert.equal(ok.body.seller_handle, "@Bruno");
  assert.equal(ok.body.product_title, "Chrono Trigger");

  const propria = await call("POST", "/reports", { token: bruno.token, body: { product_id: prod.body.id, reason: "OUTRO" } });
  assert.equal(propria.status, 403);
  const dup = await call("POST", "/reports", { token: ana.token, body: { product_id: prod.body.id, reason: "GOLPE" } });
  assert.equal(dup.status, 409);
  assert.equal(dup.body.message, "Você já denunciou este anúncio.");
  const nada = await call("POST", "/reports", { token: ana.token, body: { product_id: "nao-existe", reason: "GOLPE" } });
  assert.equal(nada.status, 404);
  const motivo = await call("POST", "/reports", { token: ana.token, body: { product_id: prod.body.id, reason: "CHATO" } });
  assert.equal(motivo.status, 400);
  assert.equal(motivo.body.field, "reason");
  const longo = await call("POST", "/reports", {
    token: ana.token,
    body: { product_id: prod.body.id, reason: "OUTRO", details: "x".repeat(501) },
  });
  assert.equal(longo.status, 400);
  assert.equal(longo.body.field, "details");

  // Não há listagem pública de denúncias.
  assert.equal((await call("GET", "/reports", { token: ana.token })).status, 404);

  // Admin arquiva; depois disso a mesma pessoa pode denunciar de novo.
  const arquivada = await call("PATCH", `/admin/reports/${ok.body.id}`, { token: admin.token, body: { status: "DISMISSED" } });
  assert.equal(arquivada.status, 200);
  assert.equal(arquivada.body.status, "DISMISSED");
  assert.ok(arquivada.body.resolved_at);
  const outraVez = await call("PATCH", `/admin/reports/${ok.body.id}`, { token: admin.token, body: { status: "DISMISSED" } });
  assert.equal(outraVez.status, 409);
  const invalida = await call("PATCH", `/admin/reports/${ok.body.id}`, { token: admin.token, body: { status: "OPEN" } });
  assert.equal(invalida.status, 400);
  const nova = await call("POST", "/reports", { token: ana.token, body: { product_id: prod.body.id, reason: "GOLPE" } });
  assert.equal(nova.status, 201);
});

test("admin remove anúncio denunciado: cascata, denúncias resolvidas e vendedor avisado", async () => {
  const prod = await call("POST", "/products", { token: bruno.token, body: { game_id: "game-gta6", price: 400 } });
  const offer = await call("POST", "/offers", { token: ana.token, body: { product_id: prod.body.id, offered_price: 350 } });
  assert.equal(offer.status, 201);
  await call("POST", "/messages", { token: ana.token, body: { offer_id: offer.body.id, text: "Faz por 350?" } });
  assert.ok(store.find("messages", (m) => m.offer_id === offer.body.id).length);

  const rep = await call("POST", "/reports", { token: ana.token, body: { product_id: prod.body.id, reason: "GOLPE" } });
  const lista = await call("GET", "/admin/reports", { token: admin.token });
  assert.equal(lista.body[0].status, "OPEN");
  assert.equal(lista.body.find((r) => r.id === rep.body.id).product_exists, true);

  assert.equal((await call("DELETE", "/admin/products/nao-existe", { token: admin.token })).status, 404);
  const del = await call("DELETE", `/admin/products/${prod.body.id}`, { token: admin.token });
  assert.equal(del.status, 200);
  assert.equal(store.get("products", prod.body.id), null);
  assert.equal(store.get("offers", offer.body.id), null);
  assert.equal(store.find("messages", (m) => m.offer_id === offer.body.id).length, 0);
  const resolvida = store.get("reports", rep.body.id);
  assert.equal(resolvida.status, "RESOLVED_REMOVED");
  assert.ok(resolvida.resolved_at);
  assert.equal(resolvida.product_title, "GTA VI");

  const depois = await call("GET", "/admin/reports", { token: admin.token });
  assert.equal(depois.body.find((r) => r.id === rep.body.id).product_exists, false);
  const notas = await call("GET", "/notifications", { token: bruno.token });
  assert.ok(notas.body.some((n) => n.title === "Anúncio removido"));
});

test("#17: 20 logins errados em paralelo geram no máximo 5 respostas 401; o resto é 429", async () => {
  resetLoginLimiter();
  await signup("Paralelo");
  try {
    const respostas = await Promise.all(
      Array.from({ length: 20 }, () =>
        call("POST", "/login", { body: { email: "paralelo@cefet.br", password: "errada" } }),
      ),
    );
    const status = respostas.map((r) => r.status);
    const n401 = status.filter((s) => s === 401).length;
    assert.ok(n401 <= 5, `401 demais: ${n401}`);
    assert.equal(n401 + status.filter((s) => s === 429).length, 20);
  } finally {
    resetLoginLimiter();
  }
});

test("migração: 'paid' legado vira 'released'; 'paid' do fluxo novo fica intacto", async () => {
  const legado = await signup("Legado");
  const novo = await signup("Novo");
  store.update("profiles", novo.id, { account_status: "refund_pending" });
  store.insert("refunds", { id: "RFD-LEGADO", seller_id: legado.id, status: "paid", paid_at: "2026-01-01T00:00:00.000Z" });
  store.insert("refunds", { id: "RFD-NOVO", seller_id: novo.id, status: "paid", paid_at: "2026-01-02T00:00:00.000Z" });
  const log = console.log;
  console.log = () => {};
  try {
    await migrate();
    await migrate();
  } finally {
    console.log = log;
  }
  assert.equal(store.get("refunds", "RFD-LEGADO").status, "released");
  assert.equal(store.get("refunds", "RFD-LEGADO").released_at, "2026-01-01T00:00:00.000Z");
  assert.equal(store.get("refunds", "RFD-NOVO").status, "paid");
  assert.equal(store.get("profiles", novo.id).account_status, "refund_pending");
  store.remove("refunds", "RFD-LEGADO");
  store.remove("refunds", "RFD-NOVO");
});

// ---------------------------------------------------------------- #21: troca de senha
test("#21: troca de senha — 401 sem token, 400 senha atual errada, 400 nova inválida, 200 e login com a nova", async () => {
  resetLoginLimiter();
  const user = await signup("TrocaSenha");
  const email = "trocasenha@cefet.br";
  try {
    const semToken = await call("PATCH", "/usuarios/me/senha", {
      body: { current_password: "segredo123", new_password: "novaSenha123" },
    });
    assert.equal(semToken.status, 401);

    const errada = await call("PATCH", "/usuarios/me/senha", {
      token: user.token,
      body: { current_password: "errada", new_password: "novaSenha123" },
    });
    assert.equal(errada.status, 400);
    assert.deepEqual(errada.body, { message: "Senha atual incorreta.", field: "current_password" });

    const curta = await call("PATCH", "/usuarios/me/senha", {
      token: user.token,
      body: { current_password: "segredo123", new_password: "curta" },
    });
    assert.equal(curta.status, 400);
    assert.equal(curta.body.field, "new_password");

    const igual = await call("PATCH", "/usuarios/me/senha", {
      token: user.token,
      body: { current_password: "segredo123", new_password: "segredo123" },
    });
    assert.equal(igual.status, 400);
    assert.equal(igual.body.field, "new_password");

    const longa = await call("PATCH", "/usuarios/me/senha", {
      token: user.token,
      body: { current_password: "segredo123", new_password: "x".repeat(73) },
    });
    assert.equal(longa.status, 400);
    assert.equal(longa.body.field, "new_password");

    const hashAntes = store.get("profiles", user.id).password_hash;
    const ok = await call("PATCH", "/usuarios/me/senha", {
      token: user.token,
      body: { current_password: "segredo123", new_password: "novaSenha123" },
    });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.message, "Senha alterada com sucesso.");
    assert.ok(ok.body.token); // #24: token novo para a sessão atual
    const hashDepois = store.get("profiles", user.id).password_hash;
    assert.notEqual(hashDepois, hashAntes);
    assert.match(hashDepois, /^\$2[aby]\$/);

    const antiga = await call("POST", "/login", { body: { email, password: "segredo123" } });
    assert.equal(antiga.status, 401);
    const nova = await call("POST", "/login", { body: { email, password: "novaSenha123" } });
    assert.equal(nova.status, 200);
    assert.ok(nova.body.token);
  } finally {
    resetLoginLimiter();
  }
});

test("#21: o admin também troca a própria senha", async () => {
  resetLoginLimiter();
  try {
    const ok = await call("PATCH", "/usuarios/me/senha", {
      token: admin.token,
      body: { current_password: "admin", new_password: "admin-nova-123" },
    });
    assert.equal(ok.status, 200);
    const login = await call("POST", "/login", { body: { email: "admin", password: "admin-nova-123" } });
    assert.equal(login.status, 200);
    // Volta a senha para não afetar outros cenários.
    const volta = await call("PATCH", "/usuarios/me/senha", {
      token: login.body.token,
      body: { current_password: "admin-nova-123", new_password: "admin-demo-1" },
    });
    assert.equal(volta.status, 200);
    admin.token = (await call("POST", "/login", { body: { email: "admin", password: "admin-demo-1" } })).body.token;
    assert.ok(admin.token);
  } finally {
    resetLoginLimiter();
  }
});

// ---------------------------------------------------------------- #10: código de consulta do ticket
test("#10: visitante recebe access_code uma vez; consulta funciona; hash nunca é exposto", async () => {
  resetConsultaTicketLimiter();
  const ticket = {
    category: "CONTA",
    priority: "HIGH",
    subject: "Não consigo me cadastrar",
    description: "O formulário de cadastro não aceita o meu CEP.",
    contact_email: "visitante2@exemplo.com",
  };
  const criado = await call("POST", "/tickets", { body: ticket });
  assert.equal(criado.status, 201);
  assert.match(criado.body.access_code, /^[A-Z0-9]{8}$/);
  assert.equal(criado.body.access_code_hash, undefined);
  const salvo = store.get("tickets", criado.body.id);
  assert.match(salvo.access_code_hash, /^[0-9a-f]{64}$/);
  assert.equal(salvo.access_code, undefined);

  // Ticket de usuário logado não ganha código.
  const logado = await call("POST", "/tickets", { token: ana.token, body: ticket });
  assert.equal(logado.body.access_code, undefined);
  assert.equal(store.get("tickets", logado.body.id).access_code_hash, undefined);

  // O admin responde; o visitante consulta com o código (aceita minúsculas e espaços).
  await call("PATCH", `/admin/tickets/${criado.body.id}`, {
    token: admin.token,
    body: { status: "IN_PROGRESS", admin_reply: "Use o CEP com hífen, por favor." },
  });
  const consulta = await call("POST", "/tickets/consulta", {
    body: { id: criado.body.id.toLowerCase(), codigo: ` ${criado.body.access_code.toLowerCase()} ` },
  });
  assert.equal(consulta.status, 200);
  assert.equal(consulta.body.id, criado.body.id);
  assert.equal(consulta.body.subject, ticket.subject);
  assert.equal(consulta.body.status, "IN_PROGRESS");
  assert.equal(consulta.body.admin_reply, "Use o CEP com hífen, por favor.");
  assert.ok(consulta.body.created_at);
  assert.ok(consulta.body.updated_at);
  for (const campo of ["access_code_hash", "contact_email", "description", "author_id", "replied_by"]) {
    assert.equal(consulta.body[campo], undefined, `consulta não deveria expor ${campo}`);
  }

  const MSG = "Ticket não encontrado ou código inválido.";
  const errado = await call("POST", "/tickets/consulta", { body: { id: criado.body.id, codigo: "ZZZZZZZZ" } });
  assert.equal(errado.status, 404);
  assert.equal(errado.body.message, MSG);
  const inexistente = await call("POST", "/tickets/consulta", { body: { id: "TCK-NAO-EXISTE", codigo: criado.body.access_code } });
  assert.equal(inexistente.status, 404);
  assert.equal(inexistente.body.message, MSG);
  // Ticket de usuário logado (sem código) também não é consultável por aqui.
  const semCodigo = await call("POST", "/tickets/consulta", { body: { id: logado.body.id, codigo: "ABCDEFGH" } });
  assert.equal(semCodigo.status, 404);
  const vazio = await call("POST", "/tickets/consulta", { body: { id: criado.body.id } });
  assert.equal(vazio.status, 400);
  assert.equal(vazio.body.field, "codigo");

  const lista = await call("GET", "/admin/tickets", { token: admin.token });
  assert.ok(lista.body.some((t) => t.id === criado.body.id));
  assert.ok(lista.body.every((t) => t.access_code_hash === undefined));
  const patch = await call("PATCH", `/admin/tickets/${criado.body.id}`, { token: admin.token, body: { status: "CLOSED" } });
  assert.equal(patch.body.access_code_hash, undefined);
  resetConsultaTicketLimiter();
});

test("#10: consulta de ticket tem limite por IP (429 depois de 10 tentativas)", async () => {
  resetConsultaTicketLimiter();
  try {
    const status = [];
    for (let i = 0; i < 12; i += 1) {
      status.push((await call("POST", "/tickets/consulta", { body: { id: "TCK-X", codigo: "AAAAAAAA" } })).status);
    }
    assert.deepEqual(status.slice(0, 10), Array(10).fill(404));
    assert.deepEqual(status.slice(10), [429, 429]);
  } finally {
    resetConsultaTicketLimiter();
  }
});

// ---------------------------------------------------------------- #18: histórico da negociação aceita
test("#18: venda aprovada preserva a negociação ACCEPTED e o chat; as outras somem", async () => {
  const vendedora = await signup("Vendedora18");
  const comprador = await signup("Comprador18");
  const curioso = await signup("Curioso18");
  const prod = await call("POST", "/products", { token: vendedora.token, body: { game_id: "game-002", price: 300 } });
  assert.equal(prod.status, 201);

  const aceita = await call("POST", "/offers", { token: comprador.token, body: { product_id: prod.body.id, offered_price: 280 } });
  const outra = await call("POST", "/offers", { token: curioso.token, body: { product_id: prod.body.id, offered_price: 200 } });
  await call("POST", "/messages", { token: comprador.token, body: { offer_id: aceita.body.id, text: "Fecha por 280?" } });
  await call("POST", "/messages", { token: curioso.token, body: { offer_id: outra.body.id, text: "Faz por 200?" } });
  const ok = await call("PATCH", `/offers/${aceita.body.id}`, { token: vendedora.token, body: { status: "ACCEPTED" } });
  assert.equal(ok.body.status, "ACCEPTED");
  const msgsAntes = store.find("messages", (m) => m.offer_id === aceita.body.id).length;
  assert.equal(msgsAntes, 2);

  const order = await call("POST", "/orders", { token: comprador.token, body: { items: [{ product_id: prod.body.id, quantity: 1 }] } });
  assert.equal(order.status, 201);
  const aprovado = await call("PATCH", `/orders/${order.body.id}`, { token: comprador.token, body: { status: "approved" } });
  assert.equal(aprovado.body.status, "approved");
  assert.equal(store.get("products", prod.body.id), null);

  // A negociação não aceita e as mensagens dela foram apagadas.
  assert.equal(store.get("offers", outra.body.id), null);
  assert.equal(store.find("messages", (m) => m.offer_id === outra.body.id).length, 0);

  // A aceita continua, com o retrato do anúncio.
  for (const parte of [comprador, vendedora]) {
    const lista = await call("GET", "/offers", { token: parte.token });
    assert.ok(lista.body.some((o) => o.id === aceita.body.id));
    const uma = await call("GET", `/offers/${aceita.body.id}`, { token: parte.token });
    assert.equal(uma.status, 200);
    assert.equal(uma.body.status, "ACCEPTED");
    assert.equal(uma.body.product_title, "Chrono Trigger");
    assert.equal(uma.body.product_price, 300);
    assert.equal(uma.body.product_removed, true);
    const msgs = await call("GET", `/messages?offer_id=${aceita.body.id}`, { token: parte.token });
    assert.equal(msgs.status, 200);
    assert.equal(msgs.body.length, msgsAntes);
  }
  // Quem não participa continua sem acesso.
  assert.equal((await call("GET", `/offers/${aceita.body.id}`, { token: curioso.token })).status, 403);
  // Chat segue somente leitura e a negociação aceita continua não excluível.
  const nova = await call("POST", "/messages", { token: comprador.token, body: { offer_id: aceita.body.id, text: "Chegou?" } });
  assert.equal(nova.status, 409);
  const del = await call("DELETE", `/offers/${aceita.body.id}`, { token: comprador.token });
  assert.equal(del.status, 409);
});

test("#18: remoção do anúncio pelo dono ou pelo admin também preserva a negociação ACCEPTED", async () => {
  const vend = await signup("Vend18b");
  const comp = await signup("Comp18b");
  for (const quemRemove of ["dono", "admin"]) {
    const prod = await call("POST", "/products", { token: vend.token, body: { game_id: "game-gta6", price: 150 } });
    const offer = await call("POST", "/offers", { token: comp.token, body: { product_id: prod.body.id, offered_price: 140 } });
    await call("PATCH", `/offers/${offer.body.id}`, { token: vend.token, body: { status: "ACCEPTED" } });
    const del =
      quemRemove === "dono"
        ? await call("DELETE", `/products/${prod.body.id}`, { token: vend.token })
        : await call("DELETE", `/admin/products/${prod.body.id}`, { token: admin.token });
    assert.equal(del.status, 200);
    const salva = store.get("offers", offer.body.id);
    assert.ok(salva, `negociação aceita sumiu (${quemRemove})`);
    assert.equal(salva.product_removed, true);
    assert.equal(salva.product_title, "GTA VI");
    assert.ok(store.find("messages", (m) => m.offer_id === offer.body.id).length >= 1);
  }
});
