"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Flag,
  Loader2,
  RefreshCcw,
  UserCheck,
} from "lucide-react";
import {
  type ModerationTicket,
  type ReportTargetType,
  type TicketStatus,
} from "../api/moderation-reports.api";
import {
  useAssignTicket,
  useTickets,
} from "../hooks/use-moderation-reports";
import {
  formatDateTime,
  labelForReason,
  labelForTargetType,
  labelForTicketStatus,
  reportTargetOptions,
  statusTone,
  ticketStatusOptions,
} from "../utils/moderation-labels";

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

function shortId(value?: string | null) {
  if (!value) return "-";
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function MaskedId({
  label,
  value,
  className = "",
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  if (!value) return <span className={className}>-</span>;

  return (
    <span className={`inline-flex max-w-full items-center gap-2 ${className}`}>
      <span
        className={`min-w-0 font-bold text-slate-600 backoffice-dark:text-white/65 ${isVisible ? "break-all" : "truncate"
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
  const title = scope === "admin" ? "Báo Cáo Vi Phạm" : "Report Tickets";

  async function handleAssign(ticket: ModerationTicket) {
    await assignMutation.mutateAsync(ticket.ticketId);
    setSelectedTicket((current) =>
      current?.ticketId === ticket.ticketId
        ? { ...current, status: "IN_PROGRESS" }
        : current,
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
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
      <div className="mx-auto flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between flex w-full max-w-7xl flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 backoffice-dark:text-white">
          {title}
        </h1>

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
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.05] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
          >
            <RefreshCcw className="h-4 w-4" />
            Tải lại
          </button>
        </div>
      </div>

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
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/5 backoffice-dark:text-white/45">
                <tr>
                  <th className="px-5 py-4">Ngày tạo</th>
                  <th className="px-5 py-4">Đối tượng</th>
                  <th className="px-5 py-4">Ưu tiên</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4">Nhân viên</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 backoffice-dark:divide-white/10">
                {tickets.map((ticket, index) => {
                  const dominantReason = getDominantReason(ticket);

                  return (
                    <tr key={ticket.ticketId} className="transition hover:bg-slate-50 backoffice-dark:hover:bg-white/[0.05]">
                      <td className="px-5 py-4">
                        <div className="max-w-[250px] space-y-1.5">
                          <p className="font-black text-slate-950 backoffice-dark:text-white">
                            {formatDateTime(ticket.createdAt)}
                          </p>
                          <p className="text-xs font-semibold text-slate-500 backoffice-dark:text-white/55">
                            Cập nhật: {formatDateTime(ticket.updatedAt)}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-800 backoffice-dark:text-white">
                          {getTargetPreview(ticket, index)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500 backoffice-dark:text-white/55">
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
                        <p className="mt-1 text-xs font-semibold text-slate-500 backoffice-dark:text-white/55">
                          {labelForReason(dominantReason)}
                        </p>
                      </td>
                      <td className="px-5 py-4">{statusBadge(ticket.status)}</td>
                      <td className="px-5 py-4 text-xs font-bold text-slate-500">
                        {ticket.assignedStaffUsername ? (
                          <span className="text-slate-700 backoffice-dark:text-white/75">
                            {ticket.assignedStaffUsername}
                          </span>
                        ) : (
                          <MaskedId
                            label="Staff ID"
                            value={ticket.assignedStaffId}
                            className="max-w-[180px]"
                          />
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedTicket(ticket)}
                            className="inline-flex h-9 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:bg-slate-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.05] backoffice-dark:text-white/75 backoffice-dark:hover:bg-white/10"
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
                            className="inline-flex h-9 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg bg-slate-950 px-3 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:bg-white backoffice-dark:text-slate-950 backoffice-dark:hover:bg-white/85"
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
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 backoffice-dark:border-white/10">
              <p className="text-sm font-semibold text-slate-500 backoffice-dark:text-white/55">
                Trang {ticketsQuery.data.pageNumber} / {ticketsQuery.data.totalPages} ·{" "}
                {ticketsQuery.data.totalElements} ticket
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={ticketsQuery.data.isFirst || ticketsQuery.isFetching}
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:border-white/10 backoffice-dark:text-white/60 backoffice-dark:hover:bg-white/10"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={ticketsQuery.data.isLast || ticketsQuery.isFetching}
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:border-white/10 backoffice-dark:text-white/60 backoffice-dark:hover:bg-white/10"
                  aria-label="Trang sau"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
