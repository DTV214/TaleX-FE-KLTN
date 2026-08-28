"use client";

import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Loader2,
  Play,
  RefreshCw,
  ReceiptText,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getAccountByCreatorId } from "@/features/admin/api/account.api";
import { getEpisodeById } from "@/features/creator-dashboard/api/creator-content-api";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { cn } from "@/shared/utils/utils";
import {
  subscriptionRevenueSharingKeys,
  useAccountSubscriptionStats,
  useCalculateSubscriptionRevenueSharing,
  useMonthlyAccountSubscriptions,
  useProcessSubscriptionStats,
  useSubscriptionResults,
  useSubscriptionRevenueLogs,
  useSubscriptionSyncMetadata,
} from "../hooks/use-subscription-revenue-sharing";
import { subscriptionRevenueSharingApi } from "../api/subscription-revenue-sharing.api";
import type {
  MonthlyAccountSubscription,
  MonthYearParams,
  SubscriptionRevenueLog,
  SubscriptionResult,
  SubscriptionStatsData,
  SyncMetadata,
} from "../types/subscription-revenue-sharing.types";

const PAGE_SIZE = 100;

function previousMonthValue() {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonthValue(value: string): MonthYearParams {
  const [year, month] = value.split("-").map(Number);
  return {
    year: Number.isFinite(year) ? year : new Date().getFullYear(),
    month: Number.isFinite(month) ? month : new Date().getMonth() + 1,
  };
}

function formatVND(value?: number | null) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value ?? 0);
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0);
}

