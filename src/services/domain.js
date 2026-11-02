// Regras que antes eram feitas no navegador (com o json-server) agora são do servidor:
// cascatas, disparo de alertas, reputação e notificações. Estas funções ficam só
// como ponte para os hooks continuarem com a mesma assinatura.
import { productsApi, reviewsApi, offersApi } from "./api";

/** Notificações agora são criadas pelo servidor. Mantida para compatibilidade. */
export function notifyUser() {
  return Promise.resolve(null);
}

/** O servidor apaga a negociação e as mensagens dela. */
export const deleteOfferCascade = (offerId) => offersApi.remove(offerId);

/** O servidor apaga o anúncio, as negociações e as mensagens ligadas a ele. */
export const deleteProductCascade = (productId) => productsApi.remove(productId);

/** O servidor dispara os alertas de preço quando o preço baixa. */
export const updateProductWithAlerts = (id, data) => productsApi.update(id, data);

/** O servidor recalcula a reputação e avisa o avaliado. */
export const saveReviewAndSyncReputation = ({ id, data }) =>
  id ? reviewsApi.update(id, data) : reviewsApi.create(data);
