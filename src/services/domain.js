// Regras de negócio que envolvem mais de um recurso do json-server.
// Como o backend é mockado, a consistência entre as coleções é feita aqui.
import {
  productsApi,
  profilesApi,
  reviewsApi,
  offersApi,
  messagesApi,
  alertsApi,
  notificationsApi,
} from "./api";
import { formatBRL } from "../utils/format";


/** Cria uma notificação na área de notificações do usuário. */
export function notifyUser(userId, { type, title, body, link }) {
  if (!userId) return Promise.resolve(null);
  return notificationsApi.create({
    user_id: userId,
    type,
    title,
    body,
    link,
    read: false,
    created_at: new Date().toISOString(),
  });
}

/** Exclui um chat: primeiro as mensagens, depois a negociação. */
export async function deleteOfferCascade(offerId) {
  const messages = await messagesApi.listByOffer(offerId);
  for (const message of messages) await messagesApi.remove(message.id);
  await offersApi.remove(offerId);
}

/**
 * Exclui um anúncio e tudo que depende dele (negociações, mensagens e alertas).
 * O anúncio é removido por último: se algo falhar no meio, ele continua
 * existindo e a exclusão pode ser repetida sem deixar dados órfãos.
 */
export async function deleteProductCascade(productId) {
  const offers = await offersApi.listByProduct(productId);
  for (const offer of offers) await deleteOfferCascade(offer.id);

  const alerts = await alertsApi.listByProduct(productId);
  for (const alert of alerts) await alertsApi.remove(alert.id);

  await productsApi.remove(productId);
}

/** Dispara os alertas de preço ativos que o novo preço do anúncio atingiu. */
export async function triggerPriceAlerts(product) {
  const alerts = await alertsApi.listActiveByProduct(product.id);
  const reached = alerts.filter((a) => Number(product.price) <= Number(a.target_price));

  for (const alert of reached) {
    await notifyUser(alert.user_id, {
      type: "PRICE_ALERT",
      title: `Alerta de preço: ${product.title}`,
      body: `O preço caiu para ${formatBRL(product.price)} (seu alvo: ${formatBRL(alert.target_price)}).`,
      link: `/product/${product.id}`,
    });
    await alertsApi.update(alert.id, {
      active: false,
      triggered_at: new Date().toISOString(),
      triggered_price: Number(product.price),
    });
  }
  return reached.length;
}

/** Atualiza o anúncio e, se o preço baixou, avisa quem criou alertas. */
export async function updateProductWithAlerts(id, data) {
  const previous = await productsApi.get(id);
  const updated = await productsApi.update(id, data);
  if (Number(updated.price) < Number(previous.price)) {
    await triggerPriceAlerts(updated);
  }
  return updated;
}

/** Grava a avaliação e recalcula a reputação do avaliado (média das notas). */
export async function saveReviewAndSyncReputation({ id, data }) {
  const saved = id ? await reviewsApi.update(id, data) : await reviewsApi.create(data);

  const reviews = await reviewsApi.listByProfile(data.profile_id);
  const average = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length;
  await profilesApi.update(data.profile_id, { reputation: Number(average.toFixed(2)) });

  if (!id) {
    await notifyUser(data.profile_id, {
      type: "REVIEW",
      title: "Nova avaliação recebida",
      body: `${data.author_handle} avaliou você com ${data.rating} estrela(s).`,
      link: "/profile",
    });
  }
  return saved;
}
