// Rotas dos recursos. Em todas: 401 sem token, 404 id inexistente, 403 registro de outra
// pessoa (nessa ordem: 404 antes de 403). O dono sempre vem do token, nunca do corpo.
import crypto from "node:crypto";
import { Router } from "express";
import * as store from "./store.js";
import { exigeJwt, jwtOpcional, isBlocked } from "./auth.js";
import { fail, parse, sameId, now, applyQuery, exigeGravado } from "./http.js";
import { notify } from "./notify.js";
import { triggerAlerts, checkExistingListings, normalize } from "./alerts.js";
import { createDemoPixPayload } from "./pix.js";
import * as S from "./schemas.js";
import { criarLimitador, ipDe } from "./rateLimit.js";

const router = Router();

// exigeDono da aula: sem item → 404; item de outra pessoa → 403.
export async function exigeItem(collection, id, label = "Registro") {
  const item = await store.get(collection, id);
  if (!item) fail(404, `${label} não encontrado.`);
  return item;
}
export const exigeDono = (allowed, message = "Este registro pertence a outra pessoa.") => {
  if (!allowed) fail(403, message);
};

export const brl = (value) => `R$ ${Number(value || 0).toFixed(2)}`;
const handleOf = (user) => user.handle;

// ---------------------------------------------------------------- Anúncios (Matheus + Luciano)
const isSeller = (product, user) =>
  sameId(product.seller_id, user.id) || (!product.seller_id && product.seller_handle === user.handle);

// Exportada: o admin também remove anúncios (DELETE /admin/products/:id) e a venda aprovada
// também tira o anúncio do catálogo. Negociações ACCEPTED são histórico da transação (#18):
// ficam, com as mensagens, e ganham um retrato do anúncio (product_title, product_price,
// product_removed). As demais negociações e suas mensagens são apagadas.
export async function removeProductCascade(productId) {
  const product = await store.get("products", productId);
  const offers = await store.find("offers", (o) => sameId(o.product_id, productId));
  const removidas = offers.filter((o) => o.status !== "ACCEPTED").map((o) => String(o.id));
  for (const offer of offers.filter((o) => o.status === "ACCEPTED")) {
    await store.update("offers", offer.id, {
      product_title: offer.product_title ?? product?.title ?? "Anúncio removido",
      product_price: offer.product_price ?? (product ? Number(product.price) : (offer.original_price ?? null)),
      product_platform: offer.product_platform ?? product?.platform ?? null,
      product_image_url: offer.product_image_url ?? product?.image_url ?? null,
      product_removed: true,
      product_removed_at: now(),
    });
  }
  await store.removeWhere("messages", (m) => removidas.includes(String(m.offer_id)));
  await store.removeWhere("offers", (o) => removidas.includes(String(o.id)));
  return store.remove("products", productId);
}

// #30: título e plataforma vêm SEMPRE do catálogo (games). O POST exige game_id (o schema
// já não aceita title/platform livres); no PATCH sem game_id o jogo atual é mantido.
async function productFromBody(body, current = {}) {
  if (!body.game_id) {
    if (!current.id) fail(400, "Selecione um jogo do catálogo.", "game_id");
    return { ...body, image_url: body.image_url || current.image_url };
  }
  const game = await store.get("games", body.game_id);
  if (!game) fail(400, "Jogo não encontrado no catálogo.", "game_id");
  return {
    ...body,
    title: game.title,
    platform: game.platform,
    image_url: body.image_url || current.image_url || game.cover_url,
  };
}

router.get("/products", async (req, res) => res.json(applyQuery(await store.list("products"), req.query)));
router.get("/products/:id", async (req, res) => res.json(await exigeItem("products", req.params.id, "Anúncio")));

router.post("/products", exigeJwt, async (req, res) => {
  if (isBlocked(req.user)) fail(403, "Conta bloqueada para novos anúncios até a quitação do reembolso PIX.");
  const body = await productFromBody(parse(S.productSchema, req.body));
  const created = await store.insert("products", {
    ...body,
    id: store.newId("prod-"),
    seller_id: req.user.id,
    seller_handle: handleOf(req.user),
    created_at: now(),
  });
  await triggerAlerts(created);
  res.status(201).json(created);
});

router.patch("/products/:id", exigeJwt, async (req, res) => {
  const product = await exigeItem("products", req.params.id, "Anúncio");
  exigeDono(isSeller(product, req.user), "Apenas o anunciante pode alterar este anúncio.");
  const previousPrice = Number(product.price);
  const body = await productFromBody(parse(S.productUpdateSchema, req.body), product);
  const updated = exigeGravado(await store.update("products", product.id, { ...body, updated_at: now() }), "Anúncio");
  if (Number(updated.price) < previousPrice) await triggerAlerts(updated);
  res.json(updated);
});

