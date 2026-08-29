"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bell, CheckCheck, Loader2, Trash2 } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { toast } from "sonner";
import { getEpisodeById } from "@/features/creator-dashboard/api/creator-content-api";
import { getPublicEpisodeDetail } from "@/features/series/api/series-api";
import { type NotificationResponse } from "@/features/notifications/api/notifications-api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  notificationKeys,
  useDeleteReadNotifications,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useMyNotifications,
  useUnreadNotificationCount,
} from "@/features/notifications/hooks/use-notifications";

type NotificationBellVariant = "creator" | "public";

type NotificationBellProps = {
  variant?: NotificationBellVariant;
  enabled?: boolean;
  className?: string;
};

const CREATOR_MODERATION_REFERENCE_TYPES = new Set([
  "APPEAL",
  "MODERATION",
  "PENALTY",
  "REPORT",
  "TICKET",
  "VIOLATION",
]);
const CREATOR_MODERATION_KEYWORDS = [
  "appeal",
  "moderation",
  "penalty",
  "report",
  "ticket",
  "violation",
  "hình phạt",
  "hinh phat",
  "khiếu nại",
  "khieu nai",
  "khôi phục",
  "khoi phuc",
  "vi phạm",
  "vi pham",
  "xử phạt",
  "xu phat",
];

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

