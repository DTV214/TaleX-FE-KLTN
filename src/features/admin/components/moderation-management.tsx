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
  Search,
  ShieldAlert,
  Smile,
  Video,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type ModerationMedia,
  type ModerationTypeFilter,
} from "@/features/admin/api/moderation.api";
import {
  useApproveMedia,
  useForceHideEpisode,
  useForceUnhideEpisode,
  useGetApprovedMedia,
  useGetPendingMedia,
  useGetRejectedMedia,
  useMediaDetail,
  useMediaViolations,
  useRejectMedia,
} from "@/features/admin/hooks/use-moderation";
import { useViolationLabelMap } from "@/shared/hooks/use-violation-label-map";

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

// BE (MediaServiceImpl.resolveReviewerName/resolveReviewerRole) đã tra sẵn tên hiển thị
// + role code (ADMIN/STAFF) từ accountId thô — FE chỉ cần ghép nhãn, không tự tra cứu.
function formatRoleLabel(role?: string) {
  if (role === "ADMIN") return "Admin";
  if (role === "STAFF") return "Staff";
  return null;
}

// ContentCensorship.reviewedBy chỉ nhận đúng 2 giá trị cố định ở BE (xem
// ContentPipelineServiceImpl/rejectWithReason) — khác hẳn formatReviewer() ở trên (actorId).
function formatCensorshipReviewer(reviewedBy?: string) {
  if (reviewedBy === "AWS_REKOGNITION") return "Hệ thống tự động (AWS Rekognition)";
  if (reviewedBy === "HUMAN") return "Nhân viên duyệt thủ công";
  return reviewedBy || "-";
}

const APPROVAL_STATUS_VI: Record<string, string> = {
  PENDING_REVIEW: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
};

function formatApprovalStatus(status: string) {
  return APPROVAL_STATUS_VI[status] || status;
}

// Duyệt/Từ chối chỉ cần xác nhận ngắn gọn — creator đã nhận lý do vi phạm cụ thể
// từ AI (fingerprint/Rekognition) ngay lúc upload, Staff không cần nhập lại lý do thủ công.
function ConfirmModerationActionModal({
  action,
  isLoading,
  media,
  onClose,
  onConfirm,
  open,
}: {
  action: "approve" | "reject";
  isLoading: boolean;
  media: ModerationMedia | null;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
}) {
  if (!open || !media) return null;

  const isApprove = action === "approve";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {isApprove ? "Duyệt nội dung" : "Từ chối nội dung"}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {isApprove
                ? "Nội dung sẽ được xuất bản, hiển thị công khai ngay sau khi duyệt. Bạn có chắc chắn không?"
                : "Nội dung sẽ bị từ chối, creator đã được AI thông báo lý do vi phạm cụ thể khi upload. Bạn có chắc chắn không?"}
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
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isApprove ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isApprove ? "Duyệt" : "Từ chối"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmForceHideModal({
  isLoading,
  media,
  onClose,
  onConfirm,
  open,
}: {
  isLoading: boolean;
  media: ModerationMedia | null;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
}) {
  if (!open || !media) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Tạm ẩn cả episode
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Toàn bộ episode sẽ ngừng hiển thị công khai ngay lập tức, creator sẽ được thông báo.
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
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Tạm ẩn episode
          </button>
        </div>
      </div>
    </div>
  );
}

function formatPercent(value?: number) {
  if (typeof value !== "number") return "-";
  return `${(value * 100).toFixed(1)}%`;
}

