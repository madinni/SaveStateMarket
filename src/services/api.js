import { API_URL } from "../context/AuthContext";

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

export const productsApi = {
  list: () => request("/products?_sort=created_at&_order=desc"),
  get: (id) => request(`/products/${id}`),
  create: (data) => request("/products", json("POST", data)),
  update: (id, data) => request(`/products/${id}`, json("PATCH", data)),
  remove: (id) => request(`/products/${id}`, { method: "DELETE" }),
};

export const profilesApi = {
  list: () => request("/profiles"),
  // A senha nunca vai na URL: busca-se apenas pelo e-mail e confere-se no cliente.
  findByEmail: (email) => request(`/profiles?email=${encodeURIComponent(email)}`),
  findByHandle: (handle) => request(`/profiles?handle=${encodeURIComponent(handle)}`),
  create: (data) => request("/profiles", json("POST", data)),
};

export const reviewsApi = {
  listByProfile: (profileId) =>
    request(`/profile_reviews?profile_id=${encodeURIComponent(profileId)}&_sort=created_at&_order=desc`),
  create: (data) => request("/profile_reviews", json("POST", data)),
  update: (id, data) => request(`/profile_reviews/${id}`, json("PATCH", data)),
};

export const ticketsApi = {
  create: (data) => request("/tickets", json("POST", data)),
};

export const offersApi = {
  list: () => request("/offers"),
  create: (data) => request("/offers", json("POST", data)),
  update: (id, data) => request(`/offers/${id}`, json("PATCH", data)),
};

export const messagesApi = {
  listByOffer: (offerId) => request(`/messages?offer_id=${encodeURIComponent(offerId)}`),
  create: (data) => request("/messages", json("POST", data)),
};
