import {
  httpClient,
  unwrapBaseResponse,
} from "@/shared/api/http-client";
import type {
  MediaProtectionType,
  MediaProvider,
} from "@/features/creator-dashboard/api/video-upload-api";
import type { MediaType } from "@/features/creator-dashboard/api/creator-content-api";

export type DrmPlaybackConfig = {
  provider?: string;
  licenseUrl?: string;
  certificateUrl?: string;
  widevineLicenseUrl?: string;
  fairplayLicenseUrl?: string;
  playReadyLicenseUrl?: string;
  headers?: Record<string, string>;
};

export type EpisodePlaybackResponse = {
  episodeId: string;
  mediaId: string;
  mediaType: MediaType;
  playbackType: string;
  provider: MediaProvider;
  protectionType: MediaProtectionType;
  hlsUrl?: string;
  playbackUrl?: string;
  manifestUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  expiresAt?: string;
  drm?: DrmPlaybackConfig;
  token?: string;
};

export async function getEpisodePlayback(
  episodeId: string,
  viewerId?: string,
) {
  return unwrapBaseResponse<EpisodePlaybackResponse>(
    httpClient.get(`/api/v1/public/episodes/${episodeId}/playback`, {
      params: { viewerId },
    }),
  );
}

/**
 * Creator-authenticated playback endpoint — works for DRAFT episodes.
 * Falls back to public endpoint on 401/403.
 */
export async function getCreatorEpisodePlayback(
  episodeId: string,
  viewerId?: string,
) {
  return unwrapBaseResponse<EpisodePlaybackResponse>(
    httpClient.get(`/api/v1/episodes/${episodeId}/playback`, {
      params: { viewerId },
    }),
  );
}

export type WatchProgressPayload = {
  event: "first_event" | "heartbeat" | "last_event";
  session_id: string;
  episode_id: string;
  current_position: number;
  heartbeat_value: number;
};

// 2. POST /api/v1/episodes/{episodeId}/views - Ghi nhận lượt xem
export async function recordEpisodeView(episodeId: string, sessionId: string) {
  return unwrapBaseResponse<{ code: number; message: string; data: any }>(
    httpClient.post(`/api/v1/episodes/${episodeId}/views`, {
      sessionId,
      episodeId,
    })
  );
}

// 3. POST /api/v1/episodes/watch-progress - Ghi nhận tiến độ xem
export async function recordWatchProgress(payload: WatchProgressPayload) {
  return unwrapBaseResponse<{ code: number; message: string; data: any }>(
    httpClient.post("/api/v1/episodes/watch-progress", payload)
  );
}

