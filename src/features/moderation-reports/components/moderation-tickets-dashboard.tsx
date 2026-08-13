"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Film,
  Flag,
  Image as ImageIcon,
  Loader2,
  RefreshCcw,
  UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  type ModerationTicket,
  type PenaltyLevel,
  type ReportTargetType,
  type TicketStatus,
} from "../api/moderation-reports.api";
import {
  useAssignTicket,
  useProcessTicket,
  useTickets,
} from "../hooks/use-moderation-reports";
import {
  formatDateTime,
  labelForPenaltyLevel,
  labelForReason,
  labelForTargetType,
  labelForTicketStatus,
  penaltyLevelOptions,
  reportTargetOptions,
  statusTone,
  ticketStatusOptions,
} from "../utils/moderation-labels";
import { WatermarkScanner } from "./watermark-scanner";

const PAGE_SIZE = 20;

type Props = {
  scope?: "admin" | "staff";
};

function statusBadge(status?: string) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${statusTone(status)}`}>
      {labelForTicketStatus(status)}
    </span>
  );
}

function ProofLinks({ images, videos, targetType }: { images?: string[], videos?: string[], targetType?: string }) {
  const hasImages = images && images.length > 0;
  const hasVideos = videos && videos.length > 0;

  if (!hasImages && !hasVideos) {
    return <span className="text-xs font-semibold text-slate-400">Không có bằng chứng (ảnh/video)</span>;
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

function TicketDetailModal({
  ticket,
  onClose,
  onProcessed,
}: {
  ticket: ModerationTicket | null;
  onClose: () => void;
  onProcessed: () => void;
}) {
  const [decision, setDecision] = useState<"approve" | "dismiss">("approve");
  const [penaltyLevel, setPenaltyLevel] = useState<PenaltyLevel>("WARNING_EPISODE");
  const [reason, setReason] = useState("");
  const processMutation = useProcessTicket(ticket?.ticketId);

  if (!ticket) return null;

  const canProcess = ticket.status === "IN_PROGRESS";

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

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm">
      <div className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-slate-950">
                Ticket {ticket.ticketId}
              </h2>
              {statusBadge(ticket.status)}
            </div>
            <p className="mt-1 break-all text-xs font-semibold text-slate-500">
              {labelForTargetType(ticket.targetType)} · {ticket.targetId}
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

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_360px]">
          <div className="min-h-0 overflow-y-auto p-5">
            <div className="mb-4 grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-400">Số report</p>
                <p className="mt-1 text-xl font-black text-slate-950">{ticket.reportCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-400">Ưu tiên</p>
                <p className="mt-1 text-xl font-black text-amber-600">{ticket.priorityScore}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-400">Lý do chính</p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  {labelForReason(ticket.dominantReason)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-400">Staff</p>
                <p className="mt-1 truncate text-sm font-black text-slate-950">
                  {ticket.assignedStaffUsername || ticket.assignedStaffId || "Chưa nhận"}
                </p>
              </div>
            </div>

            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">
              Báo cáo liên quan
            </h3>
            <div className="space-y-3">
              {(ticket.reports ?? []).map((report, index) => (
                <article
                  key={report.reportId || report.id || index}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {labelForReason(report.reason)}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-500">
                        Người báo cáo: {report.reporterUsername || report.reporterId || "-"} ·{" "}
                        {formatDateTime(report.createdAt)}
                      </p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${statusTone(report.status)}`}>
                      {report.status || "-"}
                    </span>
                  </div>
                  <p className="mb-3 whitespace-pre-line text-sm font-medium leading-relaxed text-slate-700">
                    {report.description || "Không có mô tả."}
                  </p>
                  <ProofLinks images={report.proofImages} videos={report.proofVideos} targetType={ticket.targetType} />
                </article>
              ))}

              {!ticket.reports?.length && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                  Ticket này chưa trả về danh sách report chi tiết.
                </div>
              )}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0"
          >
            <h3 className="text-base font-black text-slate-950">Xử lý ticket</h3>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">
              BE chỉ cho process khi ticket đang `IN_PROGRESS` và thuộc staff hiện tại.
            </p>

            {!canProcess && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700">
                Hãy bấm “Nhận xử lý” trước, hoặc ticket này đã được xử lý xong.
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2">
              {[
                { key: "approve", label: "Xác nhận vi phạm" },
                { key: "dismiss", label: "Bác bỏ report" },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setDecision(option.key as "approve" | "dismiss")}
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
                  onChange={(event) => setPenaltyLevel(event.target.value as PenaltyLevel)}
                  disabled={!canProcess || processMutation.isPending}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-amber-500"
                >
                  {penaltyLevelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  {labelForPenaltyLevel(penaltyLevel)} sẽ tạo Penalty ACTIVE ở BE.
                </p>
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
              {processMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Lưu kết quả
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function ModerationTicketsDashboard({ scope = "staff" }: Props) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<TicketStatus | "ALL">("ALL");
  const [targetType, setTargetType] = useState<ReportTargetType | "ALL">("ALL");
  const [selectedTicket, setSelectedTicket] = useState<ModerationTicket | null>(null);

  const queryParams = useMemo(
    () => ({ page, pageSize: PAGE_SIZE, status, targetType }),
    [page, status, targetType],
  );
  const ticketsQuery = useTickets(queryParams);
  const assignMutation = useAssignTicket();

  const tickets = ticketsQuery.data?.content ?? [];
  const title = scope === "admin" ? "Báo cáo & Moderation Tickets" : "Report Tickets";

  async function handleAssign(ticket: ModerationTicket) {
    await assignMutation.mutateAsync(ticket.ticketId);
  }

  return (
    <div className="w-full space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
              <Flag className="h-3.5 w-3.5" />
              Moderation
            </div>
            <h1 className="text-2xl font-black text-slate-950 backoffice-dark:text-white">
              {title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-relaxed text-slate-500 backoffice-dark:text-white/55">
              Danh sách ticket được gom từ report của người dùng. Nhiều report cùng target sẽ tăng
              số lượng và điểm ưu tiên để admin/staff xử lý trước.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as TicketStatus | "ALL");
                setPage(1);
              }}
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-amber-500"
            >
              {ticketStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={targetType}
              onChange={(event) => {
                setTargetType(event.target.value as ReportTargetType | "ALL");
                setPage(1);
              }}
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-amber-500"
            >
              <option value="ALL">Tất cả đối tượng</option>
              {reportTargetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => ticketsQuery.refetch()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Tải lại
            </button>
          </div>
        </div>
      </section>

      {ticketsQuery.isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-400" />
          <p className="mt-3 text-sm font-semibold text-slate-500">Đang tải ticket...</p>
        </div>
      )}

      {ticketsQuery.isError && (
        <div className="rounded-2xl border border-red-200 bg-white px-6 py-16 text-center text-sm font-bold text-red-600">
          Không thể tải danh sách moderation tickets.
        </div>
      )}

      {!ticketsQuery.isLoading && !ticketsQuery.isError && tickets.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-8 w-8 text-slate-300" />
          <h2 className="mt-3 text-lg font-black text-slate-950">Chưa có ticket phù hợp</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Khi người dùng gửi report, ticket sẽ xuất hiện tại đây.
          </p>
        </div>
      )}

      {tickets.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Ticket</th>
                  <th className="px-5 py-4">Đối tượng</th>
                  <th className="px-5 py-4">Ưu tiên</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4">Staff</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((ticket) => (
                  <tr key={ticket.ticketId} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-black text-slate-950">{ticket.ticketId}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {formatDateTime(ticket.createdAt)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-black text-slate-800">{labelForTargetType(ticket.targetType)}</p>
                      <p className="mt-1 max-w-[240px] truncate text-xs font-semibold text-slate-500">
                        {ticket.targetId}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-black text-red-600">
                          {ticket.reportCount} report
                        </span>
                        <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">
                          {ticket.priorityScore} điểm
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {labelForReason(ticket.dominantReason)}
                      </p>
                    </td>
                    <td className="px-5 py-4">{statusBadge(ticket.status)}</td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-500">
                      {ticket.assignedStaffUsername || ticket.assignedStaffId || "Chưa nhận"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(ticket)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                        >
                          <Eye className="h-4 w-4" />
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAssign(ticket)}
                          disabled={
                            assignMutation.isPending ||
                            ticket.status === "RESOLVED" ||
                            ticket.status === "DISMISSED"
                          }
                          className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {assignMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                          Nhận xử lý
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {ticketsQuery.data && ticketsQuery.data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
              <p className="text-sm font-semibold text-slate-500">
                Trang {ticketsQuery.data.pageNumber} / {ticketsQuery.data.totalPages} ·{" "}
                {ticketsQuery.data.totalElements} ticket
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={ticketsQuery.data.isFirst || ticketsQuery.isFetching}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={ticketsQuery.data.isLast || ticketsQuery.isFetching}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                  aria-label="Trang sau"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <TicketDetailModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onProcessed={() => setSelectedTicket(null)}
      />
    </div>
  );
}
