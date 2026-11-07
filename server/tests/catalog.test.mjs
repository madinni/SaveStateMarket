// Testes de integração: catálogo (UC13) e referência de preço (UC03). Usam um db temporário.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "savestate-catalog-"));
process.env.DB_PATH = path.join(tmp, "db.json");
process.env.SEGREDO = crypto.randomBytes(48).toString("hex");

const store = await import("../store.js");
const { createApp } = await import("../app.js");
const bcrypt = (await import("bcryptjs")).default;

const realFetch = globalThis.fetch;
let externalCalls = 0;
let cheapSharkBody = [{ gameID: "178613", steamAppID: "613830", cheapest: "14.99", external: "CHRONO TRIGGER" }];

let server;
let base;
let adminToken;
let userToken;

async function call(method, url, { token, body } = {}) {
  const res = await realFetch(base + url, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

before(async () => {
  // O servidor usa o fetch global para falar com a CheapShark: aqui ele é trocado por um stub.
  globalThis.fetch = async (url) => {
    const target = String(url);
    if (target.includes("cheapshark.com")) {
      externalCalls += 1;
      return Response.json(cheapSharkBody);
    }
    if (target.includes("awesomeapi.com.br")) return Response.json({ USDBRL: { bid: "5.00" } });
    throw new Error(`fetch inesperado: ${target}`);
  };

  const hash = await bcrypt.hash("senha-teste", 4);
  store.reset({
    profiles: [
      { id: "u-admin", handle: "@adm", email: "adm@teste.io", password_hash: hash, role: "admin", account_status: "active" },
      { id: "u-user", handle: "@user", email: "user@teste.io", password_hash: hash, account_status: "active" },
    ],
    games: [
      { id: "game-001", title: "Super Mario World", platform: "SNES (CART)", region: "NTSC-U", cover_url: "" },
      { id: "game-002", title: "Chrono Trigger", platform: "SNES (CART)", region: "NTSC-U", cover_url: "" },
      { id: "game-003", title: "Super Metroid", platform: "SNES (CART)", region: "NTSC-U", cover_url: "" },
      { id: "game-004", title: "Halo 3", platform: "XBOX 360", region: "NTSC-U", cover_url: "" },
    ],
    products: [
      { id: "prod-halo", game_id: "game-004", title: "Halo 3", platform: "XBOX 360", price: 50, seller_id: "u-user" },
    ],
  });

  await new Promise((resolve) => {
    server = createApp().listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;

  adminToken = (await call("POST", "/login", { body: { email: "adm@teste.io", password: "senha-teste" } })).body.token;
  userToken = (await call("POST", "/login", { body: { email: "user@teste.io", password: "senha-teste" } })).body.token;
});

after(() => {
  globalThis.fetch = realFetch;
  server.closeAllConnections?.();
  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
});

const newGame = { title: "Zelda de Teste", platform: "N64 (CART)", region: "PAL", cover_url: "https://exemplo.com/capa.jpg" };

test("UC13: escrita em /games exige token (401) e papel de admin (403)", async () => {
  assert.equal((await call("POST", "/games", { body: newGame })).status, 401);
  assert.equal((await call("POST", "/games", { token: userToken, body: newGame })).status, 403);
  assert.equal((await call("PATCH", "/games/game-001", { token: userToken, body: { region: "PAL" } })).status, 403);
  assert.equal((await call("DELETE", "/games/game-001", { token: userToken })).status, 403);
});

test("UC13: admin cria jogo; duplicado, plataforma inválida e capa insegura são recusados", async () => {
  const created = await call("POST", "/games", { token: adminToken, body: newGame });
  assert.equal(created.status, 201);
  assert.equal(created.body.title, "Zelda de Teste");
  assert.equal(created.body.region, "PAL");

  const duplicate = await call("POST", "/games", { token: adminToken, body: { ...newGame, title: "  zelda de TESTE " } });
  assert.equal(duplicate.status, 409);

  const badPlatform = await call("POST", "/games", { token: adminToken, body: { ...newGame, title: "Outro", platform: "ATARI" } });
  assert.equal(badPlatform.status, 400);
  assert.equal(badPlatform.body.field, "platform");

  const badCover = await call("POST", "/games", {
    token: adminToken,
    body: { ...newGame, title: "Outro", cover_url: "javascript:alert(1)" },
  });
  assert.equal(badCover.status, 400);
});

test("UC13: PATCH renomeia o jogo e atualiza os anúncios ligados a ele", async () => {
  const game = (await call("POST", "/games", { token: adminToken, body: { title: "Jogo Antigo", platform: "PS2 (DISC)" } })).body;
  store.insert("products", { id: "prod-antigo", game_id: game.id, title: "Jogo Antigo", platform: "PS2 (DISC)", price: 10, seller_id: "u-user" });

  const patched = await call("PATCH", `/games/${game.id}`, { token: adminToken, body: { title: "Jogo Novo" } });
  assert.equal(patched.status, 200);
  assert.equal(patched.body.title, "Jogo Novo");
  assert.equal(patched.body.platform, "PS2 (DISC)"); // o que não veio fica como está

  const product = await call("GET", "/products/prod-antigo");
  assert.equal(product.body.title, "Jogo Novo");

  assert.equal((await call("PATCH", "/games/naoexiste", { token: adminToken, body: { region: "PAL" } })).status, 404);
});

test("UC13: DELETE é bloqueado (409) enquanto houver anúncio ligado ao jogo", async () => {
  const blocked = await call("DELETE", "/games/game-004", { token: adminToken });
  assert.equal(blocked.status, 409);

  store.remove("products", "prod-halo");
  const ok = await call("DELETE", "/games/game-004", { token: adminToken });
  assert.equal(ok.status, 200);
  assert.equal((await call("GET", "/games/game-004")).status, 404);
});

test("#5: escrita em /price_references exige token, papel de admin e schema", async () => {
  assert.equal((await call("POST", "/price_references", { body: { ref_key: "x", lixo: "<script>" } })).status, 401);
  assert.equal((await call("PATCH", "/price_references/qualquer", { body: { price_brl: 0.01 } })).status, 401);
  assert.equal((await call("POST", "/price_references", { token: userToken, body: { title: "Chrono Trigger", price_brl: 100 } })).status, 403);

  const junk = await call("POST", "/price_references", { token: adminToken, body: { title: "Chrono Trigger", lixo: "<script>" } });
  assert.equal(junk.status, 400);
  const outside = await call("POST", "/price_references", { token: adminToken, body: { title: "Jogo Inexistente", price_brl: 100 } });
  assert.equal(outside.status, 404);
});

test("UC03: lookup recusa título vazio (400) e fora do catálogo (404) sem chamar a CheapShark", async () => {
  const callsBefore = externalCalls;
  assert.equal((await call("GET", "/price_references/lookup")).status, 400);
  assert.equal((await call("GET", "/price_references/lookup?title=Jogo%20Inventado")).status, 404);
  assert.equal(externalCalls, callsBefore);
});

test("UC03: lookup consulta a CheapShark uma vez e depois responde pelo cache", async () => {
  const first = await call("GET", "/price_references/lookup?title=chrono%20trigger");
  assert.equal(first.status, 200);
  assert.equal(first.body.found, true);
  assert.equal(first.body.price_usd, 14.99);
  assert.equal(first.body.price_brl, 74.95); // 14.99 × 5,00
  assert.equal(first.body.fx_estimated, false);
  assert.equal(externalCalls, 1);

  const second = await call("GET", "/price_references/lookup?title=Chrono%20Trigger");
  assert.equal(second.status, 200);
  assert.equal(second.body.id, first.body.id);
  assert.equal(externalCalls, 1);
});

test("UC03: título sem versão digital volta found=false (não é erro)", async () => {
  cheapSharkBody = [];
  const res = await call("GET", "/price_references/lookup?title=Super%20Metroid");
  assert.equal(res.status, 200);
  assert.equal(res.body.found, false);
  assert.equal(res.body.price_brl, null);
});

test("UC03: referência manual do admin vale mais que a CheapShark e não expira", async () => {
  const callsBefore = externalCalls;
  const manual = await call("POST", "/price_references", { token: adminToken, body: { title: "Super Mario World", price_brl: 250 } });
  assert.equal(manual.status, 201);
  assert.equal(manual.body.source, "MANUAL");

  const res = await call("GET", "/price_references/lookup?title=Super%20Mario%20World");
  assert.equal(res.body.source, "MANUAL");
  assert.equal(res.body.price_brl, 250);
  assert.equal(externalCalls, callsBefore);

  const patched = await call("PATCH", `/price_references/${manual.body.id}`, { token: adminToken, body: { price_brl: 300 } });
  assert.equal(patched.body.price_brl, 300);

  assert.equal((await call("DELETE", `/price_references/${manual.body.id}`, { token: adminToken })).status, 200);
});