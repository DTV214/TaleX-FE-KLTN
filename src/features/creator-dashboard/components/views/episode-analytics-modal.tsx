"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Eye,
  Clock,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  BarChart3,
  Loader2,
  Table as TableIcon,
  Film,
  BookOpen,
  AlertCircle,
  Search,
  Play,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  getEpisodeLogs,
  type EpisodeLogItem,
} from "@/features/creator-dashboard/api/creator-content-api";
import type { PublicEpisodeItem } from "@/features/series/api/series-api";

interface EpisodeAnalyticsModalProps {
  episode: PublicEpisodeItem | null;
  seriesTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

function formatWatchTime(seconds: number): string {
  if (seconds <= 0) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  return (seconds / 3600).toFixed(1) + "h";
}

function formatNumber(num: number = 0): string {
  const safeNum = num || 0;
  if (safeNum >= 1_000_000) return (safeNum / 1_000_000).toFixed(1) + "M";
  if (safeNum >= 1_000) return (safeNum / 1_000).toFixed(1) + "K";
  return safeNum.toLocaleString("vi-VN");
}

function toDateOnlyString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDateToApi(dateStr: string): string {
  if (!dateStr) return "";
  return `${dateStr}T00:00:00`;
}

export function EpisodeAnalyticsModal({
  episode,
  seriesTitle,
  isOpen,
  onClose,
}: EpisodeAnalyticsModalProps) {
  const episodeId = episode?.episodeId || "";

  // State cho date picker (chỉ ngày, không giờ)
  const [fromInput, setFromInput] = useState<string>("");
  const [toInput, setToInput] = useState<string>("");

  // Mốc đã áp dụng để gọi API
  const [appliedFrom, setAppliedFrom] = useState<string>("");
  const [appliedTo, setAppliedTo] = useState<string>("");

  const [activeTab, setActiveTab] = useState<"views" | "engagement">("views");
  const [showTable, setShowTable] = useState<boolean>(false);

  // Validate input
  const isValidInputs = useMemo(() => {
    if (!fromInput || !toInput) return false;
    const s = new Date(fromInput).getTime();
    const e = new Date(toInput).getTime();
    return !isNaN(s) && !isNaN(e) && s <= e;
  }, [fromInput, toInput]);

  // Nút Tra cứu
  const handleApplyFilter = () => {
    if (isValidInputs) {
      setAppliedFrom(fromInput);
      setAppliedTo(toInput);
    }
  };

  // Query params (format YYYY-MM-DDTHH:mm:ss)
  const queryParams = useMemo(() => {
    if (!appliedFrom || !appliedTo) return null;
    return {
      from: formatDateToApi(appliedFrom),
      to: formatDateToApi(appliedTo),
    };
  }, [appliedFrom, appliedTo]);

  // Query Episode Logs API
  const episodeLogsQuery = useQuery({
    queryKey: ["episode-analytics-logs", episodeId, queryParams],
    queryFn: () => getEpisodeLogs(episodeId, queryParams!),
    enabled: Boolean(isOpen && episodeId && queryParams?.from && queryParams?.to),
    staleTime: 60 * 1000,
  });

  const logs: EpisodeLogItem[] = episodeLogsQuery.data || [];

  // Tính tổng KPI
  const totals = useMemo(() => {
    return logs.reduce(
      (acc, item) => {
        const data = item.analyticData || {};
        return {
          views: acc.views + (data.views || 0),
          watchTime: acc.watchTime + (data.watchTime || 0),
          likes: acc.likes + (data.likes || 0),
          comments: acc.comments + (data.comments || 0),
          shares: acc.shares + (data.shares || 0),
          bookmarks: acc.bookmarks + (data.bookmarks || 0),
        };
      },
      { views: 0, watchTime: 0, likes: 0, comments: 0, shares: 0, bookmarks: 0 }
    );
  }, [logs]);

  const totalEngagement = totals.likes + totals.comments + totals.shares + totals.bookmarks;

  // Format data cho biểu đồ
  const chartData = useMemo(() => {
    return logs.map((item) => {
      const d = new Date(item.hourBucket);
      const timeStr = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}h`;
      const data = item.analyticData || {};
      return {
        timestamp: item.hourBucket,
        time: timeStr,
        views: data.views || 0,
        watchTime: data.watchTime || 0,
        likes: data.likes || 0,
        comments: data.comments || 0,
        shares: data.shares || 0,
        bookmarks: data.bookmarks || 0,
        engagement: (data.likes || 0) + (data.comments || 0) + (data.shares || 0) + (data.bookmarks || 0),
      };
    });
  }, [logs]);

  // Custom Hover Tooltip cho Episode Analytics
  const CustomEpisodeTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      if (!data) return null;
      return (
        <div className="rounded-2xl border border-white/15 bg-zinc-950/95 p-3.5 shadow-2xl backdrop-blur-md text-xs font-semibold text-white space-y-2 min-w-[210px] z-50">
          <div className="border-b border-white/10 pb-1.5 font-bold text-[#D4AF37] flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-zinc-400 font-normal">Chi tiết tập</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-zinc-300">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                Lượt xem:
              </span>
              <span className="font-bold text-[#D4AF37]">{data.views?.toLocaleString("vi-VN") || 0}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                Thời gian xem:
              </span>
              <span className="font-bold text-indigo-300">{formatWatchTime(data.watchTime || 0)}</span>
            </div>
            <div className="pt-1.5 border-t border-white/10">
              <span className="text-[11px] font-bold text-purple-400 block mb-1">
                Tương tác (Tổng: {data.engagement || 0})
              </span>
              <div className="pl-2.5 space-y-0.5 text-[11px] text-zinc-400 border-l border-white/10">
                <div className="flex justify-between">
                  <span>• Lượt thích:</span>
                  <span className="text-zinc-200">{data.likes || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Bình luận:</span>
                  <span className="text-zinc-200">{data.comments || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Lưu tác phẩm:</span>
                  <span className="text-zinc-200">{data.bookmarks || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Chia sẻ:</span>
                  <span className="text-zinc-200">{data.shares || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!episode) return null;

  const contentTypeLabel = episode.contentType === "VIDEO" ? "Tập phim" : "Chương truyện";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-white/10 bg-[#121214] text-white p-5 sm:p-7 shadow-2xl space-y-5">
        {/* ===== Header ===== */}
        <DialogHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center shadow-md">
              {episode.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={episode.thumbnail}
                  alt={episode.title}
                  className="h-full w-full object-cover"
                />
              ) : episode.contentType === "VIDEO" ? (
                <Film className="h-7 w-7 text-red-400" />
              ) : (
                <BookOpen className="h-7 w-7 text-emerald-400" />
              )}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-black tracking-tight text-white flex flex-wrap items-center gap-2">
                <span className="text-[#D4AF37]">{contentTypeLabel} {episode.episodeNumber}:</span>
                <span className="truncate max-w-[260px]">{episode.title}</span>
              </DialogTitle>
              <p className="text-xs text-zinc-400 mt-1 font-medium">
                {seriesTitle ? `Series: ${seriesTitle} • ` : ""}{contentTypeLabel}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* ===== DATE PICKER BAR ===== */}
        <div className="rounded-2xl border border-white/10 bg-[#1A1A1E] p-4 space-y-3.5 shadow-inner">
          <span className="text-xs font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#D4AF37]" />
            Chọn ngày bắt đầu và ngày kết thúc
          </span>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            {/* From Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                <span>Ngày bắt đầu <span className="text-rose-400">*</span></span>
                <span className="text-[10px] text-zinc-500 font-normal">Ngày / Tháng / Năm</span>
              </label>
              <div className="relative flex items-center">
                <Calendar className="absolute left-3 h-4 w-4 text-[#D4AF37] pointer-events-none" />
                <input
                  type="date"
                  value={fromInput}
                  onChange={(e) => setFromInput(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-zinc-950 py-2.5 pl-9 pr-3 text-xs font-bold text-white outline-none transition focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] [color-scheme:dark]"
                />
              </div>
            </div>

            {/* To Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                <span>Ngày kết thúc <span className="text-rose-400">*</span></span>
                <span className="text-[10px] text-zinc-500 font-normal">Ngày / Tháng / Năm</span>
              </label>
              <div className="relative flex items-center">
                <Calendar className="absolute left-3 h-4 w-4 text-[#D4AF37] pointer-events-none" />
                <input
                  type="date"
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-zinc-950 py-2.5 pl-9 pr-3 text-xs font-bold text-white outline-none transition focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Tra cứu Button */}
            <button
              type="button"
              onClick={handleApplyFilter}
              disabled={!isValidInputs || episodeLogsQuery.isFetching}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 text-xs font-black text-zinc-950 shadow-md transition-all hover:bg-[#e2bb3c] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap"
            >
              {episodeLogsQuery.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
              ) : (
                <Search className="h-4 w-4 text-zinc-950" />
              )}
              Tra cứu
            </button>
          </div>

          {/* Alert khi chưa chọn ngày */}
          {!queryParams && (
            <div className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs font-semibold text-blue-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-blue-400" />
              <span>
                Vui lòng chọn <strong>Ngày bắt đầu</strong> và <strong>Ngày kết thúc</strong>, sau đó nhấn <strong>"Tra cứu"</strong> để xem thống kê tập này.
              </span>
            </div>
          )}
        </div>

        {/* ===== DATA (Chỉ hiện khi đã tra cứu) ===== */}
        {!queryParams ? (
          <div className="flex h-56 flex-col items-center justify-center text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 space-y-3">
            <Play className="h-11 w-11 text-zinc-600" />
            <h4 className="text-sm font-bold text-zinc-300">Chưa có dữ liệu tra cứu</h4>
            <p className="text-xs text-zinc-500 max-w-md">
              Hãy chọn khoảng thời gian ở trên và bấm <strong>"Tra cứu Log"</strong> để xem biểu đồ và số liệu thống kê chi tiết của tập này.
            </p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Lượt xem</span>
                  <Eye size={15} className="text-[#D4AF37]" />
                </div>
                {episodeLogsQuery.isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                ) : (
                  <span className="text-2xl font-black text-white">{formatNumber(totals.views)}</span>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Thời gian xem</span>
                  <Clock size={15} className="text-blue-400" />
                </div>
                {episodeLogsQuery.isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                ) : (
                  <span className="text-2xl font-black text-white">{formatWatchTime(totals.watchTime)}</span>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Likes</span>
                  <Heart size={15} className="text-rose-400" />
                </div>
                {episodeLogsQuery.isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                ) : (
                  <span className="text-2xl font-black text-rose-300">{formatNumber(totals.likes)}</span>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Tổng tương tác</span>
                  <Bookmark size={15} className="text-purple-400" />
                </div>
                {episodeLogsQuery.isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                ) : (
                  <span className="text-2xl font-black text-indigo-300">{formatNumber(totalEngagement)}</span>
                )}
              </div>
            </div>

            {/* Chart Section */}
            <div className="rounded-2xl border border-white/10 bg-[#17171a] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("views")}
                    className={cn(
                      "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap",
                      activeTab === "views"
                        ? "bg-[#D4AF37] text-zinc-950 shadow-sm"
                        : "bg-white/[0.04] text-zinc-400 hover:text-white"
                    )}
                  >
                    Lượt xem & Thời gian xem
                  </button>
                  <button
                    onClick={() => setActiveTab("engagement")}
                    className={cn(
                      "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap",
                      activeTab === "engagement"
                        ? "bg-indigo-500 text-white shadow-sm"
                        : "bg-white/[0.04] text-zinc-400 hover:text-white"
                    )}
                  >
                    Tương tác (Lượt thích/Bình luận/Lưu)
                  </button>
                </div>

                <button
                  onClick={() => setShowTable(!showTable)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition whitespace-nowrap"
                >
                  <TableIcon size={14} />
                  {showTable ? "Ẩn bảng" : "Bảng log"}
                </button>
              </div>

              {episodeLogsQuery.isLoading ? (
                <div className="flex h-64 items-center justify-center text-zinc-500 gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" /> Đang tải log thống kê tập...
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-center text-zinc-500 space-y-2">
                  <BarChart3 className="h-8 w-8 text-zinc-600" />
                  <p className="text-xs font-semibold">Không có log trong khoảng thời gian đã chọn</p>
                </div>
              ) : activeTab === "views" ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="epViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="epWatch" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="time" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                      <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} />
                      <Tooltip content={<CustomEpisodeTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Area type="monotone" dataKey="views" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#epViews)" name="Lượt xem" />
                      <Area type="monotone" dataKey="watchTime" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#epWatch)" name="Thời gian xem" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="time" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                      <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} />
                      <Tooltip content={<CustomEpisodeTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Bar dataKey="likes" fill="#f43f5e" name="Lượt thích" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="comments" fill="#3b82f6" name="Bình luận" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="bookmarks" fill="#eab308" name="Lưu tác phẩm" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="shares" fill="#a855f7" name="Chia sẻ" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Data Table */}
            {showTable && (
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
                <h4 className="text-xs font-bold text-white">Chi tiết log từng mốc giờ ({logs.length} bản ghi)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] text-zinc-300">
                    <thead className="bg-white/[0.04] uppercase text-zinc-400 font-bold">
                      <tr>
                        <th className="px-3 py-2.5 whitespace-nowrap">Thời gian</th>
                        <th className="px-3 py-2.5 whitespace-nowrap">Views</th>
                        <th className="px-3 py-2.5 whitespace-nowrap">Watch Time</th>
                        <th className="px-3 py-2.5 whitespace-nowrap">Likes</th>
                        <th className="px-3 py-2.5 whitespace-nowrap">Comments</th>
                        <th className="px-3 py-2.5 whitespace-nowrap">Bookmarks</th>
                        <th className="px-3 py-2.5 whitespace-nowrap">Shares</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {logs.map((log) => {
                        const d = new Date(log.hourBucket);
                        const timeStr = `${d.toLocaleDateString("vi-VN")} ${d.getHours().toString().padStart(2, "0")}:00`;
                        const a = log.analyticData || {};
                        return (
                          <tr key={log.episodeLogId} className="hover:bg-white/[0.02]">
                            <td className="px-3 py-2.5 font-semibold text-white whitespace-nowrap">{timeStr}</td>
                            <td className="px-3 py-2.5 font-bold text-[#D4AF37] whitespace-nowrap">{a.views || 0}</td>
                            <td className="px-3 py-2.5 text-zinc-400 whitespace-nowrap">{formatWatchTime(a.watchTime || 0)}</td>
                            <td className="px-3 py-2.5 text-rose-400 whitespace-nowrap">{a.likes || 0}</td>
                            <td className="px-3 py-2.5 text-blue-400 whitespace-nowrap">{a.comments || 0}</td>
                            <td className="px-3 py-2.5 text-yellow-400 whitespace-nowrap">{a.bookmarks || 0}</td>
                            <td className="px-3 py-2.5 text-purple-400 whitespace-nowrap">{a.shares || 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