router.delete("/products/:id", exigeJwt, async (req, res) => {
  const product = await exigeItem("products", req.params.id, "Anúncio");
  exigeDono(isSeller(product, req.user), "Apenas o anunciante pode excluir este anúncio.");
  await removeProductCascade(product.id);
  res.json({});
});

// ---------------------------------------------------------------- Catálogo (somente leitura)
router.get("/games", async (req, res) => res.json(applyQuery(await store.list("games"), req.query)));
router.get("/games/:id", async (req, res) => res.json(await exigeItem("games", req.params.id, "Jogo")));

// ---------------------------------------------------------------- Referência de preço (cache CheapShark)
// Leitura e escrita públicas de propósito: visitantes também consultam o benchmark.
// TODO: mover a consulta à CheapShark para o servidor e fechar a escrita.
router.get("/price_references", async (req, res) => res.json(applyQuery(await store.list("price_references"), req.query)));

// ---------------------------------------------------------------- Avaliações
const reviewAuthor = (review, user) =>
  sameId(review.author_id, user.id) || (!review.author_id && review.author_handle === user.handle);

async function syncReputation(profileId) {
  const reviews = await store.find("profile_reviews", (r) => sameId(r.profile_id, profileId));
  if (!reviews.length) return;
  const average = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length;
  await store.update("profiles", profileId, { reputation: Number(average.toFixed(2)) });
}

// Houve pelo menos um pedido aprovado entre as duas pessoas (qualquer um comprou do outro)?
// O pedido guarda o comprador em buyer_id e os vendedores em items[].seller_id.
async function hasApprovedTrade(userId, otherId) {
  const soldBy = (order, id) => (order.items || []).some((item) => sameId(item.seller_id, id));
  return (await store.find(
    "orders",
    (o) =>
      o.status === "approved" &&
      ((sameId(o.buyer_id, userId) && soldBy(o, otherId)) || (sameId(o.buyer_id, otherId) && soldBy(o, userId))),
  )).length > 0;
}
const NO_TRADE = "Você só pode avaliar usuários com quem concluiu uma transação.";
const REVIEW_DUPLICATE = "Você já avaliou este operador. Edite a avaliação existente.";

router.get("/profile_reviews", async (req, res) => res.json(applyQuery(await store.list("profile_reviews"), req.query)));

router.post("/profile_reviews", exigeJwt, async (req, res) => {
  const body = parse(S.reviewSchema, req.body);
  await exigeItem("profiles", body.profile_id, "Operador");
  if (sameId(body.profile_id, req.user.id)) fail(403, "Você não pode avaliar a si mesmo.");
  if (!await hasApprovedTrade(req.user.id, body.profile_id)) fail(403, NO_TRADE);
  const already = await store.find(
    "profile_reviews",
    (r) => sameId(r.profile_id, body.profile_id) && reviewAuthor(r, req.user),
  );
  if (already.length) fail(409, REVIEW_DUPLICATE);

  // #40: a checagem acima não cobre duas requisições em paralelo; o índice único
  // (author_id, profile_id) garante uma só avaliação, e o 23505 dele vira o mesmo 409.
  let created;
  try {
    created = await store.insert("profile_reviews", {
      ...body,
      id: store.newId("REV-"),
      author_id: req.user.id,
      author_handle: handleOf(req.user),
      badge: "[VERIFIED_TRADE]",
      created_at: now(),
    });
  } catch (error) {
    if (error.code === "23505" && error.constraint === store.REVIEW_UNIQUE_INDEX) fail(409, REVIEW_DUPLICATE);
    throw error;
  }
  await syncReputation(body.profile_id);
  await notify(body.profile_id, {
    type: "REVIEW",
    title: "Nova avaliação recebida",
    body: `${handleOf(req.user)} avaliou você com ${body.rating} estrela(s).`,
    link: "/profile",
  });
  res.status(201).json(created);
});

