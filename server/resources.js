// Rotas dos recursos. Em todas: 401 sem token, 404 id inexistente, 403 registro de outra
// pessoa (nessa ordem: 404 antes de 403). O dono sempre vem do token, nunca do corpo.
import { Router } from "express";
import * as store from "./store.js";
import { exigeJwt, jwtOpcional, isBlocked } from "./auth.js";
import { fail, parse, sameId, now, applyQuery } from "./http.js";
import { notify } from "./notify.js";
import { triggerAlerts, checkExistingListings, normalize } from "./alerts.js";
import { createDemoPixPayload } from "./pix.js";
import * as S from "./schemas.js";

const router = Router();

// exigeDono da aula: sem item → 404; item de outra pessoa → 403.
function exigeItem(collection, id, label = "Registro") {
  const item = store.get(collection, id);
  if (!item) fail(404, `${label} não encontrado.`);
  return item;
}
const exigeDono = (allowed, message = "Este registro pertence a outra pessoa.") => {
  if (!allowed) fail(403, message);
};

const brl = (value) => `R$ ${Number(value || 0).toFixed(2)}`;
const handleOf = (user) => user.handle;

// ---------------------------------------------------------------- Anúncios (Matheus + Luciano)
const isSeller = (product, user) =>
  sameId(product.seller_id, user.id) || (!product.seller_id && product.seller_handle === user.handle);

function removeProductCascade(productId) {
  const offerIds = store.find("offers", (o) => sameId(o.product_id, productId)).map((o) => String(o.id));
  store.removeWhere("messages", (m) => offerIds.includes(String(m.offer_id)));
  store.removeWhere("offers", (o) => offerIds.includes(String(o.id)));
  return store.remove("products", productId);
}

function productFromBody(body, current = {}) {
  const game = body.game_id ? store.get("games", body.game_id) : null;
  if (body.game_id && !game) fail(400, "Jogo não encontrado no catálogo.", "game_id");
  const title = game?.title ?? body.title ?? current.title;
  const platform = game?.platform ?? body.platform ?? current.platform;
  if (!title) fail(400, "Selecione um jogo do catálogo.", "game_id");
  return { ...body, title, platform, image_url: body.image_url || current.image_url || game?.cover_url };
}

router.get("/products", (req, res) => res.json(applyQuery(store.list("products"), req.query)));
router.get("/products/:id", (req, res) => res.json(exigeItem("products", req.params.id, "Anúncio")));

router.post("/products", exigeJwt, (req, res) => {
  if (isBlocked(req.user)) fail(403, "Conta bloqueada para novos anúncios até a quitação do reembolso PIX.");
  const body = productFromBody(parse(S.productSchema, req.body));
  const created = store.insert("products", {
    ...body,
    id: store.newId("prod-"),
    seller_id: req.user.id,
    seller_handle: handleOf(req.user),
    created_at: now(),
  });
  triggerAlerts(created);
  res.status(201).json(created);
});

router.patch("/products/:id", exigeJwt, (req, res) => {
  const product = exigeItem("products", req.params.id, "Anúncio");
  exigeDono(isSeller(product, req.user), "Apenas o anunciante pode alterar este anúncio.");
  const previousPrice = Number(product.price);
  const body = productFromBody(parse(S.productUpdateSchema, req.body), product);
  const updated = store.update("products", product.id, { ...body, updated_at: now() });
  if (Number(updated.price) < previousPrice) triggerAlerts(updated);
  res.json(updated);
});

router.delete("/products/:id", exigeJwt, (req, res) => {
  const product = exigeItem("products", req.params.id, "Anúncio");
  exigeDono(isSeller(product, req.user), "Apenas o anunciante pode excluir este anúncio.");
  removeProductCascade(product.id);
  res.json({});
});

// ---------------------------------------------------------------- Catálogo (somente leitura)
router.get("/games", (req, res) => res.json(applyQuery(store.list("games"), req.query)));
router.get("/games/:id", (req, res) => res.json(exigeItem("games", req.params.id, "Jogo")));
const adminOnly = () => fail(403, "Somente administradores podem alterar o catálogo.");
router.post("/games", exigeJwt, adminOnly);
router.patch("/games/:id", exigeJwt, adminOnly);
router.delete("/games/:id", exigeJwt, adminOnly);

