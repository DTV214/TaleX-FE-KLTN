"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2, Calendar, Eye } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getEpisodePlayback,
  getCreatorEpisodePlayback,
} from "@/features/playback/api/playback-api";
import { getPublicEpisodeDetail } from "@/features/series/api/series-api";
import { LikeButton } from "@/features/series/components/like-button";
import { LikedUsersModal } from "@/features/series/components/liked-users-modal";
import { EpisodeShareButton } from "@/features/series/components/episode-share-button";
import { useEpisodeLikes } from "@/features/series/hooks/use-episode-likes";
import { HlsVideoPlayer } from "@/features/playback/components/hls-video-player";
import { ContentPaywallGate } from "@/features/checkout-content/components/content-paywall-gate";
import { isNotEntitledError } from "@/features/checkout-content/utils/is-not-entitled-error";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { FollowButton } from "@/features/series/components/follow-button";
import { useCreatorFollow } from "@/features/series/hooks/use-creator-follow";
import { getCreatorDetail } from "@/features/series/api/creator-follows-api";

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
      ["episode-playback", episodeId, resolvedViewerId ?? "anonymous", creatorMode ? "creator" : "public"] as const,
    [episodeId, resolvedViewerId, creatorMode],
  );
  const storageKey = useMemo(
    () => `talex.watch-position.${episodeId}`,
    [episodeId],
  );
  const [playerError, setPlayerError] = useState<PlayerErrorState | null>(null);
  const [processingRetryCount, setProcessingRetryCount] = useState(0);

  const fetchPlayback = creatorMode ? getCreatorEpisodePlayback : getEpisodePlayback;

  const playbackQuery = useQuery({
    queryKey,
    queryFn: () => fetchPlayback(episodeId, resolvedViewerId),
    // Entitlement can change externally (just purchased) — never serve a stale 403 from cache.
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Fetch chi tiết tập phim
  const { data: episodeDetail } = useQuery({
    queryKey: ["publicEpisodeDetail", episodeId],
    queryFn: () => getPublicEpisodeDetail(episodeId),
    enabled: !!episodeId,
  });

  // Quản lý trạng thái like của tập phim
  const {
    totalLikes,
    isLiked,
    toggleLike,
    isMutating,
    likedUsers,
  } = useEpisodeLikes(episodeId);

  // Truy vấn chi tiết thông tin nhà sáng tạo (để lấy accountId nhằm follow)
  const { data: creatorDetail } = useQuery({
    queryKey: ["creatorDetailPublic", episodeDetail?.creatorId],
    queryFn: () => getCreatorDetail(episodeDetail!.creatorId),
    enabled: !!episodeDetail?.creatorId,
  });

  const creatorAccountId = creatorDetail?.accountId || creatorDetail?.creatorId || episodeDetail?.creatorId;
  const creatorName = creatorDetail?.displayName || creatorDetail?.username || episodeDetail?.createdBy || "Nhà sáng tạo";
  const creatorAvatar = creatorDetail?.avatarUrl;

  const {
    isFollowing,
    toggleFollow,
    isMutating: isFollowMutating,
  } = useCreatorFollow(creatorAccountId);

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
    <div
      className={
        compact
          ? "w-full"
          : "mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8"
      }
    >
      {notEntitled ? (
        <ContentPaywallGate episodeId={episodeId} contentKind="VIDEO" compact={compact} />
      ) : manifestUrl ? (
        <HlsVideoPlayer
          episodeId={episodeId}
          manifestUrl={manifestUrl}
          posterUrl={playbackQuery.data?.thumbnailUrl}
          compact={compact}
          storageKey={storageKey}
          onFatalError={handleFatalPlayerError}
        />
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

      {/* Thông tin tập phim dưới player */}
      {!compact && episodeDetail && (
        <div className="mt-6 bg-[#121214]/40 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
            {/* Tiêu đề & Thông số */}
            <div className="space-y-2">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-wide">
                Tập {episodeDetail.episodeNumber}: {episodeDetail.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-gray-600" />
                  {episodeDetail.views.toLocaleString("vi-VN")} lượt xem
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  {new Date(episodeDetail.publishedAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>

            {/* Cụm Likes & Action */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <LikeButton
                isLiked={isLiked}
                likeCount={totalLikes}
                onLikeToggle={toggleLike}
                isLoading={isMutating}
              />

              <EpisodeShareButton
                episodeId={episodeId}
                contentType="VIDEO"
                variant="pill"
              />

              {likedUsers.length > 0 && (
                <div className="flex items-center gap-2">
                  {/* Overlapping Avatar Group */}
                  <div className="flex -space-x-2 overflow-hidden">
                    {likedUsers.slice(0, 3).map((user) => (
                      <div
                        key={user.accountId}
                        className="inline-block h-6 w-6 rounded-full ring-2 ring-[#0B0B0C] overflow-hidden bg-white/5"
                      >
                        <img
                          src={
                            user.avatarUrl ||
                            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=80&auto=format&fit=crop"
                          }
                          alt={user.username}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>

                  <LikedUsersModal
                    episodeId={episodeId}
                    trigger={
                      <button className="text-[10px] md:text-xs font-bold text-gray-400 hover:text-white cursor-pointer transition-colors">
                        {totalLikes > 3
                          ? `và ${totalLikes - 3} người khác đã thích`
                          : `đã thích`}
                      </button>
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Thông tin nhà sáng tạo (Creator Profile & Follow Action) */}
          <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 overflow-hidden relative flex-none">
                <img
                  src={
                    creatorAvatar ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=80&auto=format&fit=crop"
                  }
                  alt={creatorName}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Tên & Số người theo dõi */}
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-gray-200 truncate leading-snug">
                  {creatorName}
                </h4>
                <p className="text-[10px] text-gray-500 font-semibold mt-0.5 animate-pulse">
                  {creatorDetail?.followerCount != null
                    ? `${creatorDetail.followerCount.toLocaleString("vi-VN")} người theo dõi`
                    : "Nhà sáng tạo TaleX"}
                </p>
              </div>
            </div>

            {/* Nút Follow */}
            <FollowButton
              isFollowing={isFollowing}
              onFollowToggle={toggleFollow}
              isMutating={isFollowMutating}
            />
          </div>

          {/* Mô tả tập phim */}
          <div className="mt-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
              Giới thiệu tập phim
            </h3>
            {episodeDetail.description ? (
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {episodeDetail.description}
              </p>
            ) : (
              <p className="text-gray-500 text-xs italic">
                Tập phim này chưa có mô tả chi tiết.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
