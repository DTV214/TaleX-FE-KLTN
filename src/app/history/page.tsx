"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useInfiniteQuery, useQueries } from "@tanstack/react-query";
import {
  getRecentWatchSessions,
  WatchSessionItem,
} from "@/features/playback/api/watch-sessions-api";
import {
  getPublicSeriesDetail,
  PublicSeriesItem,
} from "@/features/series/api/series-api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  History,
  Loader2,
  Play,
  BookOpen,
  Clock,
  Film,
  Sparkles,
  Star,
  Heart,
  Clapperboard,
  Flame,
  Tag,
} from "lucide-react";
import { cn } from "@/shared/utils/utils";

type TabType = "ALL" | "VIDEO" | "COMIC";

function formatWatchTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
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
}

function PageAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.14]"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2200&auto=format&fit=crop)",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(212,175,55,0.18),transparent_32%),radial-gradient(circle_at_88%_18%,rgba(151,176,255,0.12),transparent_28%),linear-gradient(180deg,rgba(18,16,13,0.7)_0%,rgba(8,8,8,0.93)_48%,#080808_100%)]" />
      <div className="absolute -left-28 top-28 h-72 w-[720px] rotate-[-10deg] rounded-[100%] border-t border-[#D4AF37]/14" />
      <div className="absolute right-[-180px] top-20 h-[380px] w-[760px] rotate-[16deg] rounded-[100%] border-t border-cyan-100/10" />

      {/* Floating Translucent Lucide Icons */}
      <Sparkles className="absolute left-[8%] top-[8%] h-7 w-7 text-[#D4AF37]/20" />
      <Star className="absolute right-[12%] top-[12%] h-8 w-8 text-[#D4AF37]/18" />
      <Clapperboard className="absolute left-[44%] top-[10%] h-8 w-8 rotate-[-12deg] text-white/10" />
      <BookOpen className="absolute left-[6%] top-[35%] h-8 w-8 text-cyan-100/14" />
      <Heart className="absolute right-[8%] top-[30%] h-7 w-7 text-rose-300/14" />
      <Film className="absolute left-[38%] top-[45%] h-9 w-9 rotate-[14deg] text-amber-200/12" />
      <Flame className="absolute right-[22%] top-[55%] h-8 w-8 text-orange-400/14" />
      <Tag className="absolute left-[14%] top-[70%] h-8 w-8 rotate-[-18deg] text-emerald-200/12" />
      <Sparkles className="absolute right-[10%] top-[8%] h-9 w-9 text-[#D4AF37]/20" />
      <Star className="absolute left-[48%] top-[85%] h-8 w-8 text-[#D4AF37]/16" />
    </div>
  );
}