router.patch("/profile_reviews/:id", exigeJwt, async (req, res) => {
  const review = await exigeItem("profile_reviews", req.params.id, "Avaliação");
  exigeDono(reviewAuthor(review, req.user), "Só o autor pode alterar a avaliação.");
  // O avaliado não muda (o schema não aceita profile_id) e avaliações antigas, feitas
  // antes desta regra, só podem ser editadas se houver transação concluída.
  if (!await hasApprovedTrade(req.user.id, review.profile_id)) fail(403, NO_TRADE);
  const body = parse(S.reviewUpdateSchema, req.body);
  // Avaliação legada (só author_handle) ganha author_id aqui; se a pessoa já tiver outra
  // avaliação do mesmo perfil com author_id, o índice único recusa (409 em vez de 500).
  let updated;
  try {
    updated = await store.update("profile_reviews", review.id, {
      ...body,
      author_id: req.user.id,
      badge: "[UPDATED_REVIEW]",
      updated_at: now(),
    });
  } catch (error) {
    if (error.code === "23505" && error.constraint === store.REVIEW_UNIQUE_INDEX) fail(409, REVIEW_DUPLICATE);
    throw error;
  }
  exigeGravado(updated, "Avaliação");
  await syncReputation(review.profile_id);
  res.json(updated);
});

// ---------------------------------------------------------------- Negociações (ofertas)
const isParty = (offer, user) => sameId(offer.buyer_id, user.id) || sameId(offer.seller_id, user.id);
const CLOSED_STATUSES = ["ACCEPTED", "REJECTED"];
const isClosed = (offer) => CLOSED_STATUSES.includes(offer.status);
const OFFER_CLOSED = "Esta negociação já foi encerrada.";

function systemMessage(offerId, text) {
  return store.insert("messages", {
    id: store.newId("SYS-"),
    offer_id: offerId,
    sender_id: "SYSTEM",
    sender_handle: "PROTOCOL_BOT",
    text,
    timestamp: now(),
  });
}

router.get("/offers", exigeJwt, async (req, res) => {
  const mine = await store.find("offers", (o) => isParty(o, req.user));
  res.json(applyQuery(mine, req.query));
});

router.get("/offers/:id", exigeJwt, async (req, res) => {
  const offer = await exigeItem("offers", req.params.id, "Negociação");
  exigeDono(isParty(offer, req.user));
  res.json(offer);
});

router.post("/offers", exigeJwt, async (req, res) => {
  const body = parse(S.offerCreateSchema, req.body);
  const product = await store.get("products", body.product_id);
  if (!product) fail(409, "Este anúncio não está mais disponível.");
  if (isSeller(product, req.user)) fail(403, "Você não pode negociar o próprio anúncio.");
  if (isBlocked(req.user)) fail(403, "Conta bloqueada para compras até a quitação do reembolso PIX.");

  const created = await store.insert("offers", {
    id: store.newId("OFF-"),
    product_id: product.id,
    product_title: product.title,
    original_price: Number(product.price),
    offered_price: Number(body.offered_price),
    buyer_id: req.user.id,
    buyer_handle: handleOf(req.user),
    seller_id: product.seller_id,
    seller_handle: product.seller_handle,
    status: "PENDING",
    last_action_by: req.user.id,
    created_at: now(),
    updated_at: now(),
  });
  await notify(product.seller_id, {
    type: "OFFER",
    title: "Nova proposta recebida",
    body: `${handleOf(req.user)} ofereceu ${brl(body.offered_price)} por "${product.title}".`,
    link: "/offers",
  });
  res.status(201).json(created);
});

router.patch("/offers/:id", exigeJwt, async (req, res) => {
  const offer = await exigeItem("offers", req.params.id, "Negociação");
  exigeDono(isParty(offer, req.user));
  if (isClosed(offer)) fail(409, OFFER_CLOSED);
  const { status, offered_price } = parse(S.offerUpdateSchema, req.body);

  const isBuyer = sameId(offer.buyer_id, req.user.id);
  if (status === "ACCEPTED" && sameId(offer.last_action_by, req.user.id)) {
    fail(403, "Você não pode aceitar a própria proposta.");
  }
  if (isBuyer && isBlocked(req.user) && status !== "REJECTED") {
    fail(403, "Conta bloqueada para compras até a quitação do reembolso PIX.");
  }
  if (status === "COUNTER_OFFER" && !offered_price) fail(400, "Informe o valor da contraproposta.", "offered_price");

  // #39: a gravação só acontece se a oferta continua aberta E ninguém agiu desde a leitura
  // (last_action_by igual ao lido), numa única instrução. Assim, aceitar × contrapropor/recusar
  // em paralelo dá um 200 e um 409, e ninguém aceita a própria contraproposta por corrida.
  // Mensagem de sistema e notificação só são gravadas por quem venceu.
  const updated = await store.updateWhere(
    "offers",
    offer.id,
    {
      status,
      last_action_by: req.user.id,
      updated_at: now(),
      ...(status === "COUNTER_OFFER" ? { offered_price: Number(offered_price) } : {}),
    },
    { status: { notIn: CLOSED_STATUSES }, last_action_by: { eq: offer.last_action_by ?? null } },
  );
  if (!updated) {
    const current = await store.get("offers", offer.id);
    if (!current) fail(404, "Negociação não encontrada.");
    if (isClosed(current)) fail(409, OFFER_CLOSED);
    fail(409, "A negociação foi atualizada pela outra parte. Recarregue e tente de novo.");
  }

  const texts = {
    ACCEPTED: `[SISTEMA]: Proposta ACEITA por ${handleOf(req.user)}`,
    REJECTED: `[SISTEMA]: Proposta RECUSADA por ${handleOf(req.user)}`,
    COUNTER_OFFER: `[SISTEMA]: Contraproposta enviada no valor de ${brl(offered_price)}`,
  };
  await systemMessage(offer.id, texts[status]);

  const titles = {
    ACCEPTED: ["Proposta aceita", `${handleOf(req.user)} aceitou a proposta em "${offer.product_title}".`],
    REJECTED: ["Proposta recusada", `${handleOf(req.user)} recusou a proposta em "${offer.product_title}".`],
    COUNTER_OFFER: ["Nova contraproposta", `${handleOf(req.user)} propôs ${brl(offered_price)} em "${offer.product_title}".`],
  };
  const [title, body] = titles[status];
  await notify(isBuyer ? offer.seller_id : offer.buyer_id, { type: "OFFER", title, body, link: "/offers" });

  res.json(updated);
});

