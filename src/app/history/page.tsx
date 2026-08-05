"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useInfiniteQuery, useQueries } from "@tanstack/react-query";
import { getRecentWatchSessions, WatchSessionItem } from "@/features/playback/api/watch-sessions-api";
import { getPublicSeriesDetail, PublicSeriesItem } from "@/features/series/api/series-api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { History, Loader2, Play, BookOpen, Clock, Film, ExternalLink } from "lucide-react";
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

  const handleWatchAgain = (session: WatchSessionItem) => {
    const ep = session.episode;
    if (!ep) return;
    setRedirectingId(session.id);
    if (ep.contentType === "COMIC") {
      router.push(`/read/${ep.episodeId}`);
    } else {
      router.push(`/watch/${ep.episodeId}`);
    }
  };

  if (!authUser) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mx-auto mb-4 border border-neutral-800 text-neutral-400">
          <History className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Lịch sử xem</h1>
        <p className="text-neutral-400 max-w-md mx-auto mb-6">
          Vui lòng đăng nhập để xem lại lịch sử các video và truyện tranh bạn đã xem gần đây.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-medium transition"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
              <History className="w-6 h-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Lịch sử xem gần đây
            </h1>
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            Quản lý và tiếp tục xem các nội dung bạn đã theo dõi
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-xl border border-neutral-800 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("ALL")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition",
              activeTab === "ALL"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-400 hover:text-white"
            )}
          >
            Tất cả
          </button>
          <button
            onClick={() => setActiveTab("VIDEO")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition",
              activeTab === "VIDEO"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-400 hover:text-white"
            )}
          >
            <Film className="w-4 h-4" />
            Video
          </button>
          <button
            onClick={() => setActiveTab("COMIC")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition",
              activeTab === "COMIC"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-400 hover:text-white"
            )}
          >
            <BookOpen className="w-4 h-4" />
            Truyện tranh
          </button>
        </div>
      </div>

      {/* Content State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-rose-500" />
          <p className="text-sm">Đang tải lịch sử xem...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-16 bg-neutral-900/50 rounded-2xl border border-neutral-800">
          <p className="text-rose-400 mb-2">Không thể tải danh sách phiên xem.</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-neutral-400 underline hover:text-white"
          >
            Tải lại trang
          </button>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900/40 rounded-2xl border border-neutral-800/80">
          <History className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-neutral-300">Chưa có lịch sử xem</h3>
          <p className="text-sm text-neutral-500 mt-1 max-w-sm mx-auto">
            {activeTab === "ALL"
              ? "Bạn chưa xem tập phim hoặc bộ truyện nào gần đây."
              : activeTab === "VIDEO"
              ? "Bạn chưa xem video nào gần đây."
              : "Bạn chưa đọc truyện tranh nào gần đây."}
          </p>
          <Link
            href="/series"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-sm font-medium text-white transition"
          >
            Khám phá nội dung
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSessions.map((session, index) => {
            const ep = session.episode;
            if (!ep) return null;

            const seriesInfo = seriesMap[ep.seriesId];
            // Lấy thumbnail tập phim, nếu null thì mặc định dùng cover/poster của series
            const displayImage =
              ep.thumbnail ||
              seriesInfo?.coverUrl ||
              seriesInfo?.bannerUrl ||
              "https://placehold.co/600x340/18181b/fff?text=TaleX";

            const isComic = ep.contentType === "COMIC";
            const watchLink = isComic ? `/read/${ep.episodeId}` : `/watch/${ep.episodeId}`;
            const seriesTitle = seriesInfo?.title || "Phim bộ";

            return (
              <div
                key={`${session.id}-${index}`}
                className="group relative bg-neutral-900/70 rounded-xl border border-neutral-800/80 hover:border-neutral-700 overflow-hidden transition-all duration-200 flex flex-col"
              >
                {/* Thumbnail Header */}
                <div className="relative aspect-video w-full bg-neutral-950 overflow-hidden">
                  <img
                    src={displayImage}
                    alt={ep.title}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    onError={(e) => {
                      // Fallback nếu ảnh hỏng
                      const target = e.currentTarget;
                      if (seriesInfo?.coverUrl && target.src !== seriesInfo.coverUrl) {
                        target.src = seriesInfo.coverUrl;
                      } else if (seriesInfo?.bannerUrl && target.src !== seriesInfo.bannerUrl) {
                        target.src = seriesInfo.bannerUrl;
                      }
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition" />

                  {/* Content Type Badge */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold text-white backdrop-blur-md shadow-sm",
                        isComic ? "bg-amber-600/90" : "bg-rose-600/90"
                      )}
                    >
                      {isComic ? (
                        <>
                          <BookOpen className="w-3 h-3" /> Truyện
                        </>
                      ) : (
                        <>
                          <Film className="w-3 h-3" /> Video
                        </>
                      )}
                    </span>
                  </div>

                  {/* Play / Read Overlay Button */}
                  <Link
                    href={watchLink}
                    className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200 bg-black/40 backdrop-blur-[2px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition">
                      {redirectingId === session.id ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : isComic ? (
                        <BookOpen className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </div>
                  </Link>
                </div>

                {/* Info Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Series Title */}
                    <div className="text-xs font-medium text-rose-400 truncate mb-0.5">
                      {seriesTitle}
                    </div>

                    {/* Episode Title */}
                    <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-rose-300 transition">
                      Tập {ep.episodeNumber}: {ep.title}
                    </h3>
                  </div>

                  {/* Meta Stats */}
                  <div className="mt-3 pt-2.5 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-neutral-500" />
                      <span>
                        {isComic
                          ? session.currentPosition
                            ? `Trang ${Math.round(session.currentPosition)}`
                            : `Đã đọc ${formatWatchTime(session.watchDuration)}`
                          : formatWatchTime(session.watchDuration)}
                      </span>
                    </div>

                    <span className="text-[11px] text-neutral-500">
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
      <div ref={observerRef} className="h-10 flex items-center justify-center mt-6">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
            <span>Đang tải thêm...</span>
          </div>
        )}
      </div>
    </div>
  );
}
