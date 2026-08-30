"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Play,
  Users,
  Eye,
  Languages,
  Calendar,
  Lock,
  Unlock,
  Sparkles,
  AlertCircle,
  Film,
  BookOpen,
  ChevronRight,
  Heart,
  Star,
  Flag,
  Menu,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import {
  getPublicSeriesDetail,
  getPublicSeasons,
  getPublicEpisodes,
  type PublicEpisodeItem,
} from "../api/series-api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMyLikedEpisodes, getEpisodeLikes } from "../api/episode-likes-api";
import { useGetPublicCombos } from "@/features/public/hooks/use-public-combos";
import { ComboCard } from "@/features/public/components/combo-packages";
import { useCreatorFollow } from "../hooks/use-creator-follow";
import { useContentEntitlement } from "../hooks/use-content-entitlement";
import { getFollowers } from "../api/creator-follows-api";
import { FollowButton } from "./follow-button";
import { EpisodeBookmarkButton } from "./episode-bookmark-button";
import { EpisodeShareButton } from "./episode-share-button";
import { InteractiveStarRating } from "./interactive-star-rating";
import { useGetSeriesRatings } from "../hooks/use-series-ratings";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { AdSlot } from "@/shared/ui/ad-slot";
import { ReportDialog } from "@/features/moderation-reports/components/report-dialog";

interface SeriesDetailProps {
  seriesId: string;
}

