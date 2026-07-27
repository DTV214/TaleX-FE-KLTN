"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  AlertCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Eye,
  Film,
  HelpCircle,
  Play,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import {
  getPublicSeriesList,
  type PublicSeriesItem,
} from "../api/series-api";

type MockShelfItem = {
  title: string;
  episode: string;
  image: string;
};

const recommendedVideos: MockShelfItem[] = [
  {
    title: "Người Gác Cổng Sao Băng",
    episode: "Tập mới nhất",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Học Viện Sau Hoàng Hôn",
    episode: "Tập 12",
    image:
      "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Thợ Săn Vực Sâu",
    episode: "Tập 8",
    image:
      "https://images.unsplash.com/photo-1520509414578-d9cbf09933a1?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Đô Thị Neon",
    episode: "Tập 21",
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Bản Giao Hưởng Hư Không",
    episode: "Tập 4",
    image:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=900&auto=format&fit=crop",
  },
];

const watchHistory: MockShelfItem[] = [
  {
    title: "Akdong Musician: Live Session",
    episode: "Xem tiếp Tập 2",
    image:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=500&auto=format&fit=crop",
  },
  {
    title: "Nắng Dâu Của Thiên Cung",
    episode: "Xem tiếp Tập 6",
    image:
      "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=500&auto=format&fit=crop",
  },
];

const topVideos: MockShelfItem[] = [
  ...recommendedVideos,
  {
    title: "Thiên Hà Đổ Lửa",
    episode: "Tập 19",
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=500&auto=format&fit=crop",
  },
  {
    title: "Huyết Nguyệt Cổ Thành",
    episode: "Tập 31",
    image:
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=500&auto=format&fit=crop",
  },
];

function getHeroImage(item?: PublicSeriesItem) {
  return (
    item?.bannerUrl ||
    item?.coverUrl ||
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1800&auto=format&fit=crop"
  );
}

