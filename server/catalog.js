// UC13 (manter dados do jogo) e UC03 (referência de preço).
// Fica num arquivo próprio para não conflitar com resources.js: o app.js monta este router
// ANTES do resources.js, então as rotas daqui valem no lugar das antigas.
import { Router } from "express";
import { z } from "zod";
import * as store from "./store.js";
import { exigeJwt, exigeAdmin } from "./auth.js";
import { fail, parse, sameId, now, exigeGravado } from "./http.js";
import { urlSegura } from "./schemas.js";

const router = Router();

// ---------------------------------------------------------------- Schemas (Zod 4)
// Mantenha esta lista igual à PLATFORMS de src/schemas/index.js.
const PLATFORMS = ["SNES (CART)", "N64 (CART)", "PS1 (DISC)", "PS2 (DISC)", "XBOX 360", "SWITCH (CART)"];

// #28: mesma validação de avatar_url/image_url (http(s) ou data URL de imagem raster).
const coverUrl = urlSegura("A capa");

const gameSchema = z.object({
  title: z
    .string({ error: "Informe o título." })
    .trim()
    .min(2, "O título deve ter pelo menos 2 caracteres.")
    .max(120, "O título deve ter no máximo 120 caracteres."),
  platform: z.enum(PLATFORMS, { error: "Selecione uma plataforma válida." }),
  region: z.string().trim().min(2, "Informe a região.").max(20, "Máximo de 20 caracteres.").optional(),
  cover_url: coverUrl.optional(),
});
const gameUpdateSchema = gameSchema.partial();

const money = z.coerce
  .number({ error: "Informe um preço válido." })
  .positive("O preço deve ser maior que zero.")
  .max(100000, "O preço máximo é R$ 100.000,00.");

const manualReferenceSchema = z.object({
  title: z.string({ error: "Informe o título." }).trim().min(2, "Informe o título.").max(120),
  price_brl: money,
});
const manualReferenceUpdateSchema = z.object({ price_brl: money });

// ---------------------------------------------------------------- Helpers
// Mesma normalização usada no front (src/services/priceReference.js).
const refKey = (text) =>
  String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const exigeItem = async (collection, id, label) => {
  const item = await store.get(collection, id);
  if (!item) fail(404, `${label} não encontrado.`);
  return item;
};

// Anúncios ligados ao jogo: pelo game_id ou, nos antigos sem game_id, por título + plataforma.
const linkedProducts = async (game) =>
  store.find(
    "products",
    (p) =>
      sameId(p.game_id, game.id) ||
      (!p.game_id && refKey(p.title) === refKey(game.title) && p.platform === game.platform),
  );

async function exigeJogoUnico(title, platform, ignoreId) {
  const duplicate = await store.find(
    "games",
    (g) => !sameId(g.id, ignoreId) && refKey(g.title) === refKey(title) && g.platform === platform,
  );
  if (duplicate.length) fail(409, "Este jogo já existe no catálogo para esta plataforma.", "title");
}

// ---------------------------------------------------------------- Catálogo (UC13): só admin escreve
router.post("/games", exigeJwt, exigeAdmin, async (req, res) => {
  const body = parse(gameSchema, req.body);
  await exigeJogoUnico(body.title, body.platform);
  const created = await store.insert("games", {
    id: store.newId("game-"),
    title: body.title,
    platform: body.platform,
    region: body.region || "NTSC-U",
    cover_url: body.cover_url || "",
    created_at: now(),
  });
  res.status(201).json(created);
});

router.patch("/games/:id", exigeJwt, exigeAdmin, async (req, res) => {
  const game = await exigeItem("games", req.params.id, "Jogo");
  const body = parse(gameUpdateSchema, req.body);
  const title = body.title ?? game.title;
  const platform = body.platform ?? game.platform;
  await exigeJogoUnico(title, platform, game.id);

  const linked = await linkedProducts(game); // antes de alterar o jogo
  const updated = exigeGravado(await store.update("games", game.id, { ...body, updated_at: now() }), "Jogo");
  // O anúncio guarda uma cópia de título e plataforma: mantém tudo coerente com o catálogo.
  for (const product of linked) await store.update("products", product.id, { game_id: game.id, title, platform });
  res.json(updated);
});

router.delete("/games/:id", exigeJwt, exigeAdmin, async (req, res) => {
  const game = await exigeItem("games", req.params.id, "Jogo");
  const linked = await linkedProducts(game);
  if (linked.length) {
    fail(
      409,
      `Este jogo tem ${linked.length} anúncio(s) ativo(s). Remova ou altere os anúncios antes de excluí-lo.`,
    );
  }
  await store.remove("games", game.id);
  res.json({});
});

// ---------------------------------------------------------------- Referência de preço (UC03)
const CHEAPSHARK_URL = "https://www.cheapshark.com/api/1.0/games";
const FX_URL = "https://economia.awesomeapi.com.br/json/last/USD-BRL";
const FALLBACK_USD_BRL = 5.5; // só se a API de câmbio falhar
const TTL_MS = 24 * 60 * 60 * 1000;

const inflight = new Map(); // evita duas consultas simultâneas do mesmo título

