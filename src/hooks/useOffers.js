import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { offersApi, messagesApi } from "../services/api";

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

// Abre a negociação: grava a oferta e a primeira mensagem do chat.
export const useCreateOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ offer, firstMessage }) => {
      const created = await offersApi.create(offer);
      await messagesApi.create(firstMessage);
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["offers"] }),
  });
};

// Altera o estado da oferta e registra a nota do sistema no chat.
export const useUpdateOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch, systemMessage }) => {
      const updated = await offersApi.update(id, patch);
      await messagesApi.create(systemMessage);
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      queryClient.invalidateQueries({ queryKey: ["messages", updated.id] });
    },
  });
};
