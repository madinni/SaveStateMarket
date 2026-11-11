// Testes das correções de segurança do relatório (relatorios-teste/relatorio.md).
// Como nos outros arquivos: schema PostgreSQL isolado e SEGREDO antes do import dinâmico do store.
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "savestate-seg-"));
if (!process.env.TEST_DATABASE_URL) throw new Error("Defina TEST_DATABASE_URL para executar os testes com PostgreSQL.");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.DB_SCHEMA = `savestate_test_seg_${process.pid}`;
process.env.NODE_ENV = "test";
process.env.DB_PATH = path.join(tmp, "db.json");
process.env.SEGREDO = "segredo-de-teste-com-pelo-menos-32-caracteres";

const store = await import("../store.js");
const { createApp } = await import("../app.js");
const { resetAllLimiters } = await import("../rateLimit.js");

let server;
let base;
let adminToken;

const address = {
  postal_code: "20271-110",
  street: "Av. Maracanã",
  number: "229",
  complement: "",
  neighborhood: "Maracanã",
  city: "Rio de Janeiro",
  state: "RJ",
};
const JPEG = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U";

async function call(method, url, { token, body, raw } = {}) {
  const res = await fetch(base + url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed, headers: res.headers };
}

let contador = 0;
async function signup(prefixo = "Seg") {
  contador += 1;
  const handle = `${prefixo}${contador}`;
  const email = `${handle.toLowerCase()}@teste.io`;
  const reg = await call("POST", "/usuarios", {
    body: { handle, email, password: "senha-forte-1", shipping_address: address },
  });
  assert.equal(reg.status, 201, JSON.stringify(reg.body));
  const login = await call("POST", "/login", { body: { email, password: "senha-forte-1" } });
  assert.equal(login.status, 200);
  return { id: reg.body.id, email, token: login.body.token };
}

const ticket = {
  category: "SYSTEM_BUG",
  priority: "LOW",
  subject: "Teste de limite",
  description: "Descrição com mais de quinze caracteres.",
  contact_email: "visitante@teste.io",
};

before(async () => {
  await store.initialize();
  const hash = await bcrypt.hash("senha-do-admin", 10);
  await (store.reset({
    profiles: [{ id: "u-adm", handle: "@adm", email: "adm@teste.io", password_hash: hash, role: "admin", account_status: "active" }],
    games: [
      { id: "game-001", title: "Chrono Trigger", platform: "SNES (CART)" },
      { id: "game-002", title: "Super Metroid", platform: "SNES (CART)", cover_url: "https://exemplo.com/capa.jpg" },
    ],
  }));
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://localhost:${server.address().port}`;
  adminToken = (await call("POST", "/login", { body: { email: "adm@teste.io", password: "senha-do-admin" } })).body.token;
});

beforeEach(async () => resetAllLimiters());

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await store.close({ dropSchema: true });
  fs.rmSync(tmp, { recursive: true, force: true });
});

// ---------------------------------------------------------------- #24
test("#24: token antigo é recusado após troca de senha; o token devolvido continua valendo", async () => {
  const user = await signup();
  const outraSessao = (await call("POST", "/login", { body: { email: user.email, password: "senha-forte-1" } })).body.token;
  const troca = await call("PATCH", "/usuarios/me/senha", {
    token: user.token,
    body: { current_password: "senha-forte-1", new_password: "senha-nova-22" },
  });
  assert.equal(troca.status, 200);
  assert.ok(troca.body.token);

  assert.equal((await call("GET", "/usuarios/me", { token: user.token })).status, 401);
  assert.equal((await call("GET", "/usuarios/me", { token: outraSessao })).status, 401);
  assert.equal((await call("GET", "/usuarios/me", { token: troca.body.token })).status, 200);

  const login = await call("POST", "/login", { body: { email: user.email, password: "senha-nova-22" } });
  assert.equal((await call("GET", "/usuarios/me", { token: login.body.token })).status, 200);
});

// ---------------------------------------------------------------- #25
test("#25: troca de senha tem limite por usuário (5 tentativas → 429)", async () => {
  const user = await signup();
  for (let i = 0; i < 5; i += 1) {
    const r = await call("PATCH", "/usuarios/me/senha", {
      token: user.token,
      body: { current_password: `chute-${i}`, new_password: "senha-nova-22" },
    });
    assert.equal(r.status, 400);
  }
  const bloqueado = await call("PATCH", "/usuarios/me/senha", {
    token: user.token,
    body: { current_password: "senha-forte-1", new_password: "senha-nova-22" },
  });
  assert.equal(bloqueado.status, 429);
  assert.match(bloqueado.body.message, /Muitas tentativas/);
  // Outro usuário não é afetado.
  const outro = await signup();
  const ok = await call("PATCH", "/usuarios/me/senha", {
    token: outro.token,
    body: { current_password: "senha-forte-1", new_password: "senha-nova-22" },
  });
  assert.equal(ok.status, 200);
});

