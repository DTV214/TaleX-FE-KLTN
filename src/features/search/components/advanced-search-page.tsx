"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Eye,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tag,
  X,
} from "lucide-react";
import {
  DEFAULT_HOME_FEED_LIMITS,
  getHomeFeed,
} from "@/features/recommendations/api/home-feed.api";
import type { HomeFeedPoolKey, HomeFeedSeries } from "@/features/recommendations/types/home-feed.types";
import { getCategories, getTags } from "@/features/creator-dashboard/api/creator-content-api";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils/utils";

type ContentFilter = "ALL" | "VIDEO" | "COMIC";

const pools: HomeFeedPoolKey[] = [
  "promoted",
  "trending",
  "newReleases",
  "recentlyUpdated",
  "latestCommunityChoice",
  "communityChoice",
  "randomCategory",
  "accountSubscription",
];

const contentOptions: Array<{ value: ContentFilter; label: string; icon: typeof Sparkles }> = [
  { value: "ALL", label: "Tất cả", icon: Sparkles },
  { value: "VIDEO", label: "Phim bộ", icon: Clapperboard },
  { value: "COMIC", label: "Truyện tranh", icon: BookOpen },
];

const pageSizeOptions = [8, 12, 16, 20];

function normalizeContentType(series: HomeFeedSeries) {
  return series.contentType?.toUpperCase() === "COMIC" ? "COMIC" : "VIDEO";
}

function imageFor(series: HomeFeedSeries, index: number) {
  return (
    series.coverUrl ||
    series.bannerUrl ||
    [
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=900&auto=format&fit=crop",
    ][index % 3]
  );
}

function uniqueSeries(items: HomeFeedSeries[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.seriesId || seen.has(item.seriesId)) return false;
    seen.add(item.seriesId);
    return true;
  });
}

function getYear(series: HomeFeedSeries) {
  const rawDate = series.releasedUpdateTime || series.createdAt || series.updatedAt;
  if (!rawDate) return "";
  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? "" : String(date.getFullYear());
}

function matchesText(series: HomeFeedSeries, keyword: string) {
  if (!keyword.trim()) return true;
  const normalized = keyword.trim().toLowerCase();
  return [series.title, series.description, series.creatorName]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalized));
}

