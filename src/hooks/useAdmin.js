import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../services/api";

// Chaves do painel do administrador. Ficam separadas das listas do usuário comum
// (["tickets"], ["refunds"]), que o servidor filtra pelo dono do token.
export const adminKeys = {
  all: ["admin"],
  tickets: ["admin", "tickets"],
  refunds: ["admin", "refunds"],
  reports: ["admin", "reports"],
};

const useAdminMutation = (mutationFn, keys) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey })),
  });
};

// ---- Tickets (UC12) ----
export const useAdminTickets = () =>
  useQuery({ queryKey: adminKeys.tickets, queryFn: adminApi.listTickets });

export const useAdminUpdateTicket = () =>
  useAdminMutation(({ id, data }) => adminApi.updateTicket(id, data), [adminKeys.tickets, ["tickets"]]);

// ---- Reembolsos (UC13) ----
export const useAdminRefunds = () =>
  useQuery({ queryKey: adminKeys.refunds, queryFn: adminApi.listRefunds });

// O servidor reativa a conta do vendedor quando não sobra reembolso em aberto.
export const useReleaseRefund = () =>
  useAdminMutation(adminApi.releaseRefund, [adminKeys.refunds, ["refunds"], ["profiles"]]);

// ---- Denúncias (UC15/UC16) ----
export const useAdminReports = () =>
  useQuery({ queryKey: adminKeys.reports, queryFn: adminApi.listReports });

export const useDismissReport = () =>
  useAdminMutation((id) => adminApi.updateReport(id, { status: "DISMISSED" }), [adminKeys.reports]);

// Remoção em cascata no servidor: anúncio → propostas → mensagens; denúncias abertas viram RESOLVED_REMOVED.
export const useAdminDeleteProduct = () =>
  useAdminMutation(adminApi.deleteProduct, [
    adminKeys.reports,
    ["products"],
    ["offers"],
    ["messages"],
    ["alerts"],
  ]);
