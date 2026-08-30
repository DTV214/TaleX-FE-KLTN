"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  ListOrdered,
  Loader2,
  RefreshCw,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import {
  useRevenueTransactionSummary,
  useRevenueTransactionsList,
  useRevenueTransactionTimeSeries,
} from "../hooks/use-revenue-transactions";
import type {
  RevenueTimeSeriesPoint,
  RevenueTransaction,
  RevenueTransactionType,
} from "../types/revenue-transactions.types";

const PAGE_SIZE = 20;
const DESCRIPTION_PREVIEW_LENGTH = 150;

type DatePreset = "7D" | "1M" | "3M" | "CUSTOM";

const transactionTypeLabels: Record<RevenueTransactionType, string> = {
  PREMIUM_SHARE: "Chia sẻ Premium",
  CONTENT_SHARE: "Bán nội dung",
  PENALTY_DEDUCTION: "Khấu trừ phạt",
  ADJUSTMENT: "Điều chỉnh",
  WITHDRAWAL: "Rút tiền",
};

const transactionTypeClasses: Record<RevenueTransactionType, string> = {
  PREMIUM_SHARE: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  CONTENT_SHARE: "border-creator-gold/25 bg-creator-gold/10 text-creator-gold",
  PENALTY_DEDUCTION: "border-red-400/25 bg-red-400/10 text-red-200",
  ADJUSTMENT: "border-sky-400/25 bg-sky-400/10 text-sky-200",
  WITHDRAWAL: "border-zinc-400/20 bg-white/[0.06] text-zinc-200",
};

