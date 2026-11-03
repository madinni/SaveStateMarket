import { API_URL } from "../config";
import { getToken } from "./tokenStorage";

// Erro com o status HTTP e a mensagem que o servidor mandou.
export class ApiError extends Error {
  constructor(status, message, field) {
    super(message);
    this.status = status;
    this.field = field;
  }
}

const emit = (name) => window.dispatchEvent(new Event(name));

// Todo fetch protegido leva o cabeçalho Authorization: Bearer <token>.
async function request(path, options = {}) {
  const token = getToken();
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(0, "Servidor indisponível. Verifique se a API está rodando (npm run server).");
  }

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    // Token vencido ou adulterado: o AuthContext apaga o token e manda para /entrar.
    if (response.status === 401 && token) emit("auth:unauthorized");
    throw new ApiError(
      response.status,
      data?.message || `Falha na comunicação com o servidor (HTTP ${response.status}).`,
      data?.field,
    );
  }
  return data;
}

const json = (method, body) => ({ method, body: JSON.stringify(body) });
const q = (value) => encodeURIComponent(value);
const NEWEST_FIRST = "_sort=created_at&_order=desc";

// Ações que mudam o status da conta no servidor pedem para o AuthContext recarregar /usuarios/me.
const andRefreshMe = (promise) =>
  promise.then((result) => {
    emit("auth:refresh");
    return result;
  });

export const authApi = {
  register: (data) => request("/usuarios", json("POST", data)),
  login: (data) => request("/login", json("POST", data)),
  me: () => request("/usuarios/me"),
  updateMe: (data) => request("/usuarios/me", json("PATCH", data)),
};

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
  create: (data) => andRefreshMe(request("/refunds", json("POST", data))),
  update: (id, data) => andRefreshMe(request(`/refunds/${id}`, json("PATCH", data))),
};

// Perfis públicos. Alterar só vale para o próprio perfil (o servidor decide quem é pelo token).
export const profilesApi = {
  list: () => request("/profiles"),
  get: (id) => request(`/profiles/${id}`),
  update: (_id, data) => request("/usuarios/me", json("PATCH", data)),
};

export const reviewsApi = {
  listByProfile: (profileId) =>
    request(`/profile_reviews?profile_id=${q(profileId)}&${NEWEST_FIRST}`),
  create: (data) => request("/profile_reviews", json("POST", data)),
  update: (id, data) => request(`/profile_reviews/${id}`, json("PATCH", data)),
};

// O servidor já devolve só os tickets de quem está logado.
export const ticketsApi = {
  listByAuthor: () => request(`/tickets?${NEWEST_FIRST}`),
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

// Mensagens são imutáveis; somem junto com a negociação.
export const messagesApi = {
  listByOffer: (offerId) => request(`/messages?offer_id=${q(offerId)}`),
  create: (data) => request("/messages", json("POST", data)),
};

// Alertas por título. O servidor filtra pelo dono do token.
export const alertsApi = {
  listMine: () => request(`/price_alerts?${NEWEST_FIRST}`),
  create: (data) => request("/price_alerts", json("POST", data)),
  update: (id, data) => request(`/price_alerts/${id}`, json("PATCH", data)),
  remove: (id) => request(`/price_alerts/${id}`, { method: "DELETE" }),
};

// Notificações são criadas só pelo servidor.
export const notificationsApi = {
  listMine: () => request(`/notifications?${NEWEST_FIRST}`),
  update: (id, data) => request(`/notifications/${id}`, json("PATCH", data)),
  remove: (id) => request(`/notifications/${id}`, { method: "DELETE" }),
};

export const gamesApi = {
  list: () => request("/games?_sort=title&_order=asc"),
  get: (id) => request(`/games/${id}`),
};

// Cache das referências de preço externas (CheapShark).
export const priceRefsApi = {
  findByKey: (key) => request(`/price_references?ref_key=${encodeURIComponent(key)}`),
  create: (data) => request("/price_references", json("POST", data)),
  update: (id, data) => request(`/price_references/${id}`, json("PATCH", data)),
};

// Denúncias de anúncio (UC15). Só criação: a lista é exclusiva do administrador.
export const reportsApi = {
  create: (data) => request("/reports", json("POST", data)),
};

// Rotas exclusivas do administrador. O servidor responde 403 para quem não tem role "admin".
export const adminApi = {
  listTickets: () => request(`/admin/tickets?${NEWEST_FIRST}`),
  updateTicket: (id, data) => request(`/admin/tickets/${id}`, json("PATCH", data)),
  listRefunds: () => request("/admin/refunds"),
  releaseRefund: (id) => request(`/admin/refunds/${id}/liberar`, { method: "PATCH" }),
  // A ordem (abertas primeiro) já vem do servidor.
  listReports: () => request("/admin/reports"),
  updateReport: (id, data) => request(`/admin/reports/${id}`, json("PATCH", data)),
  deleteProduct: (id) => request(`/admin/products/${id}`, { method: "DELETE" }),
};
