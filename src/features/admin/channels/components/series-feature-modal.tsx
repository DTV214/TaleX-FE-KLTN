"use client";

import { useSeriesFeature } from "../hooks/use-admin-channels";
import {
  X,
  Sparkles,
  Layers,
  Star,
  Clock,
  Eye,
  Heart,
  Bookmark,
  Share2,
  MessageSquare,
  Activity,
  AlertCircle,
  Film,
  BookOpen,
  Calendar,
  Globe,
  Shield,
  Zap,
} from "lucide-react";
import Image from "next/image";

interface SeriesFeatureModalProps {
  seriesId: string | null;
  onClose: () => void;
}

export function SeriesFeatureModal({
  seriesId,
  onClose,
}: SeriesFeatureModalProps) {
  const { data: feature, isLoading, isError, error } = useSeriesFeature(
    seriesId || ""
  );

  if (!seriesId) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const formatPercentage = (num?: number) => {
    if (num == null) return "0.00%";
    const pct = num > 1 ? num : num * 100;
    return `${pct.toFixed(2)}%`;
  };

  const formatTime = (seconds?: number) => {
    if (seconds == null || isNaN(seconds)) return "0s";
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const remSecs = seconds % 60;
    if (mins < 60) return `${mins}m ${remSecs}s`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-200/80 backoffice-dark:border-white/10 backoffice-dark:bg-slate-900 backoffice-dark:text-white">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 backoffice-dark:bg-white/10 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/20 transition-all cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6 py-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200 backoffice-dark:bg-white/10" />
              <div className="space-y-2">
                <div className="h-5 w-48 animate-pulse rounded bg-slate-200 backoffice-dark:bg-white/10" />
                <div className="h-3.5 w-32 animate-pulse rounded bg-slate-200 backoffice-dark:bg-white/10" />
              </div>
            </div>
            <div className="h-44 w-full animate-pulse rounded-2xl bg-slate-100 backoffice-dark:bg-white/5" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-20 animate-pulse rounded-xl bg-slate-100 backoffice-dark:bg-white/5"
                />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="py-12 text-center space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 backoffice-dark:bg-red-950/50 backoffice-dark:text-red-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 backoffice-dark:text-white">
                Không thể tải thông tin Series Feature
              </h3>
              <p className="text-xs text-slate-500 backoffice-dark:text-white/60 mt-1">
                {error instanceof Error ? error.message : "Đã có lỗi xảy ra khi gọi API."}
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        {!isLoading && !isError && feature && (
          <div className="space-y-6">
            {/* Header / Banner Card */}
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* Cover / Thumbnail */}
              <div className="relative h-44 w-32 sm:h-48 sm:w-36 shrink-0 overflow-hidden rounded-xl bg-slate-100 backoffice-dark:bg-white/5 border border-slate-200 backoffice-dark:border-white/10 shadow-sm">
                {feature.coverUrl || feature.bannerUrl ? (
                  <Image
                    src={feature.coverUrl || feature.bannerUrl || ""}
                    alt={feature.title || "Series"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-violet-100 text-violet-600 backoffice-dark:bg-violet-950/40 backoffice-dark:text-violet-300">
                    <Layers className="h-10 w-10" />
                  </div>
                )}
              </div>

              {/* Title & Metadata Badges */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700 backoffice-dark:bg-violet-950/50 backoffice-dark:text-violet-300">
                    {feature.contentType === "VIDEO" ? (
                      <Film className="h-3.5 w-3.5" />
                    ) : (
                      <BookOpen className="h-3.5 w-3.5" />
                    )}
                    {feature.contentType}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 backoffice-dark:bg-white/10 backoffice-dark:text-white/80">
                    <Shield className="h-3 w-3 text-slate-400" />
                    {feature.ageRating || "EVERYONE"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 backoffice-dark:bg-white/10 backoffice-dark:text-white/80">
                    <Globe className="h-3 w-3 text-slate-400" />
                    {feature.language?.toUpperCase() || "VI"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 backoffice-dark:bg-amber-950/50 backoffice-dark:text-amber-300">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                    {feature.rating != null ? Number(feature.rating).toFixed(1) : "0.0"} / 5.0
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900 backoffice-dark:text-white">
                  {feature.title}
                </h2>
                <p className="text-xs text-slate-600 backoffice-dark:text-white/70 line-clamp-2 leading-relaxed">
                  {feature.description || "Không có mô tả chi tiết."}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 backoffice-dark:text-white/60 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Cập nhật: {formatDate(feature.releasedUpdatedAt)}
                  </span>
                </div>

                {/* Categories & Tags */}
                {((feature.category && feature.category.length > 0) ||
                  (feature.tags && feature.tags.length > 0)) && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {feature.category?.map((cat, idx) => (
                        <span
                          key={`cat-${idx}`}
                          className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 backoffice-dark:border-indigo-800/40 backoffice-dark:bg-indigo-950/40 backoffice-dark:text-indigo-300"
                        >
                          {cat}
                        </span>
                      ))}
                      {feature.tags?.map((tag, idx) => (
                        <span
                          key={`tag-${idx}`}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 backoffice-dark:bg-white/10 backoffice-dark:text-white/70"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            {/* Section 1: Deep Engagement Stats (Thời gian xem) */}
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 to-violet-50/40 p-4 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.03]">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-indigo-600 backoffice-dark:text-indigo-400" />
                <h4 className="text-xs font-bold text-slate-900 backoffice-dark:text-white">
                  Mức Độ Tương Tác
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-white p-3 border border-indigo-100/80 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/5">
                  <span className="text-[11px] text-slate-500 backoffice-dark:text-white/60 block">
                    Tổng thời gian xem
                  </span>
                  <span className="text-base font-extrabold text-indigo-700 backoffice-dark:text-indigo-300 mt-1 block">
                    {formatTime(feature.engagementStats?.totalWatchTime)}
                  </span>
                </div>

                <div className="rounded-xl bg-white p-3 border border-indigo-100/80 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/5">
                  <span className="text-[11px] text-slate-500 backoffice-dark:text-white/60 block">
                    Thời gian xem 7 ngày qua
                  </span>
                  <span className="text-base font-extrabold text-violet-700 backoffice-dark:text-violet-300 mt-1 block">
                    {formatTime(feature.engagementStats?.watchTimeLast7d)}
                  </span>
                </div>

                <div className="rounded-xl bg-white p-3 border border-indigo-100/80 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/5">
                  <span className="text-[11px] text-slate-500 backoffice-dark:text-white/60 block">
                    Thời gian xem 24 giờ qua
                  </span>
                  <span className="text-base font-extrabold text-sky-700 backoffice-dark:text-sky-300 mt-1 block">
                    {formatTime(feature.engagementStats?.watchTimeLast24h)}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Interaction Stats Overview & Ratios */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-violet-600 backoffice-dark:text-violet-400" />
                <h4 className="text-xs font-bold text-slate-900 backoffice-dark:text-white">
                  Tương Tác Người Dùng
                </h4>
              </div>

              {/* Total Counts Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 backoffice-dark:border-white/10 backoffice-dark:bg-white/5 text-center">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 backoffice-dark:text-white/60 mb-1">
                    <Eye className="h-3.5 w-3.5 text-sky-500" />
                    Clicks
                  </div>
                  <span className="text-sm font-black text-slate-900 backoffice-dark:text-white">
                    {(feature.interactionStats?.totalClicks ?? 0).toLocaleString()}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 backoffice-dark:border-white/10 backoffice-dark:bg-white/5 text-center">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 backoffice-dark:text-white/60 mb-1">
                    <Heart className="h-3.5 w-3.5 text-rose-500" />
                    Likes
                  </div>
                  <span className="text-sm font-black text-slate-900 backoffice-dark:text-white">
                    {(feature.interactionStats?.totalLikes ?? 0).toLocaleString()}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 backoffice-dark:border-white/10 backoffice-dark:bg-white/5 text-center">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 backoffice-dark:text-white/60 mb-1">
                    <Bookmark className="h-3.5 w-3.5 text-amber-500" />
                    Bookmarks
                  </div>
                  <span className="text-sm font-black text-slate-900 backoffice-dark:text-white">
                    {(feature.interactionStats?.totalBookmarks ?? 0).toLocaleString()}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 backoffice-dark:border-white/10 backoffice-dark:bg-white/5 text-center">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 backoffice-dark:text-white/60 mb-1">
                    <Share2 className="h-3.5 w-3.5 text-emerald-500" />
                    Shares
                  </div>
                  <span className="text-sm font-black text-slate-900 backoffice-dark:text-white">
                    {(feature.interactionStats?.totalShares ?? 0).toLocaleString()}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 backoffice-dark:border-white/10 backoffice-dark:bg-white/5 text-center col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 backoffice-dark:text-white/60 mb-1">
                    <MessageSquare className="h-3.5 w-3.5 text-violet-500" />
                    Comments
                  </div>
                  <span className="text-sm font-black text-slate-900 backoffice-dark:text-white">
                    {(feature.interactionStats?.totalComments ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Ratios Matrix Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 backoffice-dark:border-white/10 bg-white backoffice-dark:bg-white/5">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700 backoffice-dark:border-white/10 backoffice-dark:bg-slate-800 backoffice-dark:text-white/80">
                      <th className="py-2.5 px-3.5">Chỉ Số Chuyển Đổi</th>
                      <th className="py-2.5 px-3.5 text-right">Toàn Thời Gian</th>
                      <th className="py-2.5 px-3.5 text-right">7 Ngày Gần Nhất</th>
                      <th className="py-2.5 px-3.5 text-right">24 Giờ Gần Nhất</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 backoffice-dark:divide-white/10 text-slate-700 backoffice-dark:text-white/80 font-medium">
                    <tr>
                      <td className="py-2.5 px-3.5 flex items-center gap-1.5 font-semibold text-slate-900 backoffice-dark:text-white">
                        <Heart className="h-3 w-3 text-rose-500" /> Like / Click Ratio
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-rose-600 backoffice-dark:text-rose-400">
                        {formatPercentage(feature.interactionStats?.likeToClickRatio)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        {formatPercentage(feature.interactionStats?.likeToClickRatioLast7d)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        {formatPercentage(feature.interactionStats?.likeToClickRatioLast24h)}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-2.5 px-3.5 flex items-center gap-1.5 font-semibold text-slate-900 backoffice-dark:text-white">
                        <Bookmark className="h-3 w-3 text-amber-500" /> Bookmark / Click Ratio
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-amber-600 backoffice-dark:text-amber-400">
                        {formatPercentage(feature.interactionStats?.bookmarkToClickRatio)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        {formatPercentage(feature.interactionStats?.bookmarkToClickRatioLast7d)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        {formatPercentage(feature.interactionStats?.bookmarkToClickRatioLast24h)}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-2.5 px-3.5 flex items-center gap-1.5 font-semibold text-slate-900 backoffice-dark:text-white">
                        <Share2 className="h-3 w-3 text-emerald-500" /> Share / Click Ratio
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-emerald-600 backoffice-dark:text-emerald-400">
                        {formatPercentage(feature.interactionStats?.shareToClickRatio)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        {formatPercentage(feature.interactionStats?.shareToClickRatioLast7d)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        {formatPercentage(feature.interactionStats?.shareToClickRatioLast24h)}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-2.5 px-3.5 flex items-center gap-1.5 font-semibold text-slate-900 backoffice-dark:text-white">
                        <MessageSquare className="h-3 w-3 text-violet-500" /> Comment / Click Ratio
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-violet-600 backoffice-dark:text-violet-400">
                        {formatPercentage(feature.interactionStats?.commentToClickRatio)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        {formatPercentage(feature.interactionStats?.commentToClickRatioLast7d)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        {formatPercentage(feature.interactionStats?.commentToClickRatioLast24h)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
