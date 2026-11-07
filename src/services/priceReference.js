import { priceRefsApi } from "./api";

export const normalizeTitle = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const refKey = (title) => normalizeTitle(title);

// A consulta à CheapShark, o câmbio e o cache agora ficam no servidor.
export const getPriceReference = (title) => priceRefsApi.lookup(title);

// Variação percentual do preço anunciado em relação à referência (null se não houver).
export function compareWithReference(price, ref) {
  if (!ref?.found || !ref.price_brl) return null;
  return ((Number(price) - ref.price_brl) / ref.price_brl) * 100;
}