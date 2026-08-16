"use client";

import { type FormEvent, useState } from "react";
import {
  Film,
  Flag,
  Image as ImageIcon,
  Loader2,
  UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  type ModerationTicket,
  type PenaltyLevel,
  type TicketStatus,
} from "../api/moderation-reports.api";
import {
  useModerationTargetDetail,
  useProcessTicket,
} from "../hooks/use-moderation-reports";
import {
  formatDateTime,
  labelForPenaltyLevel,
  labelForReason,
  labelForTargetType,
  labelForTicketStatus,
  penaltyLevelOptions,
  statusTone,
} from "../utils/moderation-labels";
import { WatermarkScanner } from "./watermark-scanner";

function statusBadge(status?: string) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${statusTone(status)}`}
    >
      {labelForTicketStatus(status)}
    </span>
  );
}

function getDominantReason(ticket: ModerationTicket) {
  if (ticket.dominantReason) return ticket.dominantReason;

  const reasons =
    ticket.reports?.map((report) => report.reason).filter(Boolean) ?? [];
  if (!reasons.length) return undefined;

  const counts = new Map<string, number>();
  reasons.forEach((reason) => counts.set(reason, (counts.get(reason) ?? 0) + 1));

  return reasons.reduce((best, reason) =>
    (counts.get(reason) ?? 0) > (counts.get(best) ?? 0) ? reason : best,
  );
}

function isFinalTicket(status?: TicketStatus) {
  return status === "RESOLVED" || status === "DISMISSED";
}

function ProofLinks({
  images,
  videos,
  targetType,
}: {
  images?: string[];
  videos?: string[];
  targetType?: string;
}) {
  const hasImages = images && images.length > 0;
  const hasVideos = videos && videos.length > 0;

  if (!hasImages && !hasVideos) {
    return (
      <span className="text-xs font-semibold text-slate-400">
        Không có bằng chứng (ảnh/video)
      </span>
    );
  }

  return (
    <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.55)_transparent] backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.03]">
      {images?.map((url, index) => (
        <div key={`img-${index}`} className="flex flex-col gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-amber-300 hover:shadow-md backoffice-dark:border-white/10 backoffice-dark:bg-black/25"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 text-xs font-black text-slate-600 group-hover:text-amber-700 backoffice-dark:border-white/10 backoffice-dark:text-white/70">
              <ImageIcon className="h-3.5 w-3.5" />
              Ảnh minh chứng {index + 1}
            </div>
            <div className="bg-slate-950/5 p-2 backoffice-dark:bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Ảnh minh chứng ${index + 1}`}
                loading="lazy"
                className="max-h-56 w-full rounded-lg object-contain"
              />
            </div>
          </a>
          {targetType === "OTHER" && (
            <WatermarkScanner url={url} mediaType="IMAGE" />
          )}
        </div>
      ))}
      {videos?.map((url, index) => (
        <div key={`vid-${index}`} className="flex flex-col gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-amber-300 hover:shadow-md backoffice-dark:border-white/10 backoffice-dark:bg-black/25"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 text-xs font-black text-slate-600 group-hover:text-amber-700 backoffice-dark:border-white/10 backoffice-dark:text-white/70">
              <Film className="h-3.5 w-3.5" />
              Video minh chứng {index + 1}
            </div>
            <div className="bg-slate-950/5 p-2 backoffice-dark:bg-black/30">
              <video
                src={url}
                controls
                className="max-h-56 w-full rounded-lg object-contain"
              />
            </div>
          </a>
          {targetType === "OTHER" && (
            <WatermarkScanner url={url} mediaType="VIDEO" />
          )}
        </div>
      ))}
    </div>
  );
}