const presetLabels: Record<DatePreset, string> = {
  "7D": "7 ngày",
  "1M": "1 tháng",
  "3M": "3 tháng",
  CUSTOM: "Tùy chỉnh",
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toInputDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toApiDateTime(dateText: string, mode: "start" | "end") {
  return `${dateText}T${mode === "start" ? "00:00:00" : "23:59:59"}`;
}

function buildPresetRange(preset: Exclude<DatePreset, "CUSTOM">) {
  const end = new Date();
  const start = new Date(end);

  if (preset === "7D") {
    start.setDate(start.getDate() - 6);
  } else if (preset === "1M") {
    start.setMonth(start.getMonth() - 1);
  } else {
    start.setMonth(start.getMonth() - 3);
  }

  return {
    startDate: toInputDate(start),
    endDate: toInputDate(end),
  };
}

function formatVND(value?: number | null) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "VND",
  }).format(value ?? 0);
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatPeriod(point: RevenueTimeSeriesPoint) {
  const date = new Date(point.timePeriod);
  if (Number.isNaN(date.getTime())) return point.timePeriod;

  if (point.groupUnit === "HOUR") {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      hour: "2-digit",
      month: "2-digit",
    }).format(date);
  }

  if (point.groupUnit === "MONTH") {
    return new Intl.DateTimeFormat("vi-VN", {
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }

  if (point.groupUnit === "YEAR") {
    return String(date.getFullYear());
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function shortId(value?: string | null) {
  if (!value) return "-";
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function compactText(value: string, maxLength = DESCRIPTION_PREVIEW_LENGTH) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function isDeduction(transaction: RevenueTransaction) {
  return (
    transaction.amount < 0 ||
    transaction.revenueTransactionType === "PENALTY_DEDUCTION" ||
    transaction.revenueTransactionType === "WITHDRAWAL"
  );
}

function RevenueMetricCard({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "default" | "gold" | "green" | "red" | "blue";
  value: string;
}) {
  const toneClass =
    tone === "gold"
      ? "text-creator-gold"
      : tone === "green"
        ? "text-emerald-300"
        : tone === "red"
          ? "text-red-300"
          : tone === "blue"
            ? "text-sky-300"
            : "text-white";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.2)]">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-creator-muted">
        {label}
      </p>
      <p className={`mt-3 text-2xl font-black tracking-tight ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function TransactionRow({ transaction }: { transaction: RevenueTransaction }) {
  const deduction = isDeduction(transaction);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const description = transaction.description?.trim() || "-";
  const canToggleDescription = description.length > DESCRIPTION_PREVIEW_LENGTH;
  const visibleDescription =
    showFullDescription || !canToggleDescription
      ? description
      : compactText(description);

  return (
    <tr className="transition hover:bg-white/[0.035]">
      <td className="px-5 py-4">
        <p className="font-black text-white">
          {formatDateTime(transaction.createdAt)}
        </p>
        <p className="mt-1 text-xs font-semibold text-creator-muted">
          {shortId(transaction.revenueTransactionId)}
        </p>
      </td>
      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${transactionTypeClasses[transaction.revenueTransactionType]
            }`}
        >
          {transactionTypeLabels[transaction.revenueTransactionType] ??
            transaction.revenueTransactionType}
        </span>
      </td>
      <td className="px-5 py-4">
        <div className="flex max-w-[360px] items-start gap-2">
          <p className="min-w-0 flex-1 text-sm font-semibold leading-6 text-zinc-200">
            {visibleDescription}
          </p>
          {canToggleDescription && (
            <button
              type="button"
              onClick={() => setShowFullDescription((current) => !current)}
              className="mt-0.5 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-creator-muted transition hover:border-creator-gold/40 hover:text-creator-gold"
              aria-label={showFullDescription ? "Thu gọn mô tả" : "Xem đầy đủ mô tả"}
              title={showFullDescription ? "Thu gọn mô tả" : "Xem đầy đủ mô tả"}
            >
              {showFullDescription ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        <p className="mt-1 text-xs font-semibold text-creator-muted">
          {transaction.referenceType || "-"} · {transaction.referenceId}
        </p>
      </td>
      <td className="px-5 py-4 text-right">
        <p className={`font-black ${deduction ? "text-red-300" : "text-emerald-300"}`}>
          {deduction ? "-" : "+"}
          {formatVND(Math.abs(transaction.amount))}
        </p>
      </td>
      <td className="px-5 py-4 text-right">
        <p className="mt-1 text-xs font-semibold text-creator-muted">

          {formatVND(transaction.balanceBefore)}
        </p>
        <p className="text-sm font-black text-white">
          {formatVND(transaction.balanceAfter)}
        </p>
      </td>
    </tr>
  );
}

export function CreatorRevenueTransactionsView() {
  const defaultRange = useMemo(() => buildPresetRange("1M"), []);
  const [preset, setPreset] = useState<DatePreset>("1M");
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [showTransactions, setShowTransactions] = useState(false);
  const [page, setPage] = useState(1);

  const dateRangeParams = useMemo(
    () => ({
      startDate: toApiDateTime(startDate, "start"),
      endDate: toApiDateTime(endDate, "end"),
    }),
    [endDate, startDate],
  );

  const transactionsParams = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
    }),
    [page],
  );

  const summaryQuery = useRevenueTransactionSummary(dateRangeParams);
  const timeSeriesQuery = useRevenueTransactionTimeSeries(dateRangeParams);
  const transactionsQuery = useRevenueTransactionsList(
    transactionsParams,
    showTransactions,
  );

  const summary = summaryQuery.data;
  const amountByType = summary?.amountByType ?? {};
  const chartData = useMemo(
    () =>
      (timeSeriesQuery.data ?? []).map((point) => ({
        ...point,
        label: formatPeriod(point),
      })),
    [timeSeriesQuery.data],
  );

  const isLoadingSummary = summaryQuery.isLoading || timeSeriesQuery.isLoading;
  const hasRevenueError = summaryQuery.isError || timeSeriesQuery.isError;
  const transactions = transactionsQuery.data?.content ?? [];

  const handlePreset = (nextPreset: Exclude<DatePreset, "CUSTOM">) => {
    const nextRange = buildPresetRange(nextPreset);
    setPreset(nextPreset);
    setStartDate(nextRange.startDate);
    setEndDate(nextRange.endDate);
  };

  const handleRefresh = () => {
    summaryQuery.refetch();
    timeSeriesQuery.refetch();
    if (showTransactions) {
      transactionsQuery.refetch();
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-5xl">
              Doanh Thu
            </h1>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={summaryQuery.isFetching || timeSeriesQuery.isFetching}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm font-black text-zinc-200 transition hover:border-creator-gold/40 hover:text-creator-gold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={
                summaryQuery.isFetching || timeSeriesQuery.isFetching
                  ? "h-4 w-4 animate-spin"
                  : "h-4 w-4"
              }
            />
            Tải lại
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/35 p-4">
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-white">
              <CalendarDays className="h-4 w-4 text-creator-gold" />
              Khoảng thời gian
            </div>
            <div className="flex flex-wrap gap-2">
              {(["7D", "1M", "3M"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handlePreset(option)}
                  className={`inline-flex h-10 cursor-pointer items-center justify-center rounded-xl px-4 text-sm font-black transition ${preset === option
                    ? "bg-creator-gold text-black shadow-[0_12px_36px_rgba(226,177,60,0.18)]"
                    : "border border-white/10 bg-white/[0.04] text-creator-muted hover:border-creator-gold/35 hover:text-white"
                    }`}
                >
                  {presetLabels[option]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="min-w-[220px] rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2 transition focus-within:border-creator-gold/50">
              <span className="block text-[11px] font-black uppercase tracking-[0.14em] text-creator-muted">
                Từ ngày
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => {
                  if (!event.target.value) return;
                  setPreset("CUSTOM");
                  setStartDate(event.target.value);
                  if (event.target.value > endDate) {
                    setEndDate(event.target.value);
                  }
                }}
                className="mt-1 h-9 w-full cursor-pointer bg-transparent text-sm font-black text-white outline-none [color-scheme:dark]"
              />
            </label>
            <label className="min-w-[220px] rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2 transition focus-within:border-creator-gold/50">
              <span className="block text-[11px] font-black uppercase tracking-[0.14em] text-creator-muted">
                Đến ngày
              </span>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(event) => {
                  if (!event.target.value) return;
                  setPreset("CUSTOM");
                  setEndDate(event.target.value < startDate ? startDate : event.target.value);
                }}
                className="mt-1 h-9 w-full cursor-pointer bg-transparent text-sm font-black text-white outline-none [color-scheme:dark]"
              />
            </label>
          </div>
        </div>
      </section>

      {hasRevenueError ? (
        <section className="rounded-2xl border border-red-400/20 bg-red-500/10 px-6 py-10 text-center">
          <p className="font-black text-red-200">Không thể tải dữ liệu doanh thu.</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="mt-4 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-300/25 px-4 text-sm font-black text-red-100 transition hover:bg-red-400/10"
          >
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </button>
        </section>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <RevenueMetricCard
              label="Tổng doanh thu"
              value={formatVND(summary?.totalRevenueAmount)}
              tone="green"
            />
            <RevenueMetricCard
              label="Premium"
              value={formatVND(amountByType.PREMIUM_SHARE)}
              tone="gold"
            />
            <RevenueMetricCard
              label="Bán nội dung"
              value={formatVND(amountByType.CONTENT_SHARE)}
              tone="green"
            />
            <RevenueMetricCard
              label="Khấu trừ phạt"
              value={formatVND(summary?.totalPenaltyAmount)}
              tone="red"
            />
            <RevenueMetricCard
              label="Điều chỉnh"
              value={formatVND(summary?.totalAdjustmentAmount)}
              tone="blue"
            />
          </div>

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-creator-gold" />
                  <h2 className="text-xl font-black text-white">Biểu đồ doanh thu</h2>
                </div>
              </div>
              {timeSeriesQuery.data?.[0]?.groupUnit && (
                <span className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 text-xs font-black uppercase tracking-wide text-creator-muted">
                  <Clock3 className="h-4 w-4 text-creator-gold" />
                  {timeSeriesQuery.data[0].groupUnit}
                </span>
              )}
            </div>

            <div className="mt-5 h-[340px]">
              {isLoadingSummary ? (
                <div className="flex h-full items-center justify-center text-creator-muted">
                  <Loader2 className="h-6 w-6 animate-spin text-creator-gold" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 text-center text-creator-muted">
                  <WalletCards className="h-8 w-8 text-zinc-600" />
                  <p className="mt-3 text-sm font-semibold">
                    Chưa có biến động doanh thu trong khoảng thời gian này.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="creatorRevenueTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="creatorRevenuePenalty" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.24} />
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      fontSize={11}
                      stroke="#71717a"
                      tickLine={false}
                    />
                    <YAxis
                      fontSize={11}
                      stroke="#71717a"
                      tickFormatter={(value: number) =>
                        new Intl.NumberFormat("vi-VN", {
                          maximumFractionDigits: 0,
                          notation: "compact",
                        }).format(value)
                      }
                      tickLine={false}
                      width={54}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "14px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                      formatter={(value: unknown, name: unknown) => [
                        formatVND(Number(value) || 0),
                        name === "totalRevenueAmount"
                          ? "Doanh thu"
                          : name === "totalPenaltyAmount"
                            ? "Phạt"
                            : "Điều chỉnh",
                      ]}
                    />
                    <Area
                      dataKey="totalRevenueAmount"
                      fill="url(#creatorRevenueTotal)"
                      fillOpacity={1}
                      name="Doanh thu"
                      stroke="#D4AF37"
                      strokeWidth={2.5}
                      type="monotone"
                    />
                    <Area
                      dataKey="totalPenaltyAmount"
                      fill="url(#creatorRevenuePenalty)"
                      fillOpacity={1}
                      name="Phạt"
                      stroke="#f87171"
                      strokeWidth={2}
                      type="monotone"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        </>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <ListOrdered className="h-5 w-5 text-creator-gold" />
              <h2 className="text-xl font-black text-white">Biến động lợi nhuận</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowTransactions((current) => !current)}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-creator-gold px-4 text-sm font-black text-black shadow-[0_16px_44px_rgba(226,177,60,0.18)] transition hover:bg-creator-gold-hover"
          >
            {showTransactions ? "Ẩn biến động" : "Xem biến động"}
            {showTransactions ? (
              <ArrowUpCircle className="h-4 w-4" />
            ) : (
              <ArrowDownCircle className="h-4 w-4" />
            )}
          </button>
        </div>

        {showTransactions && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/25">
            {transactionsQuery.isLoading ? (
              <div className="flex h-40 items-center justify-center text-creator-muted">
                <Loader2 className="h-6 w-6 animate-spin text-creator-gold" />
              </div>
            ) : transactionsQuery.isError ? (
              <div className="px-6 py-12 text-center">
                <p className="font-black text-red-200">Không thể tải danh sách biến động.</p>
                <button
                  type="button"
                  onClick={() => transactionsQuery.refetch()}
                  className="mt-4 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-300/25 px-4 text-sm font-black text-red-100 transition hover:bg-red-400/10"
                >
                  <RefreshCw className="h-4 w-4" />
                  Thử lại
                </button>
              </div>
            ) : transactions.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm font-semibold text-creator-muted">
                Chưa có giao dịch doanh thu nào.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1040px] text-left text-sm">
                    <thead className="border-b border-white/10 bg-white/[0.035] text-xs font-black uppercase tracking-wide text-creator-muted">
                      <tr>
                        <th className="px-5 py-4">Giao dịch</th>
                        <th className="px-5 py-4">Loại</th>
                        <th className="px-5 py-4">Mô tả</th>
                        <th className="px-5 py-4 text-right">Số tiền</th>
                        <th className="px-5 py-4 text-right">Số dư</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {transactions.map((transaction) => (
                        <TransactionRow
                          key={transaction.revenueTransactionId}
                          transaction={transaction}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {transactionsQuery.data && (
                  <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
                    <p className="text-sm font-semibold text-creator-muted">
                      Trang {transactionsQuery.data.pageNumber} /{" "}
                      {transactionsQuery.data.totalPages || 1} ·{" "}
                      {transactionsQuery.data.totalElements} giao dịch
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        disabled={transactionsQuery.data.isFirst || transactionsQuery.isFetching}
                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/10 text-creator-muted transition hover:border-creator-gold/40 hover:text-creator-gold disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Trang trước"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage((current) => current + 1)}
                        disabled={transactionsQuery.data.isLast || transactionsQuery.isFetching}
                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/10 text-creator-muted transition hover:border-creator-gold/40 hover:text-creator-gold disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Trang sau"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
