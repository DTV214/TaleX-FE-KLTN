"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Loader2,
  Calendar,
  Eye,
  Film,
  PlayCircle,
  ArrowUpDown,
  Menu,
  Lock,
  CheckCircle2,
  Sparkles,
  Star,
  BookOpen,
  Clapperboard,
  Flame,
  Zap,
  Tv,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  getEpisodePlayback,
  getCreatorEpisodePlayback,
} from "@/features/playback/api/playback-api";
import { getEpisodeWatchPosition } from "@/features/playback/api/watch-sessions-api";
import {
  getPublicEpisodeDetail,
  getPublicEpisodes,
  getPublicSeriesList,
} from "@/features/series/api/series-api";
import { LikeButton } from "@/features/series/components/like-button";
import { EpisodeBookmarkButton } from "@/features/series/components/episode-bookmark-button";
import { LikedUsersModal } from "@/features/series/components/liked-users-modal";
import { EpisodeShareButton } from "@/features/series/components/episode-share-button";
import { useEpisodeLikes } from "@/features/series/hooks/use-episode-likes";
import { HlsVideoPlayer } from "@/features/playback/components/hls-video-player";
import { VideoPrerollAdWidget } from "@/features/ads/components/video-preroll-ad-widget";
import { ContentPaywallGate } from "@/features/checkout-content/components/content-paywall-gate";
import { isNotEntitledError } from "@/features/checkout-content/utils/is-not-entitled-error";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useContentEntitlement } from "@/features/series/hooks/use-content-entitlement";
import { FollowButton } from "@/features/series/components/follow-button";
import { EpisodeCommentsSection } from "@/features/comments";
import { useCreatorFollow } from "@/features/series/hooks/use-creator-follow";
import {
  getCreatorDetail,
  getFollowers,
} from "@/features/series/api/creator-follows-api";
import { useRecommendationFeedInfinite } from "@/features/recommendations/hooks/use-home-feed";
import { AdSlot } from "@/shared/ui/ad-slot";

type SignedHlsPlayerProps = {
  episodeId: string;
  viewerId?: string;
  compact?: boolean;
  /** Use creator-authenticated endpoint (works for DRAFT episodes) */
  creatorMode?: boolean;
};

const PROCESSING_RETRY_INTERVAL_MS = 7000;
const MAX_PROCESSING_RETRIES = 12;

type PlayerErrorState = {
  manifestUrl: string;
  message: string;
};

function getPlaybackErrorMessage(message?: string | null) {
  if (message === "VIDEO_PROCESSING" || message === "VIDEO_NOT_READY") {
    return "Video is still processing. Please try again shortly.";
  }

  if (message === "VIDEO_FAILED") {
    return "Video processing failed.";
  }

  return message ?? null;
}

function isProcessingPlaybackError(message?: string | null) {
  return message === "VIDEO_PROCESSING" || message === "VIDEO_NOT_READY";
}

