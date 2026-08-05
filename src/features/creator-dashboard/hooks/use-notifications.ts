"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/features/creator-dashboard/api/notifications-api";

export const notificationKeys = {
  all: ["creator-dashboard", "notifications"] as const,
  list: (page: number, pageSize: number) =>
    [...notificationKeys.all, "list", page, pageSize] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

export function useMyNotifications(page = 1, pageSize = 20, enabled = true) {
  return useQuery({
    queryKey: notificationKeys.list(page, pageSize),
    queryFn: () => getMyNotifications(page, pageSize),
    enabled,
  });
}

// Poll định kỳ để chuông cập nhật khi có thông báo mới (không có SSE riêng cho
// notification, khác pipeline — polling nhẹ 30s là đủ, không cần realtime tuyệt đối).
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => getUnreadNotificationCount(),
    refetchInterval: 30000,
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