router.delete("/offers/:id", exigeJwt, async (req, res) => {
  const offer = await exigeItem("offers", req.params.id, "Negociação");
  exigeDono(isParty(offer, req.user));
  // Negociação aceita é histórico da transação: não pode sumir.
  if (offer.status === "ACCEPTED") fail(409, "Negociações aceitas não podem ser excluídas.");
  await store.removeWhere("messages", (m) => sameId(m.offer_id, offer.id));
  await store.remove("offers", offer.id);
  res.json({});
});

// ---------------------------------------------------------------- Mensagens do chat
router.get("/messages", exigeJwt, async (req, res) => {
  const myOffers = (await store.find("offers", (o) => isParty(o, req.user))).map((o) => String(o.id));
  const mine = await store.find("messages", (m) => myOffers.includes(String(m.offer_id)));
  res.json(applyQuery(mine, req.query));
});

router.post("/messages", exigeJwt, async (req, res) => {
  const body = parse(S.messageSchema, req.body);
  const offer = await exigeItem("offers", body.offer_id, "Negociação");
  exigeDono(isParty(offer, req.user), "Você não participa desta negociação.");
  if (isClosed(offer)) fail(409, "Negociação encerrada: o chat está em modo somente leitura.");
  const created = await store.insert("messages", {
    id: store.newId("MSG-"),
    offer_id: offer.id,
    sender_id: req.user.id,
    sender_handle: handleOf(req.user),
    text: body.text,
    timestamp: now(),
  });
  res.status(201).json(created);
});

// Mensagens são imutáveis; somem apenas junto com a negociação.
const immutable = () => fail(403, "Mensagens não podem ser alteradas nem excluídas individualmente.");
router.patch("/messages/:id", exigeJwt, immutable);
router.delete("/messages/:id", exigeJwt, immutable);

