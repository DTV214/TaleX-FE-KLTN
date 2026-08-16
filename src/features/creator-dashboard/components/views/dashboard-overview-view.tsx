"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  BarChart3,
  MessageSquare,
  ChevronRight,
  Award,
  Users,
  Eye,
  Clock,
  Play,
  Loader2,
  Plus,
  Coins,
  Library,
  TrendingUp,
  Film,
  ArrowUpRight,
  Search,
  Globe,
  Monitor,
  MoreHorizontal,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore, isFullProfile } from "@/features/auth/store/auth.store";
import { cn } from "@/shared/utils/utils";
import {
  listSeriesByCreator,
  getCreatorLogs,
  type SeriesResponse,
} from "@/features/creator-dashboard/api/creator-content-api";
import {
  getOwnCreator,
  creatorOnboardingKeys,
  type OwnCreatorResponse,
} from "@/features/creator-dashboard/api/creator-onboarding-api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { CreatorAnalyticsLogsView } from "@/features/creator-dashboard/components/views/creator-analytics-logs-view";

type TabType = "overview" | "analytics" | "content" | "revenue";

interface DashboardOverviewViewProps {
  onNavigate: (view: any) => void;
  initialTab?: TabType;
}

const pad = (n: number) => n.toString().padStart(2, "0");

function formatWatchTime(seconds: number): string {
  if (seconds <= 0) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }
  const hours = (seconds / 3600).toFixed(1);
  return `${hours}h`;
}

function formatNumber(num: number = 0): string {
  const safeNum = num || 0;
  if (safeNum >= 1_000_000) return (safeNum / 1_000_000).toFixed(1) + "M";
  if (safeNum >= 1_000) return (safeNum / 1_000).toFixed(1) + "K";
  return safeNum.toLocaleString("vi-VN");
}

