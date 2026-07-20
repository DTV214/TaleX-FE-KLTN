"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Video,
  BookOpen,
  BarChart3,
  Heart,
  ThumbsUp,
  MessageSquare,
  ChevronRight,
  Award,
  Users,
  Eye,
  Wallet,
  Play,
  Loader2,
  Plus,
  Coins,
  Library,
  Sparkles,
  Search,
  Film,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore, isFullProfile } from "@/features/auth/store/auth.store";
import { cn } from "@/shared/utils/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import {
  listSeriesByCreator,
  type SeriesResponse,
} from "@/features/creator-dashboard/api/creator-content-api";
import {
  getOwnCreator,
  creatorOnboardingKeys,
} from "@/features/creator-dashboard/api/creator-onboarding-api";
import { getFollowers } from "@/features/series/api/creator-follows-api";
import {
  getPublicSeasons,
  getPublicEpisodes,
} from "@/features/series/api/series-api";
import { EpisodeCommentsSection } from "@/features/comments";
import { useCoinWallet } from "@/features/coin";

type TabType = "overview" | "content" | "comments" | "revenue";

interface DashboardOverviewViewProps {
  onNavigate: (view: any) => void;
  initialTab?: TabType;
}

function formatNumber(num: number = 0): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + "K";
  }
  return num.toLocaleString("vi-VN");
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
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [followerSearch, setFollowerSearch] = useState("");

  // Fetch Real Creator Data
  const seriesQuery = useQuery({
    queryKey: ["creator-dashboard", "series"],
    queryFn: () => listSeriesByCreator(0, 100),
  });

  const ownCreatorQuery = useQuery({
    queryKey: creatorOnboardingKeys.ownCreator(),
    queryFn: getOwnCreator,
  });

  const followersQuery = useQuery({
    queryKey: ["creator", "overview", "followers"],
    queryFn: () => getFollowers(0, 100),
  });

  const walletQuery = useCoinWallet();

  const rawSeriesData = seriesQuery.data as any;
  const seriesList: SeriesResponse[] = Array.isArray(rawSeriesData?.content)
    ? rawSeriesData.content
    : Array.isArray(rawSeriesData?.items)
      ? rawSeriesData.items
      : Array.isArray(rawSeriesData)
        ? rawSeriesData
        : [];
  const totalSeries = seriesList.length;
  const videoSeriesCount = seriesList.filter(
    (s) => s.contentType === "VIDEO"
  ).length;
  const comicSeriesCount = seriesList.filter(
    (s) => s.contentType === "COMIC"
  ).length;

  const totalViews = seriesList.reduce(
    (acc, item) => acc + (item.totalViews || 0),
    0
  );
  const totalSeriesSubs = seriesList.reduce(
    (acc, item) => acc + (item.totalSubscriptions || 0),
    0
  );

  const followerList = followersQuery.data?.content || [];
  const apiFollowerCount = ownCreatorQuery.data?.followerCount || 0;
  const listFollowerCount =
    (followersQuery.data as any)?.numberOfElements || followerList.length || 0;
  const followerCount = Math.max(
    apiFollowerCount,
    listFollowerCount,
    totalSeriesSubs
  );

  const filteredFollowerList = followerList.filter((f) =>
    (f.username || f.accountId || "")
      .toLowerCase()
      .includes(followerSearch.toLowerCase())
  );

  const walletBalance = walletQuery.data?.balance || 0;
  const totalEarned = walletQuery.data?.totalEarned || 0;
  const totalSpent = walletQuery.data?.totalSpent || 0;

  // Selected Series/Season/Episode for Comments Management
  const [commentsSeriesId, setCommentsSeriesId] = useState<string>("");
  const [commentsSeasonId, setCommentsSeasonId] = useState<string>("");
  const [commentsEpisodeId, setCommentsEpisodeId] = useState<string>("");

  const activeCommentsSeriesId =
    commentsSeriesId || seriesList[0]?.seriesId || "";

  const seasonsForCommentsQuery = useQuery({
    queryKey: ["creator-comments-seasons", activeCommentsSeriesId],
    queryFn: () => getPublicSeasons(activeCommentsSeriesId),
    enabled: Boolean(activeCommentsSeriesId),
  });

  const seasonsForComments = seasonsForCommentsQuery.data || [];
  const activeCommentsSeasonId =
    commentsSeasonId || seasonsForComments[0]?.seasonId || "";

  const episodesForCommentsQuery = useQuery({
    queryKey: ["creator-comments-episodes", activeCommentsSeasonId],
    queryFn: () => getPublicEpisodes(activeCommentsSeasonId),
    enabled: Boolean(activeCommentsSeasonId),
  });

  const episodesForComments = episodesForCommentsQuery.data || [];
  const activeCommentsEpisodeId =
    commentsEpisodeId || episodesForComments[0]?.episodeId || "";

  return (
    <div className="w-full space-y-6 py-6">
      {/* ================= CHANNEL INFO CARD ================= */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-[#2E1E1E] to-[#1E1E22] p-6 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(212,175,55,0.08),transparent_50%)]" />
        <div className="relative flex flex-col items-center gap-5 sm:flex-row">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[#D4AF37] bg-zinc-950 sm:h-20 sm:w-20">
            {profileUser?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileUser.avatarUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-2xl font-black uppercase text-[#D4AF37]">
                {displayName.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-1.5 text-center sm:text-left">
            <div className="flex flex-col items-center gap-2.5 sm:flex-row">
              <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                {displayName}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border bg-yellow-400/10 border-yellow-400/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#D4AF37] shadow-sm">
                <Award size={10} className="text-[#D4AF37]" /> Partner
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsFollowersModalOpen(true)}
              className="group text-left transition-opacity hover:opacity-90 focus:outline-none"
            >
              <p className="text-sm font-semibold text-zinc-400 transition-colors group-hover:text-[#D4AF37] flex items-center gap-1">
                {followersQuery.isLoading || ownCreatorQuery.isLoading ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Đang tải...
                  </span>
                ) : (
                  <>
                    <span>{formatNumber(followerCount)} người theo dõi</span>
                    <ChevronRight
                      size={14}
                      className="text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-[#D4AF37]"
                    />
                  </>
                )}
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* ================= TAB BAR ================= */}
      <div className="flex gap-1 overflow-x-auto border-b border-white/10 scrollbar-none">
        {(
          [
            { id: "overview", label: "Tổng quan" },
            { id: "content", label: "Nội dung" },
            { id: "comments", label: "Bình luận" },
            { id: "revenue", label: "Ví & Doanh thu" },
          ] as const
        ).map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative cursor-pointer px-5 pb-3.5 text-sm font-black transition-colors outline-none",
                isSelected ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {tab.label}
              {isSelected && (
                <span className="absolute bottom-0 left-5 right-5 h-0.5 rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* ================= TỔNG QUAN (OVERVIEW) TAB ================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black tracking-wide text-white">
              Số liệu phân tích kênh
            </h2>
            <p className="mt-1 text-xs font-semibold text-zinc-450">
              Dữ liệu thực tế từ nội dung và kênh của bạn
            </p>
          </div>

          {/* 4 Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Stat 1: Views */}
            <div className="rounded-2xl border border-white/5 bg-[#1C1C1F] p-5 transition-colors hover:border-white/10">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Tổng lượt xem
                </span>
                <Eye size={16} className="text-zinc-500" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                {seriesQuery.isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                ) : (
                  <span className="text-2xl font-black text-white">
                    {formatNumber(totalViews)}
                  </span>
                )}
              </div>
              <span className="mt-1 block text-[10px] font-semibold text-zinc-500">
                Từ {totalSeries} Series
              </span>
            </div>

            {/* Stat 2: Series Count */}
            <div className="rounded-2xl border border-white/5 bg-[#1C1C1F] p-5 transition-colors hover:border-white/10">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Tổng số Series
                </span>
                <Library size={16} className="text-zinc-500" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                {seriesQuery.isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                ) : (
                  <span className="text-2xl font-black text-white">
                    {totalSeries}
                  </span>
                )}
              </div>
              <span className="mt-1 block text-[10px] font-semibold text-zinc-500">
                {videoSeriesCount} Phim bộ • {comicSeriesCount} Truyện tranh
              </span>
            </div>

            {/* Stat 3: Followers */}
            <div
              onClick={() => setIsFollowersModalOpen(true)}
              className="group cursor-pointer rounded-2xl border border-white/5 bg-[#1C1C1F] p-5 transition-colors hover:border-[#D4AF37]/40"
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Người theo dõi
                </span>
                <Users
                  size={16}
                  className="text-zinc-500 transition-colors group-hover:text-[#D4AF37]"
                />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                {followersQuery.isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                ) : (
                  <span className="text-2xl font-black text-white transition-colors group-hover:text-[#D4AF37]">
                    {formatNumber(followerCount)}
                  </span>
                )}
              </div>
              <span className="mt-1 block flex items-center gap-1 text-[10px] font-semibold text-zinc-500 transition-colors group-hover:text-[#D4AF37]">
                Nhấp để xem danh sách <ChevronRight size={10} />
              </span>
            </div>

            {/* Stat 4: Revenue / Wallet */}
            <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#1C1C1F] p-5 shadow-lg shadow-yellow-500/5 transition-colors hover:border-[#D4AF37]/40">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Số dư Ví Coin
                </span>
                <Coins size={16} className="text-[#D4AF37]" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                {walletQuery.isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
                ) : (
                  <span className="text-2xl font-black text-[#D4AF37]">
                    {formatNumber(walletBalance)}
                  </span>
                )}
              </div>
              <span className="mt-1 block text-[10px] font-semibold text-zinc-500">
                Đã nhận: {formatNumber(totalEarned)} Coin
              </span>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-col items-center justify-around gap-6 rounded-2xl border border-white/5 bg-[#1C1C1F] p-5 sm:flex-row">
            <button
              onClick={() => onNavigate("create")}
              className="group flex w-full max-w-[160px] flex-col items-center justify-center rounded-xl p-3 text-center transition-colors hover:bg-white/[0.03]"
            >
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 transition-colors group-hover:bg-red-500/20">
                <Plus size={20} className="text-red-500" />
              </div>
              <span className="text-xs font-black text-zinc-200">
                Tạo Series mới
              </span>
            </button>

            <button
              onClick={() => onNavigate("series")}
              className="group flex w-full max-w-[160px] flex-col items-center justify-center rounded-xl p-3 text-center transition-colors hover:bg-white/[0.03]"
            >
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/20">
                <Library size={20} className="text-emerald-500" />
              </div>
              <span className="text-xs font-black text-zinc-200">
                Quản lý Series
              </span>
            </button>

            <button
              onClick={() => setActiveTab("revenue")}
              className="group flex w-full max-w-[160px] flex-col items-center justify-center rounded-xl p-3 text-center transition-colors hover:bg-white/[0.03]"
            >
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 transition-colors group-hover:bg-blue-500/20">
                <Coins size={20} className="text-blue-500" />
              </div>
              <span className="text-xs font-black text-zinc-200">Ví & Coin</span>
            </button>
          </div>

          {/* Combined Preview Sections */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Content Preview */}
            <div className="space-y-4 rounded-2xl border border-white/5 bg-[#1C1C1F] p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white">
                  Series vừa khởi tạo
                </h3>
                <button
                  onClick={() => setActiveTab("content")}
                  className="text-xs font-bold text-red-500 transition-colors hover:text-red-400"
                >
                  Xem tất cả
                </button>
              </div>
              <div className="space-y-3">
                {seriesQuery.isLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                  </div>
                ) : seriesList.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-500">
                    Chưa có series nào. Nhấp &quot;Tạo Series mới&quot; để bắt đầu!
                  </div>
                ) : (
                  seriesList.slice(0, 3).map((item) => {
                    const statusConfig =
                      statusBadgeMap[item.status] || statusBadgeMap.DRAFT;
                    return (
                      <div
                        key={item.seriesId}
                        onClick={() => onNavigate("series")}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]"
                      >
                        <div className="relative flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-800">
                          {item.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.coverUrl}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                          ) : item.contentType === "VIDEO" ? (
                            <Play size={18} className="text-red-400" />
                          ) : (
                            <BookOpen size={18} className="text-emerald-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-xs font-bold text-white">
                            {item.title}
                          </h4>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-[10px] font-medium text-zinc-400">
                              {item.contentType === "VIDEO"
                                ? "Phim bộ"
                                : "Truyện tranh"}
                            </span>
                            <span
                              className={cn(
                                "rounded border px-1.5 py-0.2 text-[8px] font-bold",
                                statusConfig.className
                              )}
                            >
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-[10px] font-bold text-zinc-400">
                          <div>{formatNumber(item.totalViews || 0)} lượt xem</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>            {/* Comments Preview */}
            <div className="space-y-4 rounded-2xl border border-white/5 bg-[#1C1C1F] p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white">
                  Bình luận & Phản hồi
                </h3>
                <button
                  onClick={() => setActiveTab("comments")}
                  className="text-xs font-bold text-red-500 transition-colors hover:text-red-400"
                >
                  Chi tiết
                </button>
              </div>

              {activeCommentsEpisodeId ? (
                <EpisodeCommentsSection episodeId={activeCommentsEpisodeId} />
              ) : (
                <div className="flex min-h-[120px] flex-col items-center justify-center space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
                  <MessageSquare className="h-8 w-8 text-zinc-600" />
                  <p className="text-xs font-medium text-zinc-400">
                    Chưa có bình luận mới nào trên các tác phẩm của bạn.
                  </p>
                  <span className="text-[10px] text-zinc-500">
                    Các bình luận mới từ khán giả sẽ xuất hiện tại đây.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= NỘI DUNG (CONTENT) TAB ================= */}
      {activeTab === "content" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black tracking-wide text-white">
                Tất cả tác phẩm của bạn ({seriesList.length})
              </h2>
              <p className="text-xs text-zinc-450 mt-0.5">
                Quản lý các bộ phim và bộ truyện tranh đã xuất bản trên TaleX
              </p>
            </div>
          </div>

          {seriesList.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#1C1C1F] py-16 text-center">
              <Film size={48} className="mb-3 text-zinc-600" />
              <h3 className="text-sm font-bold text-zinc-300">
                Chưa có tác phẩm nào
              </h3>
              <p className="mt-1 max-w-sm text-xs text-zinc-500">
                Hãy tạo bộ phim hoặc truyện tranh đầu tiên để bắt đầu thu hút lượt xem và doanh thu.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {seriesList.map((item) => {
                const statusConfig = getStatusBadge(item.status);
                return (
                  <div
                    key={item.seriesId}
                    className="group flex flex-col justify-between rounded-2xl border border-white/5 bg-[#1C1C1F] p-4 transition-all hover:border-[#D4AF37]/40 hover:bg-[#222226]"
                  >
                    <div className="space-y-3">
                      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-800">
                        {item.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.coverUrl}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            {item.contentType === "VIDEO" ? (
                              <Film size={32} className="text-zinc-600" />
                            ) : (
                              <BookOpen size={32} className="text-zinc-600" />
                            )}
                          </div>
                        )}
                        <span
                          className={cn(
                            "absolute top-2.5 right-2.5 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider backdrop-blur-md",
                            statusConfig.className
                          )}
                        >
                          {statusConfig.label}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                          {item.contentType === "VIDEO" ? "Phim bộ" : "Truyện tranh"}
                        </span>
                        <h3 className="truncate text-sm font-bold text-white mt-0.5">
                          {item.title}
                        </h3>
                        <p className="line-clamp-2 text-xs text-zinc-400 mt-1">
                          {item.description || "Chưa có mô tả nội dung."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Eye size={14} className="text-[#D4AF37]" />
                        <span>{formatNumber(item.totalViews || 0)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users size={14} className="text-[#D4AF37]" />
                        <span>{formatNumber(item.totalSubscriptions || 0)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= BÌNH LUẬN (COMMENTS) TAB ================= */}
      {activeTab === "comments" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black tracking-wide text-white">
              Quản lý bình luận tác phẩm
            </h2>
            <p className="mt-1 text-xs text-zinc-450">
              Xem, tương tác và phản hồi khán giả trên các tập phim và chương truyện của bạn
            </p>
          </div>

          {seriesList.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#1C1C1F] py-16 text-center">
              <MessageSquare size={48} className="mb-3 text-zinc-600" />
              <h3 className="text-sm font-bold text-zinc-300">
                Chưa có tác phẩm nào
              </h3>
              <p className="mt-1 max-w-sm text-xs text-zinc-500">
                Khi bạn xuất bản phim hoặc truyện tranh, bình luận của khán giả sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selectors Bar */}
              <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/5 bg-[#1C1C1F] p-4">
                {/* Series Select */}
                <div className="flex flex-col gap-1.5 min-w-[200px]">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Tác phẩm (Series)
                  </label>
                  <select
                    value={activeCommentsSeriesId}
                    onChange={(e) => {
                      setCommentsSeriesId(e.target.value);
                      setCommentsSeasonId("");
                      setCommentsEpisodeId("");
                    }}
                    className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-semibold text-white focus:border-[#D4AF37] focus:outline-none"
                  >
                    {seriesList.map((s) => (
                      <option key={s.seriesId} value={s.seriesId}>
                        {s.title} ({s.contentType === "VIDEO" ? "Phim" : "Truyện"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Season Select */}
                {seasonsForComments.length > 0 && (
                  <div className="flex flex-col gap-1.5 min-w-[160px]">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Phần / Season
                    </label>
                    <select
                      value={activeCommentsSeasonId}
                      onChange={(e) => {
                        setCommentsSeasonId(e.target.value);
                        setCommentsEpisodeId("");
                      }}
                      className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-semibold text-white focus:border-[#D4AF37] focus:outline-none"
                    >
                      {seasonsForComments.map((s) => (
                        <option key={s.seasonId} value={s.seasonId}>
                          Season {s.seasonNumber} - {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Episode Select */}
                {episodesForComments.length > 0 && (
                  <div className="flex flex-col gap-1.5 min-w-[200px]">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Tập
                    </label>
                    <select
                      value={activeCommentsEpisodeId}
                      onChange={(e) => setCommentsEpisodeId(e.target.value)}
                      className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-semibold text-white focus:border-[#D4AF37] focus:outline-none"
                    >
                      {episodesForComments.map((ep) => (
                        <option key={ep.episodeId} value={ep.episodeId}>
                          Tập {ep.episodeNumber}: {ep.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Comments Component */}
              {activeCommentsEpisodeId ? (
                <EpisodeCommentsSection episodeId={activeCommentsEpisodeId} />
              ) : (
                <div className="rounded-2xl border border-white/5 bg-[#1C1C1F] p-8 text-center text-xs text-zinc-500">
                  Series này hiện chưa có tập nào được phát hành.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= DOANH THU (REVENUE) TAB ================= */}
      {activeTab === "revenue" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black tracking-wide text-white">
              Quản lý tài chính & Ví Coin
            </h2>
            <p className="mt-1 text-xs font-semibold text-zinc-450">
              Xem dữ liệu thực tế về số dư Coin và lịch sử thu nhập của bạn
            </p>
          </div>

          <div
            onClick={() => onNavigate("monetization")}
            className="group flex cursor-pointer items-center rounded-2xl border border-[#D4AF37]/35 bg-[#1C1C1F] p-5 shadow-lg transition-colors hover:border-[#D4AF37]/60"
          >
            <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10">
              <Coins size={24} className="text-[#D4AF37]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black text-white">
                Trung tâm kiếm tiền Creator
              </h3>
              <p className="mt-1 text-xs font-semibold text-zinc-400">
                Quản lý các gói combo và chính sách mở khóa nội dung
              </p>
            </div>
            <ChevronRight
              size={20}
              className="text-[#D4AF37] transition-transform group-hover:translate-x-0.5"
            />
          </div>

          {/* Balance card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-800 to-zinc-950 p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(212,175,55,0.04),transparent_40%)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Số dư Coin hiện tại
            </span>
            <div className="mt-2 text-3xl font-black text-[#D4AF37]">
              {walletQuery.isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
              ) : (
                `${formatNumber(walletBalance)} Coin`
              )}
            </div>
            <span className="mt-1.5 block text-[10px] font-medium text-zinc-400">
              Tổng Coin đã kiếm: {formatNumber(totalEarned)} Coin • Tổng đã chi:{" "}
              {formatNumber(totalSpent)} Coin
            </span>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/coin-history"
                className="flex h-10 items-center justify-center rounded-xl bg-[#D4AF37] px-5 text-xs font-black uppercase tracking-wide text-stone-950 transition-all hover:bg-yellow-400 shadow-md shadow-yellow-500/10"
              >
                Xem Lịch sử Giao dịch
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ================= FOLLOWERS LIST MODAL ================= */}
      <Dialog
        open={isFollowersModalOpen}
        onOpenChange={setIsFollowersModalOpen}
      >
        <DialogContent className="max-w-md border border-white/10 bg-[#18181B] p-6 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black text-white">
              <Users className="text-[#D4AF37]" size={20} />
              Danh sách người theo dõi ({followerCount})
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Danh sách tài khoản đang theo dõi kênh của bạn
            </DialogDescription>
          </DialogHeader>

          {/* Search Input */}
          <div className="relative mt-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Tìm kiếm người theo dõi..."
              value={followerSearch}
              onChange={(e) => setFollowerSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          {/* Followers List */}
          <div className="mt-3 max-h-80 space-y-2.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
            {followersQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="mb-2 h-6 w-6 animate-spin text-[#D4AF37]" />
                <span className="text-xs text-zinc-400">
                  Đang tải danh sách...
                </span>
              </div>
            ) : filteredFollowerList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="mb-2 h-10 w-10 text-zinc-600" />
                <p className="text-xs font-bold text-zinc-300">
                  {followerSearch
                    ? "Không tìm thấy kết quả phù hợp"
                    : "Chưa có danh sách chi tiết"}
                </p>
                <p className="mt-1 max-w-xs text-[10px] text-zinc-500">
                  {followerSearch
                    ? "Thử tìm kiếm với từ khóa khác"
                    : "Khán giả nhấn Theo dõi kênh của bạn sẽ tự động hiển thị đầy đủ thông tin tại đây."}
                </p>
              </div>
            ) : (
              filteredFollowerList.map((follower) => (
                <div
                  key={follower.accountId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-zinc-900/50 p-3 transition-colors hover:bg-zinc-800/80"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-zinc-800 text-sm font-black text-[#D4AF37]">
                      {follower.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={follower.avatarUrl}
                          alt={follower.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        follower.username?.charAt(0).toUpperCase() || "U"
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-xs font-bold text-white">
                        {follower.username || follower.accountId}
                      </h4>
                      <p className="text-[10px] text-zinc-500">
                        {follower.followedAt
                          ? `Theo dõi từ ${new Date(follower.followedAt).toLocaleDateString("vi-VN")}`
                          : "Người theo dõi"}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-1 text-[10px] font-bold text-[#D4AF37]">
                    Follower
                  </span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