// ---------------------------------------------------------------- #26
test("#26: 20 falhas de login do mesmo IP em e-mails diferentes bloqueiam o IP (password spraying)", async () => {
  const user = await signup();
  for (let i = 0; i < 20; i += 1) {
    const r = await call("POST", "/login", { body: { email: `alvo${i}@teste.io`, password: "123456" } });
    assert.equal(r.status, 401);
  }
  assert.equal((await call("POST", "/login", { body: { email: "alvo99@teste.io", password: "123456" } })).status, 429);
  assert.equal((await call("POST", "/login", { body: { email: user.email, password: "senha-forte-1" } })).status, 429);
});

test("#26: logins bem-sucedidos não contam como falha do IP", async () => {
  const user = await signup();
  for (let i = 0; i < 25; i += 1) {
    assert.equal((await call("POST", "/login", { body: { email: user.email, password: "senha-forte-1" } })).status, 200);
  }
});

// ---------------------------------------------------------------- #27
test("#27: cadastro tem limite por IP (10 por hora → 429)", async () => {
  for (let i = 0; i < 10; i += 1) {
    const r = await call("POST", "/usuarios", {
      body: { handle: `Lote${i}`, email: `lote${i}@teste.io`, password: "senha-forte-1", shipping_address: address },
    });
    assert.equal(r.status, 201);
  }
  const bloqueado = await call("POST", "/usuarios", {
    body: { handle: "Lote10", email: "lote10@teste.io", password: "senha-forte-1", shipping_address: address },
  });
  assert.equal(bloqueado.status, 429);
  assert.equal((await store.find("profiles", (p) => p.email === "lote10@teste.io")).length, 0);
});

test("#27: ticket de visitante tem limite por IP (5 por hora → 429); logado não entra no limite", async () => {
  for (let i = 0; i < 5; i += 1) assert.equal((await call("POST", "/tickets", { body: ticket })).status, 201);
  const bloqueado = await call("POST", "/tickets", { body: ticket });
  assert.equal(bloqueado.status, 429);
  assert.match(bloqueado.body.message, /Muitos tickets/);
  const user = await signup();
  assert.equal((await call("POST", "/tickets", { token: user.token, body: ticket })).status, 201);
});

test("#27: corpo acima de 100 KB fora das rotas de imagem → 413 JSON; foto de anúncio grande ainda passa", async () => {
  const grande = await call("POST", "/tickets", { body: { ...ticket, description: "x".repeat(200_000) } });
  assert.equal(grande.status, 413);
  assert.match(grande.body.message, /muito grande/);

  const user = await signup();
  const foto = `data:image/jpeg;base64,${"A".repeat(1_000_000)}`;
  const prod = await call("POST", "/products", { token: user.token, body: { game_id: "game-001", price: 10, image_url: foto } });
  assert.equal(prod.status, 201);
  const avatar = await call("PATCH", "/usuarios/me", { token: user.token, body: { avatar_url: foto } });
  assert.equal(avatar.status, 200);

  const enorme = await call("POST", "/products", {
    token: user.token,
    body: { game_id: "game-001", price: 10, image_url: `data:image/jpeg;base64,${"A".repeat(2_200_000)}` },
  });
  assert.equal(enorme.status, 413);
});

test("#35: rotas irmãs das de imagem (ex.: /usuarios/me/senha) ficam no limite de 100 KB", async () => {
  const user = await signup();
  const troca = await call("PATCH", "/usuarios/me/senha", {
    token: user.token,
    body: { current_password: "x".repeat(500_000), new_password: "outra-senha-1" },
  });
  assert.equal(troca.status, 413);
  assert.match(troca.body.message, /muito grande/);
});

