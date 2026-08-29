"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  BookOpen,
  Clapperboard,
  Eye,
  Film,
  Flame,
  Heart,
  Play,
  Sparkles,
  Star,
  Tag,
} from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { usePublicSidebarStore } from "@/shared/stores/public-sidebar.store";
import { useRecommendationFeedInfinite } from "@/features/recommendations/hooks/use-home-feed";
import { AdSlot } from "@/shared/ui/ad-slot";
import { searchSeries } from "@/features/search/api/search-api";
import type { SearchSeries } from "@/features/search/types/search.types";
import { cn } from "@/shared/utils/utils";

function getHeroImage(item?: SearchSeries) {
  return (
    item?.bannerUrl ||
    item?.coverUrl ||
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1800&auto=format&fit=crop"
  );
}

export function SeriesList() {
  const isSidebarOpen = usePublicSidebarStore((state) => state.isSidebarOpen);

  // 1. Phim Mới Cập Nhật (Top 10)
  const latestQuery = useQuery({
    queryKey: ["public-series-section", "VIDEO", "releasedupdatetime"],
    queryFn: () =>
      searchSeries({
        contentType: "VIDEO",
        sortBy: "releasedupdatetime",
        sortDirection: "DESC",
        status: "PUBLISHED",
        size: 10,
      }),
  });

  // 2. Phim Xem Nhiều Nhất (Top 10)
  const popularQuery = useQuery({
    queryKey: ["public-series-section", "VIDEO", "views"],
    queryFn: () =>
      searchSeries({
        contentType: "VIDEO",
        sortBy: "views",
        sortDirection: "DESC",
        status: "PUBLISHED",
        size: 10,
      }),
  });

  // 3. Phim Đánh Giá Cao (Top 5)
  const topRatedQuery = useQuery({
    queryKey: ["public-series-section", "VIDEO", "averagerating"],
    queryFn: () =>
      searchSeries({
        contentType: "VIDEO",
        sortBy: "averagerating",
        sortDirection: "DESC",
        status: "PUBLISHED",
        size: 5,
      }),
  });

  // 4. Phim Yêu Thích Nhất (Top 10)
  const likedQuery = useQuery({
    queryKey: ["public-series-section", "VIDEO", "likes"],
    queryFn: () =>
      searchSeries({
        contentType: "VIDEO",
        sortBy: "likes",
        sortDirection: "DESC",
        status: "PUBLISHED",
        size: 10,
      }),
  });

  const latestSeries = latestQuery.data?.content ?? [];
  const popularSeries = popularQuery.data?.content ?? [];
  const topRatedSeries = topRatedQuery.data?.content ?? [];
  const likedSeries = likedQuery.data?.content ?? [];

  const featuredMovie = latestSeries[0] || popularSeries[0];

  const catalogGridClass = isSidebarOpen
    ? "grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
    : "grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#12100d] pb-20 text-gray-100 antialiased">
      <PageAtmosphere />
      <div className="relative z-10 mx-auto w-full max-w-[1680px] space-y-12 px-4 pt-8 md:px-8">
        {featuredMovie && (
          <FeaturedBanner
            item={featuredMovie}
            label="Phim Mới Nổi Bật"
            primaryLabel="Xem ngay"
          />
        )}

        <AdSlot slotId="mock-series-top" format="horizontal" className="my-2" />

        {/* MỤC 1: PHIM MỚI CẬP NHẬT */}
        <section>
          <SectionTitle
            eyebrow="Cập nhật gần đây"
            title="Phim Mới Cập Nhật"
            icon={Sparkles}
          />
          {latestQuery.isLoading ? (
            <ListSkeleton isSidebarOpen={isSidebarOpen} />
          ) : latestSeries.length === 0 ? (
            <EmptyState title="Chưa có phim mới" />
          ) : (
            <div className={catalogGridClass}>
              {latestSeries.map((movie, idx) => (
                <CatalogCard key={movie.seriesId || idx} item={movie} />
              ))}
            </div>
          )}
        </section>

        {/* MỤC 2: PHIM XEM NHIỀU NHẤT */}
        <section>
          <SectionTitle
            eyebrow="Thịnh hành nhất"
            title="Phim Được Xem Nhiều Nhất"
            icon={Flame}
          />
          {popularQuery.isLoading ? (
            <ListSkeleton isSidebarOpen={isSidebarOpen} />
          ) : popularSeries.length === 0 ? (
            <EmptyState title="Chưa có dữ liệu lượt xem" />
          ) : (
            <div className={catalogGridClass}>
              {popularSeries.map((movie, idx) => (
                <CatalogCard key={movie.seriesId || idx} item={movie} />
              ))}
            </div>
          )}
        </section>

        {/* MỤC 3: TOP 5 PHIM ĐÁNH GIÁ CAO NHẤT (RÕ RÀNG KHÔNG SUBTITLE) */}
        <Top5RankingSection
          title="Top 5 Phim Đánh Giá Cao Nhất"
          items={topRatedSeries}
          isLoading={topRatedQuery.isLoading}
        />

        {/* MỤC 4: PHIM YÊU THÍCH NHẤT */}
        <section>
          <SectionTitle
            eyebrow="Được thả tim nhiều"
            title="Phim Yêu Thích Nhất"
            icon={Heart}
          />
          {likedQuery.isLoading ? (
            <ListSkeleton isSidebarOpen={isSidebarOpen} />
          ) : likedSeries.length === 0 ? (
            <EmptyState title="Chưa có lượt thích" />
          ) : (
            <div className={catalogGridClass}>
              {likedSeries.map((movie, idx) => (
                <CatalogCard key={movie.seriesId || idx} item={movie} />
              ))}
            </div>
          )}
          {/* MỤC 5: TẤT CẢ PHIM ĐỀ XUẤT (CUỘN VÔ CÙNG - API RECOMMENDATIONS FEED) */}
          <MovieRecommendationSection />
        </section>
      </div>
    </div>
  );
}