export function TicketDetailModal({
  isAssigning,
  onAssign,
  ticket,
  onClose,
  onProcessed,
}: {
  isAssigning: boolean;
  onAssign: (ticket: ModerationTicket) => Promise<void>;
  ticket: ModerationTicket | null;
  onClose: () => void;
  onProcessed: () => void;
}) {
  const [decision, setDecision] = useState<"approve" | "dismiss">("approve");
  const [penaltyLevel, setPenaltyLevel] =
    useState<PenaltyLevel>("WARNING_EPISODE");
  const [reason, setReason] = useState("");
  const processMutation = useProcessTicket(ticket?.ticketId);
  const targetDetailQuery = useModerationTargetDetail(ticket);

  if (!ticket) return null;

  const canProcess = ticket.status === "IN_PROGRESS";
  const canAssign = !canProcess && !isFinalTicket(ticket.status);
  const dominantReason = getDominantReason(ticket);
  const targetDetail = targetDetailQuery.data;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      toast.error("Vui lòng nhập lý do xử lý.");
      return;
    }

    if (decision === "approve" && !penaltyLevel) {
      toast.error("Vui lòng chọn mức hình phạt.");
      return;
    }

    await processMutation.mutateAsync(
      decision === "approve"
        ? { isApproved: true, penaltyLevel, reason: trimmedReason }
        : { isApproved: false, reason: trimmedReason },
    );
    onProcessed();
  }

  async function handleAssignInModal() {
    if (!ticket) return;
    await onAssign(ticket);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm">
      <div className="flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl backoffice-dark:border-white/10 backoffice-dark:bg-[#111113]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4 backoffice-dark:border-white/10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-slate-950 backoffice-dark:text-white">
                Chi tiết ticket báo cáo
              </h2>
              {statusBadge(ticket.status)}
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-500 backoffice-dark:text-white/50">
              {labelForTargetType(ticket.targetType)} · tạo{" "}
              {formatDateTime(ticket.createdAt)} · cập nhật{" "}
              {formatDateTime(ticket.updatedAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_360px]">
          <div className="min-h-0 overflow-y-auto p-5 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.55)_transparent]">
            <section className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white sm:w-32 backoffice-dark:border-white/10 backoffice-dark:bg-black/25">
                  {targetDetail?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={targetDetail.imageUrl}
                      alt={targetDetail.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : targetDetailQuery.isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  ) : targetDetail?.targetType === "SERIES" ? (
                    <Film className="h-6 w-6 text-slate-400" />
                  ) : (
                    <Flag className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-black text-amber-700">
                      {labelForTargetType(
                        targetDetail?.targetType ?? ticket.targetType,
                      )}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      ID: {targetDetail?.targetId ?? ticket.targetId}
                    </span>
                  </div>
                  <h3 className="truncate text-base font-black text-slate-950 backoffice-dark:text-white">
                    {targetDetail?.title || "Không có tiêu đề đối tượng"}
                  </h3>
                  {targetDetail?.subtitle && (
                    <p className="truncate text-xs font-semibold text-slate-500 backoffice-dark:text-white/60">
                      {targetDetail.subtitle}
                    </p>
                  )}
                  {targetDetail?.ownerName && (
                    <p className="text-xs font-medium text-slate-500 backoffice-dark:text-white/60">
                      Chủ sở hữu:{" "}
                      <span className="font-bold text-slate-700 backoffice-dark:text-white/80">
                        {targetDetail.ownerName}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </section>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Lý do vi phạm nổi trội
                </h4>
                <p className="mt-1 text-sm font-black text-slate-950 backoffice-dark:text-white">
                  {labelForReason(dominantReason)}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Danh sách báo cáo (
                  {ticket.reports?.length ?? ticket.reportCount})
                </h4>
                {ticket.reports?.map((report, index) => (
                  <div
                    key={report.reportId ?? report.id ?? `report-${index}`}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.03]"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <span className="text-xs font-black text-amber-700">
                        {labelForReason(report.reason)}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {formatDateTime(report.createdAt)}
                      </span>
                    </div>
                    {report.description && (
                      <p className="mt-2 text-xs font-medium leading-relaxed text-slate-700 backoffice-dark:text-white/80">
                        {report.description}
                      </p>
                    )}
                    {report.proofImages?.length ||
                    report.proofVideos?.length ? (
                      <div className="mt-3">
                        <ProofLinks
                          images={report.proofImages}
                          videos={report.proofVideos}
                          targetType={ticket.targetType}
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              {!ticket.reports?.length && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                  Ticket này chưa trả về danh sách report chi tiết.
                </div>
              )}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-200 bg-slate-50 p-5 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.05] lg:border-l lg:border-t-0"
          >
            <h3 className="text-base font-black text-slate-950">
              Xử lý ticket
            </h3>

            {!canProcess && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700">
                Hãy bấm “Nhận xử lý” trước, hoặc ticket này đã được xử lý xong.
              </div>
            )}

            {canAssign && (
              <button
                type="button"
                onClick={handleAssignInModal}
                disabled={isAssigning}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-400 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAssigning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
                Nhận xử lý ticket này
              </button>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2">
              {[
                { key: "approve", label: "Xác nhận vi phạm" },
                { key: "dismiss", label: "Bác bỏ report" },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() =>
                    setDecision(option.key as "approve" | "dismiss")
                  }
                  disabled={!canProcess || processMutation.isPending}
                  className={`h-10 rounded-lg border text-xs font-black transition disabled:opacity-50 ${
                    decision === option.key
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {decision === "approve" && (
              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Mức hình phạt
                </span>
                <select
                  value={penaltyLevel}
                  onChange={(event) =>
                    setPenaltyLevel(event.target.value as PenaltyLevel)
                  }
                  disabled={!canProcess || processMutation.isPending}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-amber-500"
                >
                  {penaltyLevelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
              </label>
            )}

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Lý do xử lý
              </span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={!canProcess || processMutation.isPending}
                rows={5}
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-amber-500 disabled:bg-slate-100"
                placeholder={
                  decision === "approve"
                    ? "Ví dụ: Đủ bằng chứng vi phạm bản quyền..."
                    : "Ví dụ: Không đủ bằng chứng hoặc report sai đối tượng..."
                }
              />
            </label>

            <button
              type="submit"
              disabled={!canProcess || processMutation.isPending}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Lưu kết quả
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
