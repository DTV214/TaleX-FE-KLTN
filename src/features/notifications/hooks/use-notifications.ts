"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteReadNotifications,
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/features/notifications/api/notifications-api";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (page: number, pageSize: number) =>
    [...notificationKeys.all, "list", page, pageSize] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

export function useMyNotifications(
  page = 1,
  pageSize = 20,
  enabled = true,
  refetchInterval: number | false = false,
) {
  return useQuery({
    queryKey: notificationKeys.list(page, pageSize),
    queryFn: () => getMyNotifications(page, pageSize),
    enabled,
    refetchInterval,
    refetchOnWindowFocus: true,
  });
}

// Temporary FE polling until notification SSE/WebSocket is introduced.
export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => getUnreadNotificationCount(),
    enabled,
    refetchInterval: enabled ? 15000 : false,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useDeleteReadNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteReadNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
