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
  // A senha nunca vai na URL: busca-se apenas pelo e-mail e confere-se no cliente.
  findByEmail: (email) => request(`/profiles?email=${encodeURIComponent(email)}`),
  findByHandle: (handle) => request(`/profiles?handle=${encodeURIComponent(handle)}`),
  create: (data) => request("/profiles", json("POST", data)),
};
