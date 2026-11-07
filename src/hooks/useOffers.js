import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { offersApi, messagesApi } from "../services/api";
import { deleteOfferCascade } from "../services/domain";

export const useOffers = () =>
  useQuery({ queryKey: ["offers"], queryFn: offersApi.list });

export const useMessages = (offerId) =>
  useQuery({
    queryKey: ["messages", offerId],
    queryFn: () => messagesApi.listByOffer(offerId),
    enabled: Boolean(offerId),
  });

// O cliente manda só { offer_id, text }; id, remetente e horário vêm do servidor.
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: messagesApi.create,
    onSuccess: (_data, message) =>
      queryClient.invalidateQueries({ queryKey: ["messages", message.offer_id] }),
  });
};

// Abre a negociação. O servidor grava a oferta e avisa o vendedor;
// a primeira mensagem vai com o id que o servidor gerou.
export const useCreateOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ offer, firstMessage }) => {
      const created = await offersApi.create(offer);
      if (firstMessage?.text) {
        await messagesApi.create({ offer_id: created.id, text: firstMessage.text });
      }
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["offers"] }),
  });
};

// Altera o estado da oferta: data = { status, offered_price? }. A nota do sistema no chat,
// last_action_by e a notificação da outra parte são feitas pelo servidor.
export const useUpdateOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => offersApi.update(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      queryClient.invalidateQueries({ queryKey: ["messages", updated.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

// Exclui o chat (negociação + mensagens). Oferta ACCEPTED é recusada pela API (409).
export const useDeleteOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOfferCascade,
    onSuccess: (_data, offerId) => {
      queryClient.removeQueries({ queryKey: ["messages", offerId] });
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
    // 409: a oferta foi aceita enquanto a lista estava desatualizada; recarrega o status.
    onError: (error) => {
      if (error?.status === 409) queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
  });
};