// Usa o fetch global na hora da chamada (os testes trocam por um stub).
async function getJson(url, timeoutMs) {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function usdBrl() {
  try {
    const rate = Number((await getJson(FX_URL, 5000))?.USDBRL?.bid);
    if (rate > 0) return { rate, estimated: false };
  } catch {
    /* cai no valor de reserva */
  }
  return { rate: FALLBACK_USD_BRL, estimated: true };
}

function pickMatch(list, title) {
  const wanted = refKey(title);
  const games = Array.isArray(list) ? list : [];
  return (
    games.find((g) => refKey(g.external) === wanted) ||
    games.find((g) => refKey(g.external).includes(wanted)) ||
    null
  );
}

async function consultCheapShark(title) {
  const list = await getJson(`${CHEAPSHARK_URL}?title=${encodeURIComponent(title)}&limit=10`, 8000);
  const match = pickMatch(list, title);
  const usd = Number(match?.cheapest);
  const empty = {
    found: false,
    source: "CheapShark",
    source_game_id: null,
    matched_title: null,
    steam_app_id: null,
    price_usd: null,
    usd_brl: null,
    fx_estimated: false,
    price_brl: null,
  };
  if (!match || !(usd > 0)) return empty;

  const { rate, estimated } = await usdBrl();
  return {
    ...empty,
    found: true,
    source_game_id: match.gameID,
    matched_title: match.external,
    steam_app_id: match.steamAppID ?? null,
    price_usd: usd,
    usd_brl: rate,
    fx_estimated: estimated,
    price_brl: Math.round(usd * rate * 100) / 100,
  };
}

async function resolveReference(title) {
  const key = refKey(title);
  const cached = (await store.find("price_references", (r) => r.ref_key === key))[0];
  // Referência manual (admin) não vence; a da CheapShark vale por 24h.
  const fresh =
    cached && (cached.source === "MANUAL" || Date.now() - new Date(cached.fetched_at).getTime() < TTL_MS);
  if (fresh) return cached;

  let data;
  try {
    data = await consultCheapShark(title);
  } catch {
    if (cached) return cached; // cache vencido é melhor que nada
    fail(502, "Benchmark externo indisponível no momento.");
  }
  const record = { ...data, ref_key: key, title, fetched_at: now() };
  // #44: se o cache foi apagado no meio (update → null), grava um registro novo.
  return (
    (cached && (await store.update("price_references", cached.id, record))) ||
    (await store.insert("price_references", { ...record, id: store.newId("ref-") }))
  );
}

function lookup(title) {
  const key = refKey(title);
  if (!inflight.has(key)) {
    inflight.set(key, resolveReference(title).finally(() => inflight.delete(key)));
  }
  return inflight.get(key);
}

// Só consulta títulos que existem no catálogo ou em algum anúncio: ninguém usa a API
// como proxy livre para a CheapShark nem enche o banco com títulos inventados.
const knownTitle = async (title) => {
  const key = refKey(title);
  return (
    (await store.find("games", (g) => refKey(g.title) === key))[0]?.title ||
    (await store.find("products", (p) => refKey(p.title) === key))[0]?.title ||
    null
  );
};

// Pública: visitantes também veem o benchmark. Quem consulta o provedor externo é o servidor.
router.get("/price_references/lookup", async (req, res) => {
  const title = String(req.query.title || "").trim();
  if (!title) fail(400, "Informe o título do jogo.", "title");
  const canonical = await knownTitle(title);
  if (!canonical) fail(404, "Título fora do catálogo.");
  res.json(await lookup(canonical));
});

// Escrita só por admin, com schema: serve para informar o preço de mercado de um título
// que a CheapShark não cobre (jogos retrô).
router.post("/price_references", exigeJwt, exigeAdmin, async (req, res) => {
  const body = parse(manualReferenceSchema, req.body);
  const canonical = await knownTitle(body.title);
  if (!canonical) fail(404, "Título fora do catálogo.", "title");

  const key = refKey(canonical);
  const record = {
    ref_key: key,
    title: canonical,
    source: "MANUAL",
    found: true,
    matched_title: canonical,
    source_game_id: null,
    steam_app_id: null,
    price_usd: null,
    usd_brl: null,
    fx_estimated: false,
    price_brl: Math.round(body.price_brl * 100) / 100,
    fetched_at: now(),
  };
  const cached = (await store.find("price_references", (r) => r.ref_key === key))[0];
  // #44: se a referência sumiu entre a busca e o update (null), segue para criar uma nova (201).
  const atualizada = cached ? await store.update("price_references", cached.id, record) : null;
  if (atualizada) return res.json(atualizada);
  res.status(201).json(await store.insert("price_references", { ...record, id: store.newId("ref-") }));
});

router.patch("/price_references/:id", exigeJwt, exigeAdmin, async (req, res) => {
  const ref = await exigeItem("price_references", req.params.id, "Referência");
  const body = parse(manualReferenceUpdateSchema, req.body);
  const updated = await store.update("price_references", ref.id, {
    source: "MANUAL",
    found: true,
    matched_title: ref.title,
    source_game_id: null,
    steam_app_id: null,
    price_usd: null,
    usd_brl: null,
    fx_estimated: false,
    price_brl: Math.round(body.price_brl * 100) / 100,
    fetched_at: now(),
  });
  res.json(exigeGravado(updated, "Referência"));
});

// Remove o override manual (ou um registro ruim); a próxima consulta volta à CheapShark.
router.delete("/price_references/:id", exigeJwt, exigeAdmin, async (req, res) => {
  const ref = await exigeItem("price_references", req.params.id, "Referência");
  await store.remove("price_references", ref.id);
  res.json({});
});

export default router;