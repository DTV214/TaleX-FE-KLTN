"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  ChevronDown,
  Clapperboard,
  Eye,
  Filter,
  Heart,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tag,
  X,
  ArrowUpDown,
  Search,
  Film,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Flame,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { getPublicCategories, getPublicTags, searchSeries } from "@/features/search/api/search-api";
import type {
  SearchAgeRating,
  SearchContentFilter,
  SearchSeries,
  SearchSortBy,
  SearchSortDirection,
} from "@/features/search/types/search.types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils/utils";

const contentOptions: Array<{ value: SearchContentFilter; label: string; icon: typeof Sparkles }> = [
  { value: "ALL", label: "Tất cả", icon: Sparkles },
  { value: "VIDEO", label: "Phim bộ", icon: Clapperboard },
  { value: "COMIC", label: "Truyện tranh", icon: BookOpen },
];

const ageRatingOptions: Array<{ value: string; label: string; icon: typeof ShieldCheck }> = [
  { value: "ALL", label: "Tất cả", icon: Sparkles },
  { value: "EVERYONE", label: "P", icon: ShieldCheck },
  { value: "TEEN", label: "13+", icon: ShieldAlert },
  { value: "MATURE", label: "18+", icon: Flame },
];

const sortOptions: Array<{ value: SearchSortBy; label: string }> = [
  { value: "releasedupdatetime", label: "Mới cập nhật" },
  { value: "views", label: "Lượt xem cao" },
  { value: "averagerating", label: "Đánh giá cao" },
  { value: "likes", label: "Lượt thích" },
  { value: "watchtime", label: "Thời lượng xem" },
];

