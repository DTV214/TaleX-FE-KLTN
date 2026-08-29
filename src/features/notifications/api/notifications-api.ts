import {
  httpClient,
  unwrapBaseResponse,
  type BasePageResponse,
} from "@/shared/api/http-client";

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

// Backend notification pagination starts from page 1.
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

// Xoá vĩnh viễn các thông báo đã đọc khỏi DB, trả về số lượng đã xoá.
export async function deleteReadNotifications() {
  return unwrapBaseResponse<number>(
    httpClient.delete(`${NOTIFICATIONS_ENDPOINT}/read`),
  );
}