const statusBadgeMap: Record<string, { label: string; className: string }> = {
  PUBLISHED: {
    label: "Đã xuất bản",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  DRAFT: {
    label: "Bản nháp",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  HIDDEN: {
    label: "Đang ẩn",
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
  SCHEDULED: {
    label: "Lên lịch",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
};

function getStatusBadge(status: string): { label: string; className: string } {
  return (
    statusBadgeMap[status] ?? {
      label: status,
      className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    }
  );
}

// ============================================================
// OverviewDashboardContent — Triển khai 100% đúng bố cục ảnh mẫu
// Row 1: 3 KPI Cards với Mini Sparkline Chart
// Row 2: Sessions Overview (Area Chart) + Most Active Users (Bar Chart)
// Row 3: Top Series Performance + Sessions by Devices (Donut + Progress)
// ============================================================
function OverviewDashboardContent({
  seriesList,
  isLoadingSeries,
  ownCreatorData,
  isLoadingOwnCreator,
  onNavigate,
  onNavigateToAnalytics,
}: {
  seriesList: SeriesResponse[];
  isLoadingSeries: boolean;
  ownCreatorData?: OwnCreatorResponse;
  isLoadingOwnCreator: boolean;
  onNavigate: (view: any) => void;
  onNavigateToAnalytics: () => void;
}) {
  const [preset, setPreset] = useState<"7d" | "30d">("7d");

  // Lifetime KPI metrics directly from GET /api/v1/creators/own
  const totalViews = ownCreatorData?.analyticData?.views ?? 0;
  const followerCount = ownCreatorData?.followerCount ?? 0;
  const totalEngagement =
    (ownCreatorData?.analyticData?.likes || 0) +
    (ownCreatorData?.analyticData?.comments || 0) +
    (ownCreatorData?.analyticData?.bookmarks || 0) +
    (ownCreatorData?.analyticData?.shares || 0);

  const queryParams = useMemo(() => {
    const now = new Date();
    const daysOffset = preset === "7d" ? 6 : 29;
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - daysOffset);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = new Date(now);
    toDate.setHours(23, 59, 59, 999);

    return { from: fromDate.toISOString(), to: toDate.toISOString() };
  }, [preset]);

  const logsQuery = useQuery({
    queryKey: ["overview-creator-logs", queryParams],
    queryFn: () => getCreatorLogs(queryParams),
    staleTime: 60 * 1000,
  });

  const logs = logsQuery.data || [];

  // Tổng hợp chỉ số từ API logs
  const totals = useMemo(() => {
    const rawTotals = logs.reduce(
      (acc, item) => {
        const data = item.analyticData || {};
        return {
          views: acc.views + (data.views || 0),
          likes: acc.likes + (data.likes || 0),
          comments: acc.comments + (data.comments || 0),
          bookmarks: acc.bookmarks + (data.bookmarks || 0),
          shares: acc.shares + (data.shares || 0),
          follows: acc.follows + (item.follows || 0),
        };
      },
      { views: 0, likes: 0, comments: 0, bookmarks: 0, shares: 0, follows: 0 },
    );

    return {
      views: Math.max(0, rawTotals.views),
      likes: Math.max(0, rawTotals.likes),
      comments: Math.max(0, rawTotals.comments),
      bookmarks: Math.max(0, rawTotals.bookmarks),
      shares: Math.max(0, rawTotals.shares),
      follows: Math.max(0, rawTotals.follows),
    };
  }, [logs]);

  // Dữ liệu Area Chart (Views, Engagement, Follows) theo N ngày liên tục từ quá khứ đến HÔM NAY
  const areaChartData = useMemo(() => {
    const daysCount = preset === "7d" ? 7 : 30;
    const now = new Date();
    // Index logs by local date
    const logsByDate = new Map<string, any[]>();
    for (const item of logs) {
      if (!item.hourBucket) continue;
      const d = new Date(item.hourBucket);
      const localKey = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const list = logsByDate.get(localKey) || [];
      list.push(item);
      logsByDate.set(localKey, list);
    }

    const result = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() - i);
      const key = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}`;
      const dayLabel = `${pad(targetDate.getDate())}/${pad(targetDate.getMonth() + 1)}`;

      const itemsForDay = logsByDate.get(key) || [];
      const uniqueItemsMap = new Map<string, any>();
      for (const it of itemsForDay) {
        const itemKey = it.creatorLogId || it.hourBucket;
        uniqueItemsMap.set(itemKey, it);
      }
      const uniqueItems = Array.from(uniqueItemsMap.values());

      let views = 0;
      let likes = 0;
      let comments = 0;
      let bookmarks = 0;
      let shares = 0;
      let follows = 0;

      for (const item of uniqueItems) {
        const data = item.analyticData || {};
        views += data.views || 0;
        likes += data.likes || 0;
        comments += data.comments || 0;
        bookmarks += data.bookmarks || 0;
        shares += data.shares || 0;
        follows += item.follows || 0;
      }

      const engagement = likes + comments + bookmarks + shares;

      result.push({
        day: dayLabel,
        views: Math.max(0, views),
        engagement: Math.max(0, engagement),
        follows: Math.max(0, follows),
        likes: Math.max(0, likes),
        comments: Math.max(0, comments),
        bookmarks: Math.max(0, bookmarks),
        shares: Math.max(0, shares),
      });
    }

    return result;
  }, [logs, preset]);

  // Donut Chart Items (Cơ cấu tương tác trong kỳ)
  const donutItems = [
    { name: "Thích", value: totals.likes, color: "#f43f5e" },
    { name: "Bình luận", value: totals.comments, color: "#3b82f6" },
    { name: "Lưu tác phẩm", value: totals.bookmarks, color: "#D4AF37" },
    { name: "Chia sẻ", value: totals.shares, color: "#a855f7" },
    { name: "Đăng ký mới", value: totals.follows, color: "#10b981" },
  ];

  const validDonutData = donutItems.filter((d) => d.value > 0);
  const periodEngagementTotal = donutItems.reduce(
    (acc, item) => acc + item.value,
    0,
  );

  // Top Series Bar Chart Data (Lượt xem & Thời gian xem)
  const topSeriesChartData = useMemo(() => {
    if (!seriesList.length) return [];
    return [...seriesList]
      .map((s: any) => {
        const views =
          s.analyticData?.views ??
          s.totalViews ??
          s.views ??
          s.viewsCount ??
          0;
        const watchTime =
          s.analyticData?.watchTime ??
          s.totalWatchTime ??
          s.watchTime ??
          0;
        const titleStr = s.title || s.name || "Tác phẩm";
        return {
          name: titleStr.length > 16 ? titleStr.slice(0, 16) + "..." : titleStr,
          views,
          watchTime,
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [seriesList]);

  // Watch Time Chart Data (Số phút xem theo N ngày liên tục từ quá khứ đến HÔM NAY)
  const watchTimeChartData = useMemo(() => {
    const daysCount = preset === "7d" ? 7 : 30;
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");

    const logsByDate = new Map<string, any[]>();
    for (const item of logs) {
      if (!item.hourBucket) continue;
      const d = new Date(item.hourBucket);
      const localKey = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const list = logsByDate.get(localKey) || [];
      list.push(item);
      logsByDate.set(localKey, list);
    }

    const result = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() - i);
      const key = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}`;
      const dayLabel = `${pad(targetDate.getDate())}/${pad(targetDate.getMonth() + 1)}`;

      const itemsForDay = logsByDate.get(key) || [];
      const uniqueItemsMap = new Map<string, any>();
      for (const it of itemsForDay) {
        const itemKey = it.creatorLogId || it.hourBucket;
        uniqueItemsMap.set(itemKey, it);
      }

      let totalSec = 0;
      for (const item of uniqueItemsMap.values()) {
        const data = item.analyticData || {};
        totalSec += data.watchTime || 0;
      }

      result.push({
        day: dayLabel,
        watchMinutes: Math.round(totalSec / 60),
      });
    }

    return result;
  }, [logs, preset]);

  // Recent 4 series
  const recentSeries = useMemo(() => {
    return seriesList.slice(0, 4);
  }, [seriesList]);

  return (
    <div className="space-y-6">
      {/* ================= ROW 1: 3 TOP KPI CARDS (Lượt xem, Người đăng ký, Tổng tương tác) ================= */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Card 1: Tổng lượt xem */}
        <div className="rounded-[24px] border border-white/10 bg-[#17171a] p-6 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Tổng lượt xem
              </span>
              <span className="rounded-full bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-bold text-[#D4AF37]">
                Lượt xem
              </span>
            </div>
            <div className="text-2xl font-black text-[#D4AF37]">
              {isLoadingOwnCreator ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
              ) : (
                formatNumber(totalViews)
              )}
            </div>
            <span className="text-xs text-zinc-500 font-medium block">
              Tổng số lượt xem kênh
            </span>
          </div>
          {/* Icon Badge Gold */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 shadow-inner">
            <Eye className="h-6 w-6 text-[#D4AF37]" />
          </div>
        </div>

        {/* Card 2: Người đăng ký */}
        <div className="rounded-[24px] border border-white/10 bg-[#17171a] p-6 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Người đăng ký
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                Đăng ký
              </span>
            </div>
            <div className="text-2xl font-black text-white">
              {isLoadingOwnCreator ? (
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              ) : (
                formatNumber(followerCount)
              )}
            </div>
            <span className="text-xs text-zinc-500 font-medium block">
              Số người theo dõi kênh
            </span>
          </div>
          {/* Icon Badge Emerald */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-inner">
            <Users className="h-6 w-6 text-emerald-400" />
          </div>
        </div>

        {/* Card 3: Tổng tương tác */}
        <div className="rounded-[24px] border border-white/10 bg-[#17171a] p-6 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Tổng tương tác
              </span>
              <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                Tương tác
              </span>
            </div>
            <div className="text-2xl font-black text-white">
              {isLoadingOwnCreator ? (
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              ) : (
                formatNumber(totalEngagement)
              )}
            </div>
            <span className="text-xs text-zinc-500 font-medium block">
              Thích, Bình luận, Lưu, Chia sẻ
            </span>
          </div>
          {/* Icon Badge Rose */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-inner">
            <Heart className="h-6 w-6 text-rose-400" />
          </div>
        </div>
      </div>

      {/* ================= ROW 2: DIỄN BIẾN HOẠT ĐỘNG (3 ĐƯỜNG AREA CHART) + CƠ CẤU TƯƠNG TÁC ================= */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left 2/3: Diễn biến Hoạt động */}
        <div className="rounded-[24px] border border-white/10 bg-[#17171a] p-6 shadow-xl lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Eye size={18} className="text-[#D4AF37]" />
                Diễn biến Hoạt động
              </h3>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                Diễn biến Lượt xem, Tổng tương tác và Người đăng ký theo thời
                gian
              </p>
            </div>
            {/* Range Selector */}
            <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] p-1">
              <button
                onClick={() => setPreset("7d")}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-bold transition-all",
                  preset === "7d"
                    ? "bg-[#D4AF37] text-zinc-950 shadow"
                    : "text-zinc-400 hover:text-white",
                )}
              >
                7 ngày qua
              </button>
              <button
                onClick={() => setPreset("30d")}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-bold transition-all",
                  preset === "30d"
                    ? "bg-[#D4AF37] text-zinc-950 shadow"
                    : "text-zinc-400 hover:text-white",
                )}
              >
                30 ngày qua
              </button>
            </div>
          </div>

          {logsQuery.isLoading ? (
            <div className="flex h-56 items-center justify-center text-zinc-500 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" /> Đang
              tải dữ liệu...
            </div>
          ) : areaChartData.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center text-center text-xs text-zinc-500 space-y-2">
              <BarChart3 className="h-8 w-8 text-zinc-600" />
              <p className="font-semibold">
                Chưa có dữ liệu trong khoảng thời gian này
              </p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData}>
                  <defs>
                    <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradEng" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradFol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#27272a"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      borderColor: "#3f3f46",
                      borderRadius: "14px",
                      color: "#fff",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#D4AF37"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradViews)"
                    name="Lượt xem"
                    dot={{ r: 3, fill: "#D4AF37" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="engagement"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradEng)"
                    name="Tổng tương tác"
                    dot={{ r: 3, fill: "#f43f5e" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="follows"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradFol)"
                    name="Người đăng ký"
                    dot={{ r: 3, fill: "#10b981" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right 1/3: Cơ cấu Tương tác */}
        <div className="rounded-[24px] border border-white/10 bg-[#17171a] p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Monitor className="h-4 w-4 text-[#D4AF37]" />
                Cơ cấu Tương tác
              </h3>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                Tỷ lệ tương tác khán giả
              </p>
            </div>
            <span className="text-[11px] font-semibold text-zinc-400">
              {preset === "7d" ? "7 ngày qua" : "30 ngày qua"}
            </span>
          </div>

          {logsQuery.isLoading ? (
            <div className="flex h-56 items-center justify-center text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
            </div>
          ) : validDonutData.length === 0 ? (
            <div className="flex h-56 items-center justify-center text-xs text-zinc-500">
              Chưa có dữ liệu tương tác trong khoảng thời gian này
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center my-auto py-2">
              {/* Donut Chart với số tổng lớn ở giữa */}
              <div className="relative h-52 w-52 mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={validDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius="65%"
                      outerRadius="88%"
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {validDonutData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      offset={25}
                      wrapperStyle={{ outline: "none", zIndex: 50 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0];
                          const pct =
                            periodEngagementTotal > 0
                              ? Math.round(
                                  (Number(item.value) / periodEngagementTotal) *
                                    100,
                                )
                              : 0;
                          return (
                            <div className="rounded-xl border border-white/15 bg-zinc-900/95 p-2 px-3 shadow-2xl backdrop-blur-md text-xs font-semibold text-white">
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full shrink-0"
                                  style={{
                                    backgroundColor: item.payload.color,
                                  }}
                                />
                                <span className="text-zinc-300">
                                  {item.name}:
                                </span>
                                <span className="font-bold text-[#D4AF37]">
                                  {item.value}
                                </span>
                                <span className="text-zinc-400 text-[11px]">
                                  ({pct}%)
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                    Tổng cộng
                  </span>
                  <span className="text-xl font-black text-white">
                    {formatNumber(periodEngagementTotal)}
                  </span>
                </div>
              </div>

              {/* Clean Legend Dots */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-3 text-[11px]">
                {donutItems.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-zinc-400 font-medium">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= ROW 3: TOP TÁC PHẨM HIỆU QUẢ NHẤT & XU HƯỚNG THỜI GIAN XEM ================= */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left 2/3: Top Tác phẩm nổi bật (Horizontal Bar Chart) */}
        <div className="rounded-[24px] border border-white/10 bg-[#17171a] p-6 shadow-xl lg:col-span-2 flex flex-col space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <BarChart3 size={18} className="text-[#D4AF37]" />
                Top Tác Phẩm Nổi Bật
              </h3>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                So sánh lượt xem và thời gian xem giữa các tác phẩm
              </p>
            </div>
          </div>

          {isLoadingSeries ? (
            <div className="flex h-56 items-center justify-center text-zinc-500 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" /> Đang
              tải danh sách tác phẩm...
            </div>
          ) : topSeriesChartData.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center text-center text-xs text-zinc-500 space-y-2">
              <Film className="h-8 w-8 text-zinc-600" />
              <p className="font-semibold">Chưa có tác phẩm nào</p>
              <p className="text-[11px] text-zinc-600">
                Tạo tác phẩm đầu tiên để bắt đầu theo dõi thống kê hiệu suất!
              </p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topSeriesChartData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#27272a"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#a1a1aa"
                    fontSize={11}
                    tickLine={false}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      borderColor: "#3f3f46",
                      borderRadius: "14px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(value: any, name: any) => {
                      if (name === "Thời gian xem") {
                        return [
                          formatWatchTime(Number(value) || 0),
                          "Thời gian xem",
                        ];
                      }
                      return [formatNumber(Number(value) || 0), name];
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  />
                  <Bar
                    dataKey="views"
                    fill="#D4AF37"
                    name="Lượt xem"
                    radius={[0, 6, 6, 0]}
                    barSize={14}
                  />
                  <Bar
                    dataKey="watchTime"
                    fill="#818cf8"
                    name="Thời gian xem"
                    radius={[0, 6, 6, 0]}
                    barSize={14}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right 1/3: Danh sách Tác phẩm gần đây (Xếp dọc) */}
        <div className="rounded-[24px] border border-white/10 bg-[#17171a] p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <BookOpen size={18} className="text-[#D4AF37]" />
                  Tác Phẩm Gần Đây
                </h3>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                  Đăng tải & cập nhật gần nhất
                </p>
              </div>
              <button
                onClick={() => onNavigate("series")}
                className="text-xs font-bold text-[#D4AF37] hover:underline transition flex items-center gap-0.5 cursor-pointer"
              >
                Xem tất cả <ChevronRight size={14} />
              </button>
            </div>

            {isLoadingSeries ? (
              <div className="flex h-56 items-center justify-center text-zinc-500 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
              </div>
            ) : recentSeries.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-xs text-zinc-500">
                Chưa có tác phẩm nào
              </div>
            ) : (
              <div className="flex flex-col space-y-2.5">
                {recentSeries.slice(0, 3).map((item) => {
                  const badge = getStatusBadge(item.status);
                  const itemViews =
                    (item as any).analyticData?.views ??
                    item.totalViews ??
                    (item as any).views ??
                    0;
                  const itemWatchTime =
                    (item as any).analyticData?.watchTime ??
                    (item as any).totalWatchTime ??
                    (item as any).watchTime ??
                    0;
                  return (
                    <div
                      key={item.seriesId}
                      className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-2.5 transition hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                        {item.coverUrl ? (
                          <img
                            src={item.coverUrl}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-zinc-600">
                            <Film size={18} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={cn(
                              "rounded-full border px-1.5 py-0.2 text-[9px] font-bold",
                              badge.className,
                            )}
                          >
                            {badge.label}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-semibold uppercase">
                            {item.contentType === "COMIC" ? "Comic" : "Video"}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white truncate mt-0.5">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Eye size={11} className="text-[#D4AF37]" />
                            {formatNumber(itemViews)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-indigo-400" />
                            {formatWatchTime(itemWatchTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= ROW 4: THỜI GIAN KHÁN GIẢ XEM (FULL WIDTH) ================= */}
      <div className="rounded-[24px] border border-white/10 bg-[#17171a] p-6 shadow-xl flex flex-col space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" />
              Thời Gian Khán Giả Xem
            </h3>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              Tổng số phút khán giả theo dõi tác phẩm theo từng ngày (phút)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">Tổng thời gian:</span>
            <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-black text-indigo-400">
              {formatNumber(
                Math.round(
                  logs.reduce(
                    (acc, item) => acc + (item.analyticData?.watchTime || 0),
                    0,
                  ) / 60,
                ),
              )}{" "}
              phút
            </span>
          </div>
        </div>

        {logsQuery.isLoading ? (
          <div className="flex h-56 items-center justify-center text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
          </div>
        ) : watchTimeChartData.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-xs text-zinc-500">
            Chưa có dữ liệu thời gian xem
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={watchTimeChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#27272a"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  width={45}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#3f3f46",
                    borderRadius: "14px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`${val} phút`, "Thời gian xem"]}
                />
                <Bar
                  dataKey="watchMinutes"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  name="Số phút"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardOverviewView({
  onNavigate,
  initialTab = "overview",
}: DashboardOverviewViewProps) {
  const user = useAuthStore((state) => state.user);
  const profileUser = isFullProfile(user) ? user : null;
  const displayName =
    profileUser?.fullName ||
    profileUser?.username ||
    user?.accountId ||
    "TaleX Creator";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Fetch Real Creator Data
  const seriesQuery = useQuery({
    queryKey: ["creator-dashboard", "series"],
    queryFn: () => listSeriesByCreator(0, 100),
  });

  const ownCreatorQuery = useQuery({
    queryKey: creatorOnboardingKeys.ownCreator(),
    queryFn: getOwnCreator,
  });

  const rawSeriesData = seriesQuery.data as any;
  const seriesList: SeriesResponse[] = Array.isArray(rawSeriesData?.content)
    ? rawSeriesData.content
    : Array.isArray(rawSeriesData?.items)
      ? rawSeriesData.items
      : Array.isArray(rawSeriesData)
        ? rawSeriesData
        : [];

  return (
    <div className="w-full pt-0 pb-6 -mt-6">
      <OverviewDashboardContent
        seriesList={seriesList}
        isLoadingSeries={seriesQuery.isLoading}
        ownCreatorData={ownCreatorQuery.data}
        isLoadingOwnCreator={ownCreatorQuery.isLoading}
        onNavigate={onNavigate}
        onNavigateToAnalytics={() => {}}
      />
    </div>
  );
}