function formatPercent(value?: number | null) {
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2,
  }).format((value ?? 0) * 100)}%`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function syncTime(metadata?: SyncMetadata | null) {
  return (
    metadata?.lastSyncAt ||
    metadata?.lastSyncedAt ||
    metadata?.lastSyncTime ||
    metadata?.updatedAt ||
    metadata?.createdAt ||
    null
  );
}

function getNumberValue(
  record: Record<string, unknown>,
  keys: string[],
  fallback = 0,
) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function getStringValue(
  record: Record<string, unknown>,
  keys: string[],
  fallback = "-",
) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return fallback;
}

function asRecord(value: Record<string, unknown>) {
  return value;
}

function statRows(data?: SubscriptionStatsData) {
  if (!data) return [];
  return Array.isArray(data) ? data : data.content;
}

function resultKey(result: SubscriptionResult, index: number) {
  return result.id ?? `temporary-${result.monthYear}-${index}`;
}

function calculationResults(
  data: SubscriptionResult[] | SubscriptionResult | string | null,
) {
  if (Array.isArray(data)) return data;
  return data && typeof data === "object" ? [data] : [];
}

function MetricCard({
  icon: Icon,
  label,
  tone = "default",
  value,
}: {
  icon: typeof BarChart3;
  label: string;
  tone?: "default" | "good" | "warn";
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            tone === "good"
              ? "border-emerald-200 bg-emerald-50 text-emerald-600 backoffice-dark:border-emerald-400/25 backoffice-dark:bg-emerald-400/10 backoffice-dark:text-emerald-300"
              : tone === "warn"
                ? "border-amber-200 bg-amber-50 text-amber-600 backoffice-dark:border-amber-400/25 backoffice-dark:bg-amber-400/10 backoffice-dark:text-amber-300"
                : "border-violet-200 bg-violet-50 text-violet-600 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-[var(--backoffice-primary)]",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-black uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>
          <p
            title={value}
            className="mt-1 max-w-full truncate text-2xl font-black leading-tight text-slate-950 backoffice-dark:text-white"
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function ResultTable({
  activeResultId,
  onSelect,
  onViewDetails,
  results,
}: {
  activeResultId: string | null;
  onSelect: (id: string) => void;
  onViewDetails: (id: string) => void;
  results: SubscriptionResult[];
}) {
  if (results.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm font-semibold text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.035] backoffice-dark:text-white/45">
        Chưa có kết quả chia sẻ doanh thu cho tháng đã chọn.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/45">
            <tr>
              <th className="px-5 py-4">Kỳ</th>
              <th className="px-5 py-4 text-right">Tổng Doanh Thu (Đã Trừ VAT)</th>
              <th className="px-5 py-4 text-right">Số Tiền Mỗi Gói</th>
              <th className="px-5 py-4 text-right">Phí Nền Tảng Cơ Bản (%)</th>
              <th className="px-5 py-4 text-right">Số Tiền Chia</th>
              <th className="px-5 py-4 text-right">Số Tiền Ứng Mỗi Lượt Xem Cơ Bản</th>
              <th className="px-5 py-4 text-right">Chi Tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 backoffice-dark:divide-white/10">
            {results.map((result, index) => {
              const isActive = resultKey(result, index) === activeResultId;

              return (
                <tr
                  key={resultKey(result, index)}
                  onClick={() => onSelect(resultKey(result, index))}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(resultKey(result, index));
                    }
                  }}
                  className={cn(
                    "cursor-pointer transition hover:bg-slate-50 backoffice-dark:hover:bg-white/[0.035]",
                    isActive &&
                    "bg-violet-50/70 backoffice-dark:bg-[var(--backoffice-primary)]/10",
                  )}
                >
                  <td className="px-5 py-4">
                    <p className="font-black text-slate-950 backoffice-dark:text-white">
                      {result.monthYear}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-right font-black">
                    {formatVND(result.totalBudget)}
                  </td>
                  <td className="px-5 py-4 text-right font-black">
                    {formatVND(result.subscriptionFee)}
                  </td>
                  <td className="px-5 py-4 text-right font-bold">
                    {formatPercent(result.alpha)}
                  </td>
                  <td className="px-5 py-4 text-right font-black text-violet-600 backoffice-dark:text-violet-300">
                    {formatVND(result.targetBudget)}
                  </td>
                  <td className="px-5 py-4 text-right font-bold">
                    {formatVND(result.gamma * result.subscriptionFee)} - {formatPercent((result.gamma))}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onViewDetails(resultKey(result, index));
                      }}
                      className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
                    >
                      <ReceiptText className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AccountSubscriptionsTable({
  isFetching,
  items,
  onOpenStats,
}: {
  isFetching: boolean;
  items: MonthlyAccountSubscription[];
  onOpenStats: (item: MonthlyAccountSubscription) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/45">
            <tr>
              <th className="px-5 py-4">Người Mua</th>
              <th className="px-5 py-4">Mã Order</th>
              <th className="px-5 py-4 text-right">Tổng Tiền</th>
              <th className="px-5 py-4 text-right">VAT</th>
              <th className="px-5 py-4 text-right">Thực Nhận</th>
              <th className="px-5 py-4">Thời hạn</th>
              <th className="px-5 py-4 text-right">Chi Tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 backoffice-dark:divide-white/10">
            {isFetching && items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-sm font-semibold text-slate-400">
                  <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                  Đang tải subscription trong tháng...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-sm font-semibold text-slate-400">
                  Không có subscription kết thúc trong tháng này.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.accountSubscriptionId}
                  className="transition hover:bg-slate-50 backoffice-dark:hover:bg-white/[0.035]"
                >
                  <td className="px-5 py-4">
                    <p className="font-black text-slate-950 backoffice-dark:text-white">
                      {item.username || "Người dùng"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {item.email || item.accountId}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="break-all font-mono text-xs font-bold text-slate-700 backoffice-dark:text-white/75">
                      {item.orderId}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-right font-black text-slate-950 backoffice-dark:text-white">
                    {formatVND(item.totalAmount)}
                  </td>
                  <td className="px-5 py-4 text-right font-black text-amber-600">
                    {formatVND(item.vatAmount)}
                  </td>
                  <td className="px-5 py-4 text-right font-black">
                    {formatVND(item.amount)}
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-slate-500 backoffice-dark:text-white/50">
                    Từ: {formatDateTime(item.startTime)}
                    <br />
                    Đến: {formatDateTime(item.endTime)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onOpenStats(item)}
                      className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RevenueLogsTable({
  isFetching,
  logs,
}: {
  isFetching: boolean;
  logs: SubscriptionRevenueLog[];
}) {
  const creatorIds = [
    ...new Set(
      logs
        .map((log) => getStringValue(asRecord(log), ["creatorId"], ""))
        .filter(Boolean),
    ),
  ];
  const episodeIds = [
    ...new Set(
      logs
        .map((log) => getStringValue(asRecord(log), ["episodeId"], ""))
        .filter(Boolean),
    ),
  ];
  const creatorQueries = useQueries({
    queries: creatorIds.map((creatorId) => ({
      queryKey: ["admin", "subscription-revenue-sharing", "creator", creatorId],
      queryFn: () => getAccountByCreatorId(creatorId),
      staleTime: 5 * 60 * 1000,
    })),
  });
  const episodeQueries = useQueries({
    queries: episodeIds.map((episodeId) => ({
      queryKey: ["admin", "subscription-revenue-sharing", "episode", episodeId],
      queryFn: () => getEpisodeById(episodeId),
      staleTime: 5 * 60 * 1000,
    })),
  });
  const creatorNames = Object.fromEntries(
    creatorIds.flatMap((creatorId, index) => {
      const fullName = creatorQueries[index]?.data?.fullName;
      return fullName ? [[creatorId, fullName]] : [];
    }),
  );
  const episodeDetails = Object.fromEntries(
    episodeIds.flatMap((episodeId, index) => {
      const episode = episodeQueries[index]?.data;
      return episode
        ? [[episodeId, { episodeNumber: episode.episodeNumber, seriesTitle: episode.seriesTitle }]]
        : [];
    }),
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/45">
            <tr>
              <th className="px-5 py-4">Nhà Sáng Tạo</th>
              <th className="px-5 py-4">Tập Được Nhận</th>
              <th className="px-5 py-4 text-right">Doanh thu chia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 backoffice-dark:divide-white/10">
            {isFetching && logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm font-semibold text-slate-400">
                  <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                  Đang tải chi tiết kết quả tính toán...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm font-semibold text-slate-400">
                  Chưa có kết quả tính toán cho phần doanh thu này.
                </td>
              </tr>
            ) : (
              logs.map((log, index) => {
                const record = asRecord(log);
                const id = getStringValue(record, [
                  "subscriptionRevenueLogId",
                  "id",
                ], `${index}`);
                const creatorId = getStringValue(record, ["creatorId"], "");
                const episodeId = getStringValue(record, ["episodeId"], "");
                const episode = episodeDetails[episodeId];

                return (
                  <tr key={id} className="transition hover:bg-slate-50 backoffice-dark:hover:bg-white/[0.035]">
                    <td className="px-5 py-4">
                      <p className="font-black text-slate-950 backoffice-dark:text-white">
                        {creatorNames[creatorId] || getStringValue(record, [
                          "creatorName",
                          "username",
                          "creatorEmail",
                          "email",
                          "creatorId",
                        ])}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-600 backoffice-dark:text-white/60">
                      {episode ? (
                        <>
                          <p>{episode.seriesTitle || "Series chưa có tên"}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            Tập {episode.episodeNumber ?? "-"}
                          </p>
                        </>
                      ) : (
                        getStringValue(record, [
                          "episodeTitle",
                          "mediaTitle",
                          "contentTitle",
                          "seriesTitle",
                          "episodeId",
                        ])
                      )}
                    </td>
                    <td className="px-5 py-4 text-right font-black text-emerald-600">
                      {formatVND(getNumberValue(record, [
                        "revenue",
                        "revenueAmount",
                        "amount",
                      ]))}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RevenueLogsModal({
  isError,
  isFetching,
  logs,
  onClose,
  onNextPage,
  onPrevPage,
  pageInfo,
  result,
}: {
  isError: boolean;
  isFetching: boolean;
  logs: SubscriptionRevenueLog[];
  onClose: () => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  pageInfo?: {
    isFirst: boolean;
    isLast: boolean;
    pageNumber: number;
    totalElements: number;
    totalPages: number;
  };
  result: SubscriptionResult | null;
}) {
  if (!result) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl backoffice-dark:border-white/10 backoffice-dark:bg-[#111113]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 backoffice-dark:border-white/10">
          <div className="min-w-0">
            <h2 className="text-xl font-black text-slate-950 backoffice-dark:text-white">
              Chi Tiết Kết Quả Tính Toán
            </h2>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-violet-600 backoffice-dark:text-[var(--backoffice-primary)]">
              {result.monthYear} · {formatVND(result.calculatedBudget)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {isError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-10 text-center text-sm font-bold text-red-700 backoffice-dark:border-red-400/20 backoffice-dark:bg-red-400/10 backoffice-dark:text-red-200">
              Không thể tải revenue logs cho SubscriptionResult này.
            </div>
          ) : (
            <RevenueLogsTable isFetching={isFetching} logs={logs} />
          )}
        </div>

        {pageInfo && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between backoffice-dark:border-white/10">
            <p className="text-sm font-semibold text-slate-500 backoffice-dark:text-white/45">
              Trang {pageInfo.pageNumber} / {pageInfo.totalPages || 1} ·{" "}
              {pageInfo.totalElements}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onPrevPage}
                disabled={pageInfo.isFirst || isFetching}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 backoffice-dark:border-white/10 backoffice-dark:hover:bg-white/10"
                aria-label="Trang log trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onNextPage}
                disabled={pageInfo.isLast || isFetching}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 backoffice-dark:border-white/10 backoffice-dark:hover:bg-white/10"
                aria-label="Trang log sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatsModal({
  accountSubscription,
  onClose,
}: {
  accountSubscription: MonthlyAccountSubscription;
  onClose: () => void;
}) {
  const statsQuery = useAccountSubscriptionStats(
    accountSubscription.accountSubscriptionId,
    1,
    PAGE_SIZE,
  );
  const rows = statRows(statsQuery.data);
  const detailTotalViews = rows.reduce((sum, row) => {
    const record = asRecord(row);
    return sum + getNumberValue(record, [
      "totalViews",
      "total_views",
      "views",
      "watchCount",
      "watch_count",
    ]);
  }, 0);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl backoffice-dark:border-white/10 backoffice-dark:bg-[#111113]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/70 p-6 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.02]">
          <div className="min-w-0">
            <h2 className="text-xl font-black text-slate-950 backoffice-dark:text-white">
              Chi Tiết Lượt Xem Trong Giai Đoạn Premium
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              icon={Users}
              label="Người Mua"
              value={accountSubscription.username || accountSubscription.email}
            />
            <MetricCard
              icon={Activity}
              label="Tổng Lượt Xem"
              tone="warn"
              value={formatNumber(detailTotalViews || accountSubscription.totalViews)}
            />
            <MetricCard
              icon={ReceiptText}
              label="Thành Tiền"
              tone="good"
              value={formatVND(accountSubscription.amount)}
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.03]">
            {statsQuery.isFetching && (
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 backoffice-dark:border-amber-400/20 backoffice-dark:bg-amber-400/10 backoffice-dark:text-amber-200">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang tải
              </span>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/45">
                  <tr>
                    <th className="px-4 py-3">Nhà Sáng Tạo</th>
                    <th className="px-4 py-3">Series</th>
                    <th className="px-4 py-3">Tập Được Xem</th>
                    <th className="px-4 py-3 text-right">Số Lượt Xem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 backoffice-dark:divide-white/10">
                  {statsQuery.isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-sm font-semibold text-slate-400">
                        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                        Đang tải chi tiết...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-sm font-semibold text-slate-400">
                        Chưa có lượt xem chi tiết.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, index) => {
                      const record = asRecord(row);
                      const id = getStringValue(record, [
                        "subscriptionStatId",
                        "subscription_stat_id",
                        "id",
                        "episodeId",
                        "episode_id",
                        "mediaId",
                        "media_id",
                      ], `${index}`);

                      return (
                        <tr key={id} className="transition hover:bg-slate-50 backoffice-dark:hover:bg-white/[0.035]">
                          <td className="break-all px-4 py-3 font-bold text-slate-800 backoffice-dark:text-white/80">
                            {getStringValue(record, [
                              "creatorEmail",
                              "creator_email",
                              "email",
                              "creatorUsername",
                              "creator_username",
                              "creatorName",
                              "creator_name",
                              "creatorId",
                              "creator_id",
                            ])}
                          </td>
                          <td className="px-4 py-3">
                            <p className="break-words font-black text-slate-950 backoffice-dark:text-white">
                              {getStringValue(record, [
                                "seriesTitle",
                                "series_title",
                                "seriesName",
                                "series_name",
                                "mediaTitle",
                                "media_title",
                              ])}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-500 backoffice-dark:text-white/45">
                            <p className="mt-1 break-all text-xs font-semibold text-slate-500 backoffice-dark:text-white/45">
                              Tập {getStringValue(record, [
                                "episodeTitle",
                                "episode_title",
                                "episodeName",
                                "episode_name",
                                "episodeNumber",
                                "episode_number",
                                "episodeId",
                                "episode_id",
                              ])}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="inline-flex min-w-10 justify-center rounded-full bg-violet-50 px-3 py-1 text-sm font-black text-violet-700 backoffice-dark:bg-violet-400/10 backoffice-dark:text-violet-200">
                              {formatNumber(getNumberValue(record, [
                                "totalViews",
                                "total_views",
                                "views",
                                "watchCount",
                                "watch_count",
                              ]))}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SubscriptionRevenueSharingDashboard() {
  const queryClient = useQueryClient();
  const [monthValue, setMonthValue] = useState(previousMonthValue);
  const [subscriptionPage, setSubscriptionPage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [isRevenueLogsModalOpen, setIsRevenueLogsModalOpen] = useState(false);
  const [selectedAccountSubscription, setSelectedAccountSubscription] =
    useState<MonthlyAccountSubscription | null>(null);
  const [temporaryResultsByMonth, setTemporaryResultsByMonth] = useState<
    Record<string, SubscriptionResult[]>
  >({});

  const monthParams = useMemo(() => parseMonthValue(monthValue), [monthValue]);
  const syncMetadataQuery = useSubscriptionSyncMetadata();
  const resultsQuery = useSubscriptionResults(monthParams);
  const subscriptionsQuery = useMonthlyAccountSubscriptions({
    ...monthParams,
    page: subscriptionPage,
    pageSize: PAGE_SIZE,
  });
  const processStatsMutation = useProcessSubscriptionStats();
  const {
    isPending: isCalculatePending,
    mutateAsync: calculateRevenueSharing,
  } = useCalculateSubscriptionRevenueSharing();

  const serverResults = (resultsQuery.data ?? []).filter(
    (result) => result.monthYear === monthValue,
  );
  const temporaryResults = temporaryResultsByMonth[monthValue] ?? [];
  const isTemporaryResults =
    serverResults.length === 0 && temporaryResults.length > 0;
  const results = isTemporaryResults ? temporaryResults : serverResults;
  const activeResultId =
    selectedResultId &&
      results.some((result, index) => resultKey(result, index) === selectedResultId)
      ? selectedResultId
      : results.length > 0
        ? resultKey(results[0], 0)
        : null;
  const activeResultIndex = results.findIndex(
    (result, index) => resultKey(result, index) === activeResultId,
  );
  const logsQuery = useSubscriptionRevenueLogs(
    isTemporaryResults ? null : activeResultId,
    logPage,
    PAGE_SIZE,
  );
  const activeResult =
    (activeResultIndex >= 0 ? results[activeResultIndex] : null) ?? null;
  const subscriptions = subscriptionsQuery.data?.content ?? [];
  const logs = logsQuery.data?.content ?? [];
  const totalCalculatedBudget = results.reduce(
    (sum, item) => sum + item.calculatedBudget,
    0,
  );
  const selectedResult = selectedResultId
    ? (activeResultIndex >= 0 ? results[activeResultIndex] : null)
    : null;
  const filteredSubscriptions = selectedResult
    ? subscriptions.filter(
      (item) => item.amount === selectedResult.subscriptionFee,
    )
    : subscriptions;
  const hasStatSubscriptions = filteredSubscriptions.filter(
    (item) => item.isHasStat !== false,
  );
  const missingStatSubscriptions = filteredSubscriptions.filter(
    (item) => item.isHasStat === false,
  );
  const autoCalculatedMonthRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      !resultsQuery.isSuccess ||
      resultsQuery.isFetching ||
      serverResults.length > 0 ||
      isCalculatePending ||
      autoCalculatedMonthRef.current === monthValue
    ) {
      return;
    }

    autoCalculatedMonthRef.current = monthValue;
    void calculateRevenueSharing(monthParams)
      .then((data) => {
        const calculatedResults = calculationResults(data);
        if (calculatedResults.length > 0) {
          setTemporaryResultsByMonth((current) => ({
            ...current,
            [monthValue]: calculatedResults,
          }));
        }
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error));
      });
  }, [
    calculateRevenueSharing,
    isCalculatePending,
    monthParams,
    monthValue,
    serverResults.length,
    resultsQuery.isFetching,
    resultsQuery.isSuccess,
  ]);

  function updateMonth(value: string) {
    setMonthValue(value);
    setSubscriptionPage(1);
    setLogPage(1);
    setSelectedResultId(null);
    setIsRevenueLogsModalOpen(false);
  }

  async function refreshAll() {
    await Promise.all([
      syncMetadataQuery.refetch(),
      resultsQuery.refetch(),
      subscriptionsQuery.refetch(),
      logsQuery.refetch(),
    ]);
  }

  async function handleProcessStats() {
    try {
      await processStatsMutation.mutateAsync(monthParams);
      toast.success("Đã chạy gom watch session cho tháng đã chọn.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleCalculate() {
    try {
      const data = await calculateRevenueSharing(monthParams);
      const calculatedResults = calculationResults(data);
      setTemporaryResultsByMonth((current) => ({
        ...current,
        [monthValue]: calculatedResults,
      }));
      toast.success("Đã tính Rule X ở chế độ demo.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  function handleOpenStats(item: MonthlyAccountSubscription) {
    setSelectedAccountSubscription(item);
    void queryClient
      .fetchQuery({
        queryKey: subscriptionRevenueSharingKeys.accountSubscriptionStats(
          item.accountSubscriptionId,
          1,
          PAGE_SIZE,
        ),
        queryFn: () =>
          subscriptionRevenueSharingApi.getAccountSubscriptionStats(
            item.accountSubscriptionId,
            1,
            PAGE_SIZE,
          ),
        staleTime: 0,
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error));
      });
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-7">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 backoffice-dark:text-white">
            Chi Tiết Doanh Thu Premium
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={refreshAll}
            disabled={
              syncMetadataQuery.isFetching ||
              resultsQuery.isFetching ||
              subscriptionsQuery.isFetching ||
              logsQuery.isFetching
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                (syncMetadataQuery.isFetching ||
                  resultsQuery.isFetching ||
                  subscriptionsQuery.isFetching ||
                  logsQuery.isFetching) &&
                "animate-spin",
              )}
            />
            Làm mới
          </button>
          <button
            type="button"
            onClick={handleProcessStats}
            disabled={processStatsMutation.isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 text-sm font-black text-violet-700 transition hover:bg-violet-100 disabled:opacity-60 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-violet-200 backoffice-dark:hover:bg-white/10"
          >
            {processStatsMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
            Gom Dữ Liệu Người Dùng
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <div className="grid gap-4 md:grid-cols-[260px_1fr] md:items-end">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500 backoffice-dark:text-white/45">
              Tháng chia doanh thu
            </span>
            <input
              type="month"
              value={monthValue}
              onChange={(event) => updateMonth(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-amber-500 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
            />
          </label>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Clock3}
          label="Lần gom gần nhất"
          value={formatDateTime(syncTime(syncMetadataQuery.data))}
        />
        <MetricCard
          icon={ReceiptText}
          label="Kết Quả Chia Sẻ"
          value={formatNumber(results.length)}
        />
        <MetricCard
          icon={Users}
          label="Số Gói Trong Doanh Thu"
          value={formatNumber(subscriptions.length)}
        />
        <MetricCard
          icon={BarChart3}
          label="Tổng Tiền Chia"
          tone="good"
          value={formatVND(totalCalculatedBudget)}
        />
      </div>

      {(resultsQuery.isError ||
        subscriptionsQuery.isError ||
        syncMetadataQuery.isError) && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700 backoffice-dark:border-red-400/20 backoffice-dark:bg-red-400/10 backoffice-dark:text-red-200">
            Không thể tải một phần dữ liệu chia tiền. Hãy kiểm tra API tháng đã
            chọn hoặc quyền admin.
          </div>
        )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-slate-950 backoffice-dark:text-white">
            Kết Quả Chia Doanh Thu Theo Tháng
          </h2>
        </div>
        {isTemporaryResults && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 backoffice-dark:border-amber-400/20 backoffice-dark:bg-amber-400/10 backoffice-dark:text-amber-200">
            Đây là kết quả tính toán tạm thời từ dữ liệu người dùng đã thu thập,
            chưa được ghi nhận vào cơ sở dữ liệu.
          </div>
        )}
        {resultsQuery.isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm font-semibold text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
            Đang tải SubscriptionResult...
          </div>
        ) : (
          <ResultTable
            activeResultId={activeResultId}
            results={results}
            onSelect={(id) => {
              setSelectedResultId(id);
              setIsRevenueLogsModalOpen(false);
            }}
            onViewDetails={(id) => {
              setSelectedResultId(id);
              setLogPage(1);
              setIsRevenueLogsModalOpen(true);
            }}
          />
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-black text-slate-950 backoffice-dark:text-white">
            Các Gói Nằm Trong Doanh Thu
          </h2>
        </div>
        <AccountSubscriptionsTable
          isFetching={subscriptionsQuery.isFetching}
          items={hasStatSubscriptions}
          onOpenStats={handleOpenStats}
        />
        <div className="pt-4">
          <h2 className="text-xl font-black text-slate-950 backoffice-dark:text-white">
            Các Gói Chưa Có Lượt Xem
          </h2>
        </div>
        <AccountSubscriptionsTable
          isFetching={subscriptionsQuery.isFetching}
          items={missingStatSubscriptions}
          onOpenStats={handleOpenStats}
        />
        <div className="flex items-center justify-between gap-3">
          {subscriptionsQuery.data && (
            <p className="text-sm font-semibold text-slate-500 backoffice-dark:text-white/45">
              Trang {subscriptionsQuery.data.pageNumber} /{" "}
              {subscriptionsQuery.data.totalPages || 1} ·{" "}
              {subscriptionsQuery.data.totalElements}
            </p>
          )}
          {subscriptionsQuery.data && (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setSubscriptionPage((current) => Math.max(1, current - 1))
                }
                disabled={subscriptionsQuery.data.isFirst || subscriptionsQuery.isFetching}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 backoffice-dark:border-white/10 backoffice-dark:hover:bg-white/10"
                aria-label="Trang trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setSubscriptionPage((current) => current + 1)}
                disabled={subscriptionsQuery.data.isLast || subscriptionsQuery.isFetching}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 backoffice-dark:border-white/10 backoffice-dark:hover:bg-white/10"
                aria-label="Trang sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {selectedAccountSubscription && (
        <StatsModal
          key={selectedAccountSubscription.accountSubscriptionId}
          accountSubscription={selectedAccountSubscription}
          onClose={() => setSelectedAccountSubscription(null)}
        />
      )}

      {isRevenueLogsModalOpen && (
        <RevenueLogsModal
          isError={logsQuery.isError}
          isFetching={logsQuery.isFetching}
          logs={isTemporaryResults ? activeResult?.revenueLogs ?? [] : logs}
          pageInfo={logsQuery.data}
          result={activeResult}
          onClose={() => setIsRevenueLogsModalOpen(false)}
          onNextPage={() => setLogPage((current) => current + 1)}
          onPrevPage={() => setLogPage((current) => Math.max(1, current - 1))}
        />
      )}
    </div>
  );
}