// value tính bằng giây — dùng chung cho khoảng thời gian trùng bản quyền (video).
function formatTimeRange(startSec?: number, endSec?: number) {
  if (typeof startSec !== "number" || typeof endSec !== "number") return null;
  const format = (s: number) => {
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${r.toString().padStart(2, "0")}`;
  };
  return `${format(startSec)} - ${format(endSec)}`;
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
  const { translate: translateViolationLabel } = useViolationLabelMap();
  const [previewSourceId, setPreviewSourceId] = useState<string | null>(null);

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

        <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden md:grid-cols-2">
          <div className="min-h-0 overflow-y-auto border-b border-slate-200 bg-slate-100 p-4 md:border-b-0 md:border-r">
            {media.mediaType === "IMAGE" && media.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={media.url}
                alt={media.id}
                className="max-h-[45vh] w-full rounded-xl border border-slate-200 object-contain"
              />
            ) : media.mediaType === "VIDEO" && media.url ? (
              <video
                key={media.url}
                src={media.url}
                poster={media.thumbnailUrl}
                controls
                className="max-h-[45vh] w-full rounded-xl border border-slate-200 bg-black"
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
                <p className="text-slate-400">Tập</p>
                <p className="mt-1 truncate text-slate-700">
                  {media.episodeTitle || media.episodeId || "-"}
                </p>
              </div>
              {media.mediaType === "IMAGE" && (
                <div>
                  <p className="text-slate-400">Trang</p>
                  <p className="mt-1 text-slate-700">
                    {typeof media.displayOrder === "number" ? `Trang ${media.displayOrder}` : "-"}
                  </p>
                </div>
              )}
              <div>
                <p className="text-slate-400">Bộ truyện</p>
                <p className="mt-1 truncate text-slate-700">{media.seriesTitle || "-"}</p>
              </div>
              <div>
                <p className="text-slate-400">Phần</p>
                <p className="mt-1 truncate text-slate-700">{media.seasonTitle || "-"}</p>
              </div>
              <div>
                <p className="text-slate-400">Người sáng tạo</p>
                <p className="mt-1 truncate text-slate-700">{media.creatorUsername || "-"}</p>
              </div>
              <div>
                <p className="text-slate-400">Ngày tạo</p>
                <p className="mt-1 text-slate-700">{formatDate(media.createdAt)}</p>
              </div>
              <div>
                <p className="text-slate-400">Người duyệt</p>
                {/* Tên đầy đủ có thể dài (kèm ghi chú trong ngoặc) — tách vai trò ra dòng
                    riêng thay vì nối chung 1 chuỗi, tránh bị truncate cụt mất chữ "(Admin)". */}
                <p className="mt-1 truncate text-slate-700" title={media.approvalReviewedByName || undefined}>
                  {media.approvalReviewedByName || "-"}
                </p>
                {formatRoleLabel(media.approvalReviewedByRole) && (
                  <p className="text-xs font-semibold text-violet-600">
                    {formatRoleLabel(media.approvalReviewedByRole)}
                  </p>
                )}
              </div>
              {media.approvalReviewedAt && (
                <div>
                  <p className="text-slate-400">Thời điểm duyệt</p>
                  <p className="mt-1 text-slate-700">{formatDate(media.approvalReviewedAt)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="min-h-0 space-y-5 overflow-y-auto p-5">
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
                  {violations.contentId && (
                    <p className="mb-2 break-all text-[11px] font-semibold text-slate-400">
                      Mã fingerprint: {violations.contentId}
                    </p>
                  )}
                  {violations.copyrightViolations.length === 0 ? (
                    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                      Không phát hiện trùng lặp nội dung.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {violations.copyrightViolations.map((item) => {
                        const hasSourceIdentity = Boolean(
                          item.sourceEpisodeTitle || item.sourceSeriesTitle || item.sourceCreatorUsername,
                        );
                        const canViewSource = Boolean(item.sourceMediaId) && !item.sourceMediaDeleted;
                        return (
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
                                {item.isValid
                                  ? "Nguồn hợp lệ (CC0)"
                                  : item.sourceCreatorUsername
                                    ? `${media.creatorUsername || "Người upload"} trùng với ${item.sourceCreatorUsername}`
                                    : "Chưa xác định quyền sử dụng"}
                              </span>
                            </div>

                            {hasSourceIdentity ? (
                              <div className="mt-2 rounded-md border border-red-100 bg-white/60 p-2">
                                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                  Nội dung gốc nghi bị trùng (không phải nội dung đang xét)
                                </p>
                                <div className="flex items-start gap-2">
                                  {item.sourceThumbnailUrl && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={item.sourceThumbnailUrl}
                                      alt="Nội dung gốc"
                                      className="h-12 w-12 shrink-0 rounded-md border border-slate-200 object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-slate-700">
                                      {item.sourceEpisodeTitle || "Tập không xác định"}
                                      {item.sourceSeriesTitle ? ` · ${item.sourceSeriesTitle}` : ""}
                                    </p>
                                    <p className="text-slate-500">
                                      Creator: {item.sourceCreatorUsername || "không xác định"}
                                      {item.sourceMediaDeleted ? " (nội dung đã bị xóa)" : ""}
                                    </p>
                                  </div>
                                  {canViewSource && (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewSourceId(item.sourceMediaId!)}
                                      className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-[11px] font-bold text-slate-600 transition hover:bg-slate-100"
                                    >
                                      Xem nội dung gốc
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="mt-1 break-all text-slate-500">
                                Trùng với mã nội dung: {item.sourceMediaId || "Không xác định (nội dung gốc có thể đã bị xóa)"}
                              </p>
                            )}

                            <p className="mt-1 text-slate-500">
                              Loại nội dung: {item.violationType === "VIDEO" ? "Video" : "Ảnh"}
                            </p>
                            {item.violationType === "VIDEO" && (
                              <>
                                {formatTimeRange(item.startTimeTarget, item.endTimeTarget) && (
                                  <p className="text-slate-500">
                                    Đoạn trùng trong video này:{" "}
                                    <span className="font-semibold text-slate-700">
                                      {formatTimeRange(item.startTimeTarget, item.endTimeTarget)}
                                    </span>
                                  </p>
                                )}
                                {formatTimeRange(item.startTimeSource, item.endTimeSource) && (
                                  <p className="text-slate-500">
                                    Đoạn tương ứng trong video gốc:{" "}
                                    <span className="font-semibold text-slate-700">
                                      {formatTimeRange(item.startTimeSource, item.endTimeSource)}
                                    </span>
                                  </p>
                                )}
                              </>
                            )}
                            <p className="text-slate-500">
                              Kiểm tra lúc {formatDate(item.checkedAt)}
                            </p>
                          </div>
                        );
                      })}
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
                                : item.status === "REJECTED"
                                  ? "Bị từ chối thủ công"
                                  : "Không phát hiện vi phạm"}
                            </span>
                            <span className="text-slate-500">
                              Độ chính xác phát hiện {formatPercent((item.confidenceScore ?? 0) / 100)}
                            </span>
                          </div>
                          <p className="mt-1 text-slate-400">
                            Nguồn kiểm duyệt: {formatCensorshipReviewer(item.reviewedBy)}
                          </p>
                          {item.violationDetails.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {item.violationDetails.map((detail) => {
                                // BE lưu violationAt/endViolationAt theo mili-giây, 0 với vi
                                // phạm ở ảnh (không có khái niệm thời lượng) — chỉ hiện mốc
                                // thời gian khi media đang xét là VIDEO.
                                const timeRange =
                                  isVideo &&
                                  formatTimeRange(
                                    typeof detail.violationAt === "number" ? detail.violationAt / 1000 : undefined,
                                    typeof detail.endViolationAt === "number" ? detail.endViolationAt / 1000 : undefined,
                                  );
                                return (
                                  <li key={detail.violationDetailId} className="flex items-start gap-1.5 text-slate-600">
                                    <CircleAlert className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
                                    <span>
                                      {translateViolationLabel(detail.label)} — độ chính xác phát hiện {formatPercent((detail.confidence ?? 0) / 100)}
                                      {timeRange && (
                                        <>
                                          {" "}— vi phạm từ giây{" "}
                                          <span className="font-semibold text-slate-700">{timeRange}</span>
                                        </>
                                      )}
                                    </span>
                                  </li>
                                );
                              })}
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
          {media.approvalStatus !== "APPROVED" && (
            <>
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
            </>
          )}
        </div>
      </div>

      <SourceMediaPreviewModal
        mediaId={previewSourceId}
        onClose={() => setPreviewSourceId(null)}
      />
    </div>
  );
}

function SourceMediaPreviewModal({
  mediaId,
  onClose,
}: {
  mediaId: string | null;
  onClose: () => void;
}) {
  const detailQuery = useMediaDetail(mediaId);

  if (!mediaId) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-950">Nội dung gốc bị trùng</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          {detailQuery.isLoading && (
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải nội dung gốc...
            </div>
          )}

          {detailQuery.isError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
              Không thể tải nội dung gốc — có thể đã bị xóa hoặc bạn không có quyền xem.
            </p>
          )}

          {detailQuery.data && (
            <>
              {detailQuery.data.mediaType === "IMAGE" && detailQuery.data.originalUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={detailQuery.data.originalUrl}
                  alt="Nội dung gốc"
                  className="w-full rounded-xl border border-slate-200 object-contain"
                />
              ) : detailQuery.data.mediaType === "VIDEO" && detailQuery.data.originalUrl ? (
                <video
                  key={detailQuery.data.originalUrl}
                  src={detailQuery.data.originalUrl}
                  poster={detailQuery.data.thumbnailUrl}
                  controls
                  className="w-full rounded-xl border border-slate-200 bg-black"
                />
              ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-400">
                  <Video className="h-10 w-10" />
                  <span className="text-xs font-bold uppercase tracking-wide">
                    Xem trước Video
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-500">
                <div>
                  <p className="text-slate-400">Trạng thái</p>
                  <p className="mt-1 text-slate-700">{formatApprovalStatus(detailQuery.data.approvalStatus || "-")}</p>
                </div>
                <div>
                  <p className="text-slate-400">Tập</p>
                  <p className="mt-1 truncate text-slate-700">
                    {detailQuery.data.episodeTitle || detailQuery.data.episodeId || "-"}
                  </p>
                </div>
                {detailQuery.data.mediaType === "IMAGE" && (
                  <div>
                    <p className="text-slate-400">Trang</p>
                    <p className="mt-1 text-slate-700">
                      {typeof detailQuery.data.displayOrder === "number" ? `Trang ${detailQuery.data.displayOrder}` : "-"}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-slate-400">Bộ truyện</p>
                  <p className="mt-1 truncate text-slate-700">{detailQuery.data.seriesTitle || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-400">Phần</p>
                  <p className="mt-1 truncate text-slate-700">{detailQuery.data.seasonTitle || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-400">Người sáng tạo</p>
                  <p className="mt-1 truncate text-slate-700">{detailQuery.data.creatorUsername || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-400">Ngày tạo</p>
                  <p className="mt-1 text-slate-700">{formatDate(detailQuery.data.createdAt)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Mã nội dung</p>
                  <p className="mt-1 truncate text-slate-700">{detailQuery.data.mediaId}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
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
            <p className="text-slate-400">Tập</p>
            <p className="mt-1 truncate text-slate-700">
              {media.episodeTitle || media.episodeId || "-"}
            </p>
          </div>
          {media.mediaType === "IMAGE" && (
            <div>
              <p className="text-slate-400">Trang</p>
              <p className="mt-1 text-slate-700">
                {typeof media.displayOrder === "number" ? `Trang ${media.displayOrder}` : "-"}
              </p>
            </div>
          )}
          <div>
            <p className="text-slate-400">Bộ truyện</p>
            <p className="mt-1 truncate text-slate-700">{media.seriesTitle || "-"}</p>
          </div>
          <div>
            <p className="text-slate-400">Phần</p>
            <p className="mt-1 truncate text-slate-700">{media.seasonTitle || "-"}</p>
          </div>
          <div>
            <p className="text-slate-400">Người sáng tạo</p>
            <p className="mt-1 truncate text-slate-700">{media.creatorUsername || "-"}</p>
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ApprovedMediaCard({
  isMutating,
  media,
  mediaCount,
  onForceHide,
  onForceUnhide,
  onViewDetail,
}: {
  isMutating: boolean;
  media: ModerationMedia;
  mediaCount: number;
  onForceHide: (media: ModerationMedia) => void;
  onForceUnhide: (media: ModerationMedia) => void;
  onViewDetail: (media: ModerationMedia) => void;
}) {
  const isVideo = media.mediaType === "VIDEO";
  const PreviewIcon = isVideo ? Video : FileImage;
  // Hành động Ẩn/Gỡ ẩn thao tác ở cấp EPISODE (cả tập), không phải riêng media này — nên
  // trạng thái hiển thị phải dựa vào episodeStatus, không phải media.status (media vẫn
  // giữ nguyên ACTIVE/HLS_READY dù episode chứa nó đang bị ép ẩn).
  const isEpisodeForceHidden = media.episodeStatus === "FORCE_HIDDEN";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
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
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
              isEpisodeForceHidden
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {isEpisodeForceHidden ? "Episode đang bị ẩn" : "Episode đang hiển thị"}
          </span>
          {mediaCount > 1 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
              {mediaCount} nội dung trong episode này
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-500">
          <div>
            <p className="text-slate-400">Tập</p>
            <p className="mt-1 truncate text-slate-700">
              {media.episodeTitle || media.episodeId || "-"}
            </p>
          </div>
          {media.mediaType === "IMAGE" && (
            <div>
              <p className="text-slate-400">Trang</p>
              <p className="mt-1 text-slate-700">
                {typeof media.displayOrder === "number" ? `Trang ${media.displayOrder}` : "-"}
              </p>
            </div>
          )}
          <div>
            <p className="text-slate-400">Bộ truyện</p>
            <p className="mt-1 truncate text-slate-700">{media.seriesTitle || "-"}</p>
          </div>
          <div>
            <p className="text-slate-400">Phần</p>
            <p className="mt-1 truncate text-slate-700">{media.seasonTitle || "-"}</p>
          </div>
          <div>
            <p className="text-slate-400">Người sáng tạo</p>
            <p className="mt-1 truncate text-slate-700">{media.creatorUsername || "-"}</p>
          </div>
          <div>
            <p className="text-slate-400">Thời điểm duyệt</p>
            <p className="mt-1 text-slate-700">{formatDate(media.approvalReviewedAt)}</p>
          </div>
        </div>

        {isEpisodeForceHidden ? (
          <div>
            <button
              type="button"
              onClick={() => onForceUnhide(media)}
              disabled={isMutating}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              Gỡ ẩn episode
            </button>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
              Episode sẽ hiển thị công khai trở lại ngay sau khi gỡ ẩn, không cần creator xuất bản lại.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onForceHide(media)}
            disabled={isMutating}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            Tạm ẩn cả episode
          </button>
        )}
      </div>
    </article>
  );
}

function ModerationPreview({
  className = "",
  media,
}: {
  className?: string;
  media: ModerationMedia;
}) {
  const isVideo = media.mediaType === "VIDEO";
  const PreviewIcon = isVideo ? Video : FileImage;

  if (media.url && media.mediaType === "IMAGE") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={media.thumbnailUrl ?? media.url}
        alt={media.id}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-100 text-slate-400 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/45 ${className}`}>
      <PreviewIcon className="h-6 w-6" />
      <span className="text-[10px] font-black uppercase tracking-wide">
        {isVideo ? "Video" : "Ảnh"}
      </span>
    </div>
  );
}

