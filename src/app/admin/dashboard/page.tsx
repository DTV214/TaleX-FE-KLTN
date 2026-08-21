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
  RotateCcw,
  Megaphone,
  Crown,
  Film,
  Layers,
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
import { AdminCampaignOverviewWidget } from "@/features/admin/components/admin-campaign-overview-widget";
import { AdminSubscriptionOverviewWidget } from "@/features/admin/components/admin-subscription-overview-widget";
import { AdminContentOverviewWidget } from "@/features/admin/components/admin-content-overview-widget";
import { AdminTaxSummaryWidget } from "@/features/admin/components/admin-tax-summary-widget";
import { Button } from "@/shared/ui/button";

type DashboardTab = "all" | "campaign" | "subscription" | "content";

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
  const [activeTab, setActiveTab] = useState<DashboardTab>("all");

  const statisticsQuery = useQuery({
    queryKey: adminStatisticsKeys.list({ startTime, endTime }),
    queryFn: () =>
      getAdminStatistics({
        startTime: startTime ? `${startTime}T00:00:00` : undefined,
        endTime: endTime ? `${endTime}T23:59:59` : undefined,
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
      {/* 1. Header & Date Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-100 pb-6 backoffice-dark:border-white/10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 backoffice-dark:text-white">
            Thống Kê Tài Chính
          </h1>
          <p className="text-xs text-gray-500 backoffice-dark:text-zinc-400 mt-1">
            Tổng quan dòng tiền, doanh thu và phân tích chuyên sâu theo từng dịch vụ
          </p>
        </div>

        {/* Date Filter Inputs */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 backoffice-dark:text-white/60">
            <Filter className="w-4 h-4 text-violet-600 backoffice-dark:text-violet-400" />
            <span>Khoảng thời gian:</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 bg-gray-50 focus:bg-white focus:border-violet-500 focus:outline-none transition backoffice-dark:bg-black/30 backoffice-dark:border-white/10 backoffice-dark:text-white"
            />
            <span className="text-xs font-bold text-gray-400">-</span>
            <input
              type="date"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 bg-gray-50 focus:bg-white focus:border-violet-500 focus:outline-none transition backoffice-dark:bg-black/30 backoffice-dark:border-white/10 backoffice-dark:text-white"
            />
          </div>

          {(startTime || endTime) && (
            <button
              type="button"
              onClick={handleResetFilter}
              className="h-8 px-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:text-rose-700 rounded-lg flex items-center gap-1.5 transition cursor-pointer backoffice-dark:bg-rose-500/10 backoffice-dark:border-rose-500/20 backoffice-dark:text-rose-300 backoffice-dark:hover:bg-rose-500/20"
              title="Xóa bộ lọc ngày"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => void statisticsQuery.refetch()}
            disabled={statisticsQuery.isFetching}
            className="h-8 px-3.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${statisticsQuery.isFetching ? "animate-spin" : ""}`} />
            <span>Cập nhật</span>
          </button>
        </div>
      </div>

      {/* 2. Top Hero KPI Cards (Toàn Sàn) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* GMV */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center backoffice-dark:bg-blue-500/20">
              <TrendingUp className="h-5 w-5 text-blue-600 backoffice-dark:text-blue-300" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md backoffice-dark:bg-blue-900/30 backoffice-dark:text-blue-300">
              GROSS GMV
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 backoffice-dark:text-white/60">
            Tổng Doanh Thu Gộp Toàn Sàn
          </p>
          <h3 className="text-2xl font-bold text-gray-900 backoffice-dark:text-white">
            {formatVND(overview?.gmv)}
          </h3>
        </div>

        {/* Doanh thu thuần */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center backoffice-dark:bg-emerald-500/20">
              <DollarSign className="h-5 w-5 text-emerald-600 backoffice-dark:text-emerald-300" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md backoffice-dark:bg-emerald-900/30 backoffice-dark:text-emerald-300">
              NET REVENUE
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 backoffice-dark:text-white/60">
            Doanh Thu Thực Nhận
          </p>
          <h3 className="text-2xl font-bold text-gray-900 backoffice-dark:text-white">
            {formatVND(overview?.totalNetRevenue)}
          </h3>
        </div>

        {/* Tổng VAT */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center backoffice-dark:bg-amber-500/20">
              <Receipt className="h-5 w-5 text-amber-600 backoffice-dark:text-amber-300" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded-md backoffice-dark:bg-amber-900/30 backoffice-dark:text-amber-300">
              TOTAL VAT
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 backoffice-dark:text-white/60">
            Tổng Thuế VAT
          </p>
          <h3 className="text-2xl font-bold text-gray-900 backoffice-dark:text-white">
            {formatVND(overview?.totalVat)}
          </h3>
        </div>

        {/* Tổng Coin sử dụng */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center backoffice-dark:bg-purple-500/20">
              <Coins className="h-5 w-5 text-purple-600 backoffice-dark:text-purple-300" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-1 rounded-md backoffice-dark:bg-purple-900/30 backoffice-dark:text-purple-300">
              COINS USED
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 backoffice-dark:text-white/60">
            Coin Sử Dụng
          </p>
          <h3 className="text-2xl font-bold text-gray-900 backoffice-dark:text-white">
            {formatNumber(overview?.totalCoin)} <span className="text-xs font-semibold text-purple-600 backoffice-dark:text-purple-400">Coin</span>
          </h3>
        </div>
      </div>

      {/* 3. Stream Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-gray-200/80 backoffice-dark:border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "all"
              ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
              : "text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm backoffice-dark:bg-white/[0.03] backoffice-dark:border-white/10 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Tổng Hợp Tài Chính</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("campaign")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "campaign"
              ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
              : "text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm backoffice-dark:bg-white/[0.03] backoffice-dark:border-white/10 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Chiến Dịch (Campaign)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("subscription")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "subscription"
              ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
              : "text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm backoffice-dark:bg-white/[0.03] backoffice-dark:border-white/10 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>Gói Premium</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("content")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "content"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm backoffice-dark:bg-white/[0.03] backoffice-dark:border-white/10 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Nội Dung (Tập & Combo)</span>
        </button>
      </div>

      {/* 4. Tab Content Area */}
      {activeTab === "campaign" && (
        <AdminCampaignOverviewWidget startTime={startTime} endTime={endTime} />
      )}

      {activeTab === "subscription" && (
        <AdminSubscriptionOverviewWidget startTime={startTime} endTime={endTime} />
      )}

      {activeTab === "content" && (
        <AdminContentOverviewWidget startTime={startTime} endTime={endTime} />
      )}

      {activeTab === "all" && (
        <>
          {/* Loading state for General Overview */}
          {statisticsQuery.isLoading && (
            <div className="flex min-h-72 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-violet-600/25 border-t-violet-600" />
                Đang tải dữ liệu thống kê tài chính tổng hợp...
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

          {!statisticsQuery.isLoading && !statisticsQuery.isError && (
            <div className="flex flex-col gap-8">
              {/* General Trend Chart Area */}
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 flex flex-col backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-violet-600" />
                    <h3 className="text-lg font-bold text-gray-900 backoffice-dark:text-white">
                      Biểu Đồ Xu Hướng Tài Chính Theo Kỳ (Toàn Sàn)
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
                              gmv: "Tổng Doanh Thu Gộp",
                              netRevenue: "Doanh Thu Thực Nhận",
                              vatAmount: "Tổng Thuế VAT",
                            };
                            return [formatVND(numValue), labelMap[name] || name];
                          }}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #F3F4F6",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="gmv" name="Tổng Doanh Thu Gộp" fill="#2563EB" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="netRevenue" name="Doanh Thu Thực Nhận" fill="#10B981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="vatAmount" name="Tổng Thuế VAT" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="totalCoin" name="Coin Sử Dụng" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-xl bg-gray-50 text-xs font-medium text-gray-400 backoffice-dark:bg-white/[0.02]">
                    Không có dữ liệu xu hướng trong khoảng thời gian đã chọn.
                  </div>
                )}
              </div>

              {/* Trends Table */}
              <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between backoffice-dark:border-white/10">
                  <h3 className="text-lg font-bold text-gray-900 backoffice-dark:text-white">
                    Dữ Liệu Chi Tiết Theo Kỳ
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100 backoffice-dark:bg-white/[0.02] backoffice-dark:border-white/10 backoffice-dark:text-zinc-400">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Thời Gian / Kỳ</th>
                        <th className="px-6 py-4 font-semibold text-right">Tổng Doanh Thu Gộp</th>
                        <th className="px-6 py-4 font-semibold text-right">Doanh Thu Thực Nhận</th>
                        <th className="px-6 py-4 font-semibold text-right">Tổng Thuế VAT</th>
                        <th className="px-6 py-4 font-semibold text-right">Coin Sử Dụng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 backoffice-dark:divide-white/5">
                      {trends.length ? (
                        trends.map((item) => (
                          <tr key={item.period} className="hover:bg-gray-50/50 transition backoffice-dark:hover:bg-white/[0.03]">
                            <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2 backoffice-dark:text-white">
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

              {/* Tax Summary Widget */}
              <AdminTaxSummaryWidget />
            </div>
          )}
        </>
      )}
    </div>
  );
}
