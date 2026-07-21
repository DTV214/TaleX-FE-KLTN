"use client";

import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import {
  getPublicSeriesDetail,
  getPublicSeasons,
  getPublicEpisodes,
  type PublicEpisodeItem,
} from "../api/series-api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getMyLikedEpisodes, getEpisodeLikes } from "../api/episode-likes-api";
import { useGetPublicCombos } from "@/features/public/hooks/use-public-combos";
import { useCreatorFollow } from "../hooks/use-creator-follow";
import { getFollowers } from "../api/creator-follows-api";
import { FollowButton } from "./follow-button";
import { EpisodeBookmarkButton } from "./episode-bookmark-button";
import { EpisodeShareButton } from "./episode-share-button";
import { useAuthStore } from "@/features/auth/store/auth.store";

interface SeriesDetailProps {
  seriesId: string;
}

export function SeriesDetail({ seriesId }: SeriesDetailProps) {
  const router = useRouter();
  const authUser = useAuthStore((state) => state.user);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [expandedCombos, setExpandedCombos] = useState<Record<string, boolean>>(
    {},
  );

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

  const [initialIsFollowing, setInitialIsFollowing] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    setInitialIsFollowing(null);
  }, [series?.seriesId]);

  useEffect(() => {
    if (
      !isFollowListLoading &&
      initialIsFollowing === null &&
      series?.accountId
    ) {
      setInitialIsFollowing(isFollowing);
    }
  }, [isFollowListLoading, isFollowing, series?.accountId, initialIsFollowing]);

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
    (ownFollowersData as any)?.totalElements ??
    (ownFollowersData as any)?.numberOfElements ??
    ownFollowersData?.content?.length ??
    0;

  const displayFollowersCount = (() => {
    const baseCount = Math.max(
      series?.totalCreatorFollowers ?? 0,
      isOwner ? ownFollowerCount : 0,
    );
    if (initialIsFollowing === null) {
      return isFollowing ? Math.max(1, baseCount) : baseCount;
    }
    if (initialIsFollowing) {
      return isFollowing ? Math.max(1, baseCount) : Math.max(0, baseCount - 1);
    } else {
      return isFollowing ? Math.max(1, baseCount + 1) : baseCount;
    }
  })();

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

  // Sắp xếp các episode theo episodeNumber
  const sortedEpisodes = [...episodes].sort(
    (a, b) => a.episodeNumber - b.episodeNumber,
  );

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
      (acc, ep) => acc + (ep.views || 0),
      0,
    );
    return Math.max(series?.totalViews ?? 0, epViews);
  }, [series, allEpisodesInSeries]);

  const totalSeriesLikes = useMemo(() => {
    const epLikes = allEpisodesInSeries.reduce((acc, ep, index) => {
      const likesQueryData = episodeLikesQueries[index]?.data;
      const listLikesCount =
        likesQueryData?.numberOfElements ??
        likesQueryData?.content?.length ??
        0;
      const likesForEp = Math.max(
        ep.likes || 0,
        listLikesCount,
        myLikedEpisodeIds.has(ep.episodeId) ? 1 : 0,
      );
      return acc + likesForEp;
    }, 0);
    return Math.max((series as any)?.likes ?? 0, epLikes);
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

  // Giả lập chức năng đăng ký/theo dõi series
  const handleSubscribeToggle = () => {
    setIsSubscribed((prev) => !prev);
    if (!isSubscribed) {
      toast.success(`Đã đăng ký nhận thông báo từ series "${series?.title}"`);
    } else {
      toast.info(`Đã hủy đăng ký series "${series?.title}"`);
    }
  };

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

  return (
    <div className="w-full min-h-screen bg-[#0B0B0C] text-white relative pb-24 overflow-hidden">
      {/* 1. Backdrop Banner với blur và gradient */}
      <div className="absolute top-0 left-0 w-full h-[65vh] min-h-[500px] z-0">
        {series.bannerUrl ? (
          <div
            className="w-full h-full bg-cover bg-center filter blur-[6px] scale-105 opacity-25"
            style={{ backgroundImage: `url(${series.bannerUrl})` }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-[#D4AF37]/5 via-transparent to-transparent opacity-30" />
        )}
        {/* Lớp phủ gradient chìm vào nền tối */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/60 to-[#0B0B0C]" />
        <div
          className="absolute inset-0 bg-radial-gradient"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, transparent 20%, #0B0B0C 85%)",
          }}
        />
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
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase backdrop-blur-md border ${
                  !isComic
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                }`}
              >
                {!isComic ? "Phim bộ" : "Truyện tranh"}
              </span>
            </div>
          </motion.div>

          {/* Cột Phải: Các thông tin văn bản */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex-1"
          >
            {/* Cụm Badge thông số nhỏ */}
            <div className="flex flex-wrap items-center gap-3 mb-4 text-xs font-semibold text-gray-400">
              {series.ageRating && (
                <span className="px-2.5 py-1 rounded bg-[#E50914]/10 text-[#FF4D4D] border border-[#E50914]/20 font-extrabold">
                  {series.ageRating}
                </span>
              )}
              {series.language && (
                <span className="flex items-center gap-1 bg-white/[0.04] border border-white/5 px-2.5 py-1 rounded">
                  <Languages className="w-3.5 h-3.5 text-[#D4AF37]" />{" "}
                  {series.language.toUpperCase()}
                </span>
              )}
              <span className="flex items-center gap-1 bg-white/[0.04] border border-white/5 px-2.5 py-1 rounded text-gray-300">
                <Eye className="w-3.5 h-3.5 text-gray-400" />{" "}
                {totalSeriesViews.toLocaleString("vi-VN")} lượt xem
              </span>
              <span className="flex items-center gap-1 bg-white/[0.04] border border-white/5 px-2.5 py-1 rounded text-gray-300">
                <Users className="w-3.5 h-3.5 text-gray-400" />{" "}
                {displayFollowersCount != null
                  ? `${displayFollowersCount.toLocaleString("vi-VN")} người theo dõi`
                  : "0 người theo dõi"}
              </span>
              <span className="flex items-center gap-1 bg-white/[0.04] border border-white/5 px-2.5 py-1 rounded text-red-400 font-bold">
                <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />{" "}
                {totalSeriesLikes.toLocaleString("vi-VN")} lượt thích
              </span>
            </div>

            {/* Tiêu đề lớn */}
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
              {series.title}
            </h1>

            {/* Thể loại & Tag */}
            <div className="flex flex-wrap gap-2 mb-6">
              {series.categories.map((cat) => (
                <span
                  key={cat.categoryId}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/25"
                >
                  {cat.categoryName}
                </span>
              ))}
              {series.tags.map((tag) => (
                <span
                  key={tag.tagId}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-white/[0.03] text-gray-400 border border-white/5"
                >
                  #{tag.tagName}
                </span>
              ))}
            </div>

            {/* Thông tin nhà sáng tạo (Creator Profile & Follow Action) */}
            {series.creatorName && (
              <div className="flex items-center gap-3 mb-8 bg-white/[0.02] border border-white/5 w-fit rounded-2xl p-4 backdrop-blur-md">
                <Link
                  href={
                    isOwner
                      ? "/creator-channel"
                      : `/public-channel?creatorId=${series.creatorId || series.accountId}`
                  }
                  className="flex items-center gap-3 min-w-0 pr-2 group cursor-pointer hover:opacity-90 transition-opacity"
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
                  <div className="ml-4 pl-4 border-l border-white/5 shrink-0">
                    <FollowButton
                      isFollowing={isFollowing}
                      onFollowToggle={toggleFollow}
                      isMutating={isFollowMutating}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Mô tả dài */}
            <div className="max-w-3xl mb-8">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                Giới thiệu nội dung
              </h3>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                {series.description ||
                  "Chưa có nội dung giới thiệu chi tiết cho tác phẩm này."}
              </p>
            </div>

            {/* Nút hành động chính */}
            <div className="flex flex-wrap gap-4 items-center">
              {firstEpisodeId ? (
                <Link
                  href={`/${isComic ? "read" : "watch"}/${firstEpisodeId}`}
                  className="px-8 py-3.5 bg-[#D4AF37] hover:bg-[#E5C158] text-black font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-[0_6px_25px_rgba(212,175,55,0.3)] transition-all duration-300 hover:scale-[1.02]"
                >
                  <Play className="w-5 h-5 fill-current" />{" "}
                  {isComic ? "Đọc tập đầu tiên" : "Xem tập đầu tiên"}
                </Link>
              ) : (
                <button
                  disabled
                  className="px-8 py-3.5 bg-white/10 text-white/50 font-bold rounded-2xl cursor-not-allowed flex items-center gap-2"
                >
                  Chưa có tập phim
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* 2.5. Section: Gói Combo Ưu Đãi (chỉ hiển thị nếu có combo cho series này) */}
        {!combosQuery.isLoading && seriesCombos.length > 0 && (
          <section className="w-full bg-[#121214]/40 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl relative mb-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent pointer-events-none rounded-3xl" />
            <div className="relative z-10">
              <div className="mb-6 flex flex-col gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37] self-start">
                  <Sparkles className="w-3.5 h-3.5" /> COMBO ƯU ĐÃI ĐỘC QUYỀN
                </span>
                <h2 className="text-2xl font-bold text-white tracking-wide">
                  Mua trọn gói - Tiết kiệm đến 40%
                </h2>
                <p className="text-xs text-gray-400">
                  Mở khóa hàng loạt tập phim/truyện cùng lúc với mức giá tốt
                  nhất để xem không bị gián đoạn.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {seriesCombos.map((combo) => {
                  const originalPrice =
                    combo.originalPriceVnd ?? combo.priceVnd;
                  const discountPercentage =
                    originalPrice > combo.priceVnd
                      ? Math.round(
                          ((originalPrice - combo.priceVnd) / originalPrice) *
                            100,
                        )
                      : 0;
                  const isPurchasable = combo.priceVnd > 0;
                  const episodeCount = combo.episodes?.length ?? 0;

                  return (
                    <div
                      key={combo.comboId}
                      className="relative flex flex-col justify-between rounded-2xl border border-white/10 bg-[#161619] p-6 shadow-xl transition-all duration-300 hover:border-[#D4AF37]/50 hover:shadow-[0_0_24px_rgba(212,175,55,0.08)] group"
                    >
                      {discountPercentage > 0 && (
                        <div className="absolute top-4 right-4 z-10">
                          <span className="inline-flex items-center rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-xs font-black text-red-400">
                            Tiết kiệm {discountPercentage}%
                          </span>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <h3 className="font-bold text-lg text-white group-hover:text-[#D4AF37] transition-colors duration-200 line-clamp-1">
                            {combo.title}
                          </h3>
                          <p className="mt-2 text-xs text-gray-400 line-clamp-2 leading-relaxed">
                            {combo.description ||
                              "Mở khóa nhiều tập cùng lúc với giá tốt."}
                          </p>
                        </div>

                        {combo.episodes && combo.episodes.length > 0 && (
                          <div className="border-t border-white/5 pt-3">
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedCombos((prev) => ({
                                  ...prev,
                                  [combo.comboId]: !prev[combo.comboId],
                                }));
                              }}
                              className="text-xs font-bold text-[#D4AF37] hover:text-[#F3CE5E] flex items-center gap-1 cursor-pointer focus:outline-none"
                            >
                              {expandedCombos[combo.comboId]
                                ? "Ẩn danh sách tập"
                                : "Xem danh sách tập bao gồm"}
                              <ChevronRight
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedCombos[combo.comboId] ? "rotate-90" : ""}`}
                              />
                            </button>
                            {expandedCombos[combo.comboId] && (
                              <ul className="mt-2 max-h-32 overflow-y-auto space-y-1.5 pl-2 text-xs text-gray-400 no-scrollbar">
                                {combo.episodes.map((ep) => (
                                  <li
                                    key={ep.episodeId}
                                    className="flex items-center gap-1.5"
                                  >
                                    <span className="w-1 h-1 rounded-full bg-[#D4AF37] shrink-0" />
                                    <span className="truncate">
                                      {ep.episodeNumber != null
                                        ? `Tập ${ep.episodeNumber}: `
                                        : ""}
                                      {ep.title}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}

                        <div className="space-y-2 text-xs bg-black/40 rounded-xl border border-white/5 p-4">
                          <div className="flex justify-between items-center text-gray-300">
                            <span>Số lượng tập:</span>
                            <span className="font-bold text-white">
                              {episodeCount} tập
                            </span>
                          </div>
                          {originalPrice > combo.priceVnd && (
                            <div className="flex justify-between items-center text-gray-400">
                              <span>Giá gốc:</span>
                              <span className="line-through">
                                {originalPrice.toLocaleString("vi-VN")} đ
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
                            <span className="font-bold text-gray-300">
                              Giá combo:
                            </span>
                            <span className="text-base font-black text-[#D4AF37]">
                              {combo.priceVnd.toLocaleString("vi-VN")} đ
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const params = new URLSearchParams({
                            itemId: combo.comboId,
                            itemType: "COMBO",
                            title: combo.title,
                            returnTo: `/series/${seriesId}`,
                          });
                          router.push(`/checkout-content?${params.toString()}`);
                        }}
                        disabled={!isPurchasable}
                        className="mt-6 w-full rounded-xl bg-[#D4AF37] py-3 text-xs font-bold text-black transition-all hover:bg-[#F3CE5E] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                      >
                        {isPurchasable ? "Mua Gói Ngay" : "Liên hệ để mua"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 3. Section: Season Selector & Episodes list */}
        <section className="w-full bg-[#121214]/40 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl relative">
          {/* Lớp nền mờ */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none rounded-3xl" />

          {/* Tiêu đề khu vực tập */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10 border-b border-white/5 pb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-wide flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" /> Danh Sách Tập
                Phim
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Chọn phần phim để xem danh sách các tập tương ứng.
              </p>
            </div>

            {/* Tabs chọn phần phim (Seasons) */}
            {isSeasonsLoading ? (
              <div className="h-10 w-48 bg-white/[0.03] animate-pulse rounded-xl" />
            ) : (
              seasons.length > 0 && (
                <div className="flex p-1 rounded-xl bg-white/[0.03] border border-white/5 overflow-x-auto self-start sm:self-auto scrollbar-hide">
                  {seasons
                    .sort((a, b) => a.seasonNumber - b.seasonNumber)
                    .map((season) => (
                      <button
                        key={season.seasonId}
                        onClick={() => setSelectedSeasonId(season.seasonId)}
                        className={`px-4 py-2 rounded-lg text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                          activeSeasonId === season.seasonId
                            ? "bg-[#D4AF37] text-black shadow-md font-bold"
                            : "text-gray-400 hover:text-white hover:bg-white/[0.02]"
                        }`}
                      >
                        {season.title}
                      </button>
                    ))}
                </div>
              )
            )}
          </div>

          {/* Hiển thị lỗi/rỗng về Season */}
          {!isSeasonsLoading && seasons.length === 0 && (
            <div className="py-12 text-center max-w-sm mx-auto text-gray-500">
              <AlertCircle className="w-10 h-10 text-gray-600 mx-auto mb-4" />
              <p className="text-sm font-medium">
                Hiện tại chưa có phần phim (Season) nào được công bố.
              </p>
            </div>
          )}

          {/* TRẠNG THÁI LOADING EPISODES */}
          {isEpisodesLoading && (
            <div className="space-y-4 relative z-10">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 p-4 bg-white/[0.01] border border-white/5 rounded-2xl animate-pulse"
                >
                  <div className="w-32 sm:w-44 aspect-video rounded-xl bg-white/[0.04]" />
                  <div className="flex-1 space-y-2.5 py-1">
                    <div className="h-5 bg-white/[0.04] rounded-md w-1/3" />
                    <div className="h-4 bg-white/[0.04] rounded-md w-2/3" />
                    <div className="h-3 bg-white/[0.04] rounded-md w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TRẠNG THÁI LỖI EPISODES */}
          {isEpisodesError && !isEpisodesLoading && (
            <div className="py-12 text-center max-w-sm mx-auto relative z-10">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
              <p className="text-sm font-bold text-white mb-4">
                Lỗi tải danh sách tập phim
              </p>
              <button
                onClick={() => refetchEpisodes()}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold"
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
                  Không tìm thấy tập phim nào trong phần này.
                </p>
              </div>
            )}

          {/* DANH SÁCH TẬP PHIM */}
          {!isEpisodesLoading && !isEpisodesError && episodes.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05 },
                },
              }}
              className="space-y-4 md:space-y-5 relative z-10"
            >
              {sortedEpisodes.map((episode) => {
                const isPaid = episode.unlockType === "PAID";
                return (
                  <motion.div
                    key={episode.episodeId}
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    className="group relative flex flex-col sm:flex-row gap-4 p-4 md:p-5 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-[#D4AF37]/35 shadow-lg transition-all duration-300"
                  >
                    {/* Ảnh thu nhỏ (Thumbnail/Play button) */}
                    <div className="w-full sm:w-44 md:w-52 flex-none aspect-video rounded-xl overflow-hidden bg-white/[0.02] border border-white/5 relative group-hover:border-[#D4AF37]/50 shadow-md">
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors z-10 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-[#D4AF37]/80 group-hover:bg-[#D4AF37] group-hover:scale-110 flex items-center justify-center text-black shadow-lg transition duration-300">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>

                      {/* Trạng thái khóa / mở */}
                      <div className="absolute top-2.5 right-2.5 z-20">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wide uppercase ${
                            isPaid
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-green-500/10 text-green-400 border border-green-500/20"
                          }`}
                        >
                          {isPaid ? (
                            <>
                              <Lock className="w-2.5 h-2.5" /> Trả phí
                            </>
                          ) : (
                            <>
                              <Unlock className="w-2.5 h-2.5" /> Miễn phí
                            </>
                          )}
                        </span>
                      </div>

                      {/* Video/Image Placeholder or series cover as thumb */}
                      <div
                        className="w-full h-full bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${
                            episode.thumbnail ||
                            series.coverUrl ||
                            "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=500&auto=format&fit=crop"
                          })`,
                        }}
                      />
                    </div>

                    {/* Văn bản nội dung tập phim */}
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      {/* Tập và Tiêu đề */}
                      <h3 className="text-white font-bold text-base md:text-lg line-clamp-1 group-hover:text-[#D4AF37] transition-colors duration-200 mb-1.5 flex items-center gap-2">
                        <span className="text-gray-500 font-medium">
                          Tập {episode.episodeNumber}:
                        </span>
                        <span>{episode.title}</span>
                      </h3>

                      {/* Thông tin phụ: ngày phát hành / lượt xem */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-600" />{" "}
                          {new Date(episode.publishedAt).toLocaleDateString(
                            "vi-VN",
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-gray-600" />{" "}
                          {episode.views.toLocaleString("vi-VN")} lượt xem
                        </span>
                        {isPaid && episode.priceVnd > 0 && (
                          <span className="text-[#D4AF37] font-bold">
                            {episode.priceVnd.toLocaleString("vi-VN")} đ
                          </span>
                        )}
                      </div>

                      {/* Mô tả tập phim */}
                      {episode.description ? (
                        <p className="text-gray-400 text-xs md:text-sm line-clamp-2 leading-relaxed">
                          {episode.description}
                        </p>
                      ) : (
                        <p className="text-gray-500 text-xs italic">
                          Không có mô tả tập phim.
                        </p>
                      )}

                      {/* Mobile action row */}
                      <div className="flex md:hidden items-center justify-between mt-4 pt-3 border-t border-white/5 gap-3">
                        <div className="flex items-center gap-2">
                          <EpisodeBookmarkButton
                            episodeId={episode.episodeId}
                            contentType={series.contentType}
                          />
                          <EpisodeShareButton
                            episodeId={episode.episodeId}
                            contentType={series.contentType}
                          />
                        </div>
                        <Link
                          href={`/${isComic ? "read" : "watch"}/${episode.episodeId}`}
                          className="px-4 py-2 bg-white/[0.04] active:bg-[#D4AF37] active:text-black hover:bg-[#D4AF37] hover:text-black text-white font-bold rounded-xl text-xs transition-all duration-200 shadow-md"
                        >
                          {isComic ? "Đọc Ngay" : "Xem Ngay"}
                        </Link>
                      </div>
                    </div>

                    {/* Nút hành động bên góc phải (Chỉ hiển thị trên md screen) */}
                    <div className="hidden md:flex items-center gap-3 justify-end pl-4 shrink-0">
                      <EpisodeBookmarkButton
                        episodeId={episode.episodeId}
                        contentType={series.contentType}
                      />
                      <EpisodeShareButton
                        episodeId={episode.episodeId}
                        contentType={series.contentType}
                      />
                      <Link
                        href={`/${isComic ? "read" : "watch"}/${episode.episodeId}`}
                        className="px-5 py-2.5 bg-white/[0.04] group-hover:bg-[#D4AF37] text-white group-hover:text-black font-bold rounded-xl text-sm transition-all duration-300 whitespace-nowrap shadow-md group-hover:shadow-[0_4px_12px_rgba(212,175,55,0.25)]"
                      >
                        {isComic ? "Đọc Ngay" : "Xem Ngay"}
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
}