function MediaTypeBadge({ media }: { media: ModerationMedia }) {
  const isVideo = media.mediaType === "VIDEO";
  const Icon = isVideo ? Video : FileImage;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${
        isVideo
          ? "border-cyan-200 bg-cyan-50 text-cyan-700 backoffice-dark:border-cyan-300/25 backoffice-dark:bg-cyan-300/10 backoffice-dark:text-cyan-100"
          : "border-violet-200 bg-violet-50 text-violet-700 backoffice-dark:border-[var(--backoffice-primary)]/30 backoffice-dark:bg-[var(--backoffice-primary-soft)] backoffice-dark:text-[var(--backoffice-primary)]"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {formatMediaType(media.mediaType)}
    </span>
  );
}

function ModerationListItem({
  isSelected,
  media,
  mediaCount,
  mode,
  onSelect,
}: {
  isSelected: boolean;
  media: ModerationMedia;
  mediaCount?: number;
  mode: "pending" | "approved" | "rejected";
  onSelect: () => void;
}) {
  const isEpisodeForceHidden = media.episodeStatus === "FORCE_HIDDEN";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group w-full rounded-2xl border p-3 text-left transition ${
        isSelected
          ? "border-violet-300 bg-violet-50 shadow-sm backoffice-dark:border-[var(--backoffice-primary)]/40 backoffice-dark:bg-[var(--backoffice-primary-soft)]"
          : "border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/60 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.035] backoffice-dark:hover:bg-white/[0.07]"
      }`}
    >
      <div className="flex gap-3">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 backoffice-dark:border-white/10">
          <ModerationPreview media={media} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-400 backoffice-dark:text-white/45">
                Mã nội dung
              </p>
              <p className="mt-1 truncate text-sm font-black text-slate-950 backoffice-dark:text-white">
                {media.id}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
                mode === "pending"
                  ? "bg-amber-50 text-amber-700 backoffice-dark:bg-amber-300/10 backoffice-dark:text-amber-100"
                  : mode === "rejected"
                    ? "bg-red-50 text-red-700 backoffice-dark:bg-red-400/10 backoffice-dark:text-red-200"
                    : isEpisodeForceHidden
                      ? "bg-red-50 text-red-700 backoffice-dark:bg-red-400/10 backoffice-dark:text-red-200"
                      : "bg-emerald-50 text-emerald-700 backoffice-dark:bg-emerald-400/10 backoffice-dark:text-emerald-200"
              }`}
            >
              {mode === "pending"
                ? "Chờ duyệt"
                : mode === "rejected"
                  ? "Đã từ chối"
                  : isEpisodeForceHidden
                    ? "Đang ẩn"
                    : "Đã duyệt"}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <MediaTypeBadge media={media} />
            {mediaCount && mediaCount > 1 ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/65">
                {mediaCount} media
              </span>
            ) : null}
          </div>

          <div className="mt-3 grid gap-1 text-xs font-semibold text-slate-500 backoffice-dark:text-white/55">
            <p className="truncate">
              <span className="text-slate-400">Episode:</span>{" "}
              {media.episodeTitle || media.episodeId || "-"}
            </p>
            {media.mediaType === "IMAGE" && typeof media.displayOrder === "number" && (
              <p className="truncate">
                <span className="text-slate-400">Trang:</span> {media.displayOrder}
              </p>
            )}
            <p className="truncate">
              <span className="text-slate-400">Series:</span>{" "}
              {media.seriesTitle || "-"}
            </p>
            <p className="truncate">
              <span className="text-slate-400">Creator:</span>{" "}
              {media.creatorUsername || "-"}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