export function SeriesDetail({ seriesId }: SeriesDetailProps) {
  const router = useRouter();
  const authUser = useAuthStore((state) => state.user);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isAscending, setIsAscending] = useState(true);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);

  // 1. Fetch thông tin chi tiết Series
  const {
    data: series,
    isLoading: isSeriesLoading,
    isError: isSeriesError,
    error: seriesError,
  } = useQuery({
    queryKey: ["publicSeriesDetail", seriesId],
    queryFn: () => getPublicSeriesDetail(seriesId),
  });

  // 1.2 Fetch Ratings realtime của Series này
  const { data: seriesRatingsData } = useGetSeriesRatings(seriesId, {
    size: 100,
  });

  const calculatedAverageRating = useMemo(() => {
    const ratings = seriesRatingsData?.content || [];
    if (ratings.length === 0) {
      return series?.averageRating || (series as any)?.rating || 0;
    }
    const sum = ratings.reduce((acc, r) => acc + (r.rate || 0), 0);
    return sum / ratings.length;
  }, [seriesRatingsData, series]);

  const calculatedRatingsCount = useMemo(() => {
    return (
      seriesRatingsData?.totalElements ??
      seriesRatingsData?.content?.length ??
      (series as any)?.totalRatingsCount ??
      (series as any)?.ratingCount ??
      0
    );
  }, [seriesRatingsData, series]);

  const isComic = series?.contentType
    ? String(series.contentType).toUpperCase() === "COMIC"
    : false;

  // 1.5 Fetch public combos
  const combosQuery = useGetPublicCombos();
  const combos = combosQuery.data ?? [];

  const {
    isFollowing,
    toggleFollow,
    isMutating: isFollowMutating,
    isLoading: isFollowListLoading,
  } = useCreatorFollow(series?.accountId);

  const isOwner = Boolean(
    authUser?.accountId &&
    series?.accountId &&
    authUser.accountId === series.accountId,
  );

  const { data: ownFollowersData } = useQuery({
    queryKey: ["ownCreatorFollowers", series?.accountId],
    queryFn: () => getFollowers(0, 100),
    enabled: !!authUser && isOwner,
  });

  const ownFollowerCount =
    ownFollowersData?.numberOfElements ??
    ownFollowersData?.content?.length ??
    0;

  const displayFollowersCount = Math.max(
    series?.totalCreatorFollowers ?? 0,
    isOwner ? ownFollowerCount : 0,
  );

  // 2. Fetch danh sách Seasons của Series
  const { data: seasons = [], isLoading: isSeasonsLoading } = useQuery({
    queryKey: ["publicSeriesSeasons", seriesId],
    queryFn: () => getPublicSeasons(seriesId),
  });

  // Lấy season đầu tiên khi load xong list season để làm mặc định
  const defaultSeasonId =
    seasons.length > 0
      ? [...seasons].sort((a, b) => a.seasonNumber - b.seasonNumber)[0].seasonId
      : null;

  const activeSeasonId = selectedSeasonId || defaultSeasonId;

  // 3. Fetch danh sách Episodes dựa trên Season đang chọn
  const {
    data: episodes = [],
    isLoading: isEpisodesLoading,
    isError: isEpisodesError,
    refetch: refetchEpisodes,
  } = useQuery({
    queryKey: ["publicSeasonEpisodes", activeSeasonId],
    queryFn: () => getPublicEpisodes(activeSeasonId!),
    enabled: !!activeSeasonId, // Chỉ chạy khi có activeSeasonId
  });

  // Fetch episodes cho tất cả các seasons để tính tổng lượt thích & tổng lượt xem toàn bộ Series
  const seasonQueries = useQueries({
    queries: seasons.map((season) => ({
      queryKey: ["publicSeasonEpisodes", season.seasonId],
      queryFn: () => getPublicEpisodes(season.seasonId),
      staleTime: 60 * 1000,
    })),
  });

  const allEpisodesInSeries = useMemo(() => {
    const all: PublicEpisodeItem[] = [];
    seasonQueries.forEach((q) => {
      if (q.data && Array.isArray(q.data)) {
        all.push(...q.data);
      }
    });
    return all.length > 0 ? all : episodes;
  }, [seasonQueries, episodes]);

  // Sắp xếp các episode theo thứ tự tăng/giảm dần
  const sortedEpisodes = useMemo(() => {
    return [...episodes].sort((a, b) =>
      isAscending
        ? a.episodeNumber - b.episodeNumber
        : b.episodeNumber - a.episodeNumber,
    );
  }, [episodes, isAscending]);

  // Quyền truy cập nội dung (tập đã mua, subscription, hoặc tác giả)
  const { isEpisodeUnlocked } = useContentEntitlement({
    contentType: series?.contentType,
    creatorAccountId: series?.accountId || series?.creatorId,
    episodes: sortedEpisodes,
  });

  // Lấy tập đầu tiên để làm nút "Xem từ đầu"
  const firstEpisodeId = sortedEpisodes[0]?.episodeId;

  // Fetch danh sách các tập đã thích của user hiện tại
  const { data: myLikesData } = useQuery({
    queryKey: ["myLikedEpisodes"],
    queryFn: () => getMyLikedEpisodes(0, 200),
    enabled: !!authUser,
  });

  const myLikedEpisodeIds = useMemo(() => {
    const set = new Set<string>();
    if (myLikesData?.content) {
      myLikesData.content.forEach((item) => set.add(item.episodeId));
    }
    return set;
  }, [myLikesData]);

  // Fetch danh sách chi tiết lượt thích của từng tập trong series để có con số chính xác nhất từ DB
  const episodeLikesQueries = useQueries({
    queries: allEpisodesInSeries.map((ep) => ({
      queryKey: ["episodeLikes", ep.episodeId, 0, 100],
      queryFn: () => getEpisodeLikes(ep.episodeId, 0, 100),
      staleTime: 30 * 1000,
    })),
  });

  // Tính tổng lượt xem và lượt thích thật của series từ danh sách tất cả các tập
  const totalSeriesViews = useMemo(() => {
    const epViews = allEpisodesInSeries.reduce(
      (acc, ep) => acc + (ep.analyticData?.views ?? ep.views ?? 0),
      0,
    );
    return Math.max(
      series?.analyticData?.views ?? series?.totalViews ?? 0,
      epViews,
    );
  }, [series, allEpisodesInSeries]);

  const totalSeriesLikes = useMemo(() => {
    const epLikes = allEpisodesInSeries.reduce((acc, ep, index) => {
      const likesQueryData = episodeLikesQueries[index]?.data;
      const listLikesCount =
        likesQueryData?.numberOfElements ??
        likesQueryData?.content?.length ??
        0;
      const likesForEp = Math.max(
        ep.analyticData?.likes ?? ep.likes ?? 0,
        listLikesCount,
        myLikedEpisodeIds.has(ep.episodeId) ? 1 : 0,
      );
      return acc + likesForEp;
    }, 0);
    const seriesLikes =
      series?.analyticData?.likes ??
      (series && "likes" in series && typeof (series as any).likes === "number"
        ? (series as any).likes
        : 0);
    return Math.max(seriesLikes, epLikes);
  }, [series, allEpisodesInSeries, episodeLikesQueries, myLikedEpisodeIds]);

  // Lọc các combo thuộc về Series này
  const seasonIds = new Set(seasons.map((s) => s.seasonId));
  const seriesCombos = combos.filter((combo) => {
    if (!combo.episodes || combo.episodes.length === 0) return false;
    return combo.episodes.some(
      (ep) =>
        (ep.seasonId && seasonIds.has(ep.seasonId)) ||
        (series?.title &&
          ep.seriesTitle?.toLowerCase() === series.title.toLowerCase()),
    );
  });

  // Trạng thái Loading toàn trang (khi chưa load được Series)
  if (isSeriesLoading) {
    return (
      <div className="w-full min-h-screen bg-[#0B0B0C] text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-full border-2 border-t-[#D4AF37] border-r-transparent border-b-transparent border-l-transparent animate-spin mb-4" />
        <p className="text-gray-400 text-sm animate-pulse">
          Đang tải thông tin series...
        </p>
      </div>
    );
  }

  // Trạng thái lỗi tải thông tin Series
  if (isSeriesError || !series) {
    return (
      <div className="w-full min-h-screen bg-[#0B0B0C] text-white flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold mb-2">Tải thông tin thất bại</h3>
        <p className="text-gray-400 text-sm mb-6">
          {seriesError instanceof Error
            ? seriesError.message
            : "Series không tồn tại hoặc đã bị ẩn."}
        </p>
        <button
          onClick={() => router.push("/series")}
          className="px-6 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors"
        >
          Quay lại thư viện
        </button>
      </div>
    );
  }

  const cinematicBackdropUrl =
    series.bannerUrl ||
    series.coverUrl ||
    "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=1600&auto=format&fit=crop";
  const descriptionText =
    series.description ||
    "Chưa có nội dung giới thiệu chi tiết cho tác phẩm này.";
  const canToggleDescription = descriptionText.length > 180;

  return (
    <div className="w-full min-h-screen bg-[#0B0B0C] text-white relative pb-24 overflow-hidden">
      {/* 1. Cinematic background */}
      <div className="pointer-events-none absolute left-0 top-0 z-0 h-[600px] w-full overflow-hidden">
        <div
          className="h-full w-full scale-105 bg-cover bg-center opacity-15 blur-[2px]"
          style={{
            backgroundImage: `url(${cinematicBackdropUrl})`,
            maskImage:
              "linear-gradient(to bottom, black 30%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 30%, transparent 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B0B0C]/80 to-[#0B0B0C]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_24%,rgba(212,175,55,0.16),transparent_34%),radial-gradient(circle_at_76%_18%,rgba(34,211,238,0.12),transparent_30%)]" />
      </div>

      {/* 2. Main Content Container */}
      <div className="container mx-auto px-4 md:px-8 relative z-10 pt-8 md:pt-16">
        {/* Quay lại */}
        <Link
          href="/series"
          className="inline-flex items-center text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider mb-8 md:mb-12 group"
        >
          <ChevronRight className="w-4 h-4 mr-1.5 rotate-180 transition-transform group-hover:-translate-x-1" />{" "}
          Quay lại thư viện
        </Link>

        {/* Cụm Header thông tin series */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start mb-16">
          {/* Cột Trái: Ảnh bìa đứng */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-48 sm:w-60 md:w-72 lg:w-80 flex-none aspect-[2/3] rounded-3xl overflow-hidden border border-white/5 hover:border-[#D4AF37]/50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition duration-300 group relative"
          >
            {series.coverUrl ? (
              <div
                className="w-full h-full bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ backgroundImage: `url(${series.coverUrl})` }}
              />
            ) : (
              <div className="w-full h-full bg-white/[0.03] flex items-center justify-center">
                {!isComic ? (
                  <Film className="w-16 h-16 text-gray-600" />
                ) : (
                  <BookOpen className="w-16 h-16 text-gray-600" />
                )}
              </div>
            )}

            {/* Nhãn loại nội dung ở góc ảnh */}
            <div className="absolute top-4 left-4">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase backdrop-blur-md border ${!isComic
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  }`}
              >
                {!isComic ? "Phim bộ" : "Truyện tranh"}
              </span>
            </div>

            {/* Thẻ Đánh Giá 5 Sao Interactive */}
            <InteractiveStarRating
              seriesId={seriesId}
              averageRating={
                (series as any)?.averageRating || (series as any)?.rating || 0
              }
              totalRatingsCount={
                (series as any)?.totalRatingsCount ||
                (series as any)?.ratingCount ||
                0
              }
              className="mt-4"
            />
          </motion.div>

          {/* Cột Phải: Các thông tin văn bản */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex-1"
          >
            {/* Tiêu đề lớn */}
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
              {series.title}
            </h1>

            {/* Metadata grid */}
            <div className="mb-6 grid max-w-3xl grid-cols-[120px_1fr] gap-y-3 text-sm">
              {series.categories.length > 0 && (
                <>
                  <div className="flex items-center gap-2 font-medium text-slate-400">
                    <BookOpen className="h-4 w-4" /> Thể loại
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {series.categories.map((cat) => (
                      <span
                        key={cat.categoryId}
                        className="rounded-md bg-white/5 px-2 py-1 text-xs font-medium text-cyan-100 transition hover:bg-white/10"
                      >
                        {cat.categoryName}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {series.tags.length > 0 && (
                <>
                  <div className="flex items-center gap-2 font-medium text-slate-400">
                    <Sparkles className="h-4 w-4" /> Tags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {series.tags.map((tag) => (
                      <span
                        key={tag.tagId}
                        className="rounded-md bg-white/5 px-2 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/10"
                      >
                        #{tag.tagName}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {series.ageRating && (
                <>
                  <div className="flex items-center gap-2 font-medium text-slate-400">
                    <AlertCircle className="h-4 w-4" /> Độ tuổi
                  </div>
                  <div className="font-extrabold text-[#FF4D4D]">
                    {series.ageRating}
                  </div>
                </>
              )}

              {series.language && (
                <>
                  <div className="flex items-center gap-2 font-medium text-slate-400">
                    <Languages className="h-4 w-4" /> Ngôn ngữ
                  </div>
                  <div className="font-semibold text-white">
                    {series.language.toUpperCase()}
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 font-medium text-slate-400">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" /> Đánh
                giá
              </div>
              <div className="font-bold text-[#D4AF37] flex items-center gap-1.5">
                <span>
                  {calculatedAverageRating > 0
                    ? calculatedAverageRating.toFixed(1)
                    : "0.0"}
                </span>
                <span className="text-zinc-500 font-normal text-xs">/ 5.0</span>
                {calculatedRatingsCount > 0 && (
                  <span className="text-zinc-400 font-normal text-xs">
                    ({calculatedRatingsCount.toLocaleString("vi-VN")} lượt)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 font-medium text-slate-400">
                <Eye className="h-4 w-4" /> Lượt xem
              </div>
              <div className="text-white">
                {totalSeriesViews.toLocaleString("vi-VN")} lượt xem
              </div>

              <div className="flex items-center gap-2 font-medium text-slate-400">
                <Heart className="h-4 w-4 text-rose-500 fill-rose-500/20" />{" "}
                Lượt thích
              </div>
              <div className="text-white">
                {totalSeriesLikes.toLocaleString("vi-VN")} lượt thích
              </div>
            </div>

            {/* Thông tin nhà sáng tạo (Creator Profile & Follow Action) */}
            {series.creatorName && (
              <div className="mb-8 flex w-fit flex-wrap items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-md">
                <Link
                  href={
                    isOwner
                      ? "/creator-channel"
                      : `/public-channel?creatorId=${series.creatorId || series.accountId}`
                  }
                  className="group flex min-w-0 cursor-pointer items-center gap-3 pr-2 transition-opacity hover:opacity-90"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 overflow-hidden relative flex-none shadow-md group-hover:border-yellow-500/50 transition-colors">
                    <img
                      src={
                        series.creatorAvatar ||
                        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=80&auto=format&fit=crop"
                      }
                      alt={series.creatorName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Name & Followers */}
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider group-hover:text-yellow-500 transition-colors">
                      Tác giả
                    </p>
                    <h4 className="text-sm font-black text-gray-200 truncate leading-snug group-hover:text-yellow-400 transition-colors">
                      {series.creatorName}
                    </h4>
                    <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                      {displayFollowersCount != null
                        ? `${displayFollowersCount.toLocaleString("vi-VN")} người theo dõi`
                        : "Nhà sáng tạo TaleX"}
                    </p>
                  </div>
                </Link>
                {/* Follow Button (Ẩn nếu người xem là tác giả) */}
                {series.accountId && !isOwner && (
                  <div className="shrink-0">
                    <FollowButton
                      isFollowing={isFollowing}
                      onFollowToggle={toggleFollow}
                      isMutating={isFollowMutating}
                      isLoading={isFollowListLoading}
                    />
                  </div>
                )}
                {series.accountId && !isOwner && (
                  <ReportDialog
                    targetType="ACCOUNT"
                    targetId={series.accountId}
                    targetLabel={`Creator ${series.creatorName}`}
                  >
                    <span className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-bold text-zinc-300 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300">
                      <Flag className="h-4 w-4" />
                      Báo cáo creator
                    </span>
                  </ReportDialog>
                )}
              </div>
            )}

            {/* Mô tả dài */}
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <ReportDialog
                targetType="SERIES"
                targetId={seriesId}
                targetLabel={series.title}
              >
                <span className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-bold text-zinc-300 transition hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]">
                  <Flag className="h-4 w-4" />
                  Báo cáo series
                </span>
              </ReportDialog>
            </div>

            <div className="max-w-3xl mb-8">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                Giới thiệu nội dung
              </h3>
              <div className="relative">
                <p
                  className={`whitespace-pre-line break-words text-sm leading-relaxed text-gray-300 [overflow-wrap:anywhere] sm:text-base ${!isDescriptionExpanded && canToggleDescription
                    ? "max-h-[5.8rem] overflow-hidden"
                    : ""
                    }`}
                >
                  {descriptionText}
                </p>

                {!isDescriptionExpanded && canToggleDescription && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0B0B0C] to-transparent" />
                )}
              </div>

              {canToggleDescription && (
                <button
                  type="button"
                  onClick={() =>
                    setIsDescriptionExpanded((current) => !current)
                  }
                  className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#D4AF37] transition hover:text-[#E5C158]"
                >
                  {isDescriptionExpanded ? "Thu gọn" : "Xem thêm"}
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${isDescriptionExpanded ? "-rotate-90" : "rotate-90"
                      }`}
                  />
                </button>
              )}
            </div>

            {/* Nút hành động chính & Thanh Đánh Giá Sao Inline */}
            <div className="flex flex-wrap gap-4 items-center">
              {firstEpisodeId ? (
                <Link
                  href={`/${isComic ? "read" : "watch"}/${firstEpisodeId}`}
                  className="h-12 px-8 bg-[#D4AF37] hover:bg-[#E5C158] text-black font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-[0_6px_25px_rgba(212,175,55,0.3)] transition-all duration-300 hover:scale-[1.02]"
                >
                  <Play className="w-5 h-5 fill-current" />{" "}
                  {isComic ? "Đọc tập đầu tiên" : "Xem tập đầu tiên"}
                </Link>
              ) : (
                <button
                  disabled
                  className="h-12 px-8 bg-white/10 text-white/50 font-bold rounded-2xl cursor-not-allowed flex items-center gap-2"
                >
                  Chưa có tập phim
                </button>
              )}

              {/* Thẻ Đánh Giá 5 Sao Interactive Inline */}
              <InteractiveStarRating
                seriesId={seriesId}
                averageRating={calculatedAverageRating}
                totalRatingsCount={calculatedRatingsCount}
                variant="inline"
              />
            </div>
          </motion.div>
        </div>

        <AdSlot slotId="mock-detail-mid" format="horizontal" className="my-8" />

        {/* 2.5. Section: Gói Combo Ưu Đãi (chỉ hiển thị nếu có combo cho series này) */}
        {!combosQuery.isLoading && seriesCombos.length > 0 && (
          <section className="w-full bg-[#121214]/40 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl relative mb-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent pointer-events-none rounded-3xl" />
            <div className="relative z-10">
              <div className="mb-6 flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-white tracking-wide">
                  Mua trọn gói
                </h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {seriesCombos.map((combo) => (
                  <ComboCard
                    key={combo.comboId}
                    combo={combo}
                    returnTo={`/series/${seriesId}`}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 3. Section: Season Selector & Episodes list */}
        <section
          id="episodes"
          className="w-full scroll-mt-24 bg-[#121214]/60 border border-white/10 rounded-3xl p-5 md:p-7 backdrop-blur-md shadow-2xl relative"
        >
          {/* Lớp nền mờ */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none rounded-3xl" />

          {/* Thanh Header: Chọn Phần (Season), Đếm tập & Nút Sắp xếp */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 relative z-20">
            <div className="flex flex-wrap items-center gap-3">
              {/* Menu Dropdown Chọn Phần (Season) */}
              {isSeasonsLoading ? (
                <div className="h-9 w-32 bg-white/10 animate-pulse rounded-xl" />
              ) : seasons.length > 0 ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSeasonDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Menu className="w-4 h-4 text-[#D4AF37]" />
                    <span>
                      {seasons.find((s) => s.seasonId === activeSeasonId)
                        ?.title || "Phần 1"}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isSeasonDropdownOpen ? "rotate-180 text-white" : ""
                        }`}
                    />
                  </button>

                  {/* Dropdown Box */}
                  {isSeasonDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsSeasonDropdownOpen(false)}
                      />
                      <div className="absolute left-0 top-full mt-2 w-52 p-1.5 rounded-2xl bg-[#1e1e24] border border-white/20 shadow-2xl z-40 space-y-1 backdrop-blur-xl">
                        {seasons
                          .sort((a, b) => a.seasonNumber - b.seasonNumber)
                          .map((season) => (
                            <button
                              key={season.seasonId}
                              type="button"
                              onClick={() => {
                                setSelectedSeasonId(season.seasonId);
                                setIsSeasonDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${activeSeasonId === season.seasonId
                                ? "bg-[#D4AF37] text-black shadow-md"
                                : "text-gray-300 hover:bg-white/10 hover:text-white"
                                }`}
                            >
                              <span>{season.title}</span>
                              {activeSeasonId === season.seasonId && (
                                <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 px-1.5 py-0.5 rounded">
                                  Đang chọn
                                </span>
                              )}
                            </button>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              ) : null}

              <div className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                <span>{isComic ? "Danh sách chương" : "Danh sách tập"}</span>
                <span className="text-xs text-gray-400 font-semibold">
                  ({" "}
                  <strong className="text-[#D4AF37] font-bold">
                    {sortedEpisodes.length}
                  </strong>{" "}
                  {isComic ? "chương" : "tập"} )
                </span>
              </div>
            </div>

            {/* Nút Đổi Thứ Tự Sắp Xếp */}
            <button
              type="button"
              onClick={() => setIsAscending((prev) => !prev)}
              title={
                isAscending
                  ? "Đang sắp xếp: Tăng dần (Tập 1 -> N)"
                  : "Đang sắp xếp: Giảm dần (Tập N -> 1)"
              }
              className={`self-end sm:self-auto px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${!isAscending
                ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                : "bg-white/[0.05] hover:bg-white/10 border-white/10 text-gray-300 hover:text-white"
                }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sắp xếp</span>
            </button>
          </div>

          {/* Hiển thị lỗi/rỗng về Season */}
          {!isSeasonsLoading && seasons.length === 0 && (
            <div className="py-12 text-center max-w-sm mx-auto text-gray-500 relative z-10">
              <AlertCircle className="w-10 h-10 text-gray-600 mx-auto mb-4" />
              <p className="text-sm font-medium">
                Hiện tại chưa có phần phim (Season) nào được công bố.
              </p>
            </div>
          )}

          {/* TRẠNG THÁI LOADING EPISODES */}
          {isEpisodesLoading && (
            <div
              className={`grid gap-2.5 relative z-10 mt-5 ${isComic
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7"
                : "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10"
                }`}
            >
              {Array.from({ length: 10 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-11 rounded-xl bg-white/[0.04] animate-pulse"
                />
              ))}
            </div>
          )}

          {/* TRẠNG THÁI LỖI EPISODES */}
          {isEpisodesError && !isEpisodesLoading && (
            <div className="py-12 text-center max-w-sm mx-auto relative z-10">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
              <p className="text-sm font-bold text-white mb-4">
                Lỗi tải danh sách {isComic ? "chương" : "tập phim"}
              </p>
              <button
                type="button"
                onClick={() => refetchEpisodes()}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tải lại
              </button>
            </div>
          )}

          {/* TRẠNG THÁI EPISODES HIỂN THỊ RỖNG */}
          {!isSeasonsLoading &&
            seasons.length > 0 &&
            !isEpisodesLoading &&
            episodes.length === 0 && (
              <div className="py-12 text-center max-w-sm mx-auto text-gray-500 relative z-10">
                <AlertCircle className="w-10 h-10 text-gray-600 mx-auto mb-4" />
                <p className="text-sm font-medium">
                  Không tìm thấy {isComic ? "chương" : "tập phim"} nào trong
                  phần này.
                </p>
              </div>
            )}

          {/* ================= DANH SÁCH TẬP PHIM / CHƯƠNG (COMPACT PILL BUTTONS) ================= */}
          {!isEpisodesLoading &&
            !isEpisodesError &&
            sortedEpisodes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`grid gap-2.5 relative z-10 mt-5 ${isComic
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7"
                  : "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10"
                  }`}
              >
                {sortedEpisodes.map((episode) => {
                  const isPaid = episode.unlockType === "PAID";
                  const isUnlocked = isEpisodeUnlocked(episode);
                  const showLock = isPaid && !isUnlocked;
                  return (
                    <Link
                      key={episode.episodeId}
                      href={`/${isComic ? "read" : "watch"}/${episode.episodeId}`}
                      className="group relative flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-[#1e1e24] hover:bg-[#D4AF37] border border-white/5 hover:border-[#D4AF37] text-white hover:text-black font-extrabold text-xs md:text-sm transition-all duration-200 shadow-md active:scale-95 text-center min-w-0"
                    >
                      {isComic ? (
                        <BookOpen className="w-3.5 h-3.5 text-gray-400 group-hover:text-black shrink-0" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current text-gray-400 group-hover:text-black shrink-0" />
                      )}
                      <span className="whitespace-nowrap">
                        {isComic
                          ? `Chương ${episode.episodeNumber}`
                          : `Tập ${episode.episodeNumber}`}
                      </span>
                      {showLock && (
                        <Lock className="w-3 h-3 text-amber-400 group-hover:text-black shrink-0 ml-0.5" />
                      )}
                    </Link>
                  );
                })}
              </motion.div>
            )}
        </section>

      </div>
    </div>
  );
}
