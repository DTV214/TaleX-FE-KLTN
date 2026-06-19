import {
  httpClient,
  unwrapBaseResponse,
} from "@/shared/api/http-client";
import type { MediaResponse } from "@/features/creator-dashboard/api/creator-content-api";

export type MediaProvider = "URL" | "CLOUDINARY" | "AWS" | "MUX" | "BITMOVIN";

export type MediaProtectionType =
  | "NONE"
  | "SIGNED_URL"
  | "TOKEN"
  | "AES_128_HLS"
  | "DRM_MULTI";

export type MediaUploadSessionStatus =
  | "INITIATED"
  | "UPLOADING"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export type VideoUploadSessionRequest = {
  fileName: string;
  fileSize: number;
  mimeType: string;
  chunkSize?: number;
  protectionType?: MediaProtectionType;
  creatorId?: string;
  actorId?: string;
};

export type VideoUploadSessionResponse = {
  uploadSessionId: string;
  mediaId: string;
  episodeId: string;
  provider: MediaProvider;
  cloudName?: string;
  apiKey?: string;
  timestamp?: number;
  signature?: string;
  publicId: string;
  resourceType?: string;
  uploadUrl: string;
  uploadUniqueId?: string;
  chunkSize: number;
  fileSize: number;
  fileName: string;
  mimeType: string;
  providerDeliveryType?: string;
  uploadParams?: Record<string, string>;
  uploadedBytes?: number;
  lastUploadedChunkIndex?: number;
  status: MediaUploadSessionStatus;
  expiredAt?: string;
};

export type MediaUploadSessionResponse = {
  uploadSessionId: string;
  mediaId: string;
  episodeId: string;
  creatorId?: string;
  provider: MediaProvider;
  providerPublicId?: string;
  providerDeliveryType?: string;
  uploadUniqueId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  chunkSize: number;
  uploadedBytes: number;
  totalChunks?: number;
  lastUploadedChunkIndex?: number;
  status: MediaUploadSessionStatus;
  errorMessage?: string;
  expiredAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MediaUploadProgressRequest = {
  uploadedBytes: number;
  lastUploadedChunkIndex?: number;
  status?: MediaUploadSessionStatus;
  actorId?: string;
};

export type MediaUploadFailRequest = {
  errorMessage?: string;
  actorId?: string;
};

export type MediaUploadCompleteRequest = {
  assetId?: string;
  publicId: string;
  secureUrl: string;
  resourceType?: string;
  format?: string;
  bytes: number;
  duration?: number;
  width?: number;
  height?: number;
  actorId?: string;
};

export async function createVideoUploadSession(
  episodeId: string,
  request: VideoUploadSessionRequest,
) {
  return unwrapBaseResponse<VideoUploadSessionResponse>(
    httpClient.post(
      `/api/v1/episodes/${episodeId}/media/video/upload-session`,
      request,
    ),
  );
}

export async function getVideoUploadSession(uploadSessionId: string) {
  return unwrapBaseResponse<MediaUploadSessionResponse>(
    httpClient.get(`/api/v1/media/upload-sessions/${uploadSessionId}`),
  );
}

export async function updateVideoUploadProgress(
  uploadSessionId: string,
  request: MediaUploadProgressRequest,
) {
  return unwrapBaseResponse<MediaUploadSessionResponse>(
    httpClient.patch(
      `/api/v1/media/upload-sessions/${uploadSessionId}/progress`,
      request,
    ),
  );
}

export async function pauseVideoUpload(
  uploadSessionId: string,
  actorId?: string,
) {
  return unwrapBaseResponse<MediaUploadSessionResponse>(
    httpClient.patch(
      `/api/v1/media/upload-sessions/${uploadSessionId}/pause`,
      null,
      { params: { actorId } },
    ),
  );
}

export async function failVideoUpload(
  uploadSessionId: string,
  request?: MediaUploadFailRequest,
) {
  return unwrapBaseResponse<MediaUploadSessionResponse>(
    httpClient.patch(
      `/api/v1/media/upload-sessions/${uploadSessionId}/fail`,
      request ?? {},
    ),
  );
}

export async function cancelVideoUpload(
  uploadSessionId: string,
  actorId?: string,
) {
  return unwrapBaseResponse<MediaUploadSessionResponse>(
    httpClient.patch(
      `/api/v1/media/upload-sessions/${uploadSessionId}/cancel`,
      null,
      { params: { actorId } },
    ),
  );
}

export async function completeVideoUpload(
  uploadSessionId: string,
  request: MediaUploadCompleteRequest,
) {
  return unwrapBaseResponse<MediaResponse>(
    httpClient.post(
      `/api/v1/media/upload-sessions/${uploadSessionId}/complete`,
      request,
    ),
  );
}
