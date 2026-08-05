"use client";

import { Bell, Loader2 } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { toast } from "sonner";
import { getEpisodeById } from "@/features/creator-dashboard/api/creator-content-api";
import {
  useMarkNotificationAsRead,
  useMyNotifications,
  useUnreadNotificationCount,
} from "@/features/creator-dashboard/hooks/use-notifications";
import { type NotificationResponse } from "@/features/creator-dashboard/api/notifications-api";

function formatRelativeTime(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

// Điều hướng sâu tới đúng episode được nhắc trong thông báo. Route dashboard đọc trạng
// thái từ query string CHỈ 1 LẦN lúc mount (xem readDashboardRouteState trong
// creator-dashboard.tsx) — router.push() nội bộ (SPA) sẽ không làm dashboard nhận trạng
// thái mới nếu đang đứng sẵn trên cùng trang, nên dùng điều hướng cứng (full reload) để
// đảm bảo luôn đọc đúng seriesId/seasonId/episodeId mới.
async function navigateToEpisode(episodeId: string) {
  const episode = await getEpisodeById(episodeId);
  if (!episode.seriesId) {
    toast.error("Không thể mở episode — thiếu thông tin series.");
    return;
  }
  const view = episode.contentType === "COMIC" ? "comic" : "video";
  const params = new URLSearchParams({
    view,
    seriesId: episode.seriesId,
    seasonId: episode.seasonId,
    episodeId: episode.episodeId,
  });
  window.location.href = `/creator-dashboard?${params.toString()}`;
}

function NotificationItem({ notification }: { notification: NotificationResponse }) {
  const markAsReadMutation = useMarkNotificationAsRead();

  async function handleClick() {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.notificationId);
    }

    // Chỉ xử lý điều hướng cho thông báo content pipeline (episode bị ẩn/gỡ ẩn) — các
    // loại thông báo khác (report/penalty/appeal...) do phần khác của hệ thống định nghĩa
    // điểm đến sau, ở đây chỉ đánh dấu đã đọc, không đoán mò đường dẫn.
    if (notification.referenceType === "EPISODE" && notification.referenceId) {
      try {
        await navigateToEpisode(notification.referenceId);
      } catch {
        toast.error("Không thể mở nội dung liên quan — có thể đã bị xóa.");
      }
    }
  }

  return (
    <DropdownMenu.Item
      onSelect={(e) => {
        e.preventDefault();
        handleClick();
      }}
      className={`flex cursor-pointer select-none flex-col gap-1 rounded-lg px-3 py-2.5 text-left outline-none transition-colors hover:bg-white/5 focus:bg-white/5 ${
        notification.isRead ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-bold text-white">{notification.title}</span>
        {!notification.isRead && (
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-yellow-400" />
        )}
      </div>
      <p className="line-clamp-2 text-xs font-medium text-zinc-400">{notification.content}</p>
      <span className="text-[11px] text-zinc-500">{formatRelativeTime(notification.createdAt)}</span>
    </DropdownMenu.Item>
  );
}

export function NotificationBell() {
  const unreadCountQuery = useUnreadNotificationCount();
  const notificationsQuery = useMyNotifications(1, 10);
  const unreadCount = unreadCountQuery.data ?? 0;
  const notifications = notificationsQuery.data?.content ?? [];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="relative rounded-full p-2 text-creator-muted transition-colors hover:bg-white/[0.055] hover:text-white"
          aria-label="Thông báo"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full border border-creator-bg" />
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-50 w-80 rounded-xl border border-white/10 bg-[#161619] p-2 text-zinc-300 shadow-2xl outline-none data-[side=bottom]:animate-in data-[side=bottom]:fade-in data-[side=bottom]:slide-in-from-top-2"
        >
          <div className="px-2 py-1.5 text-xs font-black uppercase tracking-wide text-creator-gold">
            Thông báo
          </div>

          {notificationsQuery.isLoading && (
            <div className="flex items-center justify-center gap-2 py-6 text-xs font-semibold text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải...
            </div>
          )}

          {!notificationsQuery.isLoading && notifications.length === 0 && (
            <div className="px-3 py-6 text-center text-xs font-semibold text-zinc-500">
              Chưa có thông báo nào.
            </div>
          )}

          <div className="max-h-96 space-y-1 overflow-y-auto">
            {notifications.map((notification) => (
              <NotificationItem key={notification.notificationId} notification={notification} />
            ))}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
