import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ticketsApi } from "../services/api";

export const useMyTickets = (authorId) =>
  useQuery({
    queryKey: ["tickets", authorId],
    queryFn: () => ticketsApi.listByAuthor(authorId),
    enabled: Boolean(authorId),
  });

const useTicketMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] }),
  });
};

export const useCreateTicket = () => useTicketMutation(ticketsApi.create);
export const useUpdateTicket = () =>
  useTicketMutation(({ id, data }) => ticketsApi.update(id, data));
export const useDeleteTicket = () => useTicketMutation(ticketsApi.remove);

// Consulta do visitante por id + código. É uma ação (POST), não uma lista em cache.
export const useLookupTicket = () => useMutation({ mutationFn: ticketsApi.lookup });