export function AdvancedSearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [keyword, setKeyword] = useState(initialQuery);
  const [submittedKeyword, setSubmittedKeyword] = useState(initialQuery);
  const [contentType, setContentType] = useState<ContentFilter>("ALL");
  const [categoryId, setCategoryId] = useState("");
  const [tagId, setTagId] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [minViews, setMinViews] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [pageSize, setPageSize] = useState(12);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const feedQuery = useQuery({
    queryKey: ["advanced-search", "home-feed-seed"],
    queryFn: () =>
      getHomeFeed({
        ...DEFAULT_HOME_FEED_LIMITS,
        promotedLimit: 10,
        trendingLimit: 10,
        newReleasesLimit: 10,
        recentlyUpdatedLimit: 10,
        latestCommunityChoiceLimit: 10,
        communityChoiceLimit: 10,
        randomCategoryLimit: 10,
        subscriptionLimit: 10,
      }),
  });

  const categoriesQuery = useQuery({
    queryKey: ["advanced-search", "categories"],
    queryFn: getCategories,
  });

  const tagsQuery = useQuery({
    queryKey: ["advanced-search", "tags"],
    queryFn: getTags,
  });

  const allSeries = useMemo(() => {
    const feed = feedQuery.data;
    if (!feed) return [];
    return uniqueSeries(pools.flatMap((pool) => feed[pool] ?? []));
  }, [feedQuery.data]);

  const filteredSeries = useMemo(() => {
    const from = Number(yearFrom);
    const to = Number(yearTo);
    const views = Number(minViews);

    const next = allSeries.filter((series) => {
      if (contentType !== "ALL" && normalizeContentType(series) !== contentType) {
        return false;
      }

      if (!matchesText(series, submittedKeyword)) return false;

      const year = Number(getYear(series));
      if (yearFrom && (!year || year < from)) return false;
      if (yearTo && (!year || year > to)) return false;
      if (minViews && (series.totalViews ?? 0) < views) return false;

      // Category/tag values are rendered now so BE can wire them later.
      void categoryId;
      void tagId;

      return true;
    });

    return next.sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.createdAt || b.updatedAt || 0).getTime() -
          new Date(a.createdAt || a.updatedAt || 0).getTime()
        );
      }

      if (sortBy === "name") {
        return a.title.localeCompare(b.title, "vi");
      }

      return (b.totalViews ?? 0) - (a.totalViews ?? 0);
    });
  }, [
    allSeries,
    categoryId,
    contentType,
    minViews,
    sortBy,
    submittedKeyword,
    tagId,
    yearFrom,
    yearTo,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredSeries.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedSeries = filteredSeries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const categories = categoriesQuery.data?.content ?? [];
  const tags = tagsQuery.data?.content ?? [];

  function applyFilters() {
    setSubmittedKeyword(keyword);
    setPage(1);
  }

  function resetFilters() {
    setKeyword("");
    setSubmittedKeyword("");
    setContentType("ALL");
    setCategoryId("");
    setTagId("");
    setYearFrom("");
    setYearTo("");
    setMinViews("");
    setSortBy("popular");
    setPageSize(12);
    setPage(1);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060607] pb-20 text-white antialiased">
      <SearchAtmosphere />

      <div className="relative z-10 mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8">
        <section className="space-y-5">
          <div className="relative z-20 rounded-[1.35rem] border border-white/[0.08] bg-[#111113]/95 p-3 shadow-[0_16px_42px_rgba(0,0,0,0.28)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <button
                type="button"
                onClick={() => setFiltersOpen((current) => !current)}
                className="group flex h-11 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-black/35 px-4 text-left transition hover:border-[#D4AF37]/45 hover:bg-white/[0.045] md:min-w-[220px]"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4AF37]/12 text-[#D4AF37]">
                    <SlidersHorizontal className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">
                      Bộ lọc
                    </span>
                    <span className="block text-sm font-bold text-white/88">
                      Tìm kiếm nâng cao
                    </span>
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-white/60 transition group-hover:text-[#F6D969]",
                    filtersOpen && "rotate-180 text-[#F6D969]",
                  )}
                />
              </button>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-xs font-bold text-white/55">
                  <span className="text-[#F6D969]">
                    {filteredSeries.length.toLocaleString("vi-VN")}
                  </span>{" "}
                  nội dung
                </div>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                  className="filter-select h-12 min-w-[150px]"
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size} / trang
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-xs font-black text-white/68 transition hover:border-[#D4AF37]/45 hover:text-[#F6D969]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Đặt lại
                </button>
              </div>
            </div>

            {filtersOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-30 max-h-[70vh] overflow-y-auto rounded-[1.2rem] border border-white/[0.08] bg-[#101012] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <FilterGroup label="Loại nội dung">
                    <div className="grid grid-cols-3 gap-2">
                      {contentOptions.map((option) => {
                        const Icon = option.icon;
                        const selected = contentType === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setContentType(option.value);
                              setPage(1);
                            }}
                            className={cn(
                              "flex min-h-12 items-center justify-center gap-2 rounded-xl border px-2 py-3 text-xs font-black transition",
                              selected
                                ? "border-[#D4AF37]/50 bg-[#D4AF37]/14 text-[#F6D969]"
                                : "border-white/[0.08] bg-white/[0.035] text-white/55 hover:border-white/20 hover:text-white",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </FilterGroup>

                  <FilterGroup label="Thể loại">
                    <select
                      value={categoryId}
                      onChange={(event) => setCategoryId(event.target.value)}
                      className="filter-select"
                    >
                      <option value="">Tất cả thể loại</option>
                      {categories.map((category) => (
                        <option key={category.categoryId} value={category.categoryId}>
                          {category.categoryName}
                        </option>
                      ))}
                    </select>
                  </FilterGroup>

                  <FilterGroup label="Tags">
                    <select
                      value={tagId}
                      onChange={(event) => setTagId(event.target.value)}
                      className="filter-select"
                    >
                      <option value="">Tất cả tags</option>
                      {tags.map((tag) => (
                        <option key={tag.tagId} value={tag.tagId}>
                          {tag.tagName}
                        </option>
                      ))}
                    </select>
                  </FilterGroup>

                  <FilterGroup label="Năm phát hành">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        value={yearFrom}
                        onChange={(event) => setYearFrom(event.target.value)}
                        inputMode="numeric"
                        placeholder="Từ năm"
                        className="filter-input"
                      />
                      <input
                        value={yearTo}
                        onChange={(event) => setYearTo(event.target.value)}
                        inputMode="numeric"
                        placeholder="Đến năm"
                        className="filter-input"
                      />
                    </div>
                  </FilterGroup>

                  <FilterGroup label="Lượt xem tối thiểu">
                    <input
                      value={minViews}
                      onChange={(event) => setMinViews(event.target.value)}
                      inputMode="numeric"
                      placeholder="Ví dụ: 1000"
                      className="filter-input"
                    />
                  </FilterGroup>

                  <FilterGroup label="Sắp xếp">
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                      className="filter-select"
                    >
                      <option value="popular">Lượt xem cao</option>
                      <option value="newest">Mới nhất</option>
                      <option value="name">Tên A-Z</option>
                    </select>
                  </FilterGroup>
                </div>

                <div className="mt-5 flex justify-end">
                  <Button
                    type="button"
                    onClick={applyFilters}
                    className="h-12 rounded-xl bg-[#D4AF37] px-6 text-sm font-black text-black hover:bg-[#E6C65A]"
                  >
                    <Filter className="h-4 w-4" />
                    Áp dụng bộ lọc
                  </Button>
                </div>
              </div>
            )}
          </div>

          <section className="min-w-0 rounded-[1.35rem] border border-white/[0.08] bg-[#0d0d0f]/70 p-4 shadow-[0_16px_42px_rgba(0,0,0,0.24)] sm:p-5">
            {feedQuery.isLoading && <SearchSkeleton />}
            {feedQuery.isError && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-100">
                <AlertCircle className="mb-3 h-6 w-6" />
                Không tải được dữ liệu tìm kiếm tạm thời.
              </div>
            )}

            {!feedQuery.isLoading && !feedQuery.isError && (
              <>
                {pagedSeries.length === 0 ? (
                  <EmptySearchState onReset={resetFilters} />
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                    {pagedSeries.map((series, index) => (
                      <SearchResultCard
                        key={series.seriesId}
                        series={series}
                        index={index}
                      />
                    ))}
                  </div>
                )}

                <PaginationBar
                  page={currentPage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </>
            )}
          </section>
        </section>
      </div>

      <style jsx>{`
        .filter-input,
        .filter-select {
          height: 46px;
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.34);
          padding: 0 14px;
          color: rgba(255, 255, 255, 0.88);
          font-size: 13px;
          font-weight: 700;
          outline: none;
          transition:
            border-color 180ms ease,
            box-shadow 180ms ease,
            background 180ms ease;
        }

        .filter-input::placeholder {
          color: rgba(255, 255, 255, 0.32);
        }

        .filter-input:focus,
        .filter-select:focus {
          border-color: rgba(212, 175, 55, 0.62);
          background: rgba(0, 0, 0, 0.48);
          box-shadow: 0 0 24px rgba(212, 175, 55, 0.12);
        }

        .filter-select option {
          background: #141416;
          color: white;
        }
      `}</style>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/55">
        {label}
      </label>
      {children}
    </div>
  );
}

function SearchResultCard({ series, index }: { series: HomeFeedSeries; index: number }) {
  const isComic = normalizeContentType(series) === "COMIC";
  return (
    <Link href={`/series/${series.seriesId}`} className="group block min-w-0">
      <article className="relative min-w-0">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.2rem] border border-white/[0.07] bg-[#121214] shadow-[0_16px_42px_rgba(0,0,0,0.3)] transition-all duration-500 group-hover:scale-[1.012] group-hover:border-[#D4AF37]/50">
          <div
            className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-110"
            style={{ backgroundImage: `url(${imageFor(series, index)})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060607] via-black/12 to-transparent" />
          <Badge
            variant="premium"
            className="absolute left-3 top-3 bg-black/60 text-[10px]"
          >
            {isComic ? "Truyện" : "Phim"}
          </Badge>
          <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-[#D4AF37]/35 bg-black/60 text-[#D4AF37]">
            <Star className="h-4 w-4 fill-current" />
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <span className="rounded-lg bg-black/55 px-2 py-1 text-[10px] font-bold text-white/80">
              <Eye className="mr-1 inline h-3 w-3 text-[#D4AF37]" />
              {(series.totalViews ?? 0).toLocaleString("vi-VN")}
            </span>
          </div>
        </div>
        <h3 className="mt-3 line-clamp-1 text-base font-black text-white transition group-hover:text-[#D4AF37]">
          {series.title}
        </h3>
        <div className="mt-2">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-white/55">
            <span>{getYear(series) || "Đang cập nhật"}</span>
            <span>{series.ageRating || "EVERYONE"}</span>
          </div>
          <p className="line-clamp-2 text-xs font-semibold leading-relaxed text-white/42">
            {series.description || "Nội dung đang chờ cập nhật mô tả."}
          </p>
        </div>
      </article>
    </Link>
  );
}

function PaginationBar({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:flex-row">
      <p className="text-xs font-bold text-white/45">
        Trang {page}/{totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="h-10 rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/10"
        >
          <ChevronLeft className="h-4 w-4" />
          Trước
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="h-10 rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/10"
        >
          Sau
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="space-y-3 rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-2">
          <div className="aspect-[3/4] rounded-[1rem] bg-white/[0.055]" />
          <div className="h-4 w-4/5 rounded bg-white/[0.055]" />
          <div className="h-3 w-2/3 rounded bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

function EmptySearchState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-10 text-center">
      <X className="mx-auto mb-4 h-10 w-10 text-white/35" />
      <h3 className="text-2xl font-black text-white">Chưa tìm thấy nội dung phù hợp</h3>
      <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-relaxed text-white/45">
        Hãy thử bỏ bớt bộ lọc hoặc dùng từ khóa ngắn hơn để mở rộng kết quả.
      </p>
      <Button
        type="button"
        onClick={onReset}
        className="mt-6 rounded-xl bg-[#D4AF37] px-5 font-black text-black hover:bg-[#E6C65A]"
      >
        Đặt lại bộ lọc
      </Button>
    </div>
  );
}

function SearchAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(212,175,55,0.12),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(168,85,247,0.08),transparent_30%),linear-gradient(180deg,#070707_0%,#0b0a0d_54%,#050506_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-[#060607]/76 to-[#060607]" />
      <div className="absolute -left-32 top-36 h-72 w-[760px] rotate-[-14deg] rounded-[100%] border-t border-[#D4AF37]/14" />
      <div className="absolute right-[-220px] top-16 h-[420px] w-[900px] rotate-[18deg] rounded-[100%] border-t border-cyan-200/8" />
      <Star className="absolute right-[8%] top-[34%] h-14 w-14 text-[#D4AF37]/12" />
      <Tag className="absolute left-[7%] top-[62%] h-10 w-10 rotate-[-16deg] text-white/8" />
    </div>
  );
}
