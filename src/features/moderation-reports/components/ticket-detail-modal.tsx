"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  Film,
  Flag,
  Image as ImageIcon,
  Download,
  Loader2,
  UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  type ReportTargetType,
  type ModerationTicket,
  type Penalty,
  type PenaltyLevel,
  type ReportedContentExportTargetType,
  type TicketStatus,
} from "../api/moderation-reports.api";
import {
  useAppealByPenalty,
  useExportReportedContentOrders,
  useModerationTargetDetail,
  useModerationStaffAccount,
  usePenalty,
  usePenalties,
  useProcessTicket,
} from "../hooks/use-moderation-reports";
import {
  formatDateTime,
  labelForAppealStatus,
  labelForPenaltyLevel,
  labelForPenaltyStatus,
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

function shortId(value?: string | null) {
  if (!value) return "-";
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function MaskedId({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  const [isVisible, setIsVisible] = useState(false);

  if (!value) return <span>-</span>;

  return (
    <span className="inline-flex max-w-full items-center gap-2">
      <span
        className={`min-w-0 text-xs font-bold text-slate-500 backoffice-dark:text-white/55 ${isVisible ? "break-all" : "truncate"
          }`}
        title={isVisible ? value : `${label}: ${shortId(value)}`}
      >
        {isVisible ? value : shortId(value)}
      </span>
      <button
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.05] backoffice-dark:text-white/55 backoffice-dark:hover:border-amber-300/60 backoffice-dark:hover:bg-amber-300/10 backoffice-dark:hover:text-amber-200"
        aria-label={isVisible ? `Ẩn ${label}` : `Hiện ${label}`}
        title={isVisible ? `Ẩn ${label}` : `Hiện ${label}`}
      >
        {isVisible ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
      </button>
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

const penaltyLevelsByTargetType: Partial<Record<ReportTargetType, PenaltyLevel[]>> = {
  COMMENT: ["WARNING_COMMENT"],
  EPISODE: ["WARNING_EPISODE", "FINE_EPISODE"],
  SERIES: ["WARNING_SERIES", "FINE_SERIES"],
  ACCOUNT: ["WARNING_ACCOUNT", "FINE_ACCOUNT"],
};

function getPenaltyLevelOptionsForTarget(targetType?: ReportTargetType) {
  const allowedLevels = targetType ? penaltyLevelsByTargetType[targetType] : undefined;

  if (!allowedLevels) return [];

  return penaltyLevelOptions.filter((option) =>
    allowedLevels.includes(option.value),
  );
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function toDateTimeLocalValue(date: Date) {
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  const hours = padDatePart(date.getHours());
  const minutes = padDatePart(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getDefaultExportRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  start.setHours(0, 0, 0, 0);

  return {
    startTime: toDateTimeLocalValue(start),
    endTime: toDateTimeLocalValue(end),
  };
}

function toApiDateTime(value: string) {
  if (!value) return "";
  return value.length === 16 ? `${value}:00` : value;
}

function isExportableTargetType(
  targetType?: ReportTargetType,
): targetType is ReportedContentExportTargetType {
  return targetType === "EPISODE" || targetType === "SERIES";
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
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
  currentAccountId,
}: {
  isAssigning: boolean;
  onAssign: (ticket: ModerationTicket) => Promise<void>;
  ticket: ModerationTicket | null;
  onClose: () => void;
  onProcessed: () => void;
  currentAccountId?: string | null;
}) {
  const [decision, setDecision] = useState<"approve" | "dismiss">("approve");
  const [penaltyLevel, setPenaltyLevel] =
    useState<PenaltyLevel>("WARNING_EPISODE");
  const [reason, setReason] = useState("");
  const [processedPenalty, setProcessedPenalty] = useState<Penalty | null>(null);
  const [processedStatus, setProcessedStatus] = useState<TicketStatus | null>(null);
  const [exportRange, setExportRange] = useState(getDefaultExportRange);
  const processMutation = useProcessTicket(ticket?.ticketId);
  const exportMutation = useExportReportedContentOrders();
  const targetDetailQuery = useModerationTargetDetail(ticket);
  const assignedStaffQuery = useModerationStaffAccount(ticket?.assignedStaffId);
  const linkedPenaltyId =
    processedPenalty?.penaltyId ??
    ticket?.penaltyId ??
    ticket?.penalty?.penaltyId ??
    undefined;
  const linkedPenaltyQuery = usePenalty(
    linkedPenaltyId && !processedPenalty && !ticket?.penalty
      ? linkedPenaltyId
      : null,
  );
  const fallbackPenaltiesQuery = usePenalties({
    page: 1,
    pageSize: 20,
    targetType: ticket?.targetType ?? "ALL",
  });
  const allowedPenaltyLevelOptions = useMemo(
    () => getPenaltyLevelOptionsForTarget(ticket?.targetType),
    [ticket?.targetType],
  );
  const hasAllowedPenaltyLevels = allowedPenaltyLevelOptions.length > 0;
  const isPenaltyLevelAllowed = allowedPenaltyLevelOptions.some(
    (option) => option.value === penaltyLevel,
  );
  const selectedPenaltyLevel = isPenaltyLevelAllowed
    ? penaltyLevel
    : allowedPenaltyLevelOptions[0]?.value;
  const targetDetail = targetDetailQuery.data;
  const fallbackPenalty = useMemo(() => {
    if (linkedPenaltyId || !ticket) return undefined;

    return fallbackPenaltiesQuery.data?.content.find((penalty) => {
      if (penalty.ticketId && penalty.ticketId === ticket.ticketId) {
        return true;
      }

      return (
        penalty.targetType === ticket.targetType &&
        penalty.targetId === ticket.targetId
      );
    });
  }, [
    fallbackPenaltiesQuery.data?.content,
    linkedPenaltyId,
    ticket,
  ]);
  const linkedPenalty =
    processedPenalty ?? ticket?.penalty ?? linkedPenaltyQuery.data ?? fallbackPenalty;
  const resolvedLinkedPenaltyId = linkedPenalty?.penaltyId ?? linkedPenaltyId;
  const linkedAppealQuery = useAppealByPenalty(resolvedLinkedPenaltyId);
  const linkedAppeal = linkedAppealQuery.data;

  if (!ticket) return null;

  const assignedStaffId = ticket.assignedStaffId?.trim() || null;
  const isAssignedToCurrentUser =
    Boolean(assignedStaffId) && assignedStaffId === currentAccountId;
  const isAssignedToAnother =
    Boolean(assignedStaffId) && assignedStaffId !== currentAccountId;
  const assignedStaffName =
    ticket.assignedStaffUsername ??
    assignedStaffQuery.data?.fullName ??
    assignedStaffQuery.data?.username ??
    assignedStaffQuery.data?.email;
  const canProcess =
    (processedStatus ?? ticket.status) === "IN_PROGRESS" &&
    (!assignedStaffId || isAssignedToCurrentUser);
  const canAssign =
    !canProcess && !isFinalTicket(processedStatus ?? ticket.status) && !assignedStaffId;
  const dominantReason = getDominantReason(ticket);
  const canExportOrders = isExportableTargetType(ticket.targetType);
  const isSubmitDisabled =
    !canProcess ||
    processMutation.isPending ||
    (decision === "approve" && !hasAllowedPenaltyLevels);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      toast.error("Vui lòng nhập lý do xử lý.");
      return;
    }

    if (decision === "approve" && !selectedPenaltyLevel) {
      toast.error("Vui lòng chọn mức hình phạt.");
      return;
    }

    if (
      decision === "approve" &&
      !allowedPenaltyLevelOptions.some(
        (option) => option.value === selectedPenaltyLevel,
      )
    ) {
      toast.error("Mức hình phạt không khớp với đối tượng bị report.");
      return;
    }

    const result = await processMutation.mutateAsync(
      decision === "approve"
        ? { isApproved: true, penaltyLevel: selectedPenaltyLevel, reason: trimmedReason }
        : { isApproved: false, reason: trimmedReason },
    );
    setProcessedPenalty(result ?? null);
    setProcessedStatus(decision === "approve" ? "RESOLVED" : "DISMISSED");
    onProcessed();
  }

  async function handleAssignInModal() {
    if (!ticket) return;
    if (assignedStaffId) {
      toast.info("Ticket này đang có nhân viên nhận xử lý.");
      return;
    }
    await onAssign(ticket);
  }

  async function handleExportOrders() {
    const currentTicket = ticket;
    const exportTargetType = isExportableTargetType(currentTicket?.targetType)
      ? currentTicket.targetType
      : null;

    if (!currentTicket || !exportTargetType) {
      toast.error("Chỉ hỗ trợ xuất Excel cho tập nội dung hoặc series.");
      return;
    }

    const startTime = toApiDateTime(exportRange.startTime);
    const endTime = toApiDateTime(exportRange.endTime);
    if (!startTime || !endTime) {
      toast.error("Vui lòng chọn đầy đủ thời gian bắt đầu và kết thúc.");
      return;
    }

    if (new Date(startTime).getTime() > new Date(endTime).getTime()) {
      toast.error("Thời gian bắt đầu phải nhỏ hơn hoặc bằng thời gian kết thúc.");
      return;
    }

    const result = await exportMutation.mutateAsync({
      targetType: exportTargetType,
      targetId: currentTicket.targetId,
      startTime,
      endTime,
    });
    downloadBlob(result.blob, result.fileName);
    toast.success("Đã xuất file Excel người mua nội dung.");
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
      <div className="flex h-[calc(100vh-3rem)] max-h-[920px] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl backoffice-dark:border-white/10 backoffice-dark:bg-[#111113]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4 backoffice-dark:border-white/10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-slate-950 backoffice-dark:text-white">
                Chi Tiết Báo Cáo
              </h2>
              {statusBadge(processedStatus ?? ticket.status)}
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-500 backoffice-dark:text-white/50">
              Report Id: <MaskedId label="Ticket ID" value={ticket.ticketId} />
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500 backoffice-dark:text-white/50">
              {labelForTargetType(ticket.targetType)} · Tạo Lúc {" "}
              {formatDateTime(ticket.createdAt)} · Cập Nhật{" "}
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

        <div className="grid min-h-0 flex-1 overflow-hidden grid-cols-1 lg:grid-cols-[1fr_360px]">
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
                    <MaskedId
                      label="Target ID"
                      value={targetDetail?.targetId ?? ticket.targetId}
                    />
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
                  Lý do vi phạm
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
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Các mục liên quan
                </h4>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.03]">
                    <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                      Hình phạt
                    </p>
                    {linkedPenaltyQuery.isLoading && !linkedPenalty ? (
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Đang tải hình phạt...
                      </p>
                    ) : linkedPenalty ? (
                      <>
                        <p className="mt-1 text-sm font-black text-slate-950 backoffice-dark:text-white">
                          {labelForPenaltyLevel(linkedPenalty.level)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {labelForPenaltyStatus(linkedPenalty.status)} ·{" "}
                          {formatDateTime(linkedPenalty.createdAt)}
                        </p>
                        {linkedPenalty.reason && (
                          <p className="mt-2 line-clamp-2 text-xs font-medium leading-relaxed text-slate-600 backoffice-dark:text-white/70">
                            {linkedPenalty.reason}
                          </p>
                        )}
                        <Link
                          href={`/admin/penalties?penaltyId=${linkedPenalty.penaltyId}`}
                          className="mt-3 inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 backoffice-dark:border-white/10 backoffice-dark:text-white/75 backoffice-dark:hover:bg-red-300/10"
                        >
                          Xem hình phạt
                        </Link>
                      </>
                    ) : (
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Chưa có hình phạt liên quan.
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.03]">
                    <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                      Khiếu nại
                    </p>
                    {linkedAppealQuery.isLoading && !linkedAppeal ? (
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Đang tải khiếu nại...
                      </p>
                    ) : linkedAppeal ? (
                      <>
                        <p className="mt-1 text-sm font-black text-slate-950 backoffice-dark:text-white">
                          {labelForAppealStatus(linkedAppeal.status)}
                        </p>
                        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                          {linkedAppeal.reason || "Không có lý do chi tiết."}
                        </p>
                        {linkedAppeal.adminNote && (
                          <p className="mt-2 line-clamp-2 text-xs font-medium leading-relaxed text-slate-600 backoffice-dark:text-white/70">
                            Ghi chú admin: {linkedAppeal.adminNote}
                          </p>
                        )}
                        {resolvedLinkedPenaltyId && (
                          <Link
                            href={`/admin/appeals?penaltyId=${resolvedLinkedPenaltyId}`}
                            className="mt-3 inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 backoffice-dark:border-white/10 backoffice-dark:text-white/75 backoffice-dark:hover:bg-amber-300/10"
                          >
                            Xem khiếu nại
                          </Link>
                        )}
                      </>
                    ) : (
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Chưa có khiếu nại liên quan.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="min-h-0 overflow-y-auto border-t border-slate-200 bg-slate-50 p-5 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.55)_transparent] backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.05] lg:border-l lg:border-t-0"
          >
            {canExportOrders && (
              <section className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 backoffice-dark:border-emerald-300/20 backoffice-dark:bg-emerald-300/[0.08]">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm backoffice-dark:bg-white/10 backoffice-dark:text-emerald-200">
                    <Download className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-emerald-900 backoffice-dark:text-emerald-100">
                      Xuất Excel người mua
                    </h3>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-emerald-700/80 backoffice-dark:text-emerald-100/70">
                      {ticket.targetType === "SERIES"
                        ? "Lấy các đơn hoàn tất thuộc series bị report."
                        : "Lấy các đơn hoàn tất theo tập nội dung bị report."}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-2">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-emerald-700/80 backoffice-dark:text-emerald-100/70">
                      Từ thời gian
                    </span>
                    <input
                      type="datetime-local"
                      value={exportRange.startTime}
                      onChange={(event) =>
                        setExportRange((current) => ({
                          ...current,
                          startTime: event.target.value,
                        }))
                      }
                      disabled={exportMutation.isPending}
                      className="h-9 w-full rounded-lg border border-emerald-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 disabled:bg-slate-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-emerald-700/80 backoffice-dark:text-emerald-100/70">
                      Đến thời gian
                    </span>
                    <input
                      type="datetime-local"
                      value={exportRange.endTime}
                      onChange={(event) =>
                        setExportRange((current) => ({
                          ...current,
                          endTime: event.target.value,
                        }))
                      }
                      disabled={exportMutation.isPending}
                      className="h-9 w-full rounded-lg border border-emerald-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 disabled:bg-slate-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleExportOrders}
                  disabled={exportMutation.isPending}
                  className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-xs font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {exportMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Tải file Excel
                </button>
              </section>
            )}

            <h3 className="text-base font-black text-slate-950">
              Xử lý ticket
            </h3>

            {!canProcess && !isAssignedToAnother && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700">
                Hãy bấm “Nhận xử lý” trước, hoặc ticket này đã được xử lý xong.
              </div>
            )}

            {assignedStaffId && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-600 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.05] backoffice-dark:text-white/70">
                <p className="font-black uppercase tracking-wide text-slate-400">
                  Nhân viên đang xử lý
                </p>
                <p className="mt-1 truncate text-sm font-black text-slate-900 backoffice-dark:text-white">
                  {assignedStaffName ??
                    (assignedStaffQuery.isLoading
                      ? "Đang tải thông tin..."
                      : shortId(assignedStaffId))}
                </p>
              </div>
            )}

            {isAssignedToAnother && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700">
                Ticket này đang có nhân viên khác nhận xử lý. Bạn chỉ nên xem
                thông tin, không xử lý ticket này.
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
                  className={`h-10 rounded-lg border text-xs font-black transition disabled:opacity-50 ${decision === option.key
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
                  value={selectedPenaltyLevel ?? ""}
                  onChange={(event) =>
                    setPenaltyLevel(event.target.value as PenaltyLevel)
                  }
                  disabled={
                    !canProcess ||
                    processMutation.isPending ||
                    !hasAllowedPenaltyLevels
                  }
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-amber-500"
                >
                  {!hasAllowedPenaltyLevels && (
                    <option value="">Không có mức hình phạt phù hợp</option>
                  )}
                  {allowedPenaltyLevelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {!hasAllowedPenaltyLevels && (
                  <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                    Loại đối tượng này chưa có mức hình phạt phù hợp.
                  </p>
                )}

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
              disabled={isSubmitDisabled}
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
