"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileImage,
  Loader2,
  Smile,
  Video,
  X,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { type ModerationMedia } from "@/features/admin/api/moderation.api";
import {
  useApproveMedia,
  useGetPendingMedia,
  useRejectMedia,
} from "@/features/admin/hooks/use-moderation";

const PAGE_SIZE = 12;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Thao tác thất bại.";
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function RejectReasonModal({
  isLoading,
  media,
  onClose,
  onSubmit,
  open,
}: {
  isLoading: boolean;
  media: ModerationMedia | null;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  open: boolean;
}) {
  if (!open || !media) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const reason = String(formData.get("reason") ?? "").trim();

    if (!reason) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }

    onSubmit(reason);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Từ chối nội dung
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Nhập lý do để creator biết cần chỉnh sửa nội dung nào.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Media ID
          </p>
          <p className="mt-1 break-all text-sm font-bold text-slate-900">
            {media.id}
          </p>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Lý do từ chối
          </span>
          <textarea
            name="reason"
            required
            rows={5}
            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
            placeholder="Ví dụ: Nội dung chứa hình ảnh không phù hợp..."
          />
        </label>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Từ chối
          </button>
        </div>
      </form>
    </div>
  );
}

function ModerationCard({
  isMutating,
  media,
  onApprove,
  onReject,
}: {
  isMutating: boolean;
  media: ModerationMedia;
  onApprove: (media: ModerationMedia) => void;
  onReject: (media: ModerationMedia) => void;
}) {
  const isVideo = media.mediaType === "VIDEO";
  const PreviewIcon = isVideo ? Video : FileImage;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex aspect-video items-center justify-center border-b border-slate-100 bg-slate-100">
        {media.url && media.mediaType === "IMAGE" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media.thumbnailUrl ?? media.url}
            alt={media.id}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
              <PreviewIcon className="h-7 w-7" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wide">
              {isVideo ? "Video Preview" : "Image Preview"}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Media ID
          </p>
          <p className="mt-1 break-all text-sm font-bold text-slate-950">
            {media.id}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${
              isVideo
                ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                : "border-violet-200 bg-violet-50 text-violet-700"
            }`}
          >
            <PreviewIcon className="h-3.5 w-3.5" />
            {media.mediaType}
          </span>
          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
            {media.approvalStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-500">
          <div>
            <p className="text-slate-400">Episode</p>
            <p className="mt-1 truncate text-slate-700">
              {media.episodeId || "-"}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Ngày tạo</p>
            <p className="mt-1 text-slate-700">{formatDate(media.createdAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onApprove(media)}
            disabled={isMutating}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            Duyệt
          </button>
          <button
            type="button"
            onClick={() => onReject(media)}
            disabled={isMutating}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            Từ chối
          </button>
        </div>
      </div>
    </article>
  );
}

export function ModerationManagement() {
  const [page, setPage] = useState(0);
  const [rejectTarget, setRejectTarget] = useState<ModerationMedia | null>(null);
  const pendingQuery = useGetPendingMedia(page, PAGE_SIZE);
  const approveMutation = useApproveMedia();
  const rejectMutation = useRejectMedia();
  const pendingPage = pendingQuery.data;
  const items = pendingPage?.content ?? [];
  const isMutating = approveMutation.isPending || rejectMutation.isPending;

  function handleApprove(media: ModerationMedia) {
    approveMutation.mutate(media.id, {
      onSuccess: () => toast.success("Đã duyệt nội dung."),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  function handleReject(reason: string) {
    if (!rejectTarget) return;

    rejectMutation.mutate(
      { id: rejectTarget.id, reason },
      {
        onSuccess: () => {
          toast.success("Đã từ chối nội dung.");
          setRejectTarget(null);
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 bg-slate-50">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Kiểm duyệt Nội dung
        </h1>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
          Xem trước video và trang truyện đang chờ kiểm duyệt, sau đó duyệt
          hoặc từ chối kèm lý do rõ ràng.
        </p>
      </div>

      {pendingQuery.isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-400" />
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Đang tải hàng đợi kiểm duyệt...
          </p>
        </div>
      )}

      {pendingQuery.isError && (
        <div className="rounded-2xl border border-red-200 bg-white px-6 py-16 text-center text-sm font-semibold text-red-600 shadow-sm">
          Không thể tải danh sách nội dung chờ duyệt.
        </div>
      )}

      {!pendingQuery.isLoading && !pendingQuery.isError && items.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Smile className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-950">
            Không có nội dung nào đang chờ duyệt
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Hàng đợi hiện đang sạch. Các media mới từ creator sẽ xuất hiện tại
            đây.
          </p>
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((media) => (
              <ModerationCard
                key={media.id}
                isMutating={isMutating}
                media={media}
                onApprove={handleApprove}
                onReject={setRejectTarget}
              />
            ))}
          </div>

          {pendingPage && pendingPage.totalPages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Trang {pendingPage.pageNumber + 1} / {pendingPage.totalPages} -{" "}
                {pendingPage.totalElements} nội dung
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={pendingPage.isFirst || pendingQuery.isFetching}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={pendingPage.isLast || pendingQuery.isFetching}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Trang sau"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <RejectReasonModal
        isLoading={rejectMutation.isPending}
        media={rejectTarget}
        onClose={() => {
          if (!rejectMutation.isPending) setRejectTarget(null);
        }}
        onSubmit={handleReject}
        open={Boolean(rejectTarget)}
      />
    </div>
  );
}