async function navigateToCreatorEpisode(episodeId: string) {
  const episode = await getEpisodeById(episodeId);
  if (!episode.seriesId) {
    toast.error("Không thể mở episode liên quan.");
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

async function navigateToPublicEpisode(episodeId: string) {
  const episode = await getPublicEpisodeDetail(episodeId);
  const route = String(episode.contentType).toUpperCase() === "COMIC" ? "read" : "watch";
  window.location.href = `/${route}/${episodeId}`;
}

function isCreatorModerationNotification(notification: NotificationResponse) {
  const referenceType = notification.referenceType?.toUpperCase();
  if (
    referenceType &&
    CREATOR_MODERATION_REFERENCE_TYPES.has(referenceType)
  ) {
    return true;
  }

  const searchableText = [
    notification.type,
    notification.referenceType,
    notification.title,
    notification.content,
  ]
    .join(" ")
    .toLowerCase();

  return CREATOR_MODERATION_KEYWORDS.some((keyword) =>
    searchableText.includes(keyword),
  );
}

async function resolveNotificationTarget(
  notification: NotificationResponse,
  variant: NotificationBellVariant,
) {
  if (variant === "creator" && isCreatorModerationNotification(notification)) {
    window.location.href = "/creator-dashboard?view=violations";
    return;
  }

  if (!notification.referenceType || !notification.referenceId) return;

  const referenceType = notification.referenceType.toUpperCase();
  if (referenceType === "EPISODE") {
    if (variant === "creator") {
      await navigateToCreatorEpisode(notification.referenceId);
      return;
    }

    await navigateToPublicEpisode(notification.referenceId);
    return;
  }

  if (referenceType === "SERIES") {
    window.location.href = `/series/${notification.referenceId}`;
  }
}

function NotificationItem({
  notification,
  variant,
}: {
  notification: NotificationResponse;
  variant: NotificationBellVariant;
}) {
  const markAsReadMutation = useMarkNotificationAsRead();

  async function handleClick() {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.notificationId);
    }

    try {
      await resolveNotificationTarget(notification, variant);
    } catch {
      toast.error("Không thể mở nội dung liên quan.");
    }
  }

  return (
    <DropdownMenu.Item
      onSelect={(event) => {
        event.preventDefault();
        void handleClick();
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
      <p className="line-clamp-2 text-xs font-medium text-zinc-400">
        {notification.content}
      </p>
      <span className="text-[11px] text-zinc-500">
        {formatRelativeTime(notification.createdAt)}
      </span>
    </DropdownMenu.Item>
  );
}

export function NotificationBell({
  variant = "public",
  enabled = true,
  className = "",
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const queryClient = useQueryClient();
  const unreadCountQuery = useUnreadNotificationCount(enabled);
  const notificationsQuery = useMyNotifications(1, 10, enabled && open, open ? 15000 : false);
  const markAllMutation = useMarkAllNotificationsAsRead();
  const deleteReadMutation = useDeleteReadNotifications();
  const unreadCount = unreadCountQuery.data ?? 0;
  const notifications = notificationsQuery.data?.content ?? [];
  const readNotifications = useMemo(
    () => notifications.filter((notification) => notification.isRead),
    [notifications],
  );
  const badgeLabel = useMemo(() => (unreadCount > 9 ? "9+" : String(unreadCount)), [unreadCount]);
  const hasReadNotifications = readNotifications.length > 0;

  useEffect(() => {
    if (!enabled || unreadCount <= 0) return;
    queryClient.invalidateQueries({ queryKey: notificationKeys.list(1, 10) });
  }, [enabled, queryClient, unreadCount]);

  function handleOpenClearConfirm() {
    if (!hasReadNotifications) {
      toast.info("Chưa có thông báo đã xem để xóa.");
      return;
    }

    setOpen(false);
    setClearConfirmOpen(true);
  }

  function handleConfirmClearReadNotifications() {
    deleteReadMutation.mutate(undefined, {
      onSuccess: (deletedCount) => {
        setClearConfirmOpen(false);
        toast.success(`Đã xóa ${deletedCount} thông báo đã xem.`);
      },
      onError: () => {
        toast.error("Không thể xoá thông báo, vui lòng thử lại.");
      },
    });
  }

  return (
    <>
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={`relative flex items-center justify-center rounded-xl text-foreground/75 transition hover:border-primary/40 hover:bg-white/[0.08] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${className}`}
          aria-label="Thông báo"
          title="Thông báo"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-black bg-[#D4AF37] px-1 text-[10px] font-black leading-none text-black shadow-[0_0_16px_rgba(212,175,55,0.45)]">
              {badgeLabel}
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-50 w-80 rounded-xl border border-white/10 bg-[#161619] p-2 text-zinc-300 shadow-2xl shadow-black/40 outline-none data-[side=bottom]:animate-in data-[side=bottom]:fade-in data-[side=bottom]:slide-in-from-top-2"
        >
          <div className="flex items-start justify-between gap-3 px-2 py-1.5">
            <span className="text-xs font-black uppercase tracking-wide text-[#D4AF37]">
              Thông báo
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="inline-flex h-7 items-center gap-1 rounded-full border border-white/10 px-2 text-[11px] font-bold text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {markAllMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3 w-3" />
                )}
                Đọc hết
              </button>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="mb-1 flex items-center justify-end gap-1.5 px-2">
              <button
                type="button"
                onClick={handleOpenClearConfirm}
                disabled={!hasReadNotifications}
                className="inline-flex h-7 items-center gap-1 rounded-full border border-white/10 px-2 text-[11px] font-bold text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Trash2 className="h-3 w-3" />
                Xóa đã xem
              </button>
            </div>
          )}

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
              <NotificationItem
                key={notification.notificationId}
                notification={notification}
                variant={variant}
              />
            ))}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>

      <Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <DialogContent className="rounded-2xl border border-white/10 bg-[#161619] p-5 text-white shadow-2xl shadow-black/50 sm:max-w-md">
          <DialogHeader className="pr-8">
            <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl border border-amber-300/25 bg-amber-300/10 text-amber-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-black text-white">
              Xóa thông báo đã xem?
            </DialogTitle>
            <DialogDescription className="text-sm font-semibold leading-6 text-zinc-400">
              Hành động này xóa vĩnh viễn các thông báo đã đọc. Thông báo mới
              hoặc chưa xem vẫn được giữ lại để bạn không bỏ lỡ nội dung quan
              trọng.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-xs font-semibold text-zinc-400">
            Sẽ xóa {readNotifications.length} thông báo đã xem.
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setClearConfirmOpen(false)}
              disabled={deleteReadMutation.isPending}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-bold text-zinc-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmClearReadNotifications}
              disabled={deleteReadMutation.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 text-sm font-black text-black transition hover:bg-[#F0CB55] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleteReadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Xóa đã xem
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
