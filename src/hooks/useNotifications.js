import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, alertsApi } from "../services/api";

// Sem WebSocket no json-server, a área de notificações consulta a API a cada 15 s.
const POLLING_MS = 15_000;

export const useNotifications = (userId) =>
  useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => notificationsApi.listByUser(userId),
    enabled: Boolean(userId),
    refetchInterval: POLLING_MS,
  });

export const useUnreadCount = (userId) => {
  const { data = [] } = useNotifications(userId);
  return data.filter((n) => !n.read).length;
};

const useNotificationMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
};

export const useMarkRead = () =>
  useNotificationMutation((id) => notificationsApi.update(id, { read: true }));

export const useMarkAllRead = () =>
  useNotificationMutation(async (ids) => {
    for (const id of ids) await notificationsApi.update(id, { read: true });
  });

export const useDeleteNotifications = () =>
  useNotificationMutation(async (ids) => {
    for (const id of ids) await notificationsApi.remove(id);
  });

// ---- Alertas de preço (UC11) ----

export const useMyAlerts = (userId) =>
  useQuery({
    queryKey: ["alerts", userId],
    queryFn: () => alertsApi.listByUser(userId),
    enabled: Boolean(userId),
  });

const useAlertMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });
};

export const useCreateAlert = () => useAlertMutation(alertsApi.create);
export const useUpdateAlert = () =>
  useAlertMutation(({ id, data }) => alertsApi.update(id, data));
export const useDeleteAlert = () => useAlertMutation(alertsApi.remove);
