import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../services/notification.services";


export const useUnreadCount = (enabled = true) =>
  useQuery({
    queryKey: ["notificationsUnreadCount"],
    queryFn: async () => {
      const res = await notificationService.getUnreadCount();
      return res?.unreadCount ?? 0;
    },
    refetchInterval: 30_000,
    enabled,
    staleTime: 15_000,
  });


export const useNotifications = (params = {}) =>
  useQuery({
    queryKey: ["notifications", params],
    queryFn: () => notificationService.getMyNotifications(params),
    refetchInterval: 30_000,
  });


export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationsUnreadCount"] });
    },
  });
};


export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationsUnreadCount"] });
    },
  });
};