function Top5RankingSection({
  title,
  items,
  isLoading,
}: {
  title: string;
  items: SearchSeries[];
  isLoading: boolean;
}) {
  return (
    <section className="relative my-8">
      {/* Tiêu đề rõ ràng không có chữ phụ "Cộng đồng bình chọn" */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B38F24] text-black shadow-lg shadow-[#D4AF37]/20">
          <Star className="h-5 w-5 fill-current" />
        </div>
        <h2 className="text-2xl font-black text-white sm:text-3xl md:text-4xl">
          {title}
        </h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="space-y-3">
              <div className="aspect-[2/3] rounded-2xl bg-white/[0.04]" />
              <div className="h-4 w-3/4 rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center text-white/45">
          Chưa có dữ liệu đánh giá cao
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.slice(0, 5).map((item, index) => {
            const rank = index + 1;
            const ageLabel = item.ageRating || "EVERYONE";

            return (
              <Link
                key={item.seriesId || index}
                href={`/series/${item.seriesId}`}
                className="group relative block transition duration-300 hover:scale-[1.02]"
              >
                {/* Poster Card */}
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-[#121214] shadow-[0_16px_40px_rgba(0,0,0,0.5)] group-hover:border-[#D4AF37]">
                  {item.coverUrl || item.bannerUrl ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{
                        backgroundImage: `url(${item.coverUrl || item.bannerUrl})`,
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/[0.03]">
                      <Film className="h-8 w-8 text-white/20" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

                  <div className="absolute inset-0 flex scale-75 items-center justify-center opacity-0 transition duration-300 group-hover:scale-100 group-hover:opacity-100">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37] text-black shadow-2xl">
                      <Play className="ml-0.5 h-5 w-5 fill-current" />
                    </div>
                  </div>
                </div>

                {/* Phần Rank và Tên Chữ Rõ Ràng (Legible Text Layout) */}
                <div className="mt-3 flex items-start gap-2.5 px-0.5">
                  <span className="text-5xl font-black italic leading-none text-[#F6D969] drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                    {rank}
                  </span>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="line-clamp-1 text-sm font-extrabold text-white group-hover:text-[#F6D969] transition sm:text-base">
                      {item.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-xs font-bold text-white/90">
                      <span className="flex items-center gap-1 font-black text-[#F6D969]">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        {(item.averageRating ?? 0).toFixed(1)}
                      </span>
                      <span className="text-white/40">•</span>
                      <span className="rounded bg-white/20 px-1.5 py-0.5 text-[11px] font-black uppercase text-white shadow-sm">
                        {ageLabel === "EVERYONE"
                          ? "P"
                          : ageLabel === "TEEN"
                            ? "13+"
                            : "18+"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

function FeaturedBanner({
  item,
  label,
  primaryLabel,
}: {
  item: SearchSeries;
  label: string;
  primaryLabel: string;
}) {
  return (
    <section className="group/banner relative min-h-[440px] overflow-hidden rounded-3xl border border-white/10 bg-[#121214] shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${getHeroImage(item)})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0C] via-[#0B0B0C]/85 to-[#0B0B0C]/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C] via-transparent to-transparent" />

      <div className="relative z-10 flex min-h-[440px] max-w-3xl flex-col justify-center px-6 py-12 md:px-12">
        <span className="mb-4 inline-flex w-fit rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
          {label}
        </span>
        <h1 className="font-heading text-4xl font-extrabold leading-none text-white md:text-5xl">
          {item.title}
        </h1>
        <p className="mt-4 line-clamp-3 max-w-2xl text-sm font-medium leading-relaxed text-white/68 md:text-base">
          {item.description || "Bộ phim hấp dẫn nhất vừa được phát hành trên TaleX."}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-bold text-white/70">
          <span className="inline-flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#D4AF37]" />
            {(item.totalViews ?? 0).toLocaleString("vi-VN")} lượt xem
          </span>
          <span className="inline-flex items-center gap-2">
            <Star className="h-4 w-4 fill-[#D4AF37] text-[#D4AF37]" />
            {(item.averageRating ?? 0).toFixed(1)}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-widest">
            {item.ageRating || "EVERYONE"}
          </span>
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={`/series/${item.seriesId}`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-black text-black transition hover:bg-[#E5C158]"
          >
            <Play className="h-5 w-5 fill-black" />
            {primaryLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

function CatalogCard({ item }: { item: SearchSeries }) {
  const views = item.totalViews ?? (item as any).views ?? (item as any).analyticData?.views ?? 0;

  return (
    <Link href={`/series/${item.seriesId}`} className="group block min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.2rem] border border-white/[0.07] bg-[#121214] shadow-[0_16px_42px_rgba(0,0,0,0.3)] transition-all duration-500 group-hover:scale-[1.012] group-hover:border-[#D4AF37]/50">
        {item.coverUrl || item.bannerUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
            style={{ backgroundImage: `url(${item.coverUrl || item.bannerUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-white/[0.02] to-white/[0.06] text-center">
            <Film className="mb-2 h-9 w-9 text-white/25" />
            <span className="text-[11px] text-white/35">Chưa có ảnh bìa</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060607] via-black/12 to-transparent" />
        <div className="absolute left-3 top-3 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#D4AF37]">
          {item.ageRating || "EVERYONE"}
        </div>
        <div className="absolute right-3 top-3 flex h-7 items-center gap-1 rounded-full border border-[#D4AF37]/35 bg-black/75 px-2 text-[#D4AF37] backdrop-blur-md">
          <Star className="h-3.5 w-3.5 fill-current" />
          <span className="text-xs font-black text-white">{(item.averageRating ?? 0).toFixed(1)}</span>
        </div>
        <div className="absolute inset-0 flex scale-75 items-center justify-center opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37] text-black shadow-[0_0_30px_rgba(212,175,55,0.5)]">
            <Play className="ml-0.5 h-5 w-5 fill-black" />
          </div>
        </div>
        <div className="absolute bottom-3 right-3 flex items-center text-xs font-bold text-white/90">
          <span className="rounded-lg bg-black/75 px-2.5 py-1 text-xs font-black backdrop-blur-md shadow-md">
            <Eye className="mr-1.5 inline h-3.5 w-3.5 text-[#38bdf8]" />
            {views.toLocaleString("vi-VN")}
          </span>
        </div>
      </div>
      <h3 className="mt-3 line-clamp-1 text-base font-black text-white group-hover:text-[#D4AF37]">
        {item.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-white/45">
        {item.description || "Nội dung hấp dẫn trên nền tảng TaleX."}
      </p>
    </Link>
  );
}

function SectionTitle({
  eyebrow,
  title,
  icon: Icon = Sparkles,
}: {
  eyebrow: string;
  title: string;
  icon?: typeof Sparkles;
}) {
  return (
    <div className="mb-6">
      {/* <p className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
        <Icon className="h-3.5 w-3.5" />
        {eyebrow}
      </p> */}
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
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="space-y-3">
          <div className="aspect-[4/5] rounded-[1.2rem] bg-white/[0.04]" />
          <div className="h-4 w-4/5 rounded bg-white/[0.04]" />
          <div className="h-3 w-2/3 rounded bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center text-white/45">
      <p className="text-sm font-semibold">{title}</p>
    </div>
  );
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
      <Sparkles className="absolute right-[10%] top-[80%] h-9 w-9 text-[#D4AF37]/20" />
      <Star className="absolute left-[48%] top-[85%] h-8 w-8 text-[#D4AF37]/16" />
    </div>
  );
}

function MovieRecommendationSection() {
  const isSidebarOpen = usePublicSidebarStore((state) => state.isSidebarOpen);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Calls GET /api/v1/recommendations/feed with pageType="MOVIES"
  // and forceNewSessionOnMount=true so sessionId refreshes on every page reload!
  const {
    data: feedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useRecommendationFeedInfinite(12, "MOVIES", {
    forceNewSessionOnMount: true,
  });

  const movies = useMemo(() => {
    return (
      feedData?.pages
        .flatMap((page) => page.items)
        .filter((item) => String(item.contentType || "").toUpperCase() === "VIDEO") ?? []
    );
  }, [feedData]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "520px 0px 520px 0px" },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const catalogGridClass = isSidebarOpen
    ? "grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
    : "grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5";

  return (
    <section id="movies-all-recommendations" className="pt-4 space-y-6">
      <SectionTitle
        eyebrow="Cá nhân hóa & Tất cả phim"
        title="Tất Cả Phim Đề Xuất"
        icon={Clapperboard}
      />

      {isLoading && movies.length === 0 ? (
        <ListSkeleton isSidebarOpen={isSidebarOpen} />
      ) : movies.length === 0 ? (
        <EmptyState title="Chưa có dữ liệu phim đề xuất" />
      ) : (
        <>
          <div className={catalogGridClass}>
            {movies.map((movie, idx) => (
              <CatalogCard
                key={`${movie.seriesId || idx}-${idx}`}
                item={movie as unknown as SearchSeries}
              />
            ))}
          </div>

          {isFetchingNextPage ? (
            <div className="pt-6">
              <ListSkeleton isSidebarOpen={isSidebarOpen} />
            </div>
          ) : null}

          <div
            ref={loadMoreRef}
            className="flex min-h-16 items-center justify-center py-6"
          >
            {hasNextPage && !isFetchingNextPage ? (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/38">
                Đang tải thêm phim đề xuất...
              </span>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
