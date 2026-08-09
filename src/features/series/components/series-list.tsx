"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type RefObject,
} from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  AlertCircle,
  Bookmark,
  Eye,
  Film,
  HelpCircle,
  Loader2,
  Play,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { usePublicSidebarStore } from "@/shared/stores/public-sidebar.store";
import { AdSlot } from "@/shared/ui/ad-slot";
import {
  getPublicSeriesList,
  type PublicSeriesItem,
} from "../api/series-api";

function getHeroImage(item?: PublicSeriesItem) {
  return (
    item?.bannerUrl ||
    item?.coverUrl ||
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1800&auto=format&fit=crop"
  );
}

export function SeriesList() {
  const [pageSize] = useState(12);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isSidebarOpen = usePublicSidebarStore((state) => state.isSidebarOpen);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["publicMovieSeriesInfinite", pageSize],
    queryFn: ({ pageParam = 1 }) =>
      getPublicSeriesList(pageParam, pageSize, "VIDEO"),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.isLast ? undefined : allPages.length + 1,
  });

  const seriesItems = (data?.pages.flatMap((page) => page.content) || []).filter(
    (item) => item.contentType?.toUpperCase() === "VIDEO",
  );
  const featuredMovie = seriesItems[0];
  const catalogGridClass = isSidebarOpen
    ? "grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
    : "grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5";

  useEffect(() => {
    const trigger = loadMoreRef.current;
    if (!trigger || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void fetchNextPage();
        }
      },
      { rootMargin: "420px 0px", threshold: 0.1 },
    );

    observer.observe(trigger);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060607] pb-20 text-gray-100 antialiased">
      <PageAtmosphere />
      <div className="relative z-10 mx-auto w-full max-w-[1320px] space-y-10 px-4 pt-8 md:px-8">
        {featuredMovie && (
          <FeaturedBanner
            item={featuredMovie}
            label="Cập nhật mới"
            primaryLabel="Xem ngay"
          />
        )}

        <AdSlot
          slotId="mock-series-top"
          format="horizontal"
          className="my-2"
        />

        <section>
          <SectionTitle
            eyebrow="Khám phá điện ảnh"
            title="Danh Sách Phim Đặc Sắc"
          />

          {isLoading && <ListSkeleton isSidebarOpen={isSidebarOpen} />}
          {isError && (
            <ErrorState
              message={
                error instanceof Error
                  ? error.message
                  : "Hệ thống gặp sự cố nhỏ, vui lòng thử lại."
              }
              onRetry={() => refetch()}
            />
          )}

          {!isLoading && !isError && (
            <>
              {seriesItems.length === 0 ? (
                <EmptyState title="Kho phim trống" />
              ) : (
                <div className={catalogGridClass}>
                  {seriesItems.map((movie) => (
                    <CatalogCard
                      key={movie.seriesId}
                      item={movie}
                    />
                  ))}
                </div>
              )}

              <InfiniteLoadTrigger
                refEl={loadMoreRef}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function FeaturedBanner({
  item,
  label,
  primaryLabel,
}: {
  item: PublicSeriesItem;
  label: string;
  primaryLabel: string;
}) {
  const blobFrameRef = useRef<number | null>(null);
  const pendingBlobRef = useRef({ x: "50%", y: "50%" });

  useEffect(() => {
    return () => {
      if (blobFrameRef.current !== null) {
        window.cancelAnimationFrame(blobFrameRef.current);
      }
    };
  }, []);

  const handleBlobMove = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const target = event.currentTarget;
    pendingBlobRef.current = {
      x: `${event.clientX - rect.left}px`,
      y: `${event.clientY - rect.top}px`,
    };

    if (blobFrameRef.current !== null) return;

    blobFrameRef.current = window.requestAnimationFrame(() => {
      target.style.setProperty("--blob-x", pendingBlobRef.current.x);
      target.style.setProperty("--blob-y", pendingBlobRef.current.y);
      blobFrameRef.current = null;
    });
  };

  return (
    <section
      onMouseMove={handleBlobMove}
      className="group/banner relative min-h-[460px] overflow-hidden rounded-3xl border border-white/10 bg-[#121214] shadow-[0_24px_80px_rgba(0,0,0,0.4)] [--blob-x:50%] [--blob-y:50%]"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${getHeroImage(item)})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0C] via-[#0B0B0C]/85 to-[#0B0B0C]/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C] via-transparent to-transparent" />
      <div
        className="pointer-events-none absolute left-0 top-0 z-[1] h-56 w-72 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(212,175,55,0.28),rgba(125,211,252,0.16)_40%,rgba(168,85,247,0.1)_62%,transparent_76%)] opacity-0 blur-2xl transition-opacity duration-300 will-change-transform group-hover/banner:opacity-100"
        style={{
          transform:
            "translate3d(var(--blob-x), var(--blob-y), 0) translate(-50%, -50%)",
        }}
      />

      <div className="relative z-10 flex min-h-[460px] max-w-3xl flex-col justify-center px-6 py-12 md:px-12">
        <span className="mb-5 inline-flex w-fit rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#D4AF37]">
          {label}
        </span>
        <h1 className="font-heading text-4xl font-extrabold leading-none text-white md:text-6xl">
          {item.title}
        </h1>
        <p className="mt-5 line-clamp-3 max-w-2xl text-sm font-medium leading-relaxed text-white/68 md:text-base">
          {item.description ||
            "Bộ phim mới nhất vừa được cập nhật trên TaleX."}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-bold text-white/70">
          <span className="inline-flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#D4AF37]" />
            {(item.analyticData?.views ?? (item as any).views ?? item.totalViews ?? 0).toLocaleString("vi-VN")} lượt xem
          </span>
          <span className="inline-flex items-center gap-2">
            <Star className="h-4 w-4 fill-[#D4AF37] text-[#D4AF37]" />
            {item.averageRating != null && item.averageRating > 0 ? item.averageRating.toFixed(1) : "4.9"}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-widest">
            Tập mới nhất
          </span>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/series/${item.seriesId}`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-black text-black transition hover:bg-[#E5C158]"
          >
            <Play className="h-5 w-5 fill-black" />
            {primaryLabel}
          </Link>
          <Link
            href="/bookmarks"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/15"
          >
            <Bookmark className="h-5 w-5" />
            Bookmark
          </Link>
        </div>
      </div>
    </section>
  );
}

function CatalogCard({ item }: { item: PublicSeriesItem }) {
  const views = item.analyticData?.views ?? (item as any).views ?? item.totalViews ?? 0;
  return (
    <Link href={`/series/${item.seriesId}`} className="group block min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.2rem] border border-white/[0.07] bg-[#121214] shadow-[0_16px_42px_rgba(0,0,0,0.3)] transition-all duration-500 group-hover:scale-[1.012] group-hover:border-[#D4AF37]/50">
        {item.coverUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
            style={{ backgroundImage: `url(${item.coverUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-white/[0.02] to-white/[0.06] text-center">
            <Film className="mb-2 h-9 w-9 text-white/25" />
            <span className="text-[11px] text-white/35">
              No Poster Available
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060607] via-black/12 to-transparent" />
        <div className="absolute left-3 top-3 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#D4AF37]">
          {item.ageRating || "EVERYONE"}
        </div>
        <div className="absolute right-3 top-3 flex h-8 items-center gap-1 rounded-full border border-[#D4AF37]/35 bg-black/60 px-2 text-[#D4AF37] backdrop-blur-md">
          <Star className="h-4 w-4 fill-current" />
          {item.averageRating != null && item.averageRating > 0 ? (
            <span className="text-xs font-black text-white">{item.averageRating.toFixed(1)}</span>
          ) : null}
        </div>
        <div className="absolute inset-0 flex scale-75 items-center justify-center opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D4AF37] text-black shadow-[0_0_30px_rgba(212,175,55,0.5)]">
            <Play className="ml-0.5 h-6 w-6 fill-black" />
          </div>
        </div>
        <div className="absolute bottom-3 right-3 flex items-center text-xs font-bold text-white/90">
          <span className="rounded-lg bg-black/65 px-2.5 py-1 text-xs font-black backdrop-blur-md shadow-md">
            <Eye className="mr-1.5 inline h-3.5 w-3.5 text-[#D4AF37]" />
            {views.toLocaleString("vi-VN")}
          </span>
        </div>
      </div>
      <h3 className="mt-3 line-clamp-1 text-base font-black text-white group-hover:text-[#D4AF37]">
        {item.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-relaxed text-white/45">
        {item.description || "Bấm để xem chi tiết và danh sách tập phim."}
      </p>
    </Link>
  );
}

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-6">
      <p className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
        <Sparkles className="h-3.5 w-3.5" />
        {eyebrow}
      </p>
      <h2 className="font-heading text-2xl font-black text-white md:text-3xl">
        {title}
      </h2>
    </div>
  );
}

