"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  DollarSign,
  Film,
  Receipt,
  TrendingUp,
  RefreshCw,
  Calendar,
  BarChart3,
  Table as TableIcon,
  Layers,
  Coins,
  Share2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  adminStatisticsKeys,
  getContentOverviewStatistics,
  getContentDetailStatistics,
  type ContentDetailItem,
} from "@/features/admin/api/admin-statistics.api";
import { Button } from "@/shared/ui/button";

function formatVND(value: number = 0): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPeriodDisplay(period?: any, groupUnit?: string): string {
  if (!period) return "-";

  const periodStr = typeof period === "string" ? period : String(period);
  const unit = groupUnit?.toUpperCase();

  // 1. Trường hợp Giờ (HOUR) - ví dụ: "2026-08-21T08:00" hoặc "2026-08-21 08:00"
  if (unit === "HOUR" || periodStr.includes(":") || (periodStr.includes("T") && periodStr.length > 10)) {
    try {
      const d = new Date(periodStr.includes("T") ? periodStr : periodStr.replace(" ", "T"));
      if (!isNaN(d.getTime())) {
        const HH = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const MM = String(d.getMonth() + 1).padStart(2, "0");
        return `${HH}:${mm} (${dd}/${MM})`;
      }
    } catch {
      // fallback
    }
  }

  // 2. Trường hợp Ngày (DAY) - ví dụ: "2026-08-21"
  if (unit === "DAY" || /^\d{4}-\d{2}-\d{2}$/.test(periodStr)) {
    const parts = periodStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  // 3. Trường hợp Tháng (MONTH) - ví dụ: "2026-07"
  if (unit === "MONTH" || /^\d{4}-\d{2}$/.test(periodStr)) {
    const parts = periodStr.split("-");
    if (parts.length === 2) {
      return `Tháng ${parts[1]}/${parts[0]}`;
    }
  }

  // 4. Trường hợp Năm (YEAR) - ví dụ: "2026"
  if (unit === "YEAR" || /^\d{4}$/.test(periodStr)) {
    return `Năm ${periodStr}`;
  }

  return periodStr;
}

function formatDateDisplay(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  } catch {
    return isoString;
  }
}

function getGroupUnitLabel(unit?: string): string {
  switch (unit?.toUpperCase()) {
    case "HOUR":
      return "Theo Giờ";
    case "DAY":
      return "Theo Ngày";
    case "MONTH":
      return "Theo Tháng";
    case "YEAR":
      return "Theo Năm";
    default:
      return unit ? `Theo ${unit}` : "Theo Tháng";
  }
}

