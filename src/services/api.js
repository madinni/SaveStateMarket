import { API_URL } from "../config";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Falha na comunicação com o servidor (HTTP ${response.status}).`);
  }
  return response.json();
}

const json = (method, body) => ({ method, body: JSON.stringify(body) });
const q = (value) => encodeURIComponent(value);
const NEWEST_FIRST = "_sort=created_at&_order=desc";

export const productsApi = {
  list: () => request(`/products?${NEWEST_FIRST}`),
  get: (id) => request(`/products/${id}`),
  create: (data) => request("/products", json("POST", data)),
  update: (id, data) => request(`/products/${id}`, json("PATCH", data)),
  remove: (id) => request(`/products/${id}`, { method: "DELETE" }),
};

export const ordersApi = {
  list: () => request("/orders"),
  create: (data) => request("/orders", json("POST", data)),
  get: (id) => request(`/orders/${id}`),
  update: (id, data) => request(`/orders/${id}`, json("PATCH", data)),
};

export const refundsApi = {
  list: () => request("/refunds"),
  create: (data) => request("/refunds", json("POST", data)),
  update: (id, data) => request(`/refunds/${id}`, json("PATCH", data)),
};

export const profilesApi = {
  list: () => request("/profiles"),
  // A senha nunca vai na URL: busca-se apenas pelo e-mail e confere-se no cliente.
  findByEmail: (email) => request(`/profiles?email=${q(email)}`),
  findByHandle: (handle) => request(`/profiles?handle=${q(handle)}`),
  create: (data) => request("/profiles", json("POST", data)),
  update: (id, data) => request(`/profiles/${id}`, json("PATCH", data)),
};

export const reviewsApi = {
  listByProfile: (profileId) =>
    request(`/profile_reviews?profile_id=${q(profileId)}&${NEWEST_FIRST}`),
  create: (data) => request("/profile_reviews", json("POST", data)),
  update: (id, data) => request(`/profile_reviews/${id}`, json("PATCH", data)),
};

export const ticketsApi = {
  listByAuthor: (authorId) => request(`/tickets?author_id=${q(authorId)}&${NEWEST_FIRST}`),
  create: (data) => request("/tickets", json("POST", data)),
  update: (id, data) => request(`/tickets/${id}`, json("PATCH", data)),
  remove: (id) => request(`/tickets/${id}`, { method: "DELETE" }),
};

export const offersApi = {
  list: () => request("/offers"),
  listByProduct: (productId) => request(`/offers?product_id=${q(productId)}`),
  create: (data) => request("/offers", json("POST", data)),
  update: (id, data) => request(`/offers/${id}`, json("PATCH", data)),
  remove: (id) => request(`/offers/${id}`, { method: "DELETE" }),
};

export const messagesApi = {
  listByOffer: (offerId) => request(`/messages?offer_id=${q(offerId)}`),
  create: (data) => request("/messages", json("POST", data)),
  remove: (id) => request(`/messages/${id}`, { method: "DELETE" }),
};

export const alertsApi = {
  listByUser: (userId) => request(`/price_alerts?user_id=${q(userId)}&${NEWEST_FIRST}`),
  listByProduct: (productId) => request(`/price_alerts?product_id=${q(productId)}`),
  listActiveByProduct: (productId) =>
    request(`/price_alerts?product_id=${q(productId)}&active=true`),
  create: (data) => request("/price_alerts", json("POST", data)),
  update: (id, data) => request(`/price_alerts/${id}`, json("PATCH", data)),
  remove: (id) => request(`/price_alerts/${id}`, { method: "DELETE" }),
};

export const notificationsApi = {
  listByUser: (userId) => request(`/notifications?user_id=${q(userId)}&${NEWEST_FIRST}`),
  create: (data) => request("/notifications", json("POST", data)),
  update: (id, data) => request(`/notifications/${id}`, json("PATCH", data)),
  remove: (id) => request(`/notifications/${id}`, { method: "DELETE" }),
};

export const gamesApi = {
  list: () => request("/games?_sort=title&_order=asc"),
  get: (id) => request(`/games/${id}`),
  create: (data) => request("/games", json("POST", data)),
  update: (id, data) => request(`/games/${id}`, json("PATCH", data)),
  remove: (id) => request(`/games/${id}`, { method: "DELETE" }),
};

// Cache local (json-server) das referências de preço externas.
export const priceRefsApi = {
  findByKey: (key) => request(`/price_references?ref_key=${encodeURIComponent(key)}`),
  create: (data) => request("/price_references", json("POST", data)),
  update: (id, data) => request(`/price_references/${id}`, json("PATCH", data)),
};