// ---------------------------------------------------------------- #28
test("#28: avatar_url, image_url e cover_url só aceitam http(s) ou data:image raster em base64", async () => {
  const user = await signup();
  for (const ruim of ["javascript:alert(1)", "data:text/html;base64,PHNjcmlwdD4=", "data:image/svg+xml;base64,PHN2Zz4=", "vbscript:x"]) {
    const prod = await call("POST", "/products", { token: user.token, body: { game_id: "game-001", price: 10, image_url: ruim } });
    assert.equal(prod.status, 400, ruim);
    assert.equal(prod.body.field, "image_url");
    const me = await call("PATCH", "/usuarios/me", { token: user.token, body: { avatar_url: ruim } });
    assert.equal(me.status, 400, ruim);
    assert.equal(me.body.field, "avatar_url");
    const game = await call("POST", "/games", { token: adminToken, body: { title: "Jogo Novo", platform: "N64 (CART)", cover_url: ruim } });
    assert.equal(game.status, 400, ruim);
    assert.equal(game.body.field, "cover_url");
  }
  const okJpeg = await call("PATCH", "/usuarios/me", { token: user.token, body: { avatar_url: JPEG } });
  assert.equal(okJpeg.status, 200);
  const okHttps = await call("POST", "/products", {
    token: user.token,
    body: { game_id: "game-001", price: 10, image_url: "https://images.unsplash.com/photo-1.jpg?w=600" },
  });
  assert.equal(okHttps.status, 201);
  const patch = await call("PATCH", `/products/${okHttps.body.id}`, { token: user.token, body: { image_url: "javascript:alert(1)" } });
  assert.equal(patch.status, 400);
});

// ---------------------------------------------------------------- #29
test("#29: a API não expõe X-Powered-By e manda os cabeçalhos do helmet", async () => {
  const res = await call("GET", "/");
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("x-powered-by"), null);
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.match(res.headers.get("content-security-policy"), /default-src 'none'/);
  assert.match(res.headers.get("content-security-policy"), /frame-ancestors 'none'/);
  // O CORS do front continua funcionando.
  const cors = await fetch(`${base}/`, { headers: { Origin: "http://localhost:5173" } });
  assert.equal(cors.headers.get("access-control-allow-origin"), "http://localhost:5173");
});

// ---------------------------------------------------------------- #30
test("#30: POST /products exige game_id; título e plataforma livres são ignorados", async () => {
  const user = await signup();
  const livre = await call("POST", "/products", { token: user.token, body: { title: "Jogo Inventado", platform: "PS9", price: 10 } });
  assert.equal(livre.status, 400);
  assert.equal(livre.body.field, "game_id");

  const inexistente = await call("POST", "/products", { token: user.token, body: { game_id: "nao-existe", price: 10 } });
  assert.equal(inexistente.status, 400);
  assert.equal(inexistente.body.field, "game_id");

  const misto = await call("POST", "/products", {
    token: user.token,
    body: { game_id: "game-002", title: "Jogo Inventado", platform: "PS9", price: 10 },
  });
  assert.equal(misto.status, 201);
  assert.equal(misto.body.title, "Super Metroid");
  assert.equal(misto.body.platform, "SNES (CART)");
  assert.equal(misto.body.image_url, "https://exemplo.com/capa.jpg");

  // PATCH sem game_id mantém o jogo; title/platform no corpo não mudam nada.
  const semJogo = await call("PATCH", `/products/${misto.body.id}`, {
    token: user.token,
    body: { price: 20, title: "Outro", platform: "PS9" },
  });
  assert.equal(semJogo.status, 200);
  assert.equal(semJogo.body.title, "Super Metroid");
  assert.equal(semJogo.body.platform, "SNES (CART)");
  assert.equal(semJogo.body.price, 20);

  const trocaJogo = await call("PATCH", `/products/${misto.body.id}`, { token: user.token, body: { game_id: "game-001" } });
  assert.equal(trocaJogo.status, 200);
  assert.equal(trocaJogo.body.title, "Chrono Trigger");
});

// ---------------------------------------------------------------- #32
test("#32: senha do cadastro precisa ter de 8 a 72 bytes", async () => {
  const cadastro = (handle, password) =>
    call("POST", "/usuarios", { body: { handle, email: `${handle.toLowerCase()}@teste.io`, password, shipping_address: address } });
  const curta = await cadastro("Curta32", "123456");
  assert.equal(curta.status, 400);
  assert.equal(curta.body.field, "password");
  const longa = await cadastro("Longa32", "á".repeat(37)); // 37 caracteres, 74 bytes
  assert.equal(longa.status, 400);
  assert.equal(longa.body.field, "password");
  assert.equal((await cadastro("Certa32", "x".repeat(72))).status, 201);
  assert.equal((await cadastro("Minima32", "12345678")).status, 201);
});