// ---------------------------------------------------------------- Referência de preço (cache CheapShark)
// Leitura e escrita públicas de propósito: visitantes também consultam o benchmark.
// TODO: mover a consulta à CheapShark para o servidor e fechar a escrita.
router.get("/price_references", (req, res) => res.json(applyQuery(store.list("price_references"), req.query)));
router.post("/price_references", (req, res) => {
  res.status(201).json(store.insert("price_references", { ...(req.body || {}), id: store.newId("ref-") }));
});
router.patch("/price_references/:id", (req, res) => {
  exigeItem("price_references", req.params.id, "Referência");
  res.json(store.update("price_references", req.params.id, req.body || {}));
});

// ---------------------------------------------------------------- Avaliações
const reviewAuthor = (review, user) =>
  sameId(review.author_id, user.id) || (!review.author_id && review.author_handle === user.handle);

function syncReputation(profileId) {
  const reviews = store.find("profile_reviews", (r) => sameId(r.profile_id, profileId));
  if (!reviews.length) return;
  const average = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length;
  store.update("profiles", profileId, { reputation: Number(average.toFixed(2)) });
}

router.get("/profile_reviews", (req, res) => res.json(applyQuery(store.list("profile_reviews"), req.query)));

router.post("/profile_reviews", exigeJwt, (req, res) => {
  const body = parse(S.reviewSchema, req.body);
  exigeItem("profiles", body.profile_id, "Operador");
  if (sameId(body.profile_id, req.user.id)) fail(403, "Você não pode avaliar a si mesmo.");
  const already = store.find(
    "profile_reviews",
    (r) => sameId(r.profile_id, body.profile_id) && reviewAuthor(r, req.user),
  );
  if (already.length) fail(409, "Você já avaliou este operador. Edite a avaliação existente.");

  const created = store.insert("profile_reviews", {
    ...body,
    id: store.newId("REV-"),
    author_id: req.user.id,
    author_handle: handleOf(req.user),
    badge: "[VERIFIED_TRADE]",
    created_at: now(),
  });
  syncReputation(body.profile_id);
  notify(body.profile_id, {
    type: "REVIEW",
    title: "Nova avaliação recebida",
    body: `${handleOf(req.user)} avaliou você com ${body.rating} estrela(s).`,
    link: "/profile",
  });
  res.status(201).json(created);
});

router.patch("/profile_reviews/:id", exigeJwt, (req, res) => {
  const review = exigeItem("profile_reviews", req.params.id, "Avaliação");
  exigeDono(reviewAuthor(review, req.user), "Só o autor pode alterar a avaliação.");
  const body = parse(S.reviewUpdateSchema, req.body);
  const updated = store.update("profile_reviews", review.id, {
    ...body,
    author_id: req.user.id,
    badge: "[UPDATED_REVIEW]",
    updated_at: now(),
  });
  syncReputation(review.profile_id);
  res.json(updated);
});

// ---------------------------------------------------------------- Negociações (ofertas)
const isParty = (offer, user) => sameId(offer.buyer_id, user.id) || sameId(offer.seller_id, user.id);
const isClosed = (offer) => offer.status === "ACCEPTED" || offer.status === "REJECTED";

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

router.get("/offers", exigeJwt, (req, res) => {
  const mine = store.find("offers", (o) => isParty(o, req.user));
  res.json(applyQuery(mine, req.query));
});

router.get("/offers/:id", exigeJwt, (req, res) => {
  const offer = exigeItem("offers", req.params.id, "Negociação");
  exigeDono(isParty(offer, req.user));
  res.json(offer);
});

