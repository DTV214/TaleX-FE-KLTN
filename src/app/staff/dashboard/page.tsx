"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  Flag,
  Users,
  Clapperboard,
  ArrowRight,
  Loader2,
  Eye,
} from "lucide-react";
import { isFullProfile, useAuthStore } from "@/features/auth/store/auth.store";
import {
  adminVerificationKeys,
  getCreatorIdentities,
  type IdentityVerificationStatus,
} from "@/features/admin/api/admin-creator-verification-api";
import {
  useAssignTicket,
  useTickets,
} from "@/features/moderation-reports/hooks/use-moderation-reports";
import {
  labelForReason,
  labelForTargetType,
} from "@/features/moderation-reports/utils/moderation-labels";
import { useGetAllSeries } from "@/features/admin/hooks/use-admin-series";
import { useGetAdminCreators } from "@/features/admin/hooks/use-creator-admin";
import { TicketDetailModal } from "@/features/moderation-reports/components/ticket-detail-modal";
import type { ModerationTicket } from "@/features/moderation-reports/api/moderation-reports.api";

const identityStatusStyles: Record<IdentityVerificationStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
};

const identityStatusLabels: Record<IdentityVerificationStatus, string> = {
  PENDING: "Chờ xử lý",
  IN_PROGRESS: "Đang xử lý",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

const ticketStatusStyles: Record<string, string> = {
  OPEN: "border-red-200 bg-red-50 text-red-700",
  IN_PROGRESS: "border-amber-200 bg-amber-50 text-amber-700",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  DISMISSED: "border-slate-200 bg-slate-100 text-slate-600",
};

const ticketStatusLabels: Record<string, string> = {
  OPEN: "Mới mở",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã xử lý",
  DISMISSED: "Đã bác bỏ",
};

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

function getTicketTitle(ticket: ModerationTicket) {
  const dominantReason = getDominantReason(ticket);
  if (dominantReason) {
    const label = labelForReason(dominantReason);
    if (label && label !== "-") return label;
  }
  return `Báo cáo ${labelForTargetType(ticket.targetType)}`;
}

function formatRelativeTime(dateString?: string) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  } catch {
    return dateString;
  }
}

