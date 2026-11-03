import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsApi } from "../services/api";

// POST /reports. Erros esperados: 403 (próprio anúncio), 404 (anúncio sumiu), 409 (já denunciado).
export const useCreateReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reportsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "reports"] }),
  });
};
