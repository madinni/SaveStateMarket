// UC11 — Alertas de preço POR TÍTULO.
// Ex.: "GTA VI" até R$ 200 → avisa quando houver um anúncio do jogo por R$ 200 ou menos.
import * as store from "./store.js";
import { notify } from "./notify.js";
import { now, sameId } from "./http.js";

// Compara só letras e números, sem acento e sem caixa: "G.T.A. VI" = "GTA VI".
export const normalize = (text) =>
  String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const brl = (value) =>
  Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function alertMatches(alert, product) {
  if (!alert.active) return false;
  if (sameId(alert.user_id, product.seller_id)) return false; // não avisa o próprio vendedor
  if (normalize(alert.title) !== normalize(product.title)) return false;
  if (alert.platform && alert.platform !== product.platform) return false;
  return Number(product.price) <= Number(alert.target_price);
}

async function fire(alert, product) {
  // #44: alerta apagado no meio (update → null) não gera notificação.
  const disparado = await store.update("price_alerts", alert.id, {
    active: false,
    triggered_at: now(),
    triggered_price: Number(product.price),
    triggered_product_id: product.id,
  });
  if (!disparado) return;
  await notify(alert.user_id, {
    type: "PRICE_ALERT",
    title: `Alerta de preço: ${product.title}`,
    body: `Encontramos "${product.title}" (${product.platform}) por ${brl(product.price)}. Seu alvo: ${brl(alert.target_price)}.`,
    link: `/product/${product.id}`,
  });
}

// Chamado quando um anúncio é publicado ou tem o preço reduzido.
export async function triggerAlerts(product) {
  const hits = await store.find("price_alerts", (alert) => alertMatches(alert, product));
  for (const alert of hits) await fire(alert, product);
  return hits.length;
}

// Chamado ao criar/reativar um alerta: se já existe anúncio no alvo, dispara na hora.
export async function checkExistingListings(alert) {
  const candidates = (await store
    .find("products", (product) => alertMatches(alert, product)))
    .sort((a, b) => Number(a.price) - Number(b.price));
  if (candidates.length) await fire(alert, candidates[0]);
  return candidates[0] || null;
}