// ---------------------------------------------------------------- Tickets de suporte
// Código de consulta do visitante: 8 caracteres de um alfabeto sem 0/O/1/I (fácil de digitar).
// 32 símbolos dividem 256 exatamente, então "byte % 32" não tem viés.
const ALFABETO_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function gerarCodigoConsulta(tamanho = 8) {
  return Array.from(crypto.randomBytes(tamanho), (b) => ALFABETO_CODIGO[b % ALFABETO_CODIGO.length]).join("");
}
const hashCodigo = (codigo) => crypto.createHash("sha256").update(String(codigo).toUpperCase()).digest("hex");
// Comparação em tempo constante (os dois lados são hashes sha256 de 32 bytes).
function codigoConfere(codigo, hashGuardado) {
  const a = Buffer.from(hashCodigo(codigo), "hex");
  const b = Buffer.from(String(hashGuardado), "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// O hash do código nunca sai da API (nem para o admin). Exportada para admin.js.
export function semSegredoTicket(ticket) {
  if (!ticket) return ticket;
  const { access_code_hash, ...seguro } = ticket; // eslint-disable-line no-unused-vars
  return seguro;
}

// Limite de consultas por IP (em memória), no estilo do login: 10 tentativas a cada 15 minutos.
// Conta toda tentativa (certa ou errada) antes de comparar o código.
const CONSULTA_MAX = 10;
const CONSULTA_JANELA_MS = 15 * 60 * 1000;
const consultasTicket = new Map(); // ip → { count, inicio }

function consultaAtiva(chave, agora = Date.now()) {
  const registro = consultasTicket.get(chave);
  if (registro && agora - registro.inicio >= CONSULTA_JANELA_MS) {
    consultasTicket.delete(chave);
    return null;
  }
  return registro || null;
}
const consultaBloqueada = (chave) => (consultaAtiva(chave)?.count ?? 0) >= CONSULTA_MAX;
function registrarConsulta(chave) {
  const agora = Date.now();
  const registro = consultaAtiva(chave, agora);
  if (registro) registro.count += 1;
  else consultasTicket.set(chave, { count: 1, inicio: agora });
  if (consultasTicket.size > 10000) {
    for (const [k, r] of consultasTicket) if (agora - r.inicio >= CONSULTA_JANELA_MS) consultasTicket.delete(k);
  }
}
// Usado pelos testes para não deixar o limitador vazar entre cenários.
export function resetConsultaTicketLimiter() {
  consultasTicket.clear();
}

const ticketOwner = (ticket, user) =>
  sameId(ticket.author_id, user.id) || (!ticket.author_id && ticket.author_handle === user.handle);

router.get("/tickets", exigeJwt, async (req, res) => {
  const mine = await store.find("tickets", (t) => ticketOwner(t, req.user));
  const { author_id, ...query } = req.query; // eslint-disable-line no-unused-vars
  res.json(applyQuery(mine, query).map(semSegredoTicket));
});

router.get("/tickets/:id", exigeJwt, async (req, res) => {
  const ticket = await exigeItem("tickets", req.params.id, "Ticket");
  exigeDono(ticketOwner(ticket, req.user));
  res.json(semSegredoTicket(ticket));
});

// Visitantes também podem abrir ticket (como antes); logado, o dono vem do token.
// Visitante recebe UMA vez, na resposta 201, o código de consulta (access_code) para
// acompanhar a resposta em POST /tickets/consulta. Só o hash sha256 fica gravado.
// #27: visitante (sem token) abre no máximo 5 tickets por hora por IP. Conta antes da
// validação e da gravação no banco. Quem está logado não entra neste limite.
const ticketsVisitante = criarLimitador({ max: 5, janelaMs: 60 * 60 * 1000 });

router.post("/tickets", jwtOpcional, async (req, res) => {
  if (!req.user) {
    const ip = ipDe(req);
    if (ticketsVisitante.bloqueado(ip)) {
      fail(429, "Muitos tickets enviados a partir desta rede. Tente novamente mais tarde.");
    }
    ticketsVisitante.hit(ip);
  }
  const body = parse(S.ticketSchema, req.body);
  // Visitante precisa deixar um e-mail para receber a resposta; logado, o contato é a conta.
  if (!req.user && !body.contact_email) {
    fail(400, "Informe um e-mail de contato para receber a resposta.", "contact_email");
  }
  const access_code = req.user ? null : gerarCodigoConsulta();
  const created = await store.insert("tickets", {
    ...body,
    id: store.newId("TCK-").toUpperCase(),
    author_id: req.user?.id || "GUEST_SESSION",
    author_handle: req.user ? handleOf(req.user) : "@Visitante_Anonimo",
    status: "OPEN",
    created_at: now(),
    ...(access_code ? { access_code_hash: hashCodigo(access_code) } : {}),
  });
  const resposta = semSegredoTicket(created);
  res.status(201).json(access_code ? { ...resposta, access_code } : resposta);
});

// Consulta pública do ticket de visitante: { id, codigo }. Ticket inexistente e código errado
// dão a mesma resposta (404), para não revelar quais tickets existem. Limite por IP (429).
const CONSULTA_FALHA = "Ticket não encontrado ou código inválido.";
const CAMPOS_CONSULTA = [
  "id", "subject", "category", "priority", "status", "admin_reply", "replied_at", "created_at", "updated_at",
];

router.post("/tickets/consulta", async (req, res) => {
  const chave = req.ip || req.socket?.remoteAddress || "?";
  if (consultaBloqueada(chave)) fail(429, "Muitas consultas de ticket. Tente novamente em alguns minutos.");
  registrarConsulta(chave);

  const { id, codigo } = parse(S.ticketConsultaSchema, req.body);
  const ticket = await store.get("tickets", id);
  if (!ticket?.access_code_hash || !codigoConfere(codigo, ticket.access_code_hash)) fail(404, CONSULTA_FALHA);

  const publico = {};
  for (const campo of CAMPOS_CONSULTA) if (ticket[campo] !== undefined) publico[campo] = ticket[campo];
  res.json(publico);
});

router.patch("/tickets/:id", exigeJwt, async (req, res) => {
  const ticket = await exigeItem("tickets", req.params.id, "Ticket");
  exigeDono(ticketOwner(ticket, req.user));
  if (ticket.status !== "OPEN") fail(409, "Só tickets em aberto podem ser alterados.");
  const body = parse(S.ticketUpdateSchema, req.body);
  const updated = exigeGravado(await store.update("tickets", ticket.id, { ...body, updated_at: now() }), "Ticket");
  res.json(semSegredoTicket(updated));
});

router.delete("/tickets/:id", exigeJwt, async (req, res) => {
  const ticket = await exigeItem("tickets", req.params.id, "Ticket");
  exigeDono(ticketOwner(ticket, req.user));
  if (ticket.status !== "OPEN") fail(409, "Só tickets em aberto podem ser cancelados.");
  await store.remove("tickets", ticket.id);
  res.json({});
});

// ---------------------------------------------------------------- Notificações
const ownNotification = (n, user) => sameId(n.user_id, user.id);

router.get("/notifications", exigeJwt, async (req, res) => {
  const { user_id, ...query } = req.query; // eslint-disable-line no-unused-vars
  res.json(applyQuery(await store.find("notifications", (n) => ownNotification(n, req.user)), query));
});

router.post("/notifications", exigeJwt, () => fail(403, "Notificações são criadas apenas pelo sistema."));

router.patch("/notifications/:id", exigeJwt, async (req, res) => {
  const item = await exigeItem("notifications", req.params.id, "Notificação");
  exigeDono(ownNotification(item, req.user));
  const body = parse(S.notificationUpdateSchema, req.body);
  res.json(exigeGravado(await store.update("notifications", item.id, body), "Notificação"));
});

router.delete("/notifications/:id", exigeJwt, async (req, res) => {
  const item = await exigeItem("notifications", req.params.id, "Notificação");
  exigeDono(ownNotification(item, req.user));
  await store.remove("notifications", item.id);
  res.json({});
});

// ---------------------------------------------------------------- Alertas de preço por título (UC11)
router.get("/price_alerts", exigeJwt, async (req, res) => {
  const { user_id, ...query } = req.query; // eslint-disable-line no-unused-vars
  res.json(applyQuery(await store.find("price_alerts", (a) => sameId(a.user_id, req.user.id)), query));
});

// Jogo do catálogo só aceita plataforma em que ele existe. Título fora do catálogo aceita qualquer uma.
async function checkAlertPlatform(title, platform) {
  if (!platform) return;
  const platforms = (await store.find("games", (g) => normalize(g.title) === normalize(title))).map((g) => g.platform);
  if (platforms.length && !platforms.includes(platform)) {
    fail(400, `"${title}" não existe para ${platform}. Plataformas no catálogo: ${platforms.join(", ")}.`, "platform");
  }
}

router.post("/price_alerts", exigeJwt, async (req, res) => {
  const body = parse(S.alertSchema, req.body);
  await checkAlertPlatform(body.title, body.platform);
  const created = await store.insert("price_alerts", {
    id: store.newId("ALR-"),
    user_id: req.user.id,
    title: body.title,
    platform: body.platform || null,
    target_price: Number(body.target_price),
    active: true,
    created_at: now(),
  });
  await checkExistingListings(created);
  res.status(201).json(await store.get("price_alerts", created.id));
});

router.patch("/price_alerts/:id", exigeJwt, async (req, res) => {
  const alert = await exigeItem("price_alerts", req.params.id, "Alerta");
  exigeDono(sameId(alert.user_id, req.user.id));
  const body = parse(S.alertUpdateSchema, req.body);
  if (body.platform) await checkAlertPlatform(alert.title, body.platform);
  const reactivate = body.active === true || (body.target_price !== undefined && body.active !== false);
  const patch = { ...body, updated_at: now() };
  if (reactivate) {
    Object.assign(patch, { active: true, triggered_at: null, triggered_price: null, triggered_product_id: null });
  }
  const updated = exigeGravado(await store.update("price_alerts", alert.id, patch), "Alerta");
  if (updated.active) await checkExistingListings(updated);
  res.json((await store.get("price_alerts", alert.id)) ?? updated);
});

router.delete("/price_alerts/:id", exigeJwt, async (req, res) => {
  const alert = await exigeItem("price_alerts", req.params.id, "Alerta");
  exigeDono(sameId(alert.user_id, req.user.id));
  await store.remove("price_alerts", alert.id);
  res.json({});
});

// ---------------------------------------------------------------- Pedidos (módulo de transação do Luciano)
const sellerIdsOf = (order) => (order.items || []).map((item) => String(item.seller_id));
const isOrderParty = (order, user) =>
  sameId(order.buyer_id, user.id) || sellerIdsOf(order).includes(String(user.id));

router.get("/orders", exigeJwt, async (req, res) => {
  res.json(applyQuery(await store.find("orders", (o) => isOrderParty(o, req.user)), req.query));
});

router.get("/orders/:id", exigeJwt, async (req, res) => {
  const order = await exigeItem("orders", req.params.id, "Pedido");
  exigeDono(isOrderParty(order, req.user));
  res.json(order);
});

// O cliente manda só os anúncios e quantidades; preço, total, partes e PIX são do servidor.
router.post("/orders", exigeJwt, async (req, res) => {
  if (isBlocked(req.user)) fail(403, "Conta bloqueada para compras até a quitação do reembolso PIX.");
  const address = req.user.shipping_address;
  if (!address?.street || !address?.postal_code) {
    fail(400, "Cadastre um endereço de entrega no perfil para continuar.");
  }
  const { items } = parse(S.orderCreateSchema, req.body);

  const orderItems = await Promise.all(items.map(async ({ product_id, quantity }) => {
    const product = await store.get("products", product_id);
    if (!product) fail(409, "Um dos anúncios do carrinho não está mais disponível.");
    if (isSeller(product, req.user)) fail(403, "Você não pode comprar o próprio anúncio.");
    const unit = Number(product.price);
    return {
      product_id: product.id,
      title: product.title,
      platform: product.platform,
      image_url: product.image_url,
      seller_id: product.seller_id,
      seller_handle: product.seller_handle,
      quantity,
      unit_price: unit,
      subtotal: Number((unit * quantity).toFixed(2)),
    };
  }));
  const total = Number(orderItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  const id = `ORD-${Date.now().toString(36).toUpperCase()}-${store.newId().slice(0, 8)}`;

  const created = await store.insert("orders", {
    id,
    items: orderItems,
    total,
    payment_method: "PIX",
    status: "pending",
    pix_copy_paste: createDemoPixPayload(total, id),
    buyer_id: req.user.id,
    buyer_handle: handleOf(req.user),
    shipping_address: { ...address },
    delivery_cancellations: [],
    created_at: now(),
  });
  res.status(201).json(created);
});

// Só o comprador aprova (PIX simulado): pending → approved. Ao aprovar, o servidor
// retira os anúncios do catálogo e avisa os vendedores.
router.patch("/orders/:id", exigeJwt, async (req, res) => {
  const order = await exigeItem("orders", req.params.id, "Pedido");
  exigeDono(isOrderParty(order, req.user));

  if (!sameId(order.buyer_id, req.user.id)) {
    // Vendedor: o cancelamento de entrega é feito por POST /refunds; o pedido não muda aqui.
    return res.json(order);
  }
  const body = parse(S.orderUpdateSchema, req.body);
  if (body.status !== "approved") return res.json(order);
  if (order.status !== "pending") fail(409, "Este pedido não está mais aguardando pagamento.");

  const updated = exigeGravado(await store.update("orders", order.id, { status: "approved", approved_at: now() }), "Pedido");
  for (const item of order.items || []) await removeProductCascade(item.product_id);
  for (const sellerId of new Set(sellerIdsOf(order))) {
    const titles = order.items.filter((i) => sameId(i.seller_id, sellerId)).map((i) => i.title);
    await notify(sellerId, {
      type: "ORDER",
      title: "Venda aprovada",
      body: `${order.buyer_handle} pagou via PIX: ${titles.join(", ")}. Prepare o envio.`,
      link: "/profile",
    });
  }
  res.json(updated);
});

// ---------------------------------------------------------------- Reembolsos (cancelar entrega)
const isRefundParty = (refund, user) => sameId(refund.seller_id, user.id) || sameId(refund.buyer_id, user.id);

router.get("/refunds", exigeJwt, async (req, res) => {
  res.json(applyQuery(await store.find("refunds", (r) => isRefundParty(r, req.user)), req.query));
});

// O vendedor cancela a entrega dos itens dele: o servidor calcula o valor, gera o PIX,
// registra o cancelamento no pedido e bloqueia a conta até o reembolso ser pago.
router.post("/refunds", exigeJwt, async (req, res) => {
  const { order_id } = parse(S.refundCreateSchema, req.body);
  const order = await exigeItem("orders", order_id, "Pedido");
  const sellerItems = (order.items || []).filter((item) => sameId(item.seller_id, req.user.id));
  exigeDono(sellerItems.length > 0, "Apenas o vendedor dos itens pode cancelar a entrega.");
  if (order.status !== "approved") fail(409, "Só pedidos pagos podem ter a entrega cancelada.");
  const cancellations = order.delivery_cancellations || [];
  if (cancellations.some((c) => sameId(c.seller_id, req.user.id))) {
    fail(409, "A entrega dos seus itens neste pedido já foi cancelada.");
  }

  const amount = Number(sellerItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0).toFixed(2));
  const id = `RFD-${Date.now().toString(36).toUpperCase()}-${store.newId().slice(0, 6).toUpperCase()}`;
  const refund = await store.insert("refunds", {
    id,
    order_id: order.id,
    seller_id: req.user.id,
    seller_handle: handleOf(req.user),
    buyer_id: order.buyer_id,
    buyer_handle: order.buyer_handle,
    item_ids: sellerItems.map((item) => item.product_id),
    item_titles: sellerItems.map((item) => item.title),
    amount,
    payment_method: "PIX",
    status: "pending",
    pix_copy_paste: createDemoPixPayload(amount, id),
    created_at: now(),
  });
  await store.update("orders", order.id, {
    delivery_cancellations: [
      ...cancellations,
      { seller_id: req.user.id, refund_id: id, status: "cancelled", cancelled_at: now() },
    ],
  });
  await store.update("profiles", req.user.id, { account_status: "refund_pending" });
  await notify(order.buyer_id, {
    type: "REFUND",
    title: "Entrega cancelada",
    body: `${handleOf(req.user)} cancelou a entrega de ${refund.item_titles.join(", ")}. Reembolso de ${brl(amount)} em andamento.`,
    link: "/profile",
  });
  res.status(201).json(refund);
});

router.patch("/refunds/:id", exigeJwt, async (req, res) => {
  const refund = await exigeItem("refunds", req.params.id, "Reembolso");
  exigeDono(sameId(refund.seller_id, req.user.id), "Apenas o vendedor confirma o pagamento do reembolso.");
  parse(S.refundUpdateSchema, req.body);
  if (refund.status !== "pending") fail(409, "Este reembolso já foi pago.");

  // Fluxo pending → paid → released: confirmar o pagamento NÃO desbloqueia a conta;
  // só o administrador libera (PATCH /admin/refunds/:id/liberar).
  const updated = exigeGravado(await store.update("refunds", refund.id, { status: "paid", paid_at: now() }), "Reembolso");
  await notify(refund.buyer_id, {
    type: "REFUND",
    title: "Reembolso pago",
    body: `Você recebeu o reembolso de ${brl(refund.amount)} referente a ${refund.item_titles.join(", ")}.`,
    link: "/profile",
  });
  await notify(refund.seller_id, {
    type: "REFUND",
    title: "Pagamento do reembolso registrado",
    body: `Pagamento de ${brl(refund.amount)} confirmado. Sua conta aguarda a liberação do administrador.`,
    link: "/profile",
  });
  res.json(updated);
});

// ---------------------------------------------------------------- Denúncias de anúncio
const REPORT_DUPLICATE = "Você já denunciou este anúncio.";

// Só usuário logado denuncia; não há GET público (a lista fica em /admin/reports).
router.post("/reports", exigeJwt, async (req, res) => {
  const body = parse(S.reportCreateSchema, req.body);
  const product = await exigeItem("products", body.product_id, "Anúncio");
  if (isSeller(product, req.user)) fail(403, "Você não pode denunciar o próprio anúncio.");
  const duplicada = await store.find(
    "reports",
    (r) => sameId(r.product_id, product.id) && sameId(r.reporter_id, req.user.id) && r.status === "OPEN",
  );
  if (duplicada.length) fail(409, REPORT_DUPLICATE);

  // #41: a checagem acima não cobre requisições em paralelo; o índice único parcial
  // (reporter_id, product_id) WHERE status = 'OPEN' garante uma só denúncia aberta, e o
  // 23505 dele vira o mesmo 409. Denúncia resolvida sai do índice: dá para denunciar de novo.
  let created;
  try {
    created = await store.insert("reports", {
    id: store.newId("RPT-").toUpperCase(),
    product_id: product.id,
    // Retrato do anúncio: ele pode ser apagado depois.
    product_title: product.title,
    seller_id: product.seller_id ?? null,
    seller_handle: product.seller_handle ?? null,
    reason: body.reason,
    details: body.details ?? "",
    reporter_id: req.user.id,
    reporter_handle: handleOf(req.user),
    status: "OPEN",
    created_at: now(),
    });
  } catch (error) {
    if (error.code === "23505" && error.constraint === store.REPORT_UNIQUE_INDEX) fail(409, REPORT_DUPLICATE);
    throw error;
  }
  res.status(201).json(created);
});

export default router;