export default function HistoryPage() {
  const authUser = useAuthStore((state) => state.user);
  const router = useRouter();
  const observerRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [redirectingId, setRedirectingId] = useState<string | null>(null);

  // 1. Fetch danh sách phiên xem gần đây (lướt vô hạn với useInfiniteQuery)
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["recentWatchSessionsInfinite"],
    queryFn: ({ pageParam = 0 }) => getRecentWatchSessions(pageParam, 20),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.last ? undefined : lastPage.number + 1;
    },
    enabled: !!authUser,
  });

  const watchSessions: WatchSessionItem[] = useMemo(
    () => data?.pages.flatMap((page) => page.content) || [],
    [data]
  );

  // 2. Thu thập danh sách các seriesId duy nhất để fetch thông tin series (dùng fallback ảnh cover/poster)
  const uniqueSeriesIds = useMemo(() => {
    const set = new Set<string>();
    watchSessions.forEach((session) => {
      if (session.episode?.seriesId) {
        set.add(session.episode.seriesId);
      }
    });
    return Array.from(set);
  }, [watchSessions]);

  const seriesQueries = useQueries({
    queries: uniqueSeriesIds.map((seriesId) => ({
      queryKey: ["publicSeriesDetail", seriesId],
      queryFn: () => getPublicSeriesDetail(seriesId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Map seriesId -> PublicSeriesItem
  const seriesMap = useMemo(() => {
    const map: Record<string, PublicSeriesItem> = {};
    uniqueSeriesIds.forEach((id, index) => {
      const result = seriesQueries[index]?.data;
      if (result) {
        map[id] = result;
      }
    });
    return map;
  }, [uniqueSeriesIds, seriesQueries]);

  // 3. Infinite scroll observer
  useEffect(() => {
    const triggerEl = observerRef.current;
    if (!triggerEl || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(triggerEl);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Lọc danh sách theo Tab
  const filteredSessions = useMemo(() => {
    return watchSessions.filter((item) => {
      if (activeTab === "ALL") return true;
      return item.episode?.contentType === activeTab;
    });
  }, [watchSessions, activeTab]);

  if (!authUser) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#12100d] pb-24 text-gray-100 antialiased flex flex-col items-center justify-center">
        <PageAtmosphere />
        <div className="relative z-10 mx-auto max-w-md px-4 py-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.15)]">
            <History className="h-10 w-10" />
          </div>
          <h1 className="mb-3 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            Lịch sử xem
          </h1>
          <p className="mx-auto mb-8 max-w-sm text-sm text-gray-400 leading-relaxed">
            Vui lòng đăng nhập để xem lại lịch sử các video và truyện tranh bạn đã xem gần đây.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-3 rounded-2xl bg-[#D4AF37] hover:bg-[#E5C158] text-black font-extrabold transition-all duration-300 shadow-[0_6px_25px_rgba(212,175,55,0.3)] hover:scale-105"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#12100d] pb-24 text-gray-100 antialiased">
      <PageAtmosphere />

      <main className="relative z-10 mx-auto w-full max-w-[1680px] px-4 pt-8 md:px-8">
        {/* Header */}
        <div className="mb-10 flex flex-col justify-between gap-6 border-b border-white/10 pb-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.12)]">
                <History className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                  Lịch sử xem gần đây
                </h1>
                <p className="mt-0.5 text-xs text-gray-400 md:text-sm">
                  Quản lý và tiếp tục thưởng thức các tập phim và truyện tranh bạn đã theo dõi
                </p>
              </div>
            </div>
          </div>

          {/* Tab Filters */}
          <div className="flex items-center gap-1.5 self-start rounded-2xl border border-white/10 bg-[#18181c]/90 p-1.5 backdrop-blur-md shadow-inner md:self-auto">
            <button
              onClick={() => setActiveTab("ALL")}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer",
                activeTab === "ALL"
                  ? "bg-[#D4AF37] text-black shadow-md"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              Tất cả
            </button>
            <button
              onClick={() => setActiveTab("VIDEO")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer",
                activeTab === "VIDEO"
                  ? "bg-[#D4AF37] text-black shadow-md"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Film className="h-3.5 w-3.5" />
              Video
            </button>
            <button
              onClick={() => setActiveTab("COMIC")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer",
                activeTab === "COMIC"
                  ? "bg-[#D4AF37] text-black shadow-md"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Truyện tranh
            </button>
          </div>
        </div>

        {/* Content State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#D4AF37]" />
            <p className="text-sm font-semibold text-gray-400 animate-pulse">
              Đang tải lịch sử xem...
            </p>
          </div>
        ) : isError ? (
          <div className="mx-auto max-w-lg rounded-3xl border border-red-500/20 bg-[#18181c]/80 p-8 text-center backdrop-blur-md">
            <p className="mb-3 text-sm font-bold text-red-400">
              Không thể tải danh sách phiên xem.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-white/10 px-5 py-2 text-xs font-bold text-white transition hover:bg-white/20"
            >
              Tải lại trang
            </button>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-[#18181c]/60 p-12 text-center backdrop-blur-md shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-gray-500 border border-white/5">
              <History className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Chưa có lịch sử xem</h3>
            <p className="mx-auto mt-1.5 max-w-xs text-xs text-gray-400 leading-relaxed">
              {activeTab === "ALL"
                ? "Bạn chưa xem tập phim hoặc bộ truyện nào gần đây."
                : activeTab === "VIDEO"
                ? "Bạn chưa xem video nào gần đây."
                : "Bạn chưa đọc truyện tranh nào gần đây."}
            </p>
            <Link
              href="/series"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#D4AF37] hover:bg-[#E5C158] px-6 py-2.5 text-xs font-extrabold text-black transition-all shadow-[0_4px_20px_rgba(212,175,55,0.25)] hover:scale-105"
            >
              Khám phá nội dung
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredSessions.map((session, index) => {
              const ep = session.episode;
              if (!ep) return null;

              const seriesInfo = seriesMap[ep.seriesId];
              const displayImage =
                ep.thumbnail ||
                seriesInfo?.coverUrl ||
                seriesInfo?.bannerUrl ||
                "https://placehold.co/600x340/18181b/fff?text=TaleX";

              const isComic = ep.contentType === "COMIC";
              const watchLink = isComic
                ? `/read/${ep.episodeId}`
                : `/watch/${ep.episodeId}`;
              const seriesTitle = seriesInfo?.title || "Phim bộ";

              return (
                <div
                  key={`${session.id}-${index}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#18181c]/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-[#D4AF37]/50 hover:shadow-[0_8px_30px_rgba(212,175,55,0.12)] hover:-translate-y-1"
                >
                  {/* Thumbnail Header */}
                  <div className="relative aspect-video w-full overflow-hidden bg-black/60">
                    <img
                      src={displayImage}
                      alt={ep.title}
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (
                          seriesInfo?.coverUrl &&
                          target.src !== seriesInfo.coverUrl
                        ) {
                          target.src = seriesInfo.coverUrl;
                        } else if (
                          seriesInfo?.bannerUrl &&
                          target.src !== seriesInfo.bannerUrl
                        ) {
                          target.src = seriesInfo.bannerUrl;
                        }
                      }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 transition group-hover:opacity-60" />

                    {/* Content Type Badge */}
                    <div className="absolute left-3 top-3 z-10">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide backdrop-blur-md border shadow-sm",
                          isComic
                            ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                            : "bg-red-500/20 text-red-300 border-red-500/30"
                        )}
                      >
                        {isComic ? (
                          <>
                            <BookOpen className="h-3 w-3" /> Truyện
                          </>
                        ) : (
                          <>
                            <Film className="h-3 w-3" /> Video
                          </>
                        )}
                      </span>
                    </div>

                    {/* Play / Read Overlay Button */}
                    <Link
                      href={watchLink}
                      className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition duration-300 group-hover:opacity-100"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)] transition duration-300 transform scale-90 group-hover:scale-100">
                        {redirectingId === session.id ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : isComic ? (
                          <BookOpen className="h-5 w-5" />
                        ) : (
                          <Play className="ml-0.5 h-5 w-5 fill-current" />
                        )}
                      </div>
                    </Link>
                  </div>

                  {/* Info Content */}
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      {/* Series Title */}
                      <div className="mb-1 truncate text-xs font-bold text-[#D4AF37]">
                        {seriesTitle}
                      </div>

                      {/* Episode Title */}
                      <h3 className="line-clamp-1 text-sm font-bold text-white transition group-hover:text-[#D4AF37]">
                        {isComic ? `Chương ${ep.episodeNumber}: ` : `Tập ${ep.episodeNumber}: `}
                        {ep.title}
                      </h3>
                    </div>

                    {/* Meta Stats */}
                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5 text-gray-300 font-medium">
                        <Clock className="h-3.5 w-3.5 text-[#D4AF37]" />
                        <span>
                          {isComic
                            ? session.currentPosition
                              ? `Trang ${Math.round(session.currentPosition)}`
                              : `Đã đọc ${formatWatchTime(session.watchDuration)}`
                            : formatWatchTime(session.watchDuration)}
                        </span>
                      </div>

                      <span className="text-[11px] text-gray-500">
                        {formatDate(session.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        <div ref={observerRef} className="mt-8 flex h-10 items-center justify-center">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
              <span>Đang tải thêm...</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