export function SeriesList() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["publicMovieSeries", page, pageSize],
    queryFn: () => getPublicSeriesList(page, pageSize, "VIDEO"),
  });

  const seriesItems = (data?.content || []).filter(
    (item) => item.contentType?.toUpperCase() === "VIDEO",
  );
  const featuredMovie = seriesItems[0];
  const totalPages = data?.totalPages || 1;
  const isFirst = data?.isFirst ?? true;
  const isLast = data?.isLast ?? true;

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#060607] pb-20 text-gray-100 antialiased">
      <div className="container mx-auto space-y-10 px-4 pt-8 md:px-8">
        {featuredMovie && (
          <FeaturedBanner
            item={featuredMovie}
            label="Cập nhật mới"
            primaryLabel="Xem ngay"
          />
        )}

        <RecommendedCarousel title="Video đề cử" items={recommendedVideos} />

        <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <SectionTitle eyebrow="Khám phá điện ảnh" title="Danh Sách Phim Đặc Sắc" />

            {isLoading && <ListSkeleton />}
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
                  <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                    {seriesItems.map((movie) => (
                      <CatalogCard
                        key={movie.seriesId}
                        item={movie}
                        latestLabel="Tập mới nhất"
                      />
                    ))}
                  </div>
                )}

                <Pagination
                  page={page}
                  totalPages={totalPages}
                  isFirst={isFirst}
                  isLast={isLast}
                  onPageChange={setPage}
                  onPrev={handlePrevPage}
                  onNext={handleNextPage}
                />
              </>
            )}
          </div>

          <CatalogSidebar history={watchHistory} topItems={topVideos} />
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
  return (
    <section className="relative min-h-[460px] overflow-hidden rounded-3xl border border-white/10 bg-[#121214] shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${getHeroImage(item)})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0C] via-[#0B0B0C]/85 to-[#0B0B0C]/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C] via-transparent to-transparent" />

      <div className="relative z-10 flex min-h-[460px] max-w-3xl flex-col justify-center px-6 py-12 md:px-12">
        <span className="mb-5 inline-flex w-fit rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#D4AF37]">
          {label}
        </span>
        <h1 className="font-heading text-4xl font-extrabold leading-none text-white md:text-6xl">
          {item.title}
        </h1>
        <p className="mt-5 line-clamp-3 max-w-2xl text-sm font-medium leading-relaxed text-white/68 md:text-base">
          {item.description || "Bộ phim mới nhất vừa được cập nhật trên TaleX."}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-bold text-white/70">
          <span className="inline-flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#D4AF37]" />
            {item.totalViews.toLocaleString("vi-VN")} lượt xem
          </span>
          <span className="inline-flex items-center gap-2">
            <Star className="h-4 w-4 fill-[#D4AF37] text-[#D4AF37]" />
            4.9
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

function RecommendedCarousel({ title, items }: { title: string; items: MockShelfItem[] }) {
  const loopItems = [...items, ...items];

  return (
    <section className="space-y-4">
      <SectionTitle eyebrow="TaleX đề cử" title={title} compact />
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101014] p-3">
        <motion.div
          className="flex w-max gap-3"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 26, ease: "linear", repeat: Infinity }}
        >
          {loopItems.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className="relative h-44 w-72 shrink-0 overflow-hidden rounded-xl bg-white/5"
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${item.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="line-clamp-1 text-base font-black text-white">
                  {item.title}
                </p>
                <p className="mt-1 text-sm font-bold text-[#D4AF37]">
                  {item.episode}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CatalogCard({
  item,
  latestLabel,
}: {
  item: PublicSeriesItem;
  latestLabel: string;
}) {
  return (
    <Link href={`/series/${item.seriesId}`} className="group block min-w-0">
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/[0.06] bg-[#121214] shadow-2xl transition-all duration-500 group-hover:scale-[1.01] group-hover:border-[#D4AF37]/50">
        {item.coverUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
            style={{ backgroundImage: `url(${item.coverUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-white/[0.02] to-white/[0.06] text-center">
            <Film className="mb-2 h-9 w-9 text-white/25" />
            <span className="text-[11px] text-white/35">No Poster Available</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060607] via-black/10 to-transparent" />
        <div className="absolute left-3 top-3 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#D4AF37]">
          {item.ageRating || "EVERYONE"}
        </div>
        <div className="absolute inset-0 flex scale-75 items-center justify-center opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D4AF37] text-black shadow-[0_0_30px_rgba(212,175,55,0.5)]">
            <Play className="ml-0.5 h-6 w-6 fill-black" />
          </div>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-bold text-white/80">
          <span className="rounded-lg bg-black/55 px-2 py-1 backdrop-blur">
            <Eye className="mr-1 inline h-3 w-3 text-[#D4AF37]" />
            {item.totalViews.toLocaleString("vi-VN")}
          </span>
          <span className="rounded-lg bg-black/55 px-2 py-1 backdrop-blur">
            <Users className="mr-1 inline h-3 w-3 text-[#D4AF37]" />
            {item.totalSubscriptions.toLocaleString("vi-VN")}
          </span>
        </div>
      </div>
      <h3 className="mt-3 line-clamp-1 text-base font-black text-white group-hover:text-[#D4AF37]">
        {item.title}
      </h3>
      <p className="mt-1 text-sm font-bold text-white/70">{latestLabel}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/45">
        {item.description || "Bấm để xem thông tin chi tiết và tập mới nhất."}
      </p>
    </Link>
  );
}

function CatalogSidebar({
  history,
  topItems,
}: {
  history: MockShelfItem[];
  topItems: MockShelfItem[];
}) {
  return (
    <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
      <div className="rounded-2xl border border-white/10 bg-[#121214] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-white">Lịch sử xem</h3>
          <Link href="/history" prefetch={false} className="text-sm font-bold text-[#D4AF37]">
            Xem tất cả
          </Link>
        </div>
        <div className="space-y-4">
          {history.map((item) => (
            <MockSideItem key={item.title} item={item} />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121214] p-5">
        <div className="mb-4 grid grid-cols-3 overflow-hidden rounded-xl border border-white/10 text-center text-sm font-black">
          <span className="bg-[#D4AF37] py-2 text-black">Top tháng</span>
          <span className="bg-white/[0.04] py-2 text-white/60">Top tuần</span>
          <span className="bg-white/[0.04] py-2 text-white/60">Top ngày</span>
        </div>
        <div className="space-y-3">
          {topItems.slice(0, 7).map((item, index) => (
            <div key={item.title} className="flex items-center gap-3">
              <span className="w-8 text-center text-xl font-black text-[#D4AF37]/80">
                {String(index + 1).padStart(2, "0")}
              </span>
              <MockSideItem item={item} compact />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function MockSideItem({ item, compact = false }: { item: MockShelfItem; compact?: boolean }) {
  return (
    <div className="flex min-w-0 gap-3">
      <div
        className={`${compact ? "h-14 w-14" : "h-16 w-20"} shrink-0 rounded-lg bg-cover bg-center`}
        style={{ backgroundImage: `url(${item.image})` }}
      />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-bold text-white">{item.title}</p>
        <p className="mt-1 text-xs font-semibold text-white/45">{item.episode}</p>
      </div>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "" : "mb-6"}>
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

function ListSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, idx) => (
        <div key={idx} className="space-y-3">
          <div className="aspect-[2/3] rounded-2xl bg-white/[0.04]" />
          <div className="h-4 w-4/5 rounded bg-white/[0.04]" />
          <div className="h-3 w-2/3 rounded bg-white/[0.04]" />
        </div>
      ))}
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

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-400" />
      <h3 className="mb-2 text-xl font-bold text-white">Không thể tải danh sách</h3>
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

function Pagination({
  page,
  totalPages,
  isFirst,
  isLast,
  onPageChange,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  onPageChange: (page: number) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-14 flex items-center justify-center gap-3 border-t border-white/[0.06] pt-8">
      <button onClick={onPrev} disabled={isFirst} className="h-10 w-10 rounded-xl border border-white/10 text-white disabled:opacity-25">
        <ChevronLeft className="mx-auto h-4 w-4" />
      </button>
      {Array.from({ length: totalPages }).map((_, idx) => {
        const pageIndex = idx + 1;
        return (
          <button
            key={pageIndex}
            onClick={() => onPageChange(pageIndex)}
            className={`h-10 w-10 rounded-xl text-sm font-black ${
              page === pageIndex
                ? "bg-[#D4AF37] text-black"
                : "border border-white/10 bg-white/[0.02] text-white/55"
            }`}
          >
            {pageIndex}
          </button>
        );
      })}
      <button onClick={onNext} disabled={isLast} className="h-10 w-10 rounded-xl border border-white/10 text-white disabled:opacity-25">
        <ChevronRight className="mx-auto h-4 w-4" />
      </button>
    </div>
  );
}