function DetailInfoGrid({ media }: { media: ModerationMedia }) {
  const rows: [string, string][] = [
    ["Tập", media.episodeTitle || media.episodeId || "-"],
  ];
  if (media.mediaType === "IMAGE") {
    rows.push(["Trang", typeof media.displayOrder === "number" ? `Trang ${media.displayOrder}` : "-"]);
  }
  rows.push(
    ["Bộ truyện", media.seriesTitle || "-"],
    ["Phần", media.seasonTitle || "-"],
    ["Người sáng tạo", media.creatorUsername || "-"],
    ["Ngày tạo", formatDate(media.createdAt)],
    ["Thời điểm duyệt", formatDate(media.approvalReviewedAt)],
  );
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-black/20 backoffice-dark:text-white/55 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <p className="text-slate-400 backoffice-dark:text-white/40">{label}</p>
          <p className="mt-1 truncate text-slate-800 backoffice-dark:text-white/85">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

function PendingDetailPanel({
  isMutating,
  media,
  onApprove,
  onReject,
  onViewDetail,
}: {
  isMutating: boolean;
  media: ModerationMedia | null;
  onApprove: (media: ModerationMedia) => void;
  onReject: (media: ModerationMedia) => void;
  onViewDetail: (media: ModerationMedia) => void;
}) {
  if (!media) {
    return (
      <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <p className="text-sm font-semibold text-slate-500 backoffice-dark:text-white/55">
          Chọn một nội dung ở danh sách bên trái để xem chi tiết.
        </p>
      </div>
    );
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
      <div className="aspect-video overflow-hidden border-b border-slate-200 bg-slate-100 backoffice-dark:border-white/10">
        <ModerationPreview media={media} />
      </div>

      <div className="space-y-5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400 backoffice-dark:text-white/45">
              Mã nội dung
            </p>
            <h2 className="mt-1 break-all text-xl font-black text-slate-950 backoffice-dark:text-white">
              {media.id}
            </h2>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <MediaTypeBadge media={media} />
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 backoffice-dark:border-amber-300/25 backoffice-dark:bg-amber-300/10 backoffice-dark:text-amber-100">
              {formatApprovalStatus(media.approvalStatus)}
            </span>
          </div>
        </div>

        <DetailInfoGrid media={media} />

        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <button
            type="button"
            onClick={() => onApprove(media)}
            disabled={isMutating}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            Duyệt
          </button>
          <button
            type="button"
            onClick={() => onReject(media)}
            disabled={isMutating}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            Từ chối
          </button>
          <button
            type="button"
            onClick={() => onViewDetail(media)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
          >
            <Eye className="h-4 w-4" />
            Chi tiết
          </button>
        </div>
      </div>
    </article>
  );
}

function ApprovedDetailPanel({
  isMutating,
  media,
  mediaCount,
  onForceHide,
  onForceUnhide,
  onViewDetail,
}: {
  isMutating: boolean;
  media: ModerationMedia | null;
  mediaCount: number;
  onForceHide: (media: ModerationMedia) => void;
  onForceUnhide: (media: ModerationMedia) => void;
  onViewDetail: (media: ModerationMedia) => void;
}) {
  if (!media) {
    return (
      <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <p className="text-sm font-semibold text-slate-500 backoffice-dark:text-white/55">
          Chọn một nội dung đã duyệt để xem thông tin episode.
        </p>
      </div>
    );
  }

  const isEpisodeForceHidden = media.episodeStatus === "FORCE_HIDDEN";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
      <div className="aspect-video overflow-hidden border-b border-slate-200 bg-slate-100 backoffice-dark:border-white/10">
        <ModerationPreview media={media} />
      </div>

      <div className="space-y-5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400 backoffice-dark:text-white/45">
              Episode đã duyệt
            </p>
            <h2 className="mt-1 break-all text-xl font-black text-slate-950 backoffice-dark:text-white">
              {media.episodeTitle || media.episodeId || media.id}
            </h2>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <MediaTypeBadge media={media} />
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
                isEpisodeForceHidden
                  ? "border-red-200 bg-red-50 text-red-700 backoffice-dark:border-red-400/30 backoffice-dark:bg-red-400/10 backoffice-dark:text-red-200"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 backoffice-dark:border-emerald-400/30 backoffice-dark:bg-emerald-400/10 backoffice-dark:text-emerald-200"
              }`}
            >
              {isEpisodeForceHidden ? "Episode đang bị ẩn" : "Episode đang hiển thị"}
            </span>
            {mediaCount > 1 ? (
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/65">
                {mediaCount} media
              </span>
            ) : null}
          </div>
        </div>

        <DetailInfoGrid media={media} />

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          {isEpisodeForceHidden ? (
            <button
              type="button"
              onClick={() => onForceUnhide(media)}
              disabled={isMutating}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              Gỡ ẩn episode
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onForceHide(media)}
              disabled={isMutating}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="h-4 w-4" />
              Tạm ẩn cả episode
            </button>
          )}
          <button
            type="button"
            onClick={() => onViewDetail(media)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
          >
            <Eye className="h-4 w-4" />
            Chi tiết
          </button>
        </div>
      </div>
    </article>
  );
}

function RejectedDetailPanel({
  isMutating,
  media,
  mediaCount,
  onApprove,
  onViewDetail,
}: {
  isMutating: boolean;
  media: ModerationMedia | null;
  mediaCount: number;
  onApprove: (media: ModerationMedia) => void;
  onViewDetail: (media: ModerationMedia) => void;
}) {
  if (!media) {
    return (
      <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <p className="text-sm font-semibold text-slate-500 backoffice-dark:text-white/55">
          Chọn một nội dung bị từ chối để xem thông tin episode.
        </p>
      </div>
    );
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
      <div className="aspect-video overflow-hidden border-b border-slate-200 bg-slate-100 backoffice-dark:border-white/10">
        <ModerationPreview media={media} />
      </div>

      <div className="space-y-5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400 backoffice-dark:text-white/45">
              Episode bị từ chối
            </p>
            <h2 className="mt-1 break-all text-xl font-black text-slate-950 backoffice-dark:text-white">
              {media.episodeTitle || media.episodeId || media.id}
            </h2>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <MediaTypeBadge media={media} />
            <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 backoffice-dark:border-red-400/30 backoffice-dark:bg-red-400/10 backoffice-dark:text-red-200">
              Đã từ chối
            </span>
            {mediaCount > 1 ? (
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/65">
                {mediaCount} media
              </span>
            ) : null}
          </div>
        </div>

        <DetailInfoGrid media={media} />

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <button
            type="button"
            onClick={() => onApprove(media)}
            disabled={isMutating}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            Duyệt lại
          </button>
          <button
            type="button"
            onClick={() => onViewDetail(media)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
          >
            <Eye className="h-4 w-4" />
            Chi tiết
          </button>
        </div>
      </div>
    </article>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ModerationPagination({
  isFetching,
  isFirst,
  isLast,
  label,
  onNext,
  onPrevious,
}: {
  isFetching: boolean;
  isFirst: boolean;
  isLast: boolean;
  label: string;
  onNext: () => void;
  onPrevious: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
      <p className="text-sm font-semibold text-slate-500 backoffice-dark:text-white/55">
        {label}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={isFirst || isFetching}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:border-white/10 backoffice-dark:text-white/60 backoffice-dark:hover:bg-white/10"
          aria-label="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={isLast || isFetching}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:border-white/10 backoffice-dark:text-white/60 backoffice-dark:hover:bg-white/10"
          aria-label="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ModerationManagement() {
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [approvedFilter, setApprovedFilter] = useState<"all" | "manual" | "clean">("all");
  const [pendingTypeFilter, setPendingTypeFilter] = useState<ModerationTypeFilter>("all");
  const [approvedTypeFilter, setApprovedTypeFilter] = useState<ModerationTypeFilter>("all");
  const [rejectedTypeFilter, setRejectedTypeFilter] = useState<ModerationTypeFilter>("all");
  // Riêng theo từng tab (giống pendingTypeFilter/approvedTypeFilter) — đổi tab không nên
  // xóa mất từ khóa đang gõ dở ở tab kia.
  const [pendingKeyword, setPendingKeyword] = useState("");
  const [approvedKeyword, setApprovedKeyword] = useState("");
  const [rejectedKeyword, setRejectedKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [approvedPage, setApprovedPage] = useState(0);
  const [rejectedPage, setRejectedPage] = useState(0);
  const [approveTarget, setApproveTarget] = useState<ModerationMedia | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ModerationMedia | null>(null);
  const [forceHideTarget, setForceHideTarget] = useState<ModerationMedia | null>(null);
  const [detailTarget, setDetailTarget] = useState<ModerationMedia | null>(null);
  const [selectedPendingId, setSelectedPendingId] = useState<string | null>(null);
  const [selectedApprovedId, setSelectedApprovedId] = useState<string | null>(null);
  const [selectedRejectedId, setSelectedRejectedId] = useState<string | null>(null);
  const pendingQuery = useGetPendingMedia(page, PAGE_SIZE, pendingTypeFilter, pendingKeyword);
  // Lọc "manual"/"clean" chạy ở BE (MediaServiceImpl.listApproved) — approvalReviewedBy
  // KHÔNG đủ để tự lọc ở FE: pipeline tự duyệt sạch cũng ghi giá trị actor hệ thống vào
  // field này (không phải null), lọc sai sẽ lẫn nội dung không vi phạm vào "Duyệt tay".
  // Lọc ở BE cũng giúp phân trang (totalPages/totalElements) phản ánh đúng số lượng đã lọc.
  const approvedQuery = useGetApprovedMedia(
    approvedPage,
    PAGE_SIZE,
    approvedFilter,
    approvedTypeFilter,
    approvedKeyword,
  );
  const rejectedQuery = useGetRejectedMedia(rejectedPage, PAGE_SIZE, rejectedTypeFilter, rejectedKeyword);
  const approveMutation = useApproveMedia();
  const rejectMutation = useRejectMedia();
  const forceHideMutation = useForceHideEpisode();
  const forceUnhideMutation = useForceUnhideEpisode();
  const pendingPage = pendingQuery.data;
  const items = pendingPage?.content ?? [];
  // BE đã group theo episode và trả sẵn episodeMediaCount (xem MediaServiceImpl.listApproved
  // / groupByEpisode) — không group lại ở FE nữa. Group ở FE trước đây chỉ hoạt động ĐÚNG
  // trong phạm vi 1 trang đang fetch, còn BE vẫn phân trang theo Media riêng lẻ nên 1 episode
  // có thể bị cắt rải qua nhiều trang, hiện lại thành nhiều card cho cùng 1 episode (bug thật
  // đã gặp) — nay BE phân trang trực tiếp theo episode nên vấn đề này không còn nữa.
  const approvedItems = approvedQuery.data?.content ?? [];
  const rejectedItems = rejectedQuery.data?.content ?? [];
  const isMutating = approveMutation.isPending || rejectMutation.isPending;
  const isApprovedMutating = forceHideMutation.isPending || forceUnhideMutation.isPending;
  const selectedPendingMedia =
    (selectedPendingId
      ? items.find((media) => media.id === selectedPendingId)
      : null) ??
    items[0] ??
    null;
  const selectedApprovedMedia =
    (selectedApprovedId
      ? approvedItems.find((media) => media.id === selectedApprovedId)
      : null) ??
    approvedItems[0] ??
    null;
  const selectedRejectedMedia =
    (selectedRejectedId
      ? rejectedItems.find((media) => media.id === selectedRejectedId)
      : null) ??
    rejectedItems[0] ??
    null;

  function handlePendingKeywordChange(value: string) {
    setPendingKeyword(value);
    setPage(0);
  }

  function handleApprovedKeywordChange(value: string) {
    setApprovedKeyword(value);
    setApprovedPage(0);
  }

  function handleRejectedKeywordChange(value: string) {
    setRejectedKeyword(value);
    setRejectedPage(0);
  }

  function confirmApprove() {
    if (!approveTarget) return;
    approveMutation.mutate(approveTarget.id, {
      onSuccess: () => {
        toast.success("Đã duyệt nội dung.");
        setApproveTarget(null);
        setDetailTarget(null);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  function confirmReject() {
    if (!rejectTarget) return;

    // Không cần nhập lý do thủ công — creator đã nhận lý do vi phạm cụ thể từ AI
    // (fingerprint/Rekognition) ngay lúc upload, Staff chỉ cần xác nhận duyệt hay không.
    rejectMutation.mutate(
      { id: rejectTarget.id, reason: "" },
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

  function handleForceHide(media: ModerationMedia) {
    // Ẩn CẢ EPISODE chứa media này (không chỉ riêng media) — episode có thể đang HIỂN
    // THỊ CÔNG KHAI, xác nhận lại trước khi thực hiện để tránh bấm nhầm giữa lúc rà danh sách.
    // Mở modal xác nhận đúng UI app thay vì window.confirm() mặc định của trình duyệt.
    setForceHideTarget(media);
  }

  function confirmForceHide() {
    if (!forceHideTarget) return;
    forceHideMutation.mutate(forceHideTarget.episodeId, {
      onSuccess: () => {
        toast.success("Đã tạm ẩn episode. Creator đã được thông báo.");
        setForceHideTarget(null);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  function handleForceUnhide(media: ModerationMedia) {
    forceUnhideMutation.mutate(media.episodeId, {
      onSuccess: () =>
        toast.success("Đã gỡ ẩn episode — hiển thị công khai trở lại ngay. Creator đã được thông báo."),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 backoffice-dark:text-white">
          Kiểm duyệt Nội dung
        </h1>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500 backoffice-dark:text-white/55">
          Xem trước video và trang truyện đang chờ kiểm duyệt, sau đó duyệt
          hoặc từ chối kèm lý do rõ ràng.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-100 p-1 backoffice-dark:border-white/10 backoffice-dark:bg-black/25">
            {(
              [
                { key: "pending", label: "Chờ duyệt", count: pendingPage?.totalElements ?? items.length },
                { key: "approved", label: "Đã duyệt", count: approvedQuery.data?.totalElements ?? approvedItems.length },
                { key: "rejected", label: "Từ chối", count: rejectedQuery.data?.totalElements ?? rejectedItems.length },
              ] as const
            ).map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setActiveTab(option.key)}
                className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-black transition ${
                  activeTab === option.key
                    ? "bg-white text-slate-950 shadow-sm backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black"
                    : "text-slate-500 hover:text-slate-950 backoffice-dark:text-white/55 backoffice-dark:hover:text-white"
                }`}
              >
                {option.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ${
                    activeTab === option.key
                      ? "bg-slate-100 text-slate-600 backoffice-dark:bg-black/15 backoffice-dark:text-black"
                      : "bg-white text-slate-500 backoffice-dark:bg-white/10 backoffice-dark:text-white/60"
                  }`}
                >
                  {option.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: "all", label: "Tất cả" },
                { key: "IMAGE", label: "Ảnh" },
                { key: "VIDEO", label: "Video" },
              ] as const
            ).map((option) => {
              const isActive =
                activeTab === "pending"
                  ? pendingTypeFilter === option.key
                  : activeTab === "approved"
                    ? approvedTypeFilter === option.key
                    : rejectedTypeFilter === option.key;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    if (activeTab === "pending") {
                      setPendingTypeFilter(option.key);
                      setPage(0);
                      return;
                    }

                    if (activeTab === "approved") {
                      setApprovedTypeFilter(option.key);
                      setApprovedPage(0);
                      return;
                    }

                    setRejectedTypeFilter(option.key);
                    setRejectedPage(0);
                  }}
                  className={`h-10 rounded-lg border px-4 text-xs font-black transition ${
                    isActive
                      ? "border-violet-500 bg-violet-600 text-white shadow-sm backoffice-dark:border-[var(--backoffice-primary)] backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black"
                      : "border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/65 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}

            {activeTab === "approved" &&
              ([
                { key: "all", label: "Tất cả trạng thái" },
                { key: "manual", label: "Duyệt tay" },
                { key: "clean", label: "Không vi phạm" },
              ] as const).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setApprovedFilter(option.key);
                    setApprovedPage(0);
                  }}
                  className={`h-10 rounded-lg border px-4 text-xs font-black transition ${
                    approvedFilter === option.key
                      ? "border-slate-950 bg-slate-950 text-white backoffice-dark:border-[var(--backoffice-primary)] backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black"
                      : "border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/65 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên tập/phần/bộ truyện, mã nội dung hoặc tên Creator..."
            value={
              activeTab === "pending"
                ? pendingKeyword
                : activeTab === "approved"
                  ? approvedKeyword
                  : rejectedKeyword
            }
            onChange={(event) => {
              if (activeTab === "pending") {
                handlePendingKeywordChange(event.target.value);
                return;
              }
              if (activeTab === "approved") {
                handleApprovedKeywordChange(event.target.value);
                return;
              }
              handleRejectedKeywordChange(event.target.value);
            }}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white backoffice-dark:placeholder:text-white/40"
          />
        </div>
      </section>

      <div className="hidden">
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-3 text-sm font-bold transition ${
            activeTab === "pending"
              ? "border-b-2 border-slate-950 text-slate-950"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          Chờ duyệt
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("approved")}
          className={`px-4 py-3 text-sm font-bold transition ${
            activeTab === "approved"
              ? "border-b-2 border-slate-950 text-slate-950"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          Đã duyệt
        </button>
      </div>

      {activeTab === "pending" && (
        <div className="hidden flex-wrap gap-2">
          {(
            [
              { key: "all", label: "Tất cả" },
              { key: "IMAGE", label: "Ảnh" },
              { key: "VIDEO", label: "Video" },
            ] as const
          ).map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                setPendingTypeFilter(option.key);
                setPage(0);
              }}
              className={`rounded-full border px-4 py-1.5 text-xs font-bold transition ${
                pendingTypeFilter === option.key
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === "pending" && pendingQuery.isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-400" />
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Đang tải hàng đợi kiểm duyệt...
          </p>
        </div>
      )}

      {activeTab === "pending" && pendingQuery.isError && (
        <div className="rounded-2xl border border-red-200 bg-white px-6 py-16 text-center text-sm font-semibold text-red-600 shadow-sm">
          Không thể tải danh sách nội dung chờ duyệt.
        </div>
      )}

      {activeTab === "pending" && !pendingQuery.isLoading && !pendingQuery.isError && items.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
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

      {activeTab === "pending" && items.length > 0 && (
        <>
          <div className="grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-950 backoffice-dark:text-white">
                    Hàng đợi duyệt
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500 backoffice-dark:text-white/55">
                    Chọn một nội dung để xử lý ở panel bên phải.
                  </p>
                </div>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 backoffice-dark:border-amber-300/25 backoffice-dark:bg-amber-300/10 backoffice-dark:text-amber-100">
                  {pendingPage?.totalElements ?? items.length}
                </span>
              </div>

              <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.55)_transparent] backoffice-dark:[scrollbar-color:rgba(212,175,55,0.38)_transparent]">
                {items.map((media) => (
                  <ModerationListItem
                    key={media.id}
                    isSelected={selectedPendingMedia?.id === media.id}
                    media={media}
                    mode="pending"
                    onSelect={() => setSelectedPendingId(media.id)}
                  />
                ))}
              </div>
            </aside>

            <div className="xl:sticky xl:top-24 xl:self-start">
              <PendingDetailPanel
                isMutating={isMutating}
                media={selectedPendingMedia}
                onApprove={setApproveTarget}
                onReject={setRejectTarget}
                onViewDetail={setDetailTarget}
              />
            </div>
          </div>

          {pendingPage && pendingPage.totalPages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
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

      {activeTab === "approved" && (
        <div className="hidden flex-wrap gap-2">
          {(
            [
              { key: "all", label: "Tất cả" },
              { key: "manual", label: "Duyệt tay (có vi phạm)" },
              { key: "clean", label: "Không vi phạm" },
            ] as const
          ).map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                setApprovedFilter(option.key);
                setApprovedPage(0);
              }}
              className={`rounded-full border px-4 py-1.5 text-xs font-bold transition ${
                approvedFilter === option.key
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === "approved" && (
        <div className="hidden flex-wrap gap-2">
          {(
            [
              { key: "all", label: "Tất cả" },
              { key: "IMAGE", label: "Ảnh" },
              { key: "VIDEO", label: "Video" },
            ] as const
          ).map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                setApprovedTypeFilter(option.key);
                setApprovedPage(0);
              }}
              className={`rounded-full border px-4 py-1.5 text-xs font-bold transition ${
                approvedTypeFilter === option.key
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === "approved" && approvedQuery.isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-400" />
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Đang tải danh sách nội dung đã duyệt...
          </p>
        </div>
      )}

      {activeTab === "approved" && approvedQuery.isError && (
        <div className="rounded-2xl border border-red-200 bg-white px-6 py-16 text-center text-sm font-semibold text-red-600 shadow-sm">
          Không thể tải danh sách nội dung đã duyệt.
        </div>
      )}

      {activeTab === "approved" && !approvedQuery.isLoading && !approvedQuery.isError && approvedItems.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-950">
            {approvedFilter === "all"
              ? "Chưa có nội dung nào được duyệt"
              : "Không có nội dung nào khớp bộ lọc này"}
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {approvedFilter === "all"
              ? "Nội dung sau khi được duyệt sẽ hiển thị tại đây, sắp xếp theo thời điểm duyệt gần nhất."
              : "Thử chọn bộ lọc khác hoặc xem lại ở mục \"Tất cả\"."}
          </p>
        </div>
      )}

      {activeTab === "approved" && approvedItems.length > 0 && (
        <>
          <div className="grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-950 backoffice-dark:text-white">
                    Nội dung đã duyệt
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500 backoffice-dark:text-white/55">
                    Chọn episode để xem trạng thái và thao tác ẩn/hiện.
                  </p>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 backoffice-dark:border-emerald-400/30 backoffice-dark:bg-emerald-400/10 backoffice-dark:text-emerald-200">
                  {approvedQuery.data?.totalElements ?? approvedItems.length}
                </span>
              </div>

              <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.55)_transparent] backoffice-dark:[scrollbar-color:rgba(212,175,55,0.38)_transparent]">
                {approvedItems.map((media) => (
                  <ModerationListItem
                    key={media.episodeId || media.id}
                    isSelected={selectedApprovedMedia?.id === media.id}
                    media={media}
                    mediaCount={media.episodeMediaCount ?? 1}
                    mode="approved"
                    onSelect={() => setSelectedApprovedId(media.id)}
                  />
                ))}
              </div>
            </aside>

            <div className="xl:sticky xl:top-24 xl:self-start">
              <ApprovedDetailPanel
                isMutating={isApprovedMutating}
                media={selectedApprovedMedia}
                mediaCount={selectedApprovedMedia?.episodeMediaCount ?? 1}
                onForceHide={handleForceHide}
                onForceUnhide={handleForceUnhide}
                onViewDetail={setDetailTarget}
              />
            </div>
          </div>

          {approvedQuery.data && approvedQuery.data.totalPages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
              <p className="text-sm font-semibold text-slate-500">
                Trang {approvedQuery.data.pageNumber + 1} / {approvedQuery.data.totalPages} -{" "}
                {approvedQuery.data.totalElements} nội dung
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setApprovedPage((current) => Math.max(0, current - 1))}
                  disabled={approvedQuery.data.isFirst || approvedQuery.isFetching}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setApprovedPage((current) => current + 1)}
                  disabled={approvedQuery.data.isLast || approvedQuery.isFetching}
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

      {activeTab === "rejected" && rejectedQuery.isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-400" />
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Đang tải danh sách nội dung bị từ chối...
          </p>
        </div>
      )}

      {activeTab === "rejected" && rejectedQuery.isError && (
        <div className="rounded-2xl border border-red-200 bg-white px-6 py-16 text-center text-sm font-semibold text-red-600 shadow-sm">
          Không thể tải danh sách nội dung bị từ chối.
        </div>
      )}

      {activeTab === "rejected" && !rejectedQuery.isLoading && !rejectedQuery.isError && rejectedItems.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <CircleAlert className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-950">
            Chưa có nội dung nào bị từ chối
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Nội dung bị Staff từ chối tay hoặc pipeline tự động từ chối do lỗi hệ thống sẽ
            hiển thị tại đây.
          </p>
        </div>
      )}

      {activeTab === "rejected" && rejectedItems.length > 0 && (
        <>
          <div className="grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-950 backoffice-dark:text-white">
                    Nội dung bị từ chối
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500 backoffice-dark:text-white/55">
                    Chọn episode để xem lý do và duyệt lại nếu cần.
                  </p>
                </div>
                <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-700 backoffice-dark:border-red-400/30 backoffice-dark:bg-red-400/10 backoffice-dark:text-red-200">
                  {rejectedQuery.data?.totalElements ?? rejectedItems.length}
                </span>
              </div>

              <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.55)_transparent] backoffice-dark:[scrollbar-color:rgba(212,175,55,0.38)_transparent]">
                {rejectedItems.map((media) => (
                  <ModerationListItem
                    key={media.episodeId || media.id}
                    isSelected={selectedRejectedMedia?.id === media.id}
                    media={media}
                    mediaCount={media.episodeMediaCount ?? 1}
                    mode="rejected"
                    onSelect={() => setSelectedRejectedId(media.id)}
                  />
                ))}
              </div>
            </aside>

            <div className="xl:sticky xl:top-24 xl:self-start">
              <RejectedDetailPanel
                isMutating={isMutating}
                media={selectedRejectedMedia}
                mediaCount={selectedRejectedMedia?.episodeMediaCount ?? 1}
                onApprove={setApproveTarget}
                onViewDetail={setDetailTarget}
              />
            </div>
          </div>

          {rejectedQuery.data && rejectedQuery.data.totalPages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
              <p className="text-sm font-semibold text-slate-500">
                Trang {rejectedQuery.data.pageNumber + 1} / {rejectedQuery.data.totalPages} -{" "}
                {rejectedQuery.data.totalElements} nội dung
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectedPage((current) => Math.max(0, current - 1))}
                  disabled={rejectedQuery.data.isFirst || rejectedQuery.isFetching}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRejectedPage((current) => current + 1)}
                  disabled={rejectedQuery.data.isLast || rejectedQuery.isFetching}
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

      <ConfirmModerationActionModal
        action="approve"
        isLoading={approveMutation.isPending}
        media={approveTarget}
        onClose={() => {
          if (!approveMutation.isPending) setApproveTarget(null);
        }}
        onConfirm={confirmApprove}
        open={Boolean(approveTarget)}
      />

      <ConfirmModerationActionModal
        action="reject"
        isLoading={rejectMutation.isPending}
        media={rejectTarget}
        onClose={() => {
          if (!rejectMutation.isPending) setRejectTarget(null);
        }}
        onConfirm={confirmReject}
        open={Boolean(rejectTarget)}
      />

      <ConfirmForceHideModal
        isLoading={forceHideMutation.isPending}
        media={forceHideTarget}
        onClose={() => {
          if (!forceHideMutation.isPending) setForceHideTarget(null);
        }}
        onConfirm={confirmForceHide}
        open={Boolean(forceHideTarget)}
      />

      <ModerationDetailModal
        isMutating={isMutating}
        media={detailTarget}
        onApprove={setApproveTarget}
        onClose={() => setDetailTarget(null)}
        onReject={setRejectTarget}
        open={Boolean(detailTarget)}
      />
    </div>
  );
}
