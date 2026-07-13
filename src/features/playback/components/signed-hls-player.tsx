"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getEpisodePlayback,
  getCreatorEpisodePlayback,
} from "@/features/playback/api/playback-api";
import { HlsVideoPlayer } from "@/features/playback/components/hls-video-player";
import { ContentPaywallGate } from "@/features/checkout-content/components/content-paywall-gate";
import { isNotEntitledError } from "@/features/checkout-content/utils/is-not-entitled-error";
import { useAuthStore } from "@/features/auth/store/auth.store";

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
    </div>
  );
}
