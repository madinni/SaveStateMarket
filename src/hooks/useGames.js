import { useQuery } from "@tanstack/react-query";
import { gamesApi } from "../services/api";

export const gameKeys = { all: ["games"] };

export const useGames = () =>
  useQuery({ queryKey: gameKeys.all, queryFn: gamesApi.list, staleTime: 5 * 60_000 });