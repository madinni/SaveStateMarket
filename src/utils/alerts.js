// Mesma regra do servidor (server/alerts.js): compara só letras e números,
// sem acento e sem maiúsculas. "G.T.A. VI" e "gta vi" são o mesmo título.
export const normalizeAlertTitle = (text) =>
  String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

// Anúncios ativos que correspondem ao alerta (título e, se houver, plataforma).
export const listingsForAlert = (alert, products, userId) =>
  products.filter(
    (p) =>
      String(p.seller_id) !== String(userId) &&
      normalizeAlertTitle(p.title) === normalizeAlertTitle(alert.title) &&
      (!alert.platform || p.platform === alert.platform),
  );
