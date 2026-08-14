"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Coins,
  Calendar,
  RefreshCw,
  BarChart3,
  Filter,
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
  getAdminStatistics,
  type StatisticsData,
} from "@/features/admin/api/admin-statistics.api";
import { AdminTaxSummaryWidget } from "@/features/admin/components/admin-tax-summary-widget";
import { Button } from "@/shared/ui/button";

function formatVND(value: number = 0): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number = 0): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export default function AdminDashboardPage() {
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");

  const statisticsQuery = useQuery({
    queryKey: adminStatisticsKeys.list({ startTime, endTime }),
    queryFn: () =>
      getAdminStatistics({
        startTime: startTime ? new Date(startTime).toISOString() : undefined,
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
      }),
  });

  const data: StatisticsData | undefined = statisticsQuery.data;
  const overview = data?.overview;
  const trends = data?.trends ?? [];

  const handleResetFilter = () => {
    setStartTime("");
    setEndTime("");
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* 1. Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600 backoffice-dark:text-[var(--backoffice-primary)]">
            Admin Panel
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 backoffice-dark:text-white">
            Thống Kê Tài Chính
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500 backoffice-dark:text-white/60">
            Tổng quan GMV, doanh thu thuần, thuế VAT và lượng Coin sử dụng trên nền tảng.
          </p>
        </div>

        {/* Date Filter Inputs */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
            <Filter className="w-4 h-4 text-violet-600" />
            <span>Khoảng thời gian:</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 bg-gray-50 focus:bg-white focus:border-violet-500 focus:outline-none transition"
            />
            <span className="text-xs font-bold text-gray-400">-</span>
            <input
              type="date"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 bg-gray-50 focus:bg-white focus:border-violet-500 focus:outline-none transition"
            />
          </div>

          {(startTime || endTime) && (
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilter}
              className="h-8 px-3 text-xs font-bold text-gray-500 hover:text-gray-900"
            >
              Xóa bộ lọc
            </Button>
          )}

          <Button
            type="button"
            onClick={() => void statisticsQuery.refetch()}
            disabled={statisticsQuery.isFetching}
            className="h-8 px-3 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-lg flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${statisticsQuery.isFetching ? "animate-spin" : ""}`} />
            Cập nhật
          </Button>
        </div>
      </div>

      {/* 1.5. API Tax Summary Compact Widget */}
      <AdminTaxSummaryWidget />

      {/* Loading state */}
      {statisticsQuery.isLoading && (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-violet-600/25 border-t-violet-600" />
            Đang tải dữ liệu thống kê tài chính...
          </div>
        </div>
      )}

      {/* Error state */}
      {statisticsQuery.isError && (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <div>
            <p className="text-sm font-semibold text-red-700">
              Không thể tải dữ liệu thống kê tài chính.
            </p>
            <Button
              type="button"
              onClick={() => void statisticsQuery.refetch()}
              className="mt-4 h-9 bg-violet-600 px-4 font-semibold text-white hover:bg-violet-700 rounded-lg text-xs"
            >
              Thử lại
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!statisticsQuery.isLoading && !statisticsQuery.isError && (
        <>
          {/* 2. Top KPI Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* GMV */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                  Tổng GMV
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Tổng GMV
              </p>
              <h3 className="text-2xl font-bold text-gray-900 backoffice-dark:text-white">
                {formatVND(overview?.gmv)}
              </h3>
            </div>

            {/* Doanh thu thuần */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                  Doanh thu thuần
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Doanh thu thuần
              </p>
              <h3 className="text-2xl font-bold text-gray-900 backoffice-dark:text-white">
                {formatVND(overview?.totalNetRevenue)}
              </h3>
            </div>

            {/* Tổng VAT */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                  Thuế VAT
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Tổng VAT
              </p>
              <h3 className="text-2xl font-bold text-gray-900 backoffice-dark:text-white">
                {formatVND(overview?.totalVat)}
              </h3>
            </div>

            {/* Tổng Coin sử dụng */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Coins className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                  Coins
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Coin Sử Dụng
              </p>
              <h3 className="text-2xl font-bold text-gray-900 backoffice-dark:text-white">
                {formatNumber(overview?.totalCoin)} <span className="text-xs font-semibold text-purple-600">Coin</span>
              </h3>
            </div>
          </div>

          {/* 3. Trend Chart Area */}
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 flex flex-col backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-600" />
                <h3 className="text-lg font-bold text-gray-900 backoffice-dark:text-white">
                  Biểu Đồ Xu Hướng Tài ChínhTheo Kỳ
                </h3>
              </div>
              <span className="text-xs font-medium text-gray-400">
                {trends.length} kỳ hiển thị
              </span>
            </div>

            {trends.length > 0 ? (
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="period" stroke="#6B7280" fontSize={12} tickLine={false} />
                    <YAxis stroke="#6B7280" fontSize={12} tickLine={false} />
                    <Tooltip
                      formatter={(value: any, name: any) => {
                        const numValue = typeof value === "number" ? value : Number(value) || 0;
                        if (name === "totalCoin") {
                          return [formatNumber(numValue) + " Coin", "Coin Sử Dụng"];
                        }
                        const labelMap: Record<string, string> = {
                          gmv: "GMV",
                          netRevenue: "Doanh Thu Thuần",
                          vatAmount: "VAT",
                        };
                        return [formatVND(numValue), labelMap[name] || name];
                      }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1 border-gray-100",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="gmv" name="GMV" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="netRevenue" name="Doanh Thu Thuần" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="vatAmount" name="VAT" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="totalCoin" name="Coin Sử Dụng" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-xl bg-gray-50 text-xs font-medium text-gray-400">
                Không có dữ liệu xu hướng trong khoảng thời gian đã chọn.
              </div>
            )}
          </div>

          {/* 4. Trends Table */}
          <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 backoffice-dark:text-white">
                Chi Tiết Dữ Liệu Chi Tiết Theo Kỳ (Period)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Thời Gian / Kỳ</th>
                    <th className="px-6 py-4 font-semibold text-right">GMV</th>
                    <th className="px-6 py-4 font-semibold text-right">Doanh Thu Thuần</th>
                    <th className="px-6 py-4 font-semibold text-right">Thuế VAT</th>
                    <th className="px-6 py-4 font-semibold text-right">Coin Sử Dụng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trends.length ? (
                    trends.map((item) => (
                      <tr key={item.period} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-violet-600" />
                          {item.period}
                        </td>
                        <td className="px-6 py-4 font-medium text-right text-blue-600">
                          {formatVND(item.gmv)}
                        </td>
                        <td className="px-6 py-4 font-medium text-right text-emerald-600">
                          {formatVND(item.netRevenue)}
                        </td>
                        <td className="px-6 py-4 font-medium text-right text-amber-600">
                          {formatVND(item.vatAmount)}
                        </td>
                        <td className="px-6 py-4 font-medium text-right text-purple-600">
                          {formatNumber(item.totalCoin)} Coin
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-xs font-medium text-gray-400">
                        Chưa có dữ liệu thống kê chi tiết.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
