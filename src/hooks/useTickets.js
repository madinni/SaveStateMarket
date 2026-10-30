import { useMutation } from "@tanstack/react-query";
import { ticketsApi } from "../services/api";

export const useCreateTicket = () =>
  useMutation({ mutationFn: ticketsApi.create });
