import {
  httpClient,
  unwrapBaseResponse,
  type BasePageResponse,
} from "@/shared/api/http-client";

// Chỉ liệt kê type liên quan content pipeline (EPISODE_FORCE_HIDDEN/EPISODE_RESTORED) —
// các loại report/penalty/appeal khác do phần khác của hệ thống tự thêm dần, FE chỉ cần
// hiển thị chung (title/content) nên không cần khai báo type cụ thể ở đây.
export type NotificationType = string;

export type NotificationResponse = {
  notificationId: string;
  recipientId: string;
  title: string;
  content: string;
  type: NotificationType;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
};

const NOTIFICATIONS_ENDPOINT = "/api/v1/notifications";

// BE dùng page bắt đầu từ 1 (khác media pagination bắt đầu từ 0).
export async function getMyNotifications(page = 1, pageSize = 20) {
  return unwrapBaseResponse<BasePageResponse<NotificationResponse>>(
    httpClient.get(`${NOTIFICATIONS_ENDPOINT}/my-notifications`, {
      params: { page, pageSize },
    }),
  );
}

export async function getUnreadNotificationCount() {
  return unwrapBaseResponse<number>(
    httpClient.get(`${NOTIFICATIONS_ENDPOINT}/unread-count`),
  );
}

export async function markNotificationAsRead(notificationId: string) {
  return unwrapBaseResponse<void>(
    httpClient.put(`${NOTIFICATIONS_ENDPOINT}/${notificationId}/read`),
  );
}

export async function markAllNotificationsAsRead() {
  return unwrapBaseResponse<void>(
    httpClient.put(`${NOTIFICATIONS_ENDPOINT}/read-all`),
  );
}
