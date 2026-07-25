"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Eye,
  FileImage,
  Fingerprint,
  Loader2,
  ShieldAlert,
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
  useMediaViolations,
  useRejectMedia,
} from "@/features/admin/hooks/use-moderation";
import { translateViolationLabel } from "@/features/creator-dashboard/utils/media-violations";

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

function formatMediaType(mediaType: string) {
  return mediaType === "VIDEO" ? "Video" : "Ảnh";
}

const APPROVAL_STATUS_VI: Record<string, string> = {
  PENDING_REVIEW: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
};

function formatApprovalStatus(status: string) {
  return APPROVAL_STATUS_VI[status] || status;
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm animate-in fade-in duration-200">
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
            Mã nội dung
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

function formatPercent(value?: number) {
  if (typeof value !== "number") return "-";
  return `${(value * 100).toFixed(1)}%`;
}

function ModerationDetailModal({
  isMutating,
  media,
  onApprove,
  onClose,
  onReject,
  open,
}: {
  isMutating: boolean;
  media: ModerationMedia | null;
  onApprove: (media: ModerationMedia) => void;
  onClose: () => void;
  onReject: (media: ModerationMedia) => void;
  open: boolean;
}) {
  const violationsQuery = useMediaViolations(open ? media?.id ?? null : null);
  const violations = violationsQuery.data;

  if (!open || !media) return null;

  const isVideo = media.mediaType === "VIDEO";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Chi tiết kiểm duyệt</h2>
            <p className="mt-1 break-all text-xs font-semibold text-slate-500">
              Mã nội dung: {media.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-0 overflow-y-auto md:grid-cols-2">
          <div className="border-b border-slate-200 bg-slate-100 p-4 md:border-b-0 md:border-r">
            {media.mediaType === "IMAGE" && media.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={media.url}
                alt={media.id}
                className="w-full rounded-xl border border-slate-200 object-contain"
              />
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-slate-400">
                <Video className="h-10 w-10" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  Xem trước Video
                </span>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-white p-3 text-xs font-semibold text-slate-500 shadow-sm">
              <div>
                <p className="text-slate-400">Loại</p>
                <p className="mt-1 text-slate-700">{formatMediaType(media.mediaType)}</p>
              </div>
              <div>
                <p className="text-slate-400">Trạng thái duyệt</p>
                <p className="mt-1 text-slate-700">{formatApprovalStatus(media.approvalStatus)}</p>
              </div>
              <div>
                <p className="text-slate-400">Episode</p>
                <p className="mt-1 truncate text-slate-700">{media.episodeId || "-"}</p>
              </div>
              <div>
                <p className="text-slate-400">Ngày tạo</p>
                <p className="mt-1 text-slate-700">{formatDate(media.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5">
            {violationsQuery.isLoading && (
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải chi tiết vi phạm...
              </div>
            )}

            {violationsQuery.isError && (
              <p className="text-sm font-semibold text-red-600">
                Không thể tải chi tiết vi phạm.
              </p>
            )}

            {violations && (
              <>
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Fingerprint className="h-4 w-4" />
                    Bản quyền / Trùng lặp nội dung
                  </h3>
                  {violations.copyrightViolations.length === 0 ? (
                    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                      Không phát hiện trùng lặp nội dung.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {violations.copyrightViolations.map((item) => (
                        <div
                          key={item.mediaCopyrightId}
                          className={`rounded-lg border p-3 text-xs ${
                            item.isValid
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-red-200 bg-red-50"
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className={item.isValid ? "text-emerald-700" : "text-red-700"}>
                              Tương đồng {formatPercent(item.similarityScore)}
                            </span>
                            <span className={item.isValid ? "text-emerald-700" : "text-red-700"}>
                              {item.isValid ? "Nguồn hợp lệ (CC0)" : "Chưa xác định quyền sử dụng"}
                            </span>
                          </div>
                          <p className="mt-1 break-all text-slate-500">
                            Trùng với mã nội dung: {item.sourceMediaId || "Không xác định (nội dung gốc có thể đã bị xóa)"}
                          </p>
                          <p className="mt-1 text-slate-500">
                            Loại nội dung: {item.violationType === "VIDEO" ? "Video" : "Ảnh"} · Kiểm tra lúc {formatDate(item.checkedAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <ShieldAlert className="h-4 w-4" />
                    Kiểm duyệt nội dung nhạy cảm
                  </h3>
                  {violations.censorshipResults.length === 0 ? (
                    <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                      Chưa có kết quả kiểm duyệt nội dung.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {violations.censorshipResults.map((item) => (
                        <div
                          key={item.censorshipId}
                          className={`rounded-lg border p-3 text-xs ${
                            item.status === "APPROVED"
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-red-200 bg-red-50"
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className={item.status === "APPROVED" ? "text-emerald-700" : "text-red-700"}>
                              {item.primaryViolationLabel
                                ? translateViolationLabel(item.primaryViolationLabel)
                                : "Không phát hiện vi phạm"}
                            </span>
                            <span className="text-slate-500">
                              Độ chính xác phát hiện {formatPercent((item.confidenceScore ?? 0) / 100)}
                            </span>
                          </div>
                          {item.violationDetails.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {item.violationDetails.map((detail) => (
                                <li key={detail.violationDetailId} className="flex items-start gap-1.5 text-slate-600">
                                  <CircleAlert className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
                                  <span>
                                    {translateViolationLabel(detail.label)} — độ chính xác phát hiện {formatPercent((detail.confidence ?? 0) / 100)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {item.reviewerNotes && (
                            <p className="mt-2 italic text-slate-500">Ghi chú: {item.reviewerNotes}</p>
                          )}
                          <p className="mt-1 text-slate-400">Kiểm tra lúc {formatDate(item.checkedAt)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isMutating}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => onReject(media)}
            disabled={isMutating}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            Từ chối
          </button>
          <button
            type="button"
            onClick={() => onApprove(media)}
            disabled={isMutating}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            Duyệt
          </button>
        </div>
      </div>
    </div>
  );
}

function ModerationCard({
  isMutating,
  media,
  onApprove,
  onReject,
  onViewDetail,
}: {
  isMutating: boolean;
  media: ModerationMedia;
  onApprove: (media: ModerationMedia) => void;
  onReject: (media: ModerationMedia) => void;
  onViewDetail: (media: ModerationMedia) => void;
}) {
  const isVideo = media.mediaType === "VIDEO";
  const PreviewIcon = isVideo ? Video : FileImage;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <button
        type="button"
        onClick={() => onViewDetail(media)}
        className="group relative flex aspect-video w-full items-center justify-center border-b border-slate-100 bg-slate-100"
      >
        <div className="absolute inset-0 z-10 hidden items-center justify-center gap-2 bg-black/50 text-sm font-bold text-white group-hover:flex">
          <Eye className="h-4 w-4" />
          Xem chi tiết
        </div>
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
              {isVideo ? "Xem trước Video" : "Xem trước Ảnh"}
            </span>
          </div>
        )}
      </button>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Mã nội dung
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
            {formatMediaType(media.mediaType)}
          </span>
          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
            {formatApprovalStatus(media.approvalStatus)}
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
  const [detailTarget, setDetailTarget] = useState<ModerationMedia | null>(null);
  const pendingQuery = useGetPendingMedia(page, PAGE_SIZE);
  const approveMutation = useApproveMedia();
  const rejectMutation = useRejectMedia();
  const pendingPage = pendingQuery.data;
  const items = pendingPage?.content ?? [];
  const isMutating = approveMutation.isPending || rejectMutation.isPending;

  function handleApprove(media: ModerationMedia) {
    approveMutation.mutate(media.id, {
      onSuccess: () => {
        toast.success("Đã duyệt nội dung.");
        setDetailTarget(null);
      },
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
          setDetailTarget(null);
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
                onViewDetail={setDetailTarget}
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

      <ModerationDetailModal
        isMutating={isMutating}
        media={detailTarget}
        onApprove={handleApprove}
        onClose={() => setDetailTarget(null)}
        onReject={setRejectTarget}
        open={Boolean(detailTarget)}
      />
    </div>
  );
}
