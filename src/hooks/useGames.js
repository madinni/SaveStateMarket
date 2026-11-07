import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gamesApi } from "../services/api";

export const gameKeys = { all: ["games"] };

export const useGames = () =>
  useQuery({ queryKey: gameKeys.all, queryFn: gamesApi.list, staleTime: 5 * 60_000 });

// Renomear ou excluir um jogo reflete nos anúncios, por isso "products" também é invalidado.
const useGameMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.all });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useCreateGame = () => useGameMutation(gamesApi.create);
export const useUpdateGame = () => useGameMutation(({ id, data }) => gamesApi.update(id, data));
export const useDeleteGame = () => useGameMutation(gamesApi.remove);