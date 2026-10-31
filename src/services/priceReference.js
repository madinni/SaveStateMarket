import { priceRefsApi } from "./api";

const CHEAPSHARK_URL = "https://www.cheapshark.com/api/1.0/games";
const FX_URL = "https://economia.awesomeapi.com.br/json/last/USD-BRL";
const FALLBACK_USD_BRL = 5.5; // usado só se a API de câmbio falhar
const TTL_MS = 24 * 60 * 60 * 1000; // cache de 24h

export const normalizeTitle = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const refKey = (title) => normalizeTitle(title);

async function fetchCheapShark(title) {
  const res = await fetch(`${CHEAPSHARK_URL}?title=${encodeURIComponent(title)}&limit=10`);
  if (!res.ok) throw new Error(`CheapShark indisponível (HTTP ${res.status}).`);
  return res.json();
}

async function fetchUsdBrl() {
  try {
    const res = await fetch(FX_URL);
    if (res.ok) {
      const rate = Number((await res.json())?.USDBRL?.bid);
      if (rate > 0) return { rate, estimated: false };
    }
  } catch {
    /* cai no valor estimado */
  }
  return { rate: FALLBACK_USD_BRL, estimated: true };
}

// Prefere o título idêntico; senão, o primeiro que contém o título buscado.
function pickMatch(games, title) {
  const wanted = normalizeTitle(title);
  const list = Array.isArray(games) ? games : [];
  return (
    list.find((g) => normalizeTitle(g.external) === wanted) ||
    list.find((g) => normalizeTitle(g.external).includes(wanted)) ||
    null
  );
}

// UC03: consulta o cache; se vencido ou ausente, consulta a CheapShark e atualiza o cache.
export async function getPriceReference(title) {
  const key = refKey(title);
  const [cached] = await priceRefsApi.findByKey(key);
  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < TTL_MS) return cached;

  let record;
  try {
    const match = pickMatch(await fetchCheapShark(title), title);
    const usd = Number(match?.cheapest);
    const base = {
      ref_key: key,
      title,
      source: "CheapShark",
      fetched_at: new Date().toISOString(),
      found: false,
      source_game_id: null,
      matched_title: null,
      steam_app_id: null,
      price_usd: null,
      usd_brl: null,
      fx_estimated: false,
      price_brl: null,
    };
    if (match && usd > 0) {
      const { rate, estimated } = await fetchUsdBrl();
      record = {
        ...base,
        found: true,
        source_game_id: match.gameID,
        matched_title: match.external,
        steam_app_id: match.steamAppID ?? null,
        price_usd: usd,
        usd_brl: rate,
        fx_estimated: estimated,
        price_brl: Math.round(usd * rate * 100) / 100,
      };
    } else {
      record = base;
    }
  } catch (err) {
    if (cached) return cached; // cache vencido é melhor que nada
    throw err;
  }

  return cached ? priceRefsApi.update(cached.id, record) : priceRefsApi.create(record);
}

// Variação percentual do preço anunciado em relação à referência (null se não houver).
export function compareWithReference(price, ref) {
  if (!ref?.found || !ref.price_brl) return null;
  return ((Number(price) - ref.price_brl) / ref.price_brl) * 100;
}