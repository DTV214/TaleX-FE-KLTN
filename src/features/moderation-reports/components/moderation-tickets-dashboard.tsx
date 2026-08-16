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
  useModerationTargetDetail,
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

import { TicketDetailModal } from "./ticket-detail-modal";

const PAGE_SIZE = 20;

type Props = {
  scope?: "admin" | "staff";
};

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

function getTargetPreview(ticket: ModerationTicket, index: number) {
  const ordinal = index + 1;

  switch (ticket.targetType) {
    case "ACCOUNT":
      return "Tài khoản creator";
    case "SERIES":
      return `Series ${ordinal}`;
    case "EPISODE":
      return `Tập nội dung ${ordinal}`;
    case "COMMENT":
      return `Bình luận ${ordinal}`;
    default:
      return "Vấn đề hệ thống";
  }
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
    setSelectedTicket((current) =>
      current?.ticketId === ticket.ticketId
        ? { ...current, status: "IN_PROGRESS" }
        : current,
    );
  }

  return (
    <div className="w-full space-y-6">
      {selectedTicket && (
        <TicketDetailModal
          isAssigning={assignMutation.isPending}
          onAssign={handleAssign}
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onProcessed={() => {
            setSelectedTicket(null);
            ticketsQuery.refetch();
          }}
        />
      )}
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
                  <th className="px-5 py-4">Thời gian</th>
                  <th className="px-5 py-4">Đối tượng</th>
                  <th className="px-5 py-4">Ưu tiên</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4">Staff</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((ticket, index) => {
                  const dominantReason = getDominantReason(ticket);

                  return (
                  <tr key={ticket.ticketId} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Ngày tạo
                        </p>
                        <p className="font-black text-slate-950">
                          {formatDateTime(ticket.createdAt)}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                          Cập nhật: {formatDateTime(ticket.updatedAt)}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-black text-slate-800">
                        {getTargetPreview(ticket, index)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {labelForTargetType(ticket.targetType)}
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
                        {labelForReason(dominantReason)}
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
                  );
                })}
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
        isAssigning={assignMutation.isPending}
        onAssign={handleAssign}
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onProcessed={() => setSelectedTicket(null)}
      />
    </div>
  );
}
