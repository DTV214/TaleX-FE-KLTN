"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart2,
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

function buildContinuousTimeSeries(
  rawPoints: RevenueTimeSeriesPoint[],
  startDateStr: string,
  endDateStr: string,
) {
  if (!startDateStr || !endDateStr) return rawPoints;

  const start = new Date(`${startDateStr}T00:00:00`);
  const end = new Date(`${endDateStr}T23:59:59`);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start > end
  ) {
    return rawPoints;
  }

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // ----------------------------------------------------
  // TRƯỜNG HỢP 1: 7 NGÀY (<= 7 ngày) -> HIỂN THỊ THEO GIỜ
  // ----------------------------------------------------
  if (diffDays <= 7) {
    const hoursMap = new Map<
      string,
      {
        totalRevenue: number;
        totalPenalty: number;
        totalAdjustment: number;
        hourLabel: string;
        fullDateLabel: string;
      }
    >();

    // Đưa mốc bắt đầu của khoảng 7 ngày vào
    const startKey = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())} 00:00`;
    hoursMap.set(startKey, {
      totalRevenue: 0,
      totalPenalty: 0,
      totalAdjustment: 0,
      hourLabel: `00:00 ${pad(start.getDate())}/${pad(start.getMonth() + 1)}`,
      fullDateLabel: `00:00 ngày ${pad(start.getDate())}/${pad(start.getMonth() + 1)}/${start.getFullYear()}`,
    });

    // Map các điểm giờ từ backend
    rawPoints.forEach((pt) => {
      let key = pt.timePeriod;
      if (key.length >= 13) {
        key = key.slice(0, 13) + ":00";
      }
      const existing = hoursMap.get(key);
      const rev = pt.totalRevenueAmount || 0;
      const pen = pt.totalPenaltyAmount || 0;
      const adj = pt.totalAdjustmentAmount || 0;

      if (existing) {
        existing.totalRevenue += rev;
        existing.totalPenalty += pen;
        existing.totalAdjustment += adj;
      } else {
        const parsedDate = new Date(pt.timePeriod.replace(" ", "T"));
        const d = !Number.isNaN(parsedDate.getTime())
          ? pad(parsedDate.getDate())
          : key.slice(8, 10);
        const m = !Number.isNaN(parsedDate.getTime())
          ? pad(parsedDate.getMonth() + 1)
          : key.slice(5, 7);
        const y = !Number.isNaN(parsedDate.getTime())
          ? parsedDate.getFullYear()
          : key.slice(0, 4);
        const h = !Number.isNaN(parsedDate.getTime())
          ? `${pad(parsedDate.getHours())}:00`
          : key.slice(11, 16);

        hoursMap.set(key, {
          totalRevenue: rev,
          totalPenalty: pen,
          totalAdjustment: adj,
          hourLabel: `${h} ${d}/${m}`,
          fullDateLabel: `${h} ngày ${d}/${m}/${y}`,
        });
      }
    });

    // Đưa mốc kết thúc của khoảng 7 ngày vào nếu chưa có
    const endKey = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())} 23:00`;
    if (!hoursMap.has(endKey)) {
      hoursMap.set(endKey, {
        totalRevenue: 0,
        totalPenalty: 0,
        totalAdjustment: 0,
        hourLabel: `23:00 ${pad(end.getDate())}/${pad(end.getMonth() + 1)}`,
        fullDateLabel: `23:00 ngày ${pad(end.getDate())}/${pad(end.getMonth() + 1)}/${end.getFullYear()}`,
      });
    }

    const sortedEntries = Array.from(hoursMap.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    return sortedEntries.map(([key, val]) => ({
      timePeriod: key,
      totalRevenueAmount: val.totalRevenue,
      totalPenaltyAmount: val.totalPenalty,
      totalAdjustmentAmount: val.totalAdjustment,
      groupUnit: "HOUR",
      label: val.hourLabel,
      fullDateLabel: val.fullDateLabel,
    }));
  }

  // ----------------------------------------------------
  // TRƯỜNG HỢP 2: 1 THÁNG (<= 35 ngày) -> HIỂN THỊ THEO NGÀY (~30 NGÀY)
  // ----------------------------------------------------
  if (diffDays <= 35) {
    const daysMap = new Map<
      string,
      { totalRevenue: number; totalPenalty: number; totalAdjustment: number }
    >();

    const current = new Date(start);
    while (current <= end) {
      const dateKey = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`;
      if (!daysMap.has(dateKey)) {
        daysMap.set(dateKey, {
          totalRevenue: 0,
          totalPenalty: 0,
          totalAdjustment: 0,
        });
      }
      current.setDate(current.getDate() + 1);
    }

    rawPoints.forEach((pt) => {
      if (pt.timePeriod.length >= 10) {
        const dateStr = pt.timePeriod.slice(0, 10);
        const existing = daysMap.get(dateStr);
        if (existing) {
          existing.totalRevenue += pt.totalRevenueAmount || 0;
          existing.totalPenalty += pt.totalPenaltyAmount || 0;
          existing.totalAdjustment += pt.totalAdjustmentAmount || 0;
        }
      } else if (pt.timePeriod.length === 7) {
        const matchingDays = Array.from(daysMap.keys()).filter((k) =>
          k.startsWith(pt.timePeriod),
        );
        if (matchingDays.length > 0) {
          const targetDay = matchingDays[matchingDays.length - 1];
          const existing = daysMap.get(targetDay);
          if (existing) {
            existing.totalRevenue += pt.totalRevenueAmount || 0;
            existing.totalPenalty += pt.totalPenaltyAmount || 0;
            existing.totalAdjustment += pt.totalAdjustmentAmount || 0;
          }
        }
      }
    });

    return Array.from(daysMap.entries()).map(([dateKey, values]) => {
      const [y, m, d] = dateKey.split("-");
      return {
        timePeriod: dateKey,
        totalRevenueAmount: values.totalRevenue,
        totalPenaltyAmount: values.totalPenalty,
        totalAdjustmentAmount: values.totalAdjustment,
        groupUnit: "DAY",
        label: `${d}/${m}`,
        fullDateLabel: `Ngày ${d}/${m}/${y}`,
      };
    });
  }

  // ----------------------------------------------------
  // TRƯỜNG HỢP 3: 3 THÁNG HOẶC LỚN HƠN -> HIỂN THỊ THEO THÁNG
  // ----------------------------------------------------
  const monthsMap = new Map<
    string,
    { totalRevenue: number; totalPenalty: number; totalAdjustment: number }
  >();

  const currentMonth = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (currentMonth <= endMonth) {
    const monthKey = `${currentMonth.getFullYear()}-${pad(currentMonth.getMonth() + 1)}`;
    if (!monthsMap.has(monthKey)) {
      monthsMap.set(monthKey, {
        totalRevenue: 0,
        totalPenalty: 0,
        totalAdjustment: 0,
      });
    }
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  rawPoints.forEach((pt) => {
    const monthKey = pt.timePeriod.slice(0, 7);
    const existing = monthsMap.get(monthKey);
    if (existing) {
      existing.totalRevenue += pt.totalRevenueAmount || 0;
      existing.totalPenalty += pt.totalPenaltyAmount || 0;
      existing.totalAdjustment += pt.totalAdjustmentAmount || 0;
    }
  });

  return Array.from(monthsMap.entries()).map(([monthKey, values]) => {
    const [y, m] = monthKey.split("-");
    return {
      timePeriod: monthKey,
      totalRevenueAmount: values.totalRevenue,
      totalPenaltyAmount: values.totalPenalty,
      totalAdjustmentAmount: values.totalAdjustment,
      groupUnit: "MONTH",
      label: `Thg ${m}`,
      fullDateLabel: `Tháng ${m}/${y}`,
    };
  });
}

function formatShortCurrency(value: number): string {
  if (value === 0) return "0 đ";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} tỷ đ`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")} tr đ`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(0)}k đ`;
  }
  return `${sign}${abs} đ`;
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

  const [chartType, setChartType] = useState<"bar" | "line">("line");
  const [visibleSeries, setVisibleSeries] = useState({
    revenue: true,
    penalty: true,
    adjustment: true,
  });

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
  const chartData = useMemo(() => {
    const rawData = timeSeriesQuery.data ?? [];
    return buildContinuousTimeSeries(rawData, startDate, endDate);
  }, [timeSeriesQuery.data, startDate, endDate]);

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

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-creator-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Doanh Thu
            </h2>
          </div>
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
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-creator-gold" />
                  <h2 className="text-xl font-black text-white">Biểu đồ biến động</h2>
                </div>

                <div className="flex items-center rounded-xl border border-white/10 bg-black/40 p-0.5">
                  <button
                    type="button"
                    onClick={() => setChartType("bar")}
                    className={`inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition ${chartType === "bar"
                      ? "bg-creator-gold text-black shadow"
                      : "text-zinc-400 hover:text-white"
                      }`}
                    title="Dạng biểu đồ Cột"
                  >
                    <BarChart2 className="h-3.5 w-3.5" />
                    Cột
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType("line")}
                    className={`inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition ${chartType === "line"
                      ? "bg-creator-gold text-black shadow"
                      : "text-zinc-400 hover:text-white"
                      }`}
                    title="Dạng biểu đồ Đường"
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    Đường
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleSeries((prev) => ({
                      ...prev,
                      revenue: !prev.revenue,
                    }))
                  }
                  className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-black transition ${visibleSeries.revenue
                    ? "border-creator-gold/40 bg-creator-gold/15 text-creator-gold"
                    : "border-white/10 bg-white/5 text-white/30 line-through"
                    }`}
                  title="Bật/tắt hiển thị Doanh thu"
                >
                  <span className="h-2 w-2 rounded-full bg-creator-gold" />
                  Doanh thu
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setVisibleSeries((prev) => ({
                      ...prev,
                      penalty: !prev.penalty,
                    }))
                  }
                  className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-black transition ${visibleSeries.penalty
                    ? "border-red-400/40 bg-red-400/15 text-red-300"
                    : "border-white/10 bg-white/5 text-white/30 line-through"
                    }`}
                  title="Bật/tắt hiển thị Khấu trừ phạt"
                >
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  Khấu trừ phạt
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setVisibleSeries((prev) => ({
                      ...prev,
                      adjustment: !prev.adjustment,
                    }))
                  }
                  className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-black transition ${visibleSeries.adjustment
                    ? "border-sky-400/40 bg-sky-400/15 text-sky-300"
                    : "border-white/10 bg-white/5 text-white/30 line-through"
                    }`}
                  title="Bật/tắt hiển thị Điều chỉnh"
                >
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  Điều chỉnh
                </button>

                {timeSeriesQuery.data?.[0]?.groupUnit && (
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-3 text-xs font-black uppercase tracking-wide text-creator-muted">
                    <Clock3 className="h-3.5 w-3.5 text-creator-gold" />
                    {timeSeriesQuery.data[0].groupUnit}
                  </span>
                )}
              </div>
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
              ) : chartType === "bar" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ left: 0, right: 16, top: 12, bottom: 0 }}>
                    <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      fontSize={11}
                      stroke="#71717a"
                      tickLine={false}
                      minTickGap={20}
                      dy={6}
                    />
                    <YAxis
                      fontSize={11}
                      stroke="#71717a"
                      tickFormatter={formatShortCurrency}
                      tickLine={false}
                      allowDecimals={false}
                      domain={[0, "auto"]}
                      width={68}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "14px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload as
                          | { fullDateLabel?: string }
                          | undefined;
                        return `Mốc thời gian: ${item?.fullDateLabel || label}`;
                      }}
                      formatter={(value: unknown, name: unknown) => [
                        formatVND(Number(value) || 0),
                        name === "totalRevenueAmount" || name === "Doanh thu"
                          ? "Doanh thu"
                          : name === "totalPenaltyAmount" || name === "Khấu trừ phạt"
                            ? "Khấu trừ phạt"
                            : "Điều chỉnh",
                      ]}
                    />
                    {visibleSeries.revenue && (
                      <Bar
                        dataKey="totalRevenueAmount"
                        name="Doanh thu"
                        fill="#D4AF37"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      />
                    )}
                    {visibleSeries.penalty && (
                      <Bar
                        dataKey="totalPenaltyAmount"
                        name="Khấu trừ phạt"
                        fill="#f87171"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      />
                    )}
                    {visibleSeries.adjustment && (
                      <Bar
                        dataKey="totalAdjustmentAmount"
                        name="Điều chỉnh"
                        fill="#38bdf8"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ left: 0, right: 16, top: 12, bottom: 0 }}>
                    <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      fontSize={11}
                      stroke="#71717a"
                      tickLine={false}
                      minTickGap={24}
                      dy={6}
                    />
                    <YAxis
                      fontSize={11}
                      stroke="#71717a"
                      tickFormatter={formatShortCurrency}
                      tickLine={false}
                      allowDecimals={false}
                      domain={[0, "auto"]}
                      width={68}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "14px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload as
                          | { fullDateLabel?: string }
                          | undefined;
                        return `Mốc thời gian: ${item?.fullDateLabel || label}`;
                      }}
                      formatter={(value: unknown, name: unknown) => [
                        formatVND(Number(value) || 0),
                        name === "totalRevenueAmount" || name === "Doanh thu"
                          ? "Doanh thu"
                          : name === "totalPenaltyAmount" || name === "Khấu trừ phạt"
                            ? "Khấu trừ phạt"
                            : "Điều chỉnh",
                      ]}
                    />
                    {visibleSeries.revenue && (
                      <Line
                        dataKey="totalRevenueAmount"
                        name="Doanh thu"
                        stroke="#D4AF37"
                        strokeWidth={2.5}
                        type="monotone"
                        dot={{ r: 4, fill: "#D4AF37", strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: "#D4AF37", stroke: "#fff", strokeWidth: 2 }}
                      />
                    )}
                    {visibleSeries.penalty && (
                      <Line
                        dataKey="totalPenaltyAmount"
                        name="Khấu trừ phạt"
                        stroke="#f87171"
                        strokeWidth={2.5}
                        strokeDasharray="6 4"
                        type="monotone"
                        dot={{ r: 4, fill: "#f87171", strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: "#f87171", stroke: "#fff", strokeWidth: 2 }}
                      />
                    )}
                    {visibleSeries.adjustment && (
                      <Line
                        dataKey="totalAdjustmentAmount"
                        name="Điều chỉnh"
                        stroke="#38bdf8"
                        strokeWidth={2.5}
                        type="monotone"
                        dot={{ r: 4, fill: "#38bdf8", strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: "#38bdf8", stroke: "#fff", strokeWidth: 2 }}
                      />
                    )}
                  </LineChart>
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