router.post("/offers", exigeJwt, (req, res) => {
  const body = parse(S.offerCreateSchema, req.body);
  const product = store.get("products", body.product_id);
  if (!product) fail(409, "Este anúncio não está mais disponível.");
  if (isSeller(product, req.user)) fail(403, "Você não pode negociar o próprio anúncio.");
  if (isBlocked(req.user)) fail(403, "Conta bloqueada para compras até a quitação do reembolso PIX.");

  const created = store.insert("offers", {
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
  notify(product.seller_id, {
    type: "OFFER",
    title: "Nova proposta recebida",
    body: `${handleOf(req.user)} ofereceu ${brl(body.offered_price)} por "${product.title}".`,
    link: "/offers",
  });
  res.status(201).json(created);
});

router.patch("/offers/:id", exigeJwt, (req, res) => {
  const offer = exigeItem("offers", req.params.id, "Negociação");
  exigeDono(isParty(offer, req.user));
  if (isClosed(offer)) fail(409, "Esta negociação já foi encerrada.");
  const { status, offered_price } = parse(S.offerUpdateSchema, req.body);

  const isBuyer = sameId(offer.buyer_id, req.user.id);
  if (status === "ACCEPTED" && sameId(offer.last_action_by, req.user.id)) {
    fail(403, "Você não pode aceitar a própria proposta.");
  }
  if (isBuyer && isBlocked(req.user) && status !== "REJECTED") {
    fail(403, "Conta bloqueada para compras até a quitação do reembolso PIX.");
  }
  if (status === "COUNTER_OFFER" && !offered_price) fail(400, "Informe o valor da contraproposta.", "offered_price");

  const updated = store.update("offers", offer.id, {
    status,
    last_action_by: req.user.id,
    updated_at: now(),
    ...(status === "COUNTER_OFFER" ? { offered_price: Number(offered_price) } : {}),
  });

  const texts = {
    ACCEPTED: `[SISTEMA]: Proposta ACEITA por ${handleOf(req.user)}`,
    REJECTED: `[SISTEMA]: Proposta RECUSADA por ${handleOf(req.user)}`,
    COUNTER_OFFER: `[SISTEMA]: Contraproposta enviada no valor de ${brl(offered_price)}`,
  };
  systemMessage(offer.id, texts[status]);

  const titles = {
    ACCEPTED: ["Proposta aceita", `${handleOf(req.user)} aceitou a proposta em "${offer.product_title}".`],
    REJECTED: ["Proposta recusada", `${handleOf(req.user)} recusou a proposta em "${offer.product_title}".`],
    COUNTER_OFFER: ["Nova contraproposta", `${handleOf(req.user)} propôs ${brl(offered_price)} em "${offer.product_title}".`],
  };
  const [title, body] = titles[status];
  notify(isBuyer ? offer.seller_id : offer.buyer_id, { type: "OFFER", title, body, link: "/offers" });

  res.json(updated);
});

router.delete("/offers/:id", exigeJwt, (req, res) => {
  const offer = exigeItem("offers", req.params.id, "Negociação");
  exigeDono(isParty(offer, req.user));
  store.removeWhere("messages", (m) => sameId(m.offer_id, offer.id));
  store.remove("offers", offer.id);
  res.json({});
});

// ---------------------------------------------------------------- Mensagens do chat
router.get("/messages", exigeJwt, (req, res) => {
  const myOffers = store.find("offers", (o) => isParty(o, req.user)).map((o) => String(o.id));
  const mine = store.find("messages", (m) => myOffers.includes(String(m.offer_id)));
  res.json(applyQuery(mine, req.query));
});

router.post("/messages", exigeJwt, (req, res) => {
  const body = parse(S.messageSchema, req.body);
  const offer = exigeItem("offers", body.offer_id, "Negociação");
  exigeDono(isParty(offer, req.user), "Você não participa desta negociação.");
  if (isClosed(offer)) fail(409, "Negociação encerrada: o chat está em modo somente leitura.");
  const created = store.insert("messages", {
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
const ticketOwner = (ticket, user) =>
  sameId(ticket.author_id, user.id) || (!ticket.author_id && ticket.author_handle === user.handle);

router.get("/tickets", exigeJwt, (req, res) => {
  const mine = store.find("tickets", (t) => ticketOwner(t, req.user));
  const { author_id, ...query } = req.query; // eslint-disable-line no-unused-vars
  res.json(applyQuery(mine, query));
});

router.get("/tickets/:id", exigeJwt, (req, res) => {
  const ticket = exigeItem("tickets", req.params.id, "Ticket");
  exigeDono(ticketOwner(ticket, req.user));
  res.json(ticket);
});

// Visitantes também podem abrir ticket (como antes); logado, o dono vem do token.
router.post("/tickets", jwtOpcional, (req, res) => {
  const body = parse(S.ticketSchema, req.body);
  const created = store.insert("tickets", {
    ...body,
    id: store.newId("TCK-").toUpperCase(),
    author_id: req.user?.id || "GUEST_SESSION",
    author_handle: req.user ? handleOf(req.user) : "@Visitante_Anonimo",
    status: "OPEN",
    created_at: now(),
  });
  res.status(201).json(created);
});

router.patch("/tickets/:id", exigeJwt, (req, res) => {
  const ticket = exigeItem("tickets", req.params.id, "Ticket");
  exigeDono(ticketOwner(ticket, req.user));
  if (ticket.status !== "OPEN") fail(409, "Só tickets em aberto podem ser alterados.");
  const body = parse(S.ticketUpdateSchema, req.body);
  res.json(store.update("tickets", ticket.id, { ...body, updated_at: now() }));
});

router.delete("/tickets/:id", exigeJwt, (req, res) => {
  const ticket = exigeItem("tickets", req.params.id, "Ticket");
  exigeDono(ticketOwner(ticket, req.user));
  if (ticket.status !== "OPEN") fail(409, "Só tickets em aberto podem ser cancelados.");
  store.remove("tickets", ticket.id);
  res.json({});
});

// ---------------------------------------------------------------- Notificações
const ownNotification = (n, user) => sameId(n.user_id, user.id);

router.get("/notifications", exigeJwt, (req, res) => {
  const { user_id, ...query } = req.query; // eslint-disable-line no-unused-vars
  res.json(applyQuery(store.find("notifications", (n) => ownNotification(n, req.user)), query));
});

router.post("/notifications", exigeJwt, () => fail(403, "Notificações são criadas apenas pelo sistema."));

router.patch("/notifications/:id", exigeJwt, (req, res) => {
  const item = exigeItem("notifications", req.params.id, "Notificação");
  exigeDono(ownNotification(item, req.user));
  res.json(store.update("notifications", item.id, parse(S.notificationUpdateSchema, req.body)));
});

router.delete("/notifications/:id", exigeJwt, (req, res) => {
  const item = exigeItem("notifications", req.params.id, "Notificação");
  exigeDono(ownNotification(item, req.user));
  store.remove("notifications", item.id);
  res.json({});
});

// ---------------------------------------------------------------- Alertas de preço por título (UC11)
router.get("/price_alerts", exigeJwt, (req, res) => {
  const { user_id, ...query } = req.query; // eslint-disable-line no-unused-vars
  res.json(applyQuery(store.find("price_alerts", (a) => sameId(a.user_id, req.user.id)), query));
});

// Jogo do catálogo só aceita plataforma em que ele existe. Título fora do catálogo aceita qualquer uma.
function checkAlertPlatform(title, platform) {
  if (!platform) return;
  const platforms = store.find("games", (g) => normalize(g.title) === normalize(title)).map((g) => g.platform);
  if (platforms.length && !platforms.includes(platform)) {
    fail(400, `"${title}" não existe para ${platform}. Plataformas no catálogo: ${platforms.join(", ")}.`, "platform");
  }
}

router.post("/price_alerts", exigeJwt, (req, res) => {
  const body = parse(S.alertSchema, req.body);
  checkAlertPlatform(body.title, body.platform);
  const created = store.insert("price_alerts", {
    id: store.newId("ALR-"),
    user_id: req.user.id,
    title: body.title,
    platform: body.platform || null,
    target_price: Number(body.target_price),
    active: true,
    created_at: now(),
  });
  checkExistingListings(created);
  res.status(201).json(store.get("price_alerts", created.id));
});

router.patch("/price_alerts/:id", exigeJwt, (req, res) => {
  const alert = exigeItem("price_alerts", req.params.id, "Alerta");
  exigeDono(sameId(alert.user_id, req.user.id));
  const body = parse(S.alertUpdateSchema, req.body);
  if (body.platform) checkAlertPlatform(alert.title, body.platform);
  const reactivate = body.active === true || (body.target_price !== undefined && body.active !== false);
  const patch = { ...body, updated_at: now() };
  if (reactivate) {
    Object.assign(patch, { active: true, triggered_at: null, triggered_price: null, triggered_product_id: null });
  }
  const updated = store.update("price_alerts", alert.id, patch);
  if (updated.active) checkExistingListings(updated);
  res.json(store.get("price_alerts", alert.id));
});

router.delete("/price_alerts/:id", exigeJwt, (req, res) => {
  const alert = exigeItem("price_alerts", req.params.id, "Alerta");
  exigeDono(sameId(alert.user_id, req.user.id));
  store.remove("price_alerts", alert.id);
  res.json({});
});

// ---------------------------------------------------------------- Pedidos (módulo de transação do Luciano)
const sellerIdsOf = (order) => (order.items || []).map((item) => String(item.seller_id));
const isOrderParty = (order, user) =>
  sameId(order.buyer_id, user.id) || sellerIdsOf(order).includes(String(user.id));

router.get("/orders", exigeJwt, (req, res) => {
  res.json(applyQuery(store.find("orders", (o) => isOrderParty(o, req.user)), req.query));
});

router.get("/orders/:id", exigeJwt, (req, res) => {
  const order = exigeItem("orders", req.params.id, "Pedido");
  exigeDono(isOrderParty(order, req.user));
  res.json(order);
});

// O cliente manda só os anúncios e quantidades; preço, total, partes e PIX são do servidor.
router.post("/orders", exigeJwt, (req, res) => {
  if (isBlocked(req.user)) fail(403, "Conta bloqueada para compras até a quitação do reembolso PIX.");
  const address = req.user.shipping_address;
  if (!address?.street || !address?.postal_code) {
    fail(400, "Cadastre um endereço de entrega no perfil para continuar.");
  }
  const { items } = parse(S.orderCreateSchema, req.body);

  const orderItems = items.map(({ product_id, quantity }) => {
    const product = store.get("products", product_id);
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
  });
  const total = Number(orderItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  const id = `ORD-${Date.now().toString(36).toUpperCase()}-${store.newId().slice(0, 8)}`;

  const created = store.insert("orders", {
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
router.patch("/orders/:id", exigeJwt, (req, res) => {
  const order = exigeItem("orders", req.params.id, "Pedido");
  exigeDono(isOrderParty(order, req.user));

  if (!sameId(order.buyer_id, req.user.id)) {
    // Vendedor: o cancelamento de entrega é feito por POST /refunds; o pedido não muda aqui.
    return res.json(order);
  }
  const body = parse(S.orderUpdateSchema, req.body);
  if (body.status !== "approved") return res.json(order);
  if (order.status !== "pending") fail(409, "Este pedido não está mais aguardando pagamento.");

  const updated = store.update("orders", order.id, { status: "approved", approved_at: now() });
  for (const item of order.items || []) removeProductCascade(item.product_id);
  for (const sellerId of new Set(sellerIdsOf(order))) {
    const titles = order.items.filter((i) => sameId(i.seller_id, sellerId)).map((i) => i.title);
    notify(sellerId, {
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

router.get("/refunds", exigeJwt, (req, res) => {
  res.json(applyQuery(store.find("refunds", (r) => isRefundParty(r, req.user)), req.query));
});

// O vendedor cancela a entrega dos itens dele: o servidor calcula o valor, gera o PIX,
// registra o cancelamento no pedido e bloqueia a conta até o reembolso ser pago.
router.post("/refunds", exigeJwt, (req, res) => {
  const { order_id } = parse(S.refundCreateSchema, req.body);
  const order = exigeItem("orders", order_id, "Pedido");
  const sellerItems = (order.items || []).filter((item) => sameId(item.seller_id, req.user.id));
  exigeDono(sellerItems.length > 0, "Apenas o vendedor dos itens pode cancelar a entrega.");
  if (order.status !== "approved") fail(409, "Só pedidos pagos podem ter a entrega cancelada.");
  const cancellations = order.delivery_cancellations || [];
  if (cancellations.some((c) => sameId(c.seller_id, req.user.id))) {
    fail(409, "A entrega dos seus itens neste pedido já foi cancelada.");
  }

  const amount = Number(sellerItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0).toFixed(2));
  const id = `RFD-${Date.now().toString(36).toUpperCase()}-${store.newId().slice(0, 6).toUpperCase()}`;
  const refund = store.insert("refunds", {
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
  store.update("orders", order.id, {
    delivery_cancellations: [
      ...cancellations,
      { seller_id: req.user.id, refund_id: id, status: "cancelled", cancelled_at: now() },
    ],
  });
  store.update("profiles", req.user.id, { account_status: "refund_pending" });
  notify(order.buyer_id, {
    type: "REFUND",
    title: "Entrega cancelada",
    body: `${handleOf(req.user)} cancelou a entrega de ${refund.item_titles.join(", ")}. Reembolso de ${brl(amount)} em andamento.`,
    link: "/profile",
  });
  res.status(201).json(refund);
});

router.patch("/refunds/:id", exigeJwt, (req, res) => {
  const refund = exigeItem("refunds", req.params.id, "Reembolso");
  exigeDono(sameId(refund.seller_id, req.user.id), "Apenas o vendedor confirma o pagamento do reembolso.");
  parse(S.refundUpdateSchema, req.body);
  if (refund.status !== "pending") fail(409, "Este reembolso já foi pago.");

  const updated = store.update("refunds", refund.id, { status: "paid", paid_at: now() });
  const pending = store.find("refunds", (r) => sameId(r.seller_id, req.user.id) && r.status === "pending");
  if (!pending.length) store.update("profiles", req.user.id, { account_status: "active" });
  notify(refund.buyer_id, {
    type: "REFUND",
    title: "Reembolso pago",
    body: `Você recebeu o reembolso de ${brl(refund.amount)} referente a ${refund.item_titles.join(", ")}.`,
    link: "/profile",
  });
  res.json(updated);
});

export default router;