function toLocalDateTimeString(d: Date): string {
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}`;
}

interface AdminContentOverviewWidgetProps {
  startTime?: string;
  endTime?: string;
}

export function AdminContentOverviewWidget({
  startTime,
  endTime,
}: AdminContentOverviewWidgetProps) {
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  // Format ngày theo chuẩn LocalDateTime YYYY-MM-DDTHH:mm:ss (không bị lệch timezone UTC+7)
  const { finalStartTime, finalEndTime, isDefaultRange, defaultMonthLabel } = useMemo(() => {
    if (startTime || endTime) {
      const now = new Date();
      const start = startTime
        ? `${startTime}T00:00:00`
        : toLocalDateTimeString(new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0));
      const end = endTime
        ? `${endTime}T23:59:59`
        : toLocalDateTimeString(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59));

      return {
        finalStartTime: start,
        finalEndTime: end,
        isDefaultRange: false,
        defaultMonthLabel: "",
      };
    }

    const now = new Date();
    // Mặc định lấy từ đầu tháng trước đến hết tháng hiện tại
    const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const prevMonthStr = String(now.getMonth()).padStart(2, "0");
    const currentMonthStr = String(now.getMonth() + 1).padStart(2, "0");
    const yearStr = now.getFullYear();

    return {
      finalStartTime: toLocalDateTimeString(startOfMonth),
      finalEndTime: toLocalDateTimeString(endOfMonth),
      isDefaultRange: true,
      defaultMonthLabel: `Tháng ${prevMonthStr} - ${currentMonthStr}/${yearStr}`,
    };
  }, [startTime, endTime]);

  // 1. Query KPI Overview
  const contentOverviewQuery = useQuery({
    queryKey: adminStatisticsKeys.contentOverview({
      startTime: finalStartTime,
      endTime: finalEndTime,
    }),
    queryFn: () =>
      getContentOverviewStatistics({
        startTime: finalStartTime,
        endTime: finalEndTime,
      }),
    staleTime: 60 * 1000,
  });

  // 2. Query Time-series Chart Details
  const contentDetailsQuery = useQuery({
    queryKey: adminStatisticsKeys.contentDetails({
      startTime: finalStartTime,
      endTime: finalEndTime,
    }),
    queryFn: () =>
      getContentDetailStatistics({
        startTime: finalStartTime,
        endTime: finalEndTime,
      }),
    staleTime: 60 * 1000,
  });

  const stats = contentOverviewQuery.data;
  const details: ContentDetailItem[] = contentDetailsQuery.data ?? [];
  const currentGroupUnit = details[0]?.groupUnit;

  const handleRefetch = () => {
    void contentOverviewQuery.refetch();
    void contentDetailsQuery.refetch();
  };

  const isFetching =
    contentOverviewQuery.isFetching || contentDetailsQuery.isFetching;

  return (
    <div className="w-full rounded-2xl bg-white border border-gray-100 p-6 shadow-sm transition-all hover:shadow-md backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5 backoffice-dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center backoffice-dark:bg-blue-500/20">
            <Film className="h-5 w-5 text-blue-600 backoffice-dark:text-blue-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-gray-900 backoffice-dark:text-white">
                Thống Kê Doanh Thu Nội Dung (Tập Phim / Truyện & Combo)
              </h3>
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 backoffice-dark:bg-blue-950/50 backoffice-dark:text-blue-300 border border-blue-200 backoffice-dark:border-blue-800/40">
                <Calendar className="w-3 h-3" />
                {isDefaultRange
                  ? (defaultMonthLabel || "Tháng hiện tại")
                  : `${formatDateDisplay(finalStartTime)} - ${formatDateDisplay(finalEndTime)}`}
              </span>
              {currentGroupUnit && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 backoffice-dark:bg-emerald-950/50 backoffice-dark:text-emerald-300 border border-emerald-200 backoffice-dark:border-emerald-800/40">
                  <Layers className="w-3 h-3" />
                  {getGroupUnitLabel(currentGroupUnit)}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 backoffice-dark:text-white/60 mt-0.5">
              Doanh thu từ các đơn hàng mua Tập (EPISODE) và COMBO hoàn tất (COMPLETED)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefetch}
            disabled={isFetching}
            className="h-8 px-2.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition cursor-pointer backoffice-dark:bg-white/5 backoffice-dark:border-white/10 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
            title="Làm mới dữ liệu Nội dung"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-blue-600" : ""}`}
            />
          </button>

          <Link
            href="/admin/series"
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-600 transition hover:bg-blue-100 hover:text-blue-700 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.05] backoffice-dark:text-white/80 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white group"
          >
            <span>Danh sách Series</span>
            <ArrowRight className="h-3.5 w-3.5 text-blue-500 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-700 backoffice-dark:text-white/60 backoffice-dark:group-hover:text-white" />
          </Link>
        </div>
      </div>

      {/* Loading state */}
      {contentOverviewQuery.isLoading && (
        <div className="py-10 flex items-center justify-center gap-2 text-xs font-medium text-gray-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600/25 border-t-blue-600" />
          Đang tải dữ liệu tổng quan nội dung...
        </div>
      )}

      {/* Error state */}
      {contentOverviewQuery.isError && (
        <div className="py-8 text-center">
          <p className="text-xs font-semibold text-red-500">
            Không thể tải dữ liệu thống kê nội dung.
          </p>
          <Button
            type="button"
            onClick={handleRefetch}
            className="mt-3 h-8 bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 rounded-lg"
          >
            Thử lại
          </Button>
        </div>
      )}

      {/* Stats KPI Cards */}
      {!contentOverviewQuery.isLoading && !contentOverviewQuery.isError && (
        <>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Gross Revenue */}
            <div className="rounded-xl bg-slate-50/70 p-4 border border-slate-100 transition-all hover:bg-slate-50 backoffice-dark:bg-white/[0.02] backoffice-dark:border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center backoffice-dark:bg-blue-500/20">
                  <TrendingUp className="h-4 w-4 text-blue-600 backoffice-dark:text-blue-300" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded backoffice-dark:bg-blue-900/30 backoffice-dark:text-blue-300">
                  GROSS
                </span>
              </div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 backoffice-dark:text-white/60">
                Tổng Doanh Thu Gộp
              </p>
              <h4 className="text-lg font-bold text-gray-900 backoffice-dark:text-white">
                {formatVND(stats?.totalGrossRevenue)}
              </h4>
            </div>

            {/* Total VAT */}
            <div className="rounded-xl bg-slate-50/70 p-4 border border-slate-100 transition-all hover:bg-slate-50 backoffice-dark:bg-white/[0.02] backoffice-dark:border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center backoffice-dark:bg-amber-500/20">
                  <Receipt className="h-4 w-4 text-amber-600 backoffice-dark:text-amber-300" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded backoffice-dark:bg-amber-900/30 backoffice-dark:text-amber-300">
                  VAT
                </span>
              </div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 backoffice-dark:text-white/60">
                Tổng Thuế VAT
              </p>
              <h4 className="text-lg font-bold text-gray-900 backoffice-dark:text-white">
                {formatVND(stats?.totalVatAmount)}
              </h4>
            </div>

            {/* Total Coin */}
            <div className="rounded-xl bg-slate-50/70 p-4 border border-slate-100 transition-all hover:bg-slate-50 backoffice-dark:bg-white/[0.02] backoffice-dark:border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center backoffice-dark:bg-purple-500/20">
                  <Coins className="h-4 w-4 text-purple-600 backoffice-dark:text-purple-300" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded backoffice-dark:bg-purple-900/30 backoffice-dark:text-purple-300">
                  COIN
                </span>
              </div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 backoffice-dark:text-white/60">
                Coin Sử Dụng
              </p>
              <h4 className="text-lg font-bold text-gray-900 backoffice-dark:text-white">
                {formatVND(stats?.totalCoinAmount)}
              </h4>
            </div>

            {/* Creator Share */}
            <div className="rounded-xl bg-slate-50/70 p-4 border border-slate-100 transition-all hover:bg-slate-50 backoffice-dark:bg-white/[0.02] backoffice-dark:border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center backoffice-dark:bg-rose-500/20">
                  <Share2 className="h-4 w-4 text-rose-600 backoffice-dark:text-rose-300" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded backoffice-dark:bg-rose-900/30 backoffice-dark:text-rose-300">
                  SHARE
                </span>
              </div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 backoffice-dark:text-white/60">
                Chia Sẻ Creator
              </p>
              <h4 className="text-lg font-bold text-gray-900 backoffice-dark:text-white">
                {formatVND(stats?.totalCreatorShareAmount)}
              </h4>
            </div>

            {/* Total Net Revenue */}
            <div className="rounded-xl bg-slate-50/70 p-4 border border-slate-100 transition-all hover:bg-slate-50 backoffice-dark:bg-white/[0.02] backoffice-dark:border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center backoffice-dark:bg-emerald-500/20">
                  <DollarSign className="h-4 w-4 text-emerald-600 backoffice-dark:text-emerald-300" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded backoffice-dark:bg-emerald-900/30 backoffice-dark:text-emerald-300">
                  NET
                </span>
              </div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 backoffice-dark:text-white/60">
                Doanh Thu Thuần
              </p>
              <h4 className="text-lg font-bold text-emerald-600 backoffice-dark:text-emerald-400">
                {formatVND(stats?.totalNetRevenue)}
              </h4>
            </div>
          </div>

          {/* Time-series Chart & Table Section */}
          <div className="mt-6 border-t border-gray-100 pt-5 backoffice-dark:border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-bold text-gray-900 backoffice-dark:text-white">
                  Biểu Đồ & Chi Tiết Doanh Thu Nội Dung Theo Chuỗi Thời Gian
                </h4>
              </div>

              {/* Toggle Chart / Table */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl backoffice-dark:bg-white/10">
                <button
                  type="button"
                  onClick={() => setViewMode("chart")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                    viewMode === "chart"
                      ? "bg-white text-blue-700 shadow-sm backoffice-dark:bg-black/40 backoffice-dark:text-white"
                      : "text-gray-500 hover:text-gray-900 backoffice-dark:text-white/60"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Biểu đồ
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                    viewMode === "table"
                      ? "bg-white text-blue-700 shadow-sm backoffice-dark:bg-black/40 backoffice-dark:text-white"
                      : "text-gray-500 hover:text-gray-900 backoffice-dark:text-white/60"
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  Bảng chi tiết
                </button>
              </div>
            </div>

            {contentDetailsQuery.isLoading ? (
              <div className="h-64 flex items-center justify-center gap-2 text-xs font-medium text-gray-400">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600/25 border-t-blue-600" />
                Đang tải dữ liệu chuỗi thời gian...
              </div>
            ) : details.length === 0 ? (
              <div className="flex h-56 items-center justify-center rounded-xl bg-slate-50 text-xs font-medium text-gray-400 backoffice-dark:bg-white/[0.02]">
                Không có dữ liệu chi tiết nội dung trong khoảng thời gian này.
              </div>
            ) : viewMode === "chart" ? (
              /* Chart Mode */
              <div className="w-full h-72 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={details} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                      dataKey="period"
                      stroke="#6B7280"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => formatPeriodDisplay(val, currentGroupUnit)}
                    />
                    <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                    <Tooltip
                      labelFormatter={(label) => formatPeriodDisplay(label, currentGroupUnit)}
                      formatter={(value: any, name: any) => {
                        const numValue = typeof value === "number" ? value : Number(value) || 0;
                        const labelMap: Record<string, string> = {
                          grossRevenue: "Doanh Thu Gộp",
                          vatAmount: "Tổng Thuế VAT",
                          coinAmount: "Coin Sử Dụng",
                          creatorShareAmount: "Chia Sẻ Creator",
                          netRevenue: "Doanh Thu Thuần",
                        };
                        return [formatVND(numValue), labelMap[name] || name];
                      }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #F3F4F6",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="grossRevenue" name="Doanh Thu Gộp" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="vatAmount" name="Tổng Thuế VAT" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="coinAmount" name="Coin Sử Dụng" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="creatorShareAmount" name="Chia Sẻ Creator" fill="#EC4899" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="netRevenue" name="Doanh Thu Thuần" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              /* Table Mode */
              <div className="overflow-x-auto rounded-xl border border-gray-100 backoffice-dark:border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 uppercase tracking-wider text-gray-500 border-b border-gray-100 backoffice-dark:bg-white/[0.02] backoffice-dark:border-white/10">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Kỳ ({getGroupUnitLabel(currentGroupUnit)})</th>
                      <th className="px-4 py-3 font-semibold text-right">Doanh Thu Gộp</th>
                      <th className="px-4 py-3 font-semibold text-right">Thuế VAT</th>
                      <th className="px-4 py-3 font-semibold text-right">Coin Sử Dụng</th>
                      <th className="px-4 py-3 font-semibold text-right">Chia Sẻ Creator</th>
                      <th className="px-4 py-3 font-semibold text-right">Doanh Thu Thuần</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 backoffice-dark:divide-white/5">
                    {details.map((item) => (
                      <tr key={item.period} className="hover:bg-gray-50/50 transition">
                        <td className="px-4 py-3 font-bold text-gray-900 flex items-center gap-1.5 backoffice-dark:text-white">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          {formatPeriodDisplay(item.period, item.groupUnit)}
                        </td>
                        <td className="px-4 py-3 font-medium text-right text-blue-600">
                          {formatVND(item.grossRevenue)}
                        </td>
                        <td className="px-4 py-3 font-medium text-right text-amber-600">
                          {formatVND(item.vatAmount)}
                        </td>
                        <td className="px-4 py-3 font-medium text-right text-purple-600">
                          {formatVND(item.coinAmount)}
                        </td>
                        <td className="px-4 py-3 font-medium text-right text-pink-600">
                          {formatVND(item.creatorShareAmount)}
                        </td>
                        <td className="px-4 py-3 font-bold text-right text-emerald-600">
                          {formatVND(item.netRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