export function SignedHlsPlayer({
  episodeId,
  viewerId,
  compact = false,
  creatorMode = false,
}: SignedHlsPlayerProps) {
  const retryCountRef = useRef(0);
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  // Falls back to the logged-in viewer's own accountId so the BE entitlement
  // check (purchase/subscription/ownership) has someone to check against —
  // without this every viewer looks anonymous and paid content 403s for everyone.
  const resolvedViewerId = viewerId ?? authUser?.accountId;
  const queryKey = useMemo(
    () =>
      [
        "episode-playback",
        episodeId,
        resolvedViewerId ?? "anonymous",
        creatorMode ? "creator" : "public",
      ] as const,
    [episodeId, resolvedViewerId, creatorMode],
  );
  const storageKey = useMemo(
    () => `talex.watch-position.${episodeId}`,
    [episodeId],
  );
  const [playerError, setPlayerError] = useState<PlayerErrorState | null>(null);
  const [processingRetryCount, setProcessingRetryCount] = useState(0);
  const [previewEnded, setPreviewEnded] = useState(false);
  const [isAdFinished, setIsAdFinished] = useState(false);

  const fetchPlayback = creatorMode
    ? getCreatorEpisodePlayback
    : getEpisodePlayback;

  const playbackQuery = useQuery({
    queryKey,
    queryFn: () => fetchPlayback(episodeId, resolvedViewerId),
    // Entitlement can change externally (just purchased) — never serve a stale 403 from cache.
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Tải vị trí xem dở gần nhất từ API Watch Session và lưu vào localStorage
  useEffect(() => {
    if (!episodeId || !storageKey) return;
    let isMounted = true;
    console.log("[SignedHlsPlayer] Fetching watch position for episodeId:", episodeId);
    void getEpisodeWatchPosition(episodeId).then((position) => {
      console.log("[SignedHlsPlayer] API Watch Position result:", position);
      if (isMounted && typeof position === "number" && position > 0) {
        const currentLocal = Number(localStorage.getItem(storageKey) || 0);
        console.log("[SignedHlsPlayer] Setting position from API:", position, "(previous local:", currentLocal, ")");
        localStorage.setItem(storageKey, String(position));
      }
    });
    return () => {
      isMounted = false;
    };
  }, [episodeId, storageKey]);

  // Fetch chi tiết tập phim
  const { data: episodeDetail } = useQuery({
    queryKey: ["publicEpisodeDetail", episodeId],
    queryFn: () => getPublicEpisodeDetail(episodeId),
    enabled: !!episodeId,
  });

  const { data: seasonEpisodes = [], isLoading: isSeasonEpisodesLoading } =
    useQuery({
      queryKey: ["publicSeasonEpisodes", episodeDetail?.seasonId],
      queryFn: () => getPublicEpisodes(episodeDetail!.seasonId),
      enabled: !compact && !!episodeDetail?.seasonId,
    });

  const [isAscending, setIsAscending] = useState(true);

  const sortedSeasonEpisodes = useMemo(
    () =>
      [...seasonEpisodes].sort((a, b) =>
        isAscending
          ? a.episodeNumber - b.episodeNumber
          : b.episodeNumber - a.episodeNumber,
      ),
    [seasonEpisodes, isAscending],
  );

  // Quyền truy cập nội dung (tập đã mua, subscription, hoặc tác giả)
  const { isEpisodeUnlocked } = useContentEntitlement({
    contentType: episodeDetail?.contentType || "VIDEO",
    creatorAccountId: episodeDetail?.creatorId,
    episodes: sortedSeasonEpisodes,
  });

  // Quản lý trạng thái like của tập phim
  const { totalLikes, isLiked, toggleLike, isMutating, likedUsers } =
    useEpisodeLikes(episodeId);

  // Truy vấn chi tiết thông tin nhà sáng tạo (để lấy accountId nhằm follow)
  const { data: creatorDetail } = useQuery({
    queryKey: ["creatorDetailPublic", episodeDetail?.creatorId],
    queryFn: () => getCreatorDetail(episodeDetail!.creatorId),
    enabled: !!episodeDetail?.creatorId,
  });

  // Fetch danh sách series public để ghép thông tin creator (accountId, avatar, name, followers)
  const { data: publicSeriesData } = useQuery({
    queryKey: ["publicSeriesListAll"],
    queryFn: () => getPublicSeriesList(1, 100),
    staleTime: 30 * 1000,
  });

  const matchedSeries = useMemo(() => {
    if (!episodeDetail || !publicSeriesData?.content) return null;
    const episodeSeriesId =
      "seriesId" in episodeDetail && typeof episodeDetail.seriesId === "string"
        ? episodeDetail.seriesId
        : null;
    return (
      publicSeriesData.content.find(
        (s) =>
          s.creatorId === episodeDetail.creatorId ||
          s.seriesId === episodeSeriesId ||
          (s.creatorName && s.creatorName === episodeDetail.createdBy),
      ) || null
    );
  }, [episodeDetail, publicSeriesData]);

  const [selectedFilter, setSelectedFilter] = useState<"all" | "creator" | "newest">("all");

  // Call GET /api/v1/recommendations/feed for watch page sidebar with fresh sessionId on reload
  const {
    data: watchFeedData,
    fetchNextPage: fetchNextWatchPage,
    hasNextPage: hasNextWatchPage,
    isFetchingNextPage: isFetchingNextWatchPage,
    isLoading: isWatchFeedLoading,
  } = useRecommendationFeedInfinite(12, "WATCH", {
    forceNewSessionOnMount: true,
  });

  const watchFeedSeries = useMemo(() => {
    return watchFeedData?.pages.flatMap((page) => page.items) ?? [];
  }, [watchFeedData]);

  const filteredSeriesList = useMemo(() => {
    if (!publicSeriesData?.content) return [];
    const currentSeriesId = matchedSeries?.seriesId;
    let list = publicSeriesData.content.filter(
      (s) => s.contentType === "VIDEO" && s.seriesId !== currentSeriesId,
    );
    if (selectedFilter === "creator" && episodeDetail?.creatorId) {
      list = list.filter((s) => s.creatorId === episodeDetail.creatorId);
    }
    return list;
  }, [publicSeriesData, matchedSeries, selectedFilter, episodeDetail]);

  const displaySidebarList = useMemo(() => {
    if (selectedFilter === "creator") {
      return filteredSeriesList;
    }
    if (watchFeedSeries.length > 0) {
      return watchFeedSeries;
    }
    return filteredSeriesList;
  }, [selectedFilter, watchFeedSeries, filteredSeriesList]);

  const creatorAccountId =
    creatorDetail?.accountId ||
    matchedSeries?.accountId ||
    (creatorDetail?.creatorId === episodeDetail?.creatorId
      ? undefined
      : creatorDetail?.creatorId);
  const creatorName =
    creatorDetail?.displayName ||
    creatorDetail?.username ||
    matchedSeries?.creatorName ||
    episodeDetail?.createdBy ||
    "Nhà sáng tạo";
  const creatorAvatar =
    creatorDetail?.avatarUrl || matchedSeries?.creatorAvatar;

  const {
    isFollowing,
    toggleFollow,
    isMutating: isFollowMutating,
  } = useCreatorFollow(creatorAccountId);

  const isOwner = Boolean(
    authUser?.accountId &&
    creatorAccountId &&
    authUser.accountId === creatorAccountId,
  );

  const { data: ownFollowersData } = useQuery({
    queryKey: ["ownCreatorFollowers", creatorAccountId],
    queryFn: () => getFollowers(0, 100),
    enabled: !!authUser && isOwner,
  });

  const ownFollowerCount =
    ownFollowersData?.numberOfElements ??
    ownFollowersData?.content?.length ??
    0;

  const rawFollowerCount = Math.max(
    creatorDetail?.followerCount ?? 0,
    creatorDetail?.totalCreatorFollowers ?? 0,
    creatorDetail?.followersCount ?? 0,
    matchedSeries?.totalCreatorFollowers ?? 0,
    isOwner ? ownFollowerCount : 0,
  );

  const displayFollowersCount = rawFollowerCount;

  const manifestUrl =
    playbackQuery.data?.manifestUrl ||
    playbackQuery.data?.hlsUrl ||
    playbackQuery.data?.playbackUrl ||
    "";

  const refreshPlayback = useCallback(() => {
    setPlayerError(null);
    retryCountRef.current = 0;
    setProcessingRetryCount(0);
    void queryClient.refetchQueries({ queryKey, exact: true });
  }, [queryClient, queryKey]);

  const handleFatalPlayerError = useCallback(
    (message: string) => {
      setPlayerError({ manifestUrl, message });

      if (retryCountRef.current >= 2) {
        return;
      }

      retryCountRef.current += 1;
      void queryClient.refetchQueries({ queryKey, exact: true });
    },
    [manifestUrl, queryClient, queryKey],
  );

  const queryErrorMessage =
    playbackQuery.error instanceof Error ? playbackQuery.error.message : null;
  const emptyManifestError =
    playbackQuery.isSuccess && !manifestUrl
      ? "No playback manifest available."
      : null;
  const playerErrorMessage =
    playerError?.manifestUrl === manifestUrl ? playerError.message : null;
  const rawErrorMessage =
    playerErrorMessage || queryErrorMessage || emptyManifestError;
  const processingPlaybackError = isProcessingPlaybackError(rawErrorMessage);
  const notEntitled = isNotEntitledError(rawErrorMessage);
  const errorMessage = getPlaybackErrorMessage(rawErrorMessage);

  useEffect(() => {
    if (!processingPlaybackError) {
      return;
    }

    if (processingRetryCount >= MAX_PROCESSING_RETRIES) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setProcessingRetryCount((count) => count + 1);
      void queryClient.refetchQueries({ queryKey, exact: true });
    }, PROCESSING_RETRY_INTERVAL_MS);

    return () => window.clearTimeout(timeoutId);
  }, [processingPlaybackError, processingRetryCount, queryClient, queryKey]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#12100d] text-white">
      {/* Background không khí rạp phim sang trọng chuẩn tông đen - vàng kim của TaleX */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Ảnh nền thiên hà rực rỡ */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.22] mix-blend-screen"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2200&auto=format&fit=crop)",
          }}
        />

        {/* Quầng sáng Gold & Đen sâu thẳm (Không có màu xanh) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(212,175,55,0.28),transparent_42%),radial-gradient(circle_at_80%_25%,rgba(212,175,55,0.18),transparent_40%),linear-gradient(180deg,rgba(18,16,13,0.88)_0%,rgba(10,9,8,0.95)_50%,#080808_100%)]" />

        {/* Ambient Gold Orbs làm sáng nhẹ nhàng tông đen sang trọng */}
        <div className="absolute -top-24 left-[15%] h-[450px] w-[450px] rounded-full bg-[#D4AF37]/18 blur-[130px]" />
        <div className="absolute top-[20%] right-[5%] h-[450px] w-[450px] rounded-full bg-amber-500/12 blur-[140px]" />

        {/* Dải vòng vòm ánh sáng Vàng Kim */}
        <div className="absolute -left-28 top-20 h-80 w-[800px] rotate-[-10deg] rounded-[100%] border-t-2 border-[#D4AF37]/25 shadow-[0_-10px_20px_rgba(212,175,55,0.15)]" />
        <div className="absolute right-[-180px] top-16 h-[420px] w-[820px] rotate-[16deg] rounded-[100%] border-t-2 border-[#D4AF37]/15" />

        {/* Bộ sưu tập các Icon điện ảnh Tông Vàng / Trắng phát sáng */}
        <Sparkles className="absolute left-[12%] top-[14%] h-8 w-8 text-[#D4AF37]/45 animate-pulse drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
        <Star className="absolute right-[14%] top-[16%] h-9 w-9 text-amber-300/40 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
        <Flame className="absolute right-[22%] top-[42%] h-8 w-8 text-amber-400/35 rotate-[12deg]" />
        <BookOpen className="absolute left-[8%] top-[48%] h-8 w-8 text-amber-200/30 rotate-[-8deg]" />
        <Clapperboard className="absolute left-[42%] top-[8%] h-9 w-9 rotate-[-12deg] text-white/25 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
        <Film className="absolute right-[8%] top-[65%] h-10 w-10 text-[#D4AF37]/35 rotate-[15deg]" />
        <Tv className="absolute left-[16%] top-[72%] h-9 w-9 text-amber-300/30 rotate-[-15deg]" />
        <Zap className="absolute right-[32%] top-[12%] h-7 w-7 text-yellow-300/40 animate-bounce" />
        <Sparkles className="absolute left-[48%] top-[78%] h-7 w-7 text-[#D4AF37]/40 animate-pulse" />
      </div>

      <div
        className={
          compact
            ? "relative z-10 w-full"
            : "relative z-10 mx-auto w-full max-w-[1600px] px-4 pt-16 pb-8 sm:px-6 lg:px-8 lg:pt-18"
        }
      >
      <div
        className={
          compact
            ? "w-full"
            : "grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_410px]"
        }
      >
        <div className="min-w-0">
          {notEntitled ? (
            <ContentPaywallGate
              episodeId={episodeId}
              contentKind="VIDEO"
              compact={compact}
            />
          ) : manifestUrl ? (
            <div className="relative w-full">
              {!isAdFinished && !creatorMode ? (
                <VideoPrerollAdWidget
                  onAdFinished={() => setIsAdFinished(true)}
                />
              ) : (
                <HlsVideoPlayer
                  episodeId={episodeId}
                  manifestUrl={manifestUrl}
                  posterUrl={playbackQuery.data?.thumbnailUrl}
                  realDuration={playbackQuery.data?.duration}
                  isLocked={playbackQuery.data?.isLocked ?? false}
                  blurVideo={previewEnded}
                  compact={compact}
                  storageKey={storageKey}
                  enableHeartbeat={Boolean(authUser)}
                  viewerId={resolvedViewerId}
                  token={playbackQuery.data?.token}
                  onFatalError={handleFatalPlayerError}
                  onEnded={() => {
                    if (playbackQuery.data?.isLocked) {
                      setPreviewEnded(true);
                    }
                  }}
                  onTimeUpdate={(time) => {
                    if (previewEnded && time < 9.9) {
                      setPreviewEnded(false);
                    }
                  }}
                />
              )}
              {previewEnded && playbackQuery.data?.isLocked && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center overflow-hidden rounded-2xl pointer-events-none">
                  <div className="w-full bg-black/80 backdrop-blur-md px-6 py-8 shadow-2xl flex flex-col items-center justify-center pointer-events-auto">
                    <ContentPaywallGate
                      episodeId={episodeId}
                      contentKind="VIDEO"
                      compact={compact}
                      inline={true}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className={
                compact
                  ? "flex aspect-video w-full items-center justify-center rounded-xl bg-black text-white"
                  : "flex aspect-video w-full items-center justify-center rounded-2xl bg-black text-white shadow-[0_24px_80px_rgba(0,0,0,0.25)]"
              }
            >
              {playbackQuery.isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <span className="px-4 text-center text-sm font-bold">
                  Playback is not available.
                </span>
              )}
            </div>
          )}

          {!notEntitled && errorMessage && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#FFD8D4] bg-[#FFF7F6] p-4 text-sm font-bold text-[#B42318]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p>{errorMessage}</p>
                <button
                  type="button"
                  onClick={refreshPlayback}
                  className="mt-3 rounded-full bg-[#B42318] px-4 py-2 text-xs font-black text-white"
                >
                  {processingPlaybackError ? "Check Again" : "Retry Playback"}
                </button>
              </div>
            </div>
          )}

          {/* Thông tin tập phim dưới player (Layout 1:1 chuẩn YouTube) */}
          {!compact && episodeDetail && (
            <div className="mt-4 space-y-4">
              {/* Tiêu đề Video chuẩn YouTube */}
              <h1 className="text-lg md:text-xl font-extrabold text-white leading-snug tracking-tight">
                Tập {episodeDetail.episodeNumber}: {episodeDetail.title}
              </h1>

              {/* Dòng Kênh Sáng Tạo & Cụm Nút Tương Tác chuẩn YouTube */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-white/10">
                {/* Góc Trái: Kênh & Nút Đăng Ký */}
                <div className="flex items-center gap-3">
                  <Link
                    href={
                      authUser?.accountId &&
                      (creatorAccountId === authUser.accountId ||
                        episodeDetail?.creatorId === authUser.accountId)
                        ? "/creator-channel"
                        : `/public-channel?creatorId=${creatorAccountId || episodeDetail?.creatorId}`
                    }
                    className="flex items-center gap-3 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 overflow-hidden shrink-0 group-hover:border-[#D4AF37] transition-colors">
                      <img
                        src={
                          creatorAvatar ||
                          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=80&auto=format&fit=crop"
                        }
                        alt={creatorName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 pr-1">
                      <h4 className="text-sm font-bold text-white group-hover:text-[#D4AF37] truncate leading-snug transition-colors flex items-center gap-1">
                        {creatorName}
                        <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 fill-zinc-800" />
                      </h4>
                      <p className="text-[11px] text-zinc-400 font-medium">
                        {displayFollowersCount != null
                          ? `${displayFollowersCount.toLocaleString("vi-VN")} người đăng ký`
                          : "Nhà sáng tạo TaleX"}
                      </p>
                    </div>
                  </Link>

                  {!isOwner && (
                    <div className="ml-1">
                      <FollowButton
                        isFollowing={isFollowing}
                        onFollowToggle={toggleFollow}
                        isMutating={isFollowMutating}
                      />
                    </div>
                  )}
                </div>

                {/* Góc Phải: Cụm Nút Hành Động Kiểu YouTube (Thích, Chia sẻ, Lưu) */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center rounded-full bg-[#27272a] hover:bg-zinc-700 text-white font-semibold text-xs transition-colors">
                    <LikeButton
                      isLiked={isLiked}
                      likeCount={totalLikes}
                      onLikeToggle={toggleLike}
                      isLoading={isMutating}
                    />
                  </div>

                  <EpisodeBookmarkButton
                    episodeId={episodeId}
                    contentType="VIDEO"
                    className="rounded-full bg-[#27272a] hover:bg-zinc-700 h-9 w-9"
                  />

                  <EpisodeShareButton
                    episodeId={episodeId}
                    contentType="VIDEO"
                    variant="pill"
                  />

                  {likedUsers.length > 0 && (
                    <LikedUsersModal
                      episodeId={episodeId}
                      trigger={
                        <button className="text-xs font-semibold text-gray-300 hover:text-white bg-[#27272a] hover:bg-zinc-700 px-3.5 py-2 rounded-full cursor-pointer transition-colors">
                          {totalLikes > 3
                            ? `+${totalLikes - 3} người thích`
                            : `Đã thích`}
                        </button>
                      }
                    />
                  )}
                </div>
              </div>

              {/* Hộp Mô Tả Chuẩn YouTube (YouTube Description Box) */}
              <div className="mt-3 mb-6 rounded-2xl border border-white/5 bg-[#27272a]/60 hover:bg-[#27272a] p-4 text-xs text-zinc-200 transition-colors">
                <div className="flex flex-wrap items-center gap-2.5 font-bold text-white text-xs mb-2">
                  <span>
                    {(
                      episodeDetail.analyticData?.views ??
                      episodeDetail.views ??
                      0
                    ).toLocaleString("vi-VN")}{" "}
                    lượt xem
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(episodeDetail.publishedAt).toLocaleDateString("vi-VN")}
                  </span>
                  <span>•</span>
                  <span className="text-[#D4AF37]">#TaleX #PhimBo #Series</span>
                </div>

                {episodeDetail.description ? (
                  <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-line">
                    {episodeDetail.description}
                  </p>
                ) : (
                  <p className="text-gray-500 text-xs italic">
                    Tập phim này chưa có mô tả chi tiết.
                  </p>
                )}
              </div>

              {/* Danh sách tập phim (Phần tập nằm ngay dưới Mô tả) */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-base md:text-lg font-bold text-white tracking-wide">
                    Danh sách tập
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAscending((prev) => !prev)}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-colors cursor-pointer"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>Sắp xếp</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-400">
                  <Menu className="w-4 h-4 text-gray-400" />
                  <span>Phần 1</span>
                </div>

                <div className="bg-[#121214]/80 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  {isSeasonEpisodesLoading ? (
                    <div className="flex flex-wrap gap-2.5">
                      {Array.from({ length: 8 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="h-10 w-24 animate-pulse rounded-xl bg-white/5"
                        />
                      ))}
                    </div>
                  ) : sortedSeasonEpisodes.length > 0 ? (
                    <div className="flex flex-wrap gap-2.5">
                      {sortedSeasonEpisodes.map((ep) => {
                        const isActive = ep.episodeId === episodeId;
                        const isPaid = ep.unlockType === "PAID";
                        const isUnlocked = isEpisodeUnlocked(ep);
                        const showLock = isPaid && !isUnlocked;
                        return (
                          <Link
                            key={ep.episodeId}
                            href={`/watch/${ep.episodeId}`}
                            className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-extrabold transition-all duration-200 flex items-center gap-1.5 ${
                              isActive
                                ? "bg-[#FFD700] text-black shadow-lg shadow-[#FFD700]/20 scale-[1.02]"
                                : "bg-[#242428] text-gray-300 hover:bg-[#323238] hover:text-white border border-white/5"
                            }`}
                          >
                            <span>Tập {ep.episodeNumber}</span>
                            {showLock && (
                              <Lock className="w-3.5 h-3.5 text-amber-500/90" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs italic">
                      Chưa có danh sách tập phim.
                    </p>
                  )}
                </div>
              </div>

              {/* Banner Quảng Cáo */}
              <AdSlot
                slotId="mock-watch-bottom"
                format="horizontal"
                className="mt-6 mb-8"
              />

              {/* Phần Bình luận Tập Phim */}
              <EpisodeCommentsSection episodeId={episodeId} className="mt-8" />
            </div>
          )}
        </div>

        {/* Thanh Bên Góc Phải (Right Sidebar Chuẩn YouTube) */}
        {!compact && episodeDetail && (
          <aside className="relative space-y-4 lg:sticky lg:top-18">
            {/* Banner QC Quảng cáo Sidebar */}
            <AdSlot
              slotId="mock-watch-sidebar"
              format="horizontal"
              className="rounded-2xl overflow-hidden shadow-lg border border-white/10"
            />

            {/* Thanh Chip Lọc Thể Loại YouTube style */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedFilter("all")}
                className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  selectedFilter === "all"
                    ? "bg-white text-black font-extrabold"
                    : "bg-[#27272a] text-white hover:bg-zinc-700"
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter("creator")}
                className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  selectedFilter === "creator"
                    ? "bg-white text-black font-extrabold"
                    : "bg-[#27272a] text-white hover:bg-zinc-700"
                }`}
              >
                Của {creatorName.slice(0, 12)}
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter("newest")}
                className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  selectedFilter === "newest"
                    ? "bg-white text-black font-extrabold"
                    : "bg-[#27272a] text-white hover:bg-zinc-700"
                }`}
              >
                Video liên quan
              </button>
            </div>

            {/* Danh Sách Thẻ Phim Đề Xuất Dọc Kiểu YouTube */}
            <div className="space-y-3">
              {isWatchFeedLoading && displaySidebarList.length === 0 ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="flex gap-3 p-1.5 animate-pulse">
                      <div className="aspect-video w-40 shrink-0 rounded-xl bg-white/5" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 w-4/5 rounded bg-white/10" />
                        <div className="h-2 w-1/2 rounded bg-white/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : displaySidebarList.length > 0 ? (
                <>
                  {displaySidebarList.map((series, idx) => (
                    <Link
                      key={`${series.seriesId}-${idx}`}
                      href={`/series/${series.seriesId}`}
                      className="group flex gap-3 rounded-xl hover:bg-white/[0.06] p-1.5 transition-all cursor-pointer"
                    >
                      {/* 16:9 Thumbnail Youtube style */}
                      <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-xl bg-zinc-900 border border-white/10">
                        {series.coverUrl || series.bannerUrl ? (
                          <img
                            src={(series.coverUrl || series.bannerUrl) ?? undefined}
                            alt={series.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Film className="h-6 w-6 text-white/20" />
                          </div>
                        )}
                        {/* Thời lượng video badge */}
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white font-extrabold text-[10px] px-1.5 py-0.5 rounded">
                          15:00
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <PlayCircle className="h-7 w-7 text-[#D4AF37] shadow-md" />
                        </div>
                      </div>

                      {/* Chi tiết thông tin phim */}
                      <div className="min-w-0 flex-1 flex flex-col justify-start py-0.5">
                        <h4 className="line-clamp-2 text-xs font-bold text-white group-hover:text-[#D4AF37] transition-colors leading-snug">
                          {series.title}
                        </h4>
                        <p className="mt-1 text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                          <span className="truncate">{series.creatorName || "TaleX Official"}</span>
                          <CheckCircle2 className="w-3 h-3 text-zinc-400 shrink-0" />
                        </p>
                        <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                          {((series as any).totalViews || (series as any).views || 0).toLocaleString("vi-VN")} lượt xem • Đề xuất
                        </p>
                      </div>
                    </Link>
                  ))}

                  {hasNextWatchPage && (
                    <button
                      type="button"
                      onClick={() => void fetchNextWatchPage()}
                      disabled={isFetchingNextWatchPage}
                      className="w-full mt-2 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-gray-300 hover:bg-white/10 transition-colors"
                    >
                      {isFetchingNextWatchPage ? "Đang tải..." : "Tải thêm đề xuất"}
                    </button>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs text-zinc-400 text-center">
                  Chưa có phim đề xuất khác.
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  </div>
);
}
