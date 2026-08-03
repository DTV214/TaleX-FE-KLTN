"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Eye,
  Clock,
  UserPlus,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  TrendingUp,
  BarChart3,
  Loader2,
  RefreshCw,
  Table as TableIcon,
  Activity,
  ArrowUpRight,
  Filter,
} from "lucide-react";
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
  Legend,
} from "recharts";
import { cn } from "@/shared/utils/utils";
import {
  getCreatorLogs,
  type CreatorLogItem,
} from "@/features/creator-dashboard/api/creator-content-api";

type RangePreset = "24h" | "7d" | "30d" | "custom";

interface CreatorAnalyticsLogsViewProps {
  isWidget?: boolean;
  onNavigateToFullAnalytics?: () => void;
}

function formatWatchTime(seconds: number): string {
  if (seconds <= 0) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = (seconds / 3600).toFixed(1);
  return `${hours}h`;
}

function formatNumber(num: number = 0): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString("vi-VN");
}

export function CreatorAnalyticsLogsView({
  isWidget = false,
  onNavigateToFullAnalytics,
}: CreatorAnalyticsLogsViewProps) {
  const [rangePreset, setRangePreset] = useState<RangePreset>("7d");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"views" | "engagement">("views");
  const [showTable, setShowTable] = useState<boolean>(false);

  // Tính toán khoảng thời gian from - to
  const queryParams = useMemo(() => {
    if (rangePreset === "custom") {
      return {
        from: customFrom ? new Date(customFrom).toISOString() : undefined,
        to: customTo ? new Date(customTo).toISOString() : undefined,
      };
    }
    const now = new Date();
    const fromDate = new Date();

    if (rangePreset === "24h") {
      fromDate.setHours(now.getHours() - 24);
    } else if (rangePreset === "7d") {
      fromDate.setDate(now.getDate() - 7);
    } else if (rangePreset === "30d") {
      fromDate.setDate(now.getDate() - 30);
    }

    return {
      from: fromDate.toISOString(),
      to: now.toISOString(),
    };
  }, [rangePreset, customFrom, customTo]);

  // Query dữ liệu Log từ Backend
  const logsQuery = useQuery({
    queryKey: ["creator-analytics-logs", queryParams],
    queryFn: () => getCreatorLogs(queryParams),
    staleTime: 60 * 1000,
  });

  const logs = logsQuery.data || [];

  // Tính toán tổng các chỉ số KPI
  const totals = useMemo(() => {
    return logs.reduce(
      (acc, item) => {
        const data = item.analyticData || {};
        return {
          views: acc.views + (data.views || 0),
          watchTime: acc.watchTime + (data.watchTime || 0),
          follows: acc.follows + (item.follows || 0),
          likes: acc.likes + (data.likes || 0),
          comments: acc.comments + (data.comments || 0),
          shares: acc.shares + (data.shares || 0),
          bookmarks: acc.bookmarks + (data.bookmarks || 0),
        };
      },
      { views: 0, watchTime: 0, follows: 0, likes: 0, comments: 0, shares: 0, bookmarks: 0 }
    );
  }, [logs]);

  const totalEngagement = totals.likes + totals.comments + totals.shares + totals.bookmarks;

  // Format dữ liệu biểu đồ
  const chartData = useMemo(() => {
    return logs.map((item) => {
      const d = new Date(item.hourBucket);
      const timeStr =
        rangePreset === "24h"
          ? `${d.getHours().toString().padStart(2, "0")}:00`
          : `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
              .toString()
              .padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}h`;

      const data = item.analyticData || {};
      return {
        timestamp: item.hourBucket,
        time: timeStr,
        views: data.views || 0,
        watchTime: data.watchTime || 0,
        follows: item.follows || 0,
        likes: data.likes || 0,
        comments: data.comments || 0,
        shares: data.shares || 0,
        bookmarks: data.bookmarks || 0,
        engagement: (data.likes || 0) + (data.comments || 0) + (data.shares || 0) + (data.bookmarks || 0),
      };
    });
  }, [logs, rangePreset]);

  // Nút reload dữ liệu
  const handleRefresh = () => {
    logsQuery.refetch();
  };

  // Nút widget rút gọn
  if (isWidget) {
    return (
      <div className="creator-shine-card relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-[#1E1E22] to-[#141416] p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-black tracking-wide text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-[#D4AF37]" />
              Thống kê hoạt động gần đây
            </h3>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">7 ngày qua</p>
          </div>
          {onNavigateToFullAnalytics && (
            <button
              onClick={onNavigateToFullAnalytics}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-bold text-[#D4AF37] transition-all hover:bg-[#D4AF37]/20"
            >
              Xem chi tiết <ArrowUpRight size={14} />
            </button>
          )}
        </div>

        {/* 4 Mini Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Lượt xem
            </span>
            <span className="text-lg font-black text-white">{formatNumber(totals.views)}</span>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Thời gian xem
            </span>
            <span className="text-lg font-black text-white">{formatWatchTime(totals.watchTime)}</span>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Follows mới
            </span>
            <span className="text-lg font-black text-emerald-400">+{totals.follows}</span>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Tương tác
            </span>
            <span className="text-lg font-black text-indigo-400">{formatNumber(totalEngagement)}</span>
          </div>
        </div>

        {/* Mini Chart */}
        <div className="h-44 w-full">
          {logsQuery.isLoading ? (
            <div className="flex h-full items-center justify-center text-zinc-500 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" /> Đang tải biểu đồ...
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-zinc-500">
              Chưa có dữ liệu log hoạt động
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="widgetViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#71717a" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", borderColor: "#3f3f46", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="views" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#widgetViews)" name="Lượt xem" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    );
  }

  // Giao diện đầy đủ trong Tab Thống kê
  return (
    <div className="space-y-6">
      {/* Header & Bộ lọc thời gian */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-black/40 p-4">
        <div>
          <h2 className="creator-spotlight-text text-xl font-black tracking-wide text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#D4AF37]" />
            Thống kê Hoạt động & Tương tác (Creator Logs)
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Dữ liệu phân tích theo từng mốc thời gian thực từ hệ thống TaleX
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Presets */}
          <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
            {(
              [
                { id: "24h", label: "24h qua" },
                { id: "7d", label: "7 ngày" },
                { id: "30d", label: "30 ngày" },
                { id: "custom", label: "Tùy chọn" },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setRangePreset(p.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                  rangePreset === p.id
                    ? "bg-[#D4AF37] text-zinc-950 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            disabled={logsQuery.isFetching}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37] disabled:opacity-50"
            title="Tải lại dữ liệu"
          >
            <RefreshCw size={14} className={cn(logsQuery.isFetching && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Input tùy chỉnh ngày nếu chọn custom */}
      {rangePreset === "custom" && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-400">Từ mốc (From):</span>
            <input
              type="datetime-local"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-white outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-400">Đến mốc (To):</span>
            <input
              type="datetime-local"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-white outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>
      )}

      {/* 4 Thẻ KPI Tổng quan */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Views */}
        <div className="creator-shine-card rounded-[22px] border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Tổng lượt xem (Views)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-[#D4AF37]">
              <Eye size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            {logsQuery.isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            ) : (
              <span className="text-2xl font-black text-white">{formatNumber(totals.views)}</span>
            )}
          </div>
          <span className="mt-1 block text-[11px] text-zinc-400">
            Lượt xem trong khoảng thời gian chọn
          </span>
        </div>

        {/* Card 2: Watch Time */}
        <div className="creator-shine-card rounded-[22px] border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Thời gian xem
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            {logsQuery.isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            ) : (
              <span className="text-2xl font-black text-white">{formatWatchTime(totals.watchTime)}</span>
            )}
          </div>
          <span className="mt-1 block text-[11px] text-zinc-400">
            Tổng thời lượng khán giả theo dõi
          </span>
        </div>

        {/* Card 3: Follows */}
        <div className="creator-shine-card rounded-[22px] border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Followers Mới
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <UserPlus size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            {logsQuery.isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            ) : (
              <span className="text-2xl font-black text-emerald-400">+{totals.follows}</span>
            )}
          </div>
          <span className="mt-1 block text-[11px] text-zinc-400">
            Lượt đăng ký kênh mới
          </span>
        </div>

        {/* Card 4: Engagement */}
        <div className="creator-shine-card rounded-[22px] border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Tổng tương tác
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Heart size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            {logsQuery.isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            ) : (
              <span className="text-2xl font-black text-indigo-300">{formatNumber(totalEngagement)}</span>
            )}
          </div>
          <span className="mt-1 block text-[11px] text-zinc-400">
            Likes ({totals.likes}) • Comments ({totals.comments}) • Shares ({totals.shares})
          </span>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="creator-shine-card rounded-[24px] border border-white/10 bg-[#141416] p-6 shadow-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("views")}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-black transition-all",
                activeTab === "views"
                  ? "bg-[#D4AF37] text-zinc-950 shadow-md"
                  : "bg-white/[0.04] text-zinc-400 hover:text-white"
              )}
            >
              Biến động Lượt xem & Thời gian xem
            </button>
            <button
              onClick={() => setActiveTab("engagement")}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-black transition-all",
                activeTab === "engagement"
                  ? "bg-indigo-500 text-white shadow-md"
                  : "bg-white/[0.04] text-zinc-400 hover:text-white"
              )}
            >
              Chi tiết Tương tác (Thích/Bình luận/Lượt theo dõi)
            </button>
          </div>

          <button
            onClick={() => setShowTable(!showTable)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition"
          >
            <TableIcon size={14} />
            {showTable ? "Ẩn bảng chi tiết" : "Hiện bảng chi tiết log"}
          </button>
        </div>

        {logsQuery.isLoading ? (
          <div className="flex h-80 items-center justify-center text-zinc-500 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" /> Đang tải biểu đồ Creator Logs...
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-80 flex-col items-center justify-center text-center text-zinc-500 space-y-2">
            <BarChart3 className="h-10 w-10 text-zinc-600 stroke-[1.5]" />
            <p className="text-sm font-semibold">Chưa có log thống kê trong khoảng thời gian này</p>
            <p className="text-xs text-zinc-600">Thử mở rộng khoảng thời gian tìm kiếm hoặc tạo thêm hoạt động trên kênh</p>
          </div>
        ) : activeTab === "views" ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradientViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradientWatchTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="time" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#3f3f46",
                    borderRadius: "16px",
                    color: "#fff",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                  }}
                  formatter={(value: any, name: any) => [
                    name === "Thời gian xem (giây)" ? formatWatchTime(Number(value)) : value,
                    name,
                  ]}
                />
                <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#D4AF37"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#gradientViews)"
                  name="Lượt xem (Views)"
                />
                <Area
                  type="monotone"
                  dataKey="watchTime"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#gradientWatchTime)"
                  name="Thời gian xem (giây)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="time" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#3f3f46",
                    borderRadius: "16px",
                    color: "#fff",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
                <Bar dataKey="likes" fill="#f43f5e" name="Lượt thích" radius={[4, 4, 0, 0]} />
                <Bar dataKey="comments" fill="#3b82f6" name="Bình luận" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bookmarks" fill="#eab308" name="Lưu tác phẩm" radius={[4, 4, 0, 0]} />
                <Bar dataKey="shares" fill="#a855f7" name="Chia sẻ" radius={[4, 4, 0, 0]} />
                <Bar dataKey="follows" fill="#10b981" name="Đăng ký mới" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Table Data view chi tiết */}
      {showTable && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-4">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <TableIcon size={16} className="text-[#D4AF37]" />
            Bảng log thống kê từng khung giờ ({logs.length} mốc ghi nhận)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-white/[0.04] text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Mốc Thời Gian (Hour Bucket)</th>
                  <th className="px-4 py-3">Views</th>
                  <th className="px-4 py-3">Watch Time</th>
                  <th className="px-4 py-3">Follows</th>
                  <th className="px-4 py-3">Likes</th>
                  <th className="px-4 py-3">Comments</th>
                  <th className="px-4 py-3">Shares</th>
                  <th className="px-4 py-3">Bookmarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => {
                  const d = new Date(log.hourBucket);
                  const formattedStr = `${d.toLocaleDateString("vi-VN")} ${d.getHours().toString().padStart(2, "0")}:00`;
                  const analytic = log.analyticData || {};
                  return (
                    <tr key={log.creatorLogId} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 font-semibold text-white">{formattedStr}</td>
                      <td className="px-4 py-2.5 font-bold text-[#D4AF37]">{analytic.views || 0}</td>
                      <td className="px-4 py-2.5 text-zinc-400">{formatWatchTime(analytic.watchTime || 0)}</td>
                      <td className="px-4 py-2.5 font-bold text-emerald-400">+{log.follows || 0}</td>
                      <td className="px-4 py-2.5 text-rose-400">{analytic.likes || 0}</td>
                      <td className="px-4 py-2.5 text-blue-400">{analytic.comments || 0}</td>
                      <td className="px-4 py-2.5 text-purple-400">{analytic.shares || 0}</td>
                      <td className="px-4 py-2.5 text-yellow-400">{analytic.bookmarks || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