export default function StaffDashboardPage() {
  const { user } = useAuthStore();
  const [selectedTicket, setSelectedTicket] =
    useState<ModerationTicket | null>(null);

  const displayName = isFullProfile(user)
    ? user.fullName || user.username || user.email || "Staff"
    : user?.accountId || "Staff";

  // 1. Query danh sách hồ sơ kiểm duyệt creator
  const identitiesQuery = useQuery({
    queryKey: adminVerificationKeys.identities(),
    queryFn: () => getCreatorIdentities(),
  });
  const identities = identitiesQuery.data ?? [];
  const pendingIdentitiesCount = identities.filter(
    (item) => item.status === "PENDING",
  ).length;

  // 2. Query tickets báo cáo
  const ticketsQuery = useTickets({ page: 0, pageSize: 5 });
  const tickets = ticketsQuery.data?.content ?? [];
  const openTicketsCount =
    ticketsQuery.data?.totalElements ?? tickets.length;
  const assignMutation = useAssignTicket();

  async function handleAssign(ticket: ModerationTicket) {
    await assignMutation.mutateAsync(ticket.ticketId);
    setSelectedTicket((current) =>
      current?.ticketId === ticket.ticketId
        ? { ...current, status: "IN_PROGRESS" }
        : current,
    );
  }

  // 3. Query series
  const seriesQuery = useGetAllSeries();
  const seriesList = seriesQuery.data ?? [];

  // 4. Query creators
  const creatorsQuery = useGetAdminCreators();
  const creatorsList = creatorsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* Ticket Detail Modal trực tiếp trên Dashboard */}
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

      {/* 1. Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
          Staff Workspace
        </h1>
        <p className="text-sm text-gray-500 font-medium">
          Xin chào <span className="font-bold text-gray-800">{displayName}</span>. Dưới đây là tổng quan hệ thống và các tác vụ theo thời gian thực.
        </p>
      </div>

      {/* 2. Real-time KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Creator Verification */}
        <Link
          href="/staff/creator-verification"
          className="group rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#10B981]/30 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-full bg-[#ECFDF5] flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-5 w-5 text-[#10B981]" />
            </div>
            {identitiesQuery.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : pendingIdentitiesCount > 0 ? (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase tracking-wider">
                {pendingIdentitiesCount} chờ duyệt
              </span>
            ) : null}
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 mb-1">
              {identitiesQuery.isLoading ? "--" : identities.length}
            </h3>
            <p className="text-sm font-medium text-gray-500">
              Hồ sơ đăng ký Creator
            </p>
          </div>
        </Link>

        {/* Card 2: Reports & Tickets */}
        <Link
          href="/staff/reports"
          className="group rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-red-200 transition-all flex flex-col justify-between border-b-4 border-b-red-500"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Flag className="h-5 w-5 text-red-500" />
            </div>
            {ticketsQuery.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : (
              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md uppercase tracking-wider">
                Ưu tiên xử lý
              </span>
            )}
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 mb-1">
              {ticketsQuery.isLoading ? "--" : openTicketsCount}
            </h3>
            <p className="text-sm font-medium text-gray-500">
              Reports & Tickets
            </p>
          </div>
        </Link>

        {/* Card 3: Series Management */}
        <Link
          href="/staff/series"
          className="group rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#10B981]/30 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clapperboard className="h-5 w-5 text-blue-500" />
            </div>
            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 mb-1">
              {seriesQuery.isLoading ? "--" : seriesList.length}
            </h3>
            <p className="text-sm font-medium text-gray-500">
              Tác phẩm trên hệ thống
            </p>
          </div>
        </Link>

        {/* Card 4: Creator Management */}
        <Link
          href="/staff/creators"
          className="group rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#10B981]/30 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 mb-1">
              {creatorsQuery.isLoading ? "--" : creatorsList.length}
            </h3>
            <p className="text-sm font-medium text-gray-500">
              Tài khoản Creator
            </p>
          </div>
        </Link>
      </div>

      {/* 3. Live Action Queues & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cột trái: Live Tickets Queue */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Ticket Báo cáo vi phạm gần đây
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Bấm vào ticket để mở nhanh chi tiết và xử lý lỗi
              </p>
            </div>
            <Link
              href="/staff/reports"
              className="text-xs font-bold text-[#10B981] hover:underline flex items-center gap-1"
            >
              Xem tất cả
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-gray-50">
            {ticketsQuery.isLoading && (
              <div className="p-10 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                <p className="mt-2 text-xs font-medium text-gray-500">
                  Đang tải danh sách ticket...
                </p>
              </div>
            )}

            {!ticketsQuery.isLoading && tickets.length === 0 && (
              <div className="p-10 text-center text-sm font-medium text-gray-400">
                Không có ticket báo cáo nào cần xử lý.
              </div>
            )}

            {tickets.map((ticket) => {
              const statusClass =
                ticketStatusStyles[ticket.status] ??
                "border-gray-200 bg-gray-50 text-gray-700";
              const statusLabel =
                ticketStatusLabels[ticket.status] ?? ticket.status;
              const title = getTicketTitle(ticket);

              return (
                <div
                  key={ticket.ticketId}
                  onClick={() => setSelectedTicket(ticket)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedTicket(ticket);
                    }
                  }}
                  className="flex items-center gap-4 p-4 hover:bg-emerald-50/40 hover:border-l-4 hover:border-l-[#10B981] transition-all group cursor-pointer text-left"
                >
                  <div className="h-10 w-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Flag className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-[#10B981] transition-colors">
                        {title}
                      </h4>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      Đối tượng: <span className="font-semibold text-gray-700">{labelForTargetType(ticket.targetType)}</span> • ID: {ticket.targetId}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] font-bold text-gray-400">
                      {formatRelativeTime(ticket.createdAt)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#10B981] opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-3.5 h-3.5" />
                      Xem chi tiết
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cột phải: Live Creator Applications */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Hồ sơ Creator đăng ký gần đây
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Danh sách hồ sơ định danh đối tác chờ kiểm duyệt
              </p>
            </div>
            <Link
              href="/staff/creator-verification"
              className="text-xs font-bold text-[#10B981] hover:underline flex items-center gap-1"
            >
              Xem tất cả
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-gray-50">
            {identitiesQuery.isLoading && (
              <div className="p-10 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                <p className="mt-2 text-xs font-medium text-gray-500">
                  Đang tải hồ sơ creator...
                </p>
              </div>
            )}

            {!identitiesQuery.isLoading && identities.length === 0 && (
              <div className="p-10 text-center text-sm font-medium text-gray-400">
                Chưa có hồ sơ đăng ký creator nào.
              </div>
            )}

            {identities.slice(0, 5).map((item) => {
              const statusClass =
                identityStatusStyles[item.status] ??
                "border-gray-200 bg-gray-50 text-gray-700";
              const statusLabel =
                identityStatusLabels[item.status] ?? item.status;

              return (
                <Link
                  key={item.id}
                  href="/staff/creator-verification"
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className="h-10 w-10 rounded-full bg-[#ECFDF5] border border-emerald-100 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900 truncate">
                        {item.accountName}
                      </h4>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      Mã số thuế / CMND: {item.taxId}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#10B981] transition-colors group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
