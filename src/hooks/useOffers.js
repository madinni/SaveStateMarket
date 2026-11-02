import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { offersApi, messagesApi } from "../services/api";
import { deleteOfferCascade, notifyUser } from "../services/domain";

export const useOffers = () =>
  useQuery({ queryKey: ["offers"], queryFn: offersApi.list });

export const useMessages = (offerId) =>
  useQuery({
    queryKey: ["messages", offerId],
    queryFn: () => messagesApi.listByOffer(offerId),
    enabled: Boolean(offerId),
  });

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: messagesApi.create,
    onSuccess: (_data, message) =>
      queryClient.invalidateQueries({ queryKey: ["messages", message.offer_id] }),
  });
};

// Abre a negociação: grava a oferta, a primeira mensagem e avisa o vendedor.
export const useCreateOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ offer, firstMessage }) => {
      const created = await offersApi.create(offer);
      await messagesApi.create(firstMessage);
      await notifyUser(offer.seller_id, {
        type: "OFFER",
        title: offer.status === "ACCEPTED" ? "Compra direta confirmada" : "Nova proposta recebida",
        body: `${offer.buyer_handle} ${offer.status === "ACCEPTED" ? "comprou" : "ofereceu R$ " + Number(offer.offered_price).toFixed(2) + " por"} "${offer.product_title}".`,
        link: "/offers",
      });
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["offers"] }),
  });
};

// Altera o estado da oferta, registra a nota do sistema e avisa a outra parte.
export const useUpdateOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch, systemMessage, notification }) => {
      const updated = await offersApi.update(id, patch);
      await messagesApi.create(systemMessage);
      if (notification) await notifyUser(notification.user_id, notification);
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      queryClient.invalidateQueries({ queryKey: ["messages", updated.id] });
    },
  });
};

// Exclui o chat (negociação + mensagens).
export const useDeleteOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOfferCascade,
    onSuccess: (_data, offerId) => {
      queryClient.removeQueries({ queryKey: ["messages", offerId] });
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
  });
};