function imageFor(series: SearchSeries, index: number) {
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

function getYear(series: SearchSeries) {
  const rawDate = series.releasedUpdateTime || series.createdAt || series.updatedAt;
  if (!rawDate) return "";
  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? "" : String(date.getFullYear());
}

export function AdvancedSearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  // 1. Trạng thái tạm thời trong Bộ Lọc Modal
  const [keyword, setKeyword] = useState(initialQuery);
  const [contentType, setContentType] = useState<SearchContentFilter>("ALL");
  const [categoryId, setCategoryId] = useState("");
  const [tagId, setTagId] = useState("");
  const [ageRating, setAgeRating] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SearchSortBy>("releasedupdatetime");
  const [sortDirection, setSortDirection] = useState<SearchSortDirection>("DESC");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // 2. Trạng thái chính thức được áp dụng vào API query
  const [appliedKeyword, setAppliedKeyword] = useState(initialQuery);
  const [appliedContentType, setAppliedContentType] = useState<SearchContentFilter>("ALL");
  const [appliedCategoryId, setAppliedCategoryId] = useState("");
  const [appliedTagId, setAppliedTagId] = useState("");
  const [appliedAgeRating, setAppliedAgeRating] = useState<string>("ALL");
  const [appliedSortBy, setAppliedSortBy] = useState<SearchSortBy>("releasedupdatetime");
  const [appliedSortDirection, setAppliedSortDirection] = useState<SearchSortDirection>("DESC");

  // Đồng bộ từ khóa tìm kiếm khi query URL ?q=... trên Header thay đổi
  const queryParam = searchParams.get("q") ?? "";
  useEffect(() => {
    setKeyword(queryParam);
    setAppliedKeyword(queryParam);
  }, [queryParam]);

  const searchQuery = useQuery({
    queryKey: [
      "advanced-search",
      "series",
      {
        search: appliedKeyword,
        contentType: appliedContentType,
        categoryIds: appliedCategoryId ? [appliedCategoryId] : undefined,
        tagIds: appliedTagId ? [appliedTagId] : undefined,
        ageRatings: appliedAgeRating !== "ALL" ? ([appliedAgeRating] as SearchAgeRating[]) : undefined,
        status: "PUBLISHED",
        sortBy: appliedSortBy,
        sortDirection: appliedSortDirection,
        size: 21, // Tối đa 21 bộ theo yêu cầu
      },
    ],
    queryFn: () =>
      searchSeries({
        search: appliedKeyword,
        contentType: appliedContentType,
        categoryIds: appliedCategoryId ? [appliedCategoryId] : undefined,
        tagIds: appliedTagId ? [appliedTagId] : undefined,
        ageRatings: appliedAgeRating !== "ALL" ? ([appliedAgeRating] as SearchAgeRating[]) : undefined,
        status: "PUBLISHED",
        sortBy: appliedSortBy,
        sortDirection: appliedSortDirection,
        size: 21, // Tối đa 21 bộ theo yêu cầu
      }),
    placeholderData: (prev) => prev,
  });

  const categoriesQuery = useQuery({
    queryKey: ["advanced-search", "categories"],
    queryFn: getPublicCategories,
  });

  const tagsQuery = useQuery({
    queryKey: ["advanced-search", "tags"],
    queryFn: getPublicTags,
  });

  const series = searchQuery.data?.content ?? [];
  const categories = categoriesQuery.data?.content ?? [];
  const tags = tagsQuery.data?.content ?? [];

  // Bấm "Áp dụng bộ lọc" -> Lưu trạng thái và đóng Modal
  function applyFilters() {
    setAppliedKeyword(keyword);
    setAppliedContentType(contentType);
    setAppliedCategoryId(categoryId);
    setAppliedTagId(tagId);
    setAppliedAgeRating(ageRating);
    setAppliedSortBy(sortBy);
    setAppliedSortDirection(sortDirection);
    setFiltersOpen(false);
  }

  // Bấm "Đặt lại" -> Trở về mặc định và đóng Modal
  function resetFilters() {
    setKeyword("");
    setContentType("ALL");
    setCategoryId("");
    setTagId("");
    setAgeRating("ALL");
    setSortBy("releasedupdatetime");
    setSortDirection("DESC");

    setAppliedKeyword("");
    setAppliedContentType("ALL");
    setAppliedCategoryId("");
    setAppliedTagId("");
    setAppliedAgeRating("ALL");
    setAppliedSortBy("releasedupdatetime");
    setAppliedSortDirection("DESC");
  }

  // Tìm tên category/tag đã áp dụng để hiển thị Badge Chip
  const activeCategoryObj = categories.find(
    (c) => (c.categoryId || (c as any).id) === appliedCategoryId
  );
  const activeTagObj = tags.find(
    (t) => (t.tagId || (t as any).id) === appliedTagId
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#12100d] pb-20 text-white antialiased">
      <SearchAtmosphere />

      <div className="relative z-10 w-full px-[50px] py-8">
        <section className="space-y-5">
          {/* TIÊU ĐỀ TÌM KIẾM CHUẨN THEO GIAO DIỆN USER */}
          <div className="mb-2 flex items-center gap-3">
            <Search className="h-7 w-7 text-[#D4AF37]" />
            <h1 className="text-2xl font-bold tracking-tight text-white/90 sm:text-3xl">
              Tìm kiếm : <span className="font-extrabold text-white">{appliedKeyword || keyword || "Tất cả"}</span>
            </h1>
          </div>

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
                      Bộ lọc nâng cao
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
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-xs font-black text-white/68 transition hover:border-[#D4AF37]/45 hover:text-[#F6D969]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Đặt lại
                </button>
              </div>
            </div>

            {/* POPUP BỘ LỌC */}
            {filtersOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-30 max-h-[70vh] overflow-y-auto rounded-[1.2rem] border border-white/[0.08] bg-[#101012] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <FilterGroup label="Loại nội dung" icon={Film}>
                    <div className="grid grid-cols-3 gap-2">
                      {contentOptions.map((option) => {
                        const Icon = option.icon;
                        const selected = contentType === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setContentType(option.value)}
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

                  <FilterGroup label="Thể loại" icon={Layers}>
                    <select
                      value={categoryId}
                      onChange={(event) => setCategoryId(event.target.value)}
                      className="filter-select"
                    >
                      <option value="">Tất cả thể loại</option>
                      {categories.map((category) => {
                        const id = category.categoryId || (category as any).id;
                        const name = category.categoryName || (category as any).name;
                        return (
                          <option key={id} value={id}>
                            {name}
                          </option>
                        );
                      })}
                    </select>
                  </FilterGroup>

                  <FilterGroup label="Thẻ Tag" icon={Tag}>
                    <select
                      value={tagId}
                      onChange={(event) => setTagId(event.target.value)}
                      className="filter-select"
                    >
                      <option value="">Tất cả thẻ tag</option>
                      {tags.map((tag) => {
                        const id = tag.tagId || (tag as any).id;
                        const name = tag.tagName || (tag as any).name;
                        return (
                          <option key={id} value={id}>
                            #{name}
                          </option>
                        );
                      })}
                    </select>
                  </FilterGroup>

                  <FilterGroup label="Độ tuổi" icon={ShieldAlert}>
                    <div className="grid grid-cols-4 gap-2">
                      {ageRatingOptions.map((option) => {
                        const Icon = option.icon;
                        const selected = ageRating === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setAgeRating(option.value)}
                            className={cn(
                              "flex h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-black transition",
                              selected
                                ? "border-[#D4AF37]/50 bg-[#D4AF37]/14 text-[#F6D969]"
                                : "border-white/[0.08] bg-white/[0.035] text-white/55 hover:border-white/20 hover:text-white",
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </FilterGroup>

                  <FilterGroup label="Sắp xếp theo" icon={ArrowUpDown}>
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value as SearchSortBy)}
                      className="filter-select"
                    >
                      {sortOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </FilterGroup>

                  <FilterGroup label="Thứ tự sắp xếp" icon={TrendingDown}>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSortDirection("DESC")}
                        className={cn(
                          "flex h-11 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-black transition",
                          sortDirection === "DESC"
                            ? "border-[#D4AF37]/50 bg-[#D4AF37]/14 text-[#F6D969]"
                            : "border-white/[0.08] bg-white/[0.035] text-white/55 hover:border-white/20 hover:text-white",
                        )}
                      >
                        <TrendingDown className="h-3.5 w-3.5 text-[#F6D969]" />
                        Giảm dần
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortDirection("ASC")}
                        className={cn(
                          "flex h-11 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-black transition",
                          sortDirection === "ASC"
                            ? "border-[#D4AF37]/50 bg-[#D4AF37]/14 text-[#F6D969]"
                            : "border-white/[0.08] bg-white/[0.035] text-white/55 hover:border-white/20 hover:text-white",
                        )}
                      >
                        <TrendingUp className="h-3.5 w-3.5 text-[#F6D969]" />
                        Tăng dần
                      </button>
                    </div>
                  </FilterGroup>
                </div>

                <div className="mt-5 flex justify-end">
                  <Button
                    type="button"
                    onClick={applyFilters}
                    className="h-12 rounded-xl bg-[#D4AF37] px-6 text-sm font-black text-black hover:bg-[#E6C65A] shadow-lg shadow-[#D4AF37]/20"
                  >
                    <Filter className="h-4 w-4" />
                    Áp dụng bộ lọc
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* CHIP HIỂN THỊ CÁC BỘ LỌC ĐANG ÁP DỤNG */}
          {(appliedKeyword !== "" ||
            appliedContentType !== "ALL" ||
            appliedCategoryId !== "" ||
            appliedTagId !== "" ||
            appliedAgeRating !== "ALL") && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-bold text-white/45">Đang lọc:</span>

              {appliedKeyword !== "" && (
                <button
                  type="button"
                  onClick={() => {
                    setKeyword("");
                    setAppliedKeyword("");
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-3 py-1 text-xs font-bold text-[#F6D969] transition hover:bg-[#D4AF37]/25"
                >
                  Từ khóa: &quot;{appliedKeyword}&quot;
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              {appliedContentType !== "ALL" && (
                <button
                  type="button"
                  onClick={() => {
                    setContentType("ALL");
                    setAppliedContentType("ALL");
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-3 py-1 text-xs font-bold text-[#F6D969] transition hover:bg-[#D4AF37]/25"
                >
                  {appliedContentType === "VIDEO" ? "Phim bộ" : "Truyện tranh"}
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              {appliedCategoryId !== "" && (
                <button
                  type="button"
                  onClick={() => {
                    setCategoryId("");
                    setAppliedCategoryId("");
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-3 py-1 text-xs font-bold text-[#F6D969] transition hover:bg-[#D4AF37]/25"
                >
                  {activeCategoryObj?.categoryName || (activeCategoryObj as any)?.name || "Thể loại"}
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              {appliedTagId !== "" && (
                <button
                  type="button"
                  onClick={() => {
                    setTagId("");
                    setAppliedTagId("");
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-3 py-1 text-xs font-bold text-[#F6D969] transition hover:bg-[#D4AF37]/25"
                >
                  #{activeTagObj?.tagName || (activeTagObj as any)?.name || "Tag"}
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              {appliedAgeRating !== "ALL" && (
                <button
                  type="button"
                  onClick={() => {
                    setAgeRating("ALL");
                    setAppliedAgeRating("ALL");
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-3 py-1 text-xs font-bold text-[#F6D969] transition hover:bg-[#D4AF37]/25"
                >
                  {appliedAgeRating === "EVERYONE" ? "P" : appliedAgeRating === "TEEN" ? "13+" : "18+"}
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          <section className="min-w-0 rounded-[1.35rem] border border-white/[0.08] bg-[#0d0d0f]/70 p-4 shadow-[0_16px_42px_rgba(0,0,0,0.24)] sm:p-5">
            {searchQuery.isLoading && <SearchSkeleton />}
            {searchQuery.isError && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-100">
                <AlertCircle className="mb-3 h-6 w-6" />
                Không tải được dữ liệu tìm kiếm tạm thời.
              </div>
            )}

            {!searchQuery.isLoading && !searchQuery.isError && (
              <>
                {appliedKeyword !== "" && (
                  <h2 className="mb-4 text-sm font-bold text-white/70">
                    Kết quả tìm kiếm cho từ khóa:{" "}
                    <span className="font-black text-[#F6D969]">
                      &quot;{appliedKeyword}&quot;
                    </span>
                  </h2>
                )}

                {series.length === 0 ? (
                  <EmptySearchState onReset={resetFilters} />
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 min-[2100px]:grid-cols-8">
                    {series.map((item, index) => (
                      <SearchResultCard
                        key={item.seriesId}
                        series={item}
                        index={index}
                      />
                    ))}
                  </div>
                )}
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

function FilterGroup({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: typeof Film;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white/55">
        {Icon && <Icon className="h-3.5 w-3.5 text-[#D4AF37]" />}
        {label}
      </label>
      {children}
    </div>
  );
}

function SearchResultCard({ series, index }: { series: SearchSeries; index: number }) {
  const isComic = series.contentType?.toUpperCase() === "COMIC";
  const rawAge = series.ageRating ? String(series.ageRating).toUpperCase().trim() : "EVERYONE";

  let ageLabel = "P";
  let ageStyle = "bg-emerald-600 border-emerald-400 text-white";
  if (rawAge.includes("18") || rawAge === "MATURE") {
    ageLabel = "18+";
    ageStyle = "bg-red-600 border-red-400 text-white";
  } else if (rawAge.includes("13") || rawAge === "TEEN") {
    ageLabel = "13+";
    ageStyle = "bg-amber-600 border-amber-400 text-white";
  }

  return (
    <Link href={`/series/${series.seriesId}`} className="group block min-w-0">
      <article className="relative min-w-0">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.2rem] border border-white/[0.07] bg-[#121214] shadow-[0_16px_42px_rgba(0,0,0,0.3)] transition-all duration-500 group-hover:scale-[1.012] group-hover:border-[#D4AF37]/50">
          <div
            className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-110"
            style={{ backgroundImage: `url(${imageFor(series, index)})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060607] via-black/12 to-transparent" />

          {/* Top Left: TRUYỆN (Blue) / PHIM (Red) Badge */}
          <div
            className={cn(
              "absolute left-3 top-3 rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase shadow-md z-10",
              isComic
                ? "bg-[#2563EB] border-[#60A5FA] text-white"
                : "bg-[#DC2626] border-[#F87171] text-white"
            )}
          >
            {isComic ? "Truyện" : "Phim"}
          </div>

          {/* Top Right: Age Rating Badge */}
          <div className={cn("absolute right-3 top-3 rounded-lg border px-2 py-0.5 text-[10px] font-black shadow-md z-10", ageStyle)}>
            {ageLabel}
          </div>

          {/* Bottom Right: Star Rating & Views */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="rounded-lg bg-black/75 px-2 py-1 text-[10px] font-bold text-white/80 border border-white/10">
              <Eye className="mr-1 inline h-3 w-3 text-[#38bdf8]" />
              {(series.totalViews ?? 0).toLocaleString("vi-VN")}
            </span>
            <div className="flex h-6 items-center gap-1 rounded-full border border-white/20 bg-black/90 px-2 text-[#D4AF37]">
              <Star className="h-3 w-3 fill-current text-[#D4AF37]" />
              <span className="text-[10px] font-black text-white">
                {(series.averageRating ?? 0).toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <h3 className="mt-3 line-clamp-1 text-base font-black text-white transition group-hover:text-[#D4AF37]">
          {series.title}
        </h3>
        <div className="mt-2">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-bold text-white/55">
            <span>{getYear(series) || "2026"}</span>
            <span>•</span>
            <span className="truncate">{series.creatorName || "TaleX"}</span>
          </div>
          <p className="line-clamp-2 text-xs font-semibold leading-relaxed text-white/42">
            {series.description || "Nội dung hấp dẫn trên nền tảng TaleX."}
          </p>
        </div>
      </article>
    </Link>
  );
}

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 min-[2100px]:grid-cols-8">
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

      {/* Dynamic Floating Background Icons (Translucent Home Style) */}
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