function ListSkeleton({ isSidebarOpen }: { isSidebarOpen: boolean }) {
  const skeletonGridClass = isSidebarOpen
    ? "grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
    : "grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5";

  return (
    <div className={skeletonGridClass}>
      {Array.from({ length: 8 }).map((_, idx) => (
        <div key={idx} className="space-y-3">
          <div className="aspect-[4/5] rounded-[1.2rem] bg-white/[0.04]" />
          <div className="h-4 w-4/5 rounded bg-white/[0.04]" />
          <div className="h-3 w-2/3 rounded bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

function PageAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(212,175,55,0.14),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(59,130,246,0.08),transparent_30%),linear-gradient(180deg,#070707_0%,#0b0b0d_54%,#050506_100%)]" />
      <div
        className="absolute inset-x-0 top-0 h-[620px] bg-cover bg-center opacity-[0.11] blur-[1px]"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2000&auto=format&fit=crop)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-[#060607]/82 to-[#060607]" />
      <div className="absolute -left-32 top-36 h-72 w-[760px] rotate-[-14deg] rounded-[100%] border-t border-[#D4AF37]/16 blur-[0.3px]" />
      <div className="absolute right-[-220px] top-16 h-[420px] w-[900px] rotate-[18deg] rounded-[100%] border-t border-cyan-200/10" />
      <div className="absolute bottom-24 left-1/4 h-56 w-[720px] rotate-[8deg] rounded-[100%] border-t border-fuchsia-200/8" />
    </div>
  );
}

function InfiniteLoadTrigger({
  refEl,
  hasNextPage,
  isFetchingNextPage,
}: {
  refEl: RefObject<HTMLDivElement | null>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}) {
  return (
    <div
      ref={refEl}
      className="mt-12 flex min-h-20 items-center justify-center border-t border-white/[0.06] pt-8"
    >
      {isFetchingNextPage ? (
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/55">
          <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
          Đang tải thêm phim
        </span>
      ) : hasNextPage ? (
        <span className="text-xs font-bold text-white/35">
          Cuộn xuống để xem thêm
        </span>
      ) : (
        <span className="text-xs font-bold text-white/25">
          Đã hết danh sách phim
        </span>
      )}
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="py-24 text-center">
      <HelpCircle className="mx-auto mb-4 h-10 w-10 text-white/25" />
      <h3 className="text-lg font-bold text-white">{title}</h3>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-400" />
      <h3 className="mb-2 text-xl font-bold text-white">
        Không thể tải danh sách
      </h3>
      <p className="mb-6 text-sm text-white/55">{message}</p>
      <button
        onClick={onRetry}
        className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black"
      >
        Thử lại
      </button>
    </div>
  );
}
