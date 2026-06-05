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
