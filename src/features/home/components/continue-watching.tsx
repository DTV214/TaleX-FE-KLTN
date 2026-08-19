"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Film,
  History,
  Play,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
  getRecentWatchSessions,
  type WatchSessionItem,
} from "@/features/playback/api/watch-sessions-api";
import {
  getPublicSeriesDetail,
  type PublicSeriesItem,
} from "@/features/series/api/series-api";
import { cn } from "@/shared/utils/utils";

const HOMEPAGE_HISTORY_LIMIT = 8;

function formatWatchTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "0 phút";
  const mins = Math.floor(seconds / 60);
  if (mins <= 0) return "Dưới 1 phút";
  if (mins < 60) return `${mins} phút`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins ? `${hours} giờ ${remainMins} phút` : `${hours} giờ`;
}

function getProgress(session: WatchSessionItem) {
  if (session.heartbeatCount > 0) {
    return Math.min(94, Math.max(18, session.heartbeatCount * 7));
  }

  if (session.currentPosition > 0) {
    return Math.min(94, Math.max(14, Math.round(session.currentPosition) % 100));
  }

  return 22;
}

function getSessionHref(session: WatchSessionItem) {
  const episode = session.episode;
  if (!episode) return "/history";
  return episode.contentType === "COMIC"
    ? `/read/${episode.episodeId}`
    : `/watch/${episode.episodeId}`;
}

export function ContinueWatching() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [activeIndex, setActiveIndex] = useState(0);

  const sessionsQuery = useQuery({
    queryKey: ["home", "recent-watch-sessions"],
    queryFn: () => getRecentWatchSessions(0, HOMEPAGE_HISTORY_LIMIT),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const sessions = useMemo(
    () => sessionsQuery.data?.content.filter((item) => item.episode) ?? [],
    [sessionsQuery.data?.content],
  );

  const seriesIds = useMemo(() => {
    const ids = new Set<string>();
    sessions.forEach((session) => {
      if (session.episode?.seriesId) {
        ids.add(session.episode.seriesId);
      }
    });
    return Array.from(ids);
  }, [sessions]);

  const seriesQueries = useQueries({
    queries: seriesIds.map((seriesId) => ({
      queryKey: ["home", "continue-watching-series", seriesId],
      queryFn: () => getPublicSeriesDetail(seriesId),
      enabled: isAuthenticated,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const seriesMap = useMemo(() => {
    const next: Record<string, PublicSeriesItem> = {};
    seriesIds.forEach((seriesId, index) => {
      const series = seriesQueries[index]?.data;
      if (series) {
        next[seriesId] = series;
      }
    });
    return next;
  }, [seriesIds, seriesQueries]);

  if (!isAuthenticated || sessions.length === 0) {
    return null;
  }

  const orderedSessions = [
    ...sessions.slice(activeIndex),
    ...sessions.slice(0, activeIndex),
  ];
  const hasCarousel = sessions.length > 1;

  function moveActive(direction: "prev" | "next") {
    setActiveIndex((current) => {
      if (direction === "prev") {
        return current === 0 ? sessions.length - 1 : current - 1;
      }
      return current === sessions.length - 1 ? 0 : current + 1;
    });
  }

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#101012]/86 p-5 md:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(212,175,55,0.12),transparent_34%),radial-gradient(circle_at_90%_18%,rgba(255,255,255,0.08),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
      <div className="relative z-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/22 bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.12)]">
              <History className="h-5 w-5" />
            </span>
            <h2 className="font-heading text-3xl font-black leading-tight text-white md:text-4xl">
              Tiếp tục xem
            </h2>
          </div>
          <Link
            href="/history"
            prefetch={false}
            className="group hidden shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-black text-white/70 transition hover:border-[#D4AF37]/45 hover:text-[#F6D969] sm:inline-flex"
          >
            Xem tất cả
            <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>

      {hasCarousel ? (
        <>
          <button
            type="button"
            onClick={() => moveActive("prev")}
            aria-label="Lịch sử trước đó"
            className="absolute left-4 top-[58%] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/68 text-white shadow-[0_10px_28px_rgba(0,0,0,0.35)] transition hover:border-[#D4AF37]/50 hover:text-[#F6D969] md:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => moveActive("next")}
            aria-label="Lịch sử tiếp theo"
            className="absolute right-4 top-[58%] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/68 text-white shadow-[0_10px_28px_rgba(0,0,0,0.35)] transition hover:border-[#D4AF37]/50 hover:text-[#F6D969] md:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      ) : null}

      <div className="relative z-10 flex items-start gap-5 overflow-x-auto pb-1 pr-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {orderedSessions.map((session, index) => {
          const episode = session.episode;
          const series = seriesMap[episode.seriesId];
          const image =
            episode.thumbnail ||
            series?.bannerUrl ||
            series?.coverUrl ||
            "https://placehold.co/640x360/111113/D4AF37?text=TaleX";
          const isComic = episode.contentType === "COMIC";
          const progress = getProgress(session);
          const label = isComic
            ? session.currentPosition
              ? `Trang ${Math.round(session.currentPosition)}`
              : `Đã đọc ${formatWatchTime(session.watchDuration)}`
            : `${formatWatchTime(session.watchDuration)} đã xem`;
          const isActive = index === 0;

          return (
            <Link
              key={`${session.id}-${episode.episodeId}`}
              href={getSessionHref(session)}
              className={cn(
                "group relative flex shrink-0 flex-col overflow-hidden rounded-[1.2rem] border border-white/[0.08] bg-[#121214] shadow-[0_16px_42px_rgba(0,0,0,0.3)] transition duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/45",
                isActive
                  ? "animate__animated animate__fadeIn w-[320px] sm:w-[430px] lg:w-[480px] [--animate-duration:420ms]"
                  : "w-[280px] sm:w-[330px] lg:w-[360px]",
              )}
            >
              <div className="relative aspect-video overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/24 to-transparent" />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-black text-white/82">
                  {isComic ? (
                    <BookOpen className="h-3 w-3 text-[#D4AF37]" />
                  ) : (
                    <Film className="h-3 w-3 text-[#D4AF37]" />
                  )}
                  {isComic ? "Truyện" : "Video"}
                </span>
                <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white opacity-0 transition group-hover:opacity-100">
                  <Play className="h-4 w-4 fill-current" />
                </span>
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/18">
                  <div
                    className="h-full bg-[#D4AF37]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div
                className={cn(
                  "flex flex-col justify-between space-y-1 px-3 pb-4 pt-3",
                  isActive ? "min-h-[112px]" : "min-h-[106px]",
                )}
              >
                <h3
                  className={cn(
                    "line-clamp-1 font-black text-white transition group-hover:text-[#F6D969]",
                    isActive ? "text-lg md:text-xl" : "text-sm md:text-base",
                  )}
                >
                  {series?.title || episode.title}
                </h3>
                <p className="line-clamp-1 text-xs font-semibold text-white/45">
                  Tập {episode.episodeNumber}: {episode.title}
                </p>
                <p className="flex items-center gap-1 text-[11px] font-bold text-white/38">
                  <Clock className="h-3.5 w-3.5 text-[#D4AF37]/80" />
                  {label}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
      </div>
    </section>
  );
}
