import {
  httpClient,
  unwrapBaseResponse,
  type BasePageResponse,
} from "@/shared/api/http-client";

export type ContentType = "VIDEO" | "COMIC";
export type SeriesStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "DELETED" | "SCHEDULED";
export type Visibility = "PUBLIC" | "PRIVATE";
export type SeasonStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "DELETED" | "SCHEDULED";
export type EpisodeStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "DELETED" | "SCHEDULED";
export type ContentApprovalStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";
export type EpisodeUnlockType = "FREE" | "PAID";
export type MediaType = "VIDEO" | "IMAGE";
export type MediaStatus =
  | "PENDING"
  | "PROCESSING"
  | "HLS_PROCESSING"
  | "HLS_READY"
  | "ACTIVE"
  | "HIDDEN"
  | "FORCE_HIDDEN"
  | "INACTIVE"
  | "DELETED"
  | "FAILED";

export type MediaCopyrightResponseDto = {
  mediaCopyrightId: string;
  mediaId: string;
  sourceMediaId?: string;
  startTimeTarget?: number;
  endTimeTarget?: number;
  startTimeSource?: number;
  endTimeSource?: number;
  similarityScore?: number;
  violationType: string;
  isValid?: boolean;
  note?: string;
  checkedAt?: string;
};

export type ViolationDetailResponseDto = {
  violationDetailId: string;
  violationAt?: number;
  endViolationAt?: number;
  label: string;
  confidence?: number;
  suggestion?: string;
};

export type ContentCensorshipResponseDto = {
  censorshipId: string;
  mediaId: string;
  primaryViolationLabel?: string;
  confidenceScore?: number;
  checkedAt?: string;
  reviewedBy?: string;
  reviewerNotes?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";
  violationDetails?: ViolationDetailResponseDto[];
};

export type MediaViolationsResponseDto = {
  mediaId: string;
  contentId?: string;
  copyrightViolations: MediaCopyrightResponseDto[];
  censorshipResults: ContentCensorshipResponseDto[];
};

export type CategoryResponse = {
  categoryId: string;
  categoryName: string;
  description?: string;
  slug?: string;
  status?: string;
};

export type TagResponse = {
  tagId: string;
  tagName: string;
  description?: string;
  slug?: string;
  status?: string;
};

export type SeriesResponse = {
  seriesId: string;
  creatorId?: string;
  title: string;
  description?: string;
  coverUrl?: string;
  bannerUrl?: string;
  contentType: ContentType;
  status: SeriesStatus;
  visibility?: Visibility;
  ageRating?: string;
  language?: string;
  totalViews?: number;
  totalSubscriptions?: number;
  categories?: CategoryResponse[];
  tags?: TagResponse[];
  createdAt?: string;
  updatedAt?: string;
};

export type SeasonResponse = {
  seasonId: string;
  seriesId: string;
  creatorId?: string;
  seasonNumber?: number;
  title: string;
  description?: string;
  status: SeasonStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type EpisodeResponse = {
  episodeId: string;
  seasonId: string;
  creatorId?: string;
  episodeNumber?: number;
  title: string;
  description?: string;
  contentType: ContentType;
  status: EpisodeStatus;
  scheduledPublishAt?: string;
  publishedAt?: string;
  unlockType?: EpisodeUnlockType;
  priceVnd?: number;
  likes?: number;
  views?: number;
  totalPage?: number;
  thumbnail?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MediaResponse = {
  mediaId: string;
  episodeId: string;
  mediaType: MediaType;
  mimeType: string;
  fileUrl?: string | null;
  originalUrl?: string | null;
  playbackUrl?: string | null;
  hlsUrl?: string | null;
  manifestUrl?: string | null;
  signedPlaybackUrl?: string | null;
  thumbnailUrl?: string | null;
  externalPublicId?: string;
  providerPublicId?: string;
  providerAssetId?: string;
  provider?: string;
  storageProvider?: string;
  providerDeliveryType?: string;
  fileSize: number;
  checksum?: string;
  format?: string;
  width?: number;
  height?: number;
  resolution?: string;
  duration?: number;
  displayOrder?: number;
  status: MediaStatus;
  approvalStatus?: ContentApprovalStatus;
  approvalReviewedAt?: string;
  approvalReviewedBy?: string;
  playbackPolicy?: string;
  protectionType?: string;
  tokenPolicy?: string;
  drmProvider?: string;
  keyId?: string;
  processingJobId?: string;
  errorMessage?: string;
  pendingDelete?: boolean;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
};

export type SeriesRequest = {
  creatorId?: string;
  title: string;
  description?: string;
  coverUrl?: string;
  bannerUrl?: string;
  contentType: ContentType;
  status?: SeriesStatus;
  visibility?: Visibility;
  ageRating?: string;
  language?: string;
  categoryIds?: string[];
  tagIds?: string[];
};

export type SeasonRequest = {
  seasonNumber?: number;
  title: string;
  description?: string;
  status?: SeasonStatus;
};

export type EpisodeRequest = {
  episodeNumber?: number;
  title: string;
  description?: string;
  contentType?: ContentType;
  status?: EpisodeStatus;
  totalPage?: number;
  thumbnail?: string;
};

export type MediaMetadataRequest = {
  fileUrl: string;
  mediaType: MediaType;
  mimeType: string;
  fileSize: number;
  checksum?: string;
  externalPublicId?: string;
  storageProvider?: string;
  width?: number;
  height?: number;
  resolution?: string;
  duration?: number;
  displayOrder?: number;
  actorId?: string;
};

export type MediaComicPageRequest = {
  fileUrl: string;
  displayOrder: number;
  mimeType: string;
  fileSize: number;
  checksum?: string;
  externalPublicId?: string;
  storageProvider?: string;
  width?: number;
  height?: number;
  resolution?: string;
};

export type MediaReorderRequest = {
  items: Array<{
    mediaId: string;
    displayOrder: number;
  }>;
  actorId?: string;
};

export type MediaUpdateRequest = {
  width?: number;
  height?: number;
  resolution?: string;
  duration?: number;
  displayOrder?: number;
  status?: MediaStatus;
  actorId?: string;
};

export type MediaUrlUpdateRequest = {
  fileUrl: string;
  mediaType?: MediaType;
  checksum?: string;
  externalPublicId?: string;
  storageProvider?: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  resolution?: string;
  duration?: number;
  displayOrder?: number;
  actorId?: string;
};

export type ScheduledPublishRequest = {
  scheduledPublishAt: string;
};

export type EpisodeUnlockSettingsRequest = {
  unlockType: EpisodeUnlockType;
  priceVnd?: number;
};

export async function listSeriesByCreator(page = 0, pageSize = 50) {
  return unwrapBaseResponse<BasePageResponse<SeriesResponse>>(
    httpClient.get("/api/v1/series/by-creator", {
      params: { page, pageSize },
    }),
  );
}

export async function createSeries(request: SeriesRequest) {
  return unwrapBaseResponse<SeriesResponse>(
    httpClient.post("/api/v1/series", request),
  );
}

export async function updateSeries(id: string, request: SeriesRequest) {
  return unwrapBaseResponse<SeriesResponse>(
    httpClient.put(`/api/v1/series/${id}`, request),
  );
}

export async function deleteSeries(id: string) {
  return unwrapBaseResponse<void>(
    httpClient.delete(`/api/v1/series/${id}`),
  );
}

export async function hideSeries(id: string) {
  return unwrapBaseResponse<SeriesResponse>(
    httpClient.patch(`/api/v1/series/${id}/hide`),
  );
}

export async function unhideSeries(id: string) {
  return unwrapBaseResponse<SeriesResponse>(
    httpClient.patch(`/api/v1/series/${id}/unhide`),
  );
}

export async function listSeasonsBySeries(seriesId: string) {
  return unwrapBaseResponse<SeasonResponse[]>(
    httpClient.get(`/api/v1/series/${seriesId}/seasons`),
  );
}

export async function createSeason(seriesId: string, request: SeasonRequest) {
  return unwrapBaseResponse<SeasonResponse>(
    httpClient.post(`/api/v1/series/${seriesId}/seasons`, request),
  );
}

export async function updateSeason(id: string, request: SeasonRequest) {
  return unwrapBaseResponse<SeasonResponse>(
    httpClient.put(`/api/v1/seasons/${id}`, request),
  );
}

export async function deleteSeason(id: string) {
  return unwrapBaseResponse<void>(
    httpClient.delete(`/api/v1/seasons/${id}`),
  );
}

export async function hideSeason(id: string) {
  return unwrapBaseResponse<SeasonResponse>(
    httpClient.patch(`/api/v1/seasons/${id}/hide`),
  );
}

export async function unhideSeason(id: string) {
  return unwrapBaseResponse<SeasonResponse>(
    httpClient.patch(`/api/v1/seasons/${id}/unhide`),
  );
}

export async function listEpisodesBySeason(seasonId: string) {
  return unwrapBaseResponse<EpisodeResponse[]>(
    httpClient.get(`/api/v1/seasons/${seasonId}/episodes`),
  );
}

export async function createEpisode(
  seasonId: string,
  request: EpisodeRequest,
) {
  return unwrapBaseResponse<EpisodeResponse>(
    httpClient.post(`/api/v1/seasons/${seasonId}/episodes`, request),
  );
}

export async function updateEpisode(id: string, request: EpisodeRequest) {
  return unwrapBaseResponse<EpisodeResponse>(
    httpClient.put(`/api/v1/episodes/${id}`, request),
  );
}

export async function updateEpisodeUnlockSettings(
  id: string,
  request: EpisodeUnlockSettingsRequest,
) {
  return unwrapBaseResponse<EpisodeResponse>(
    httpClient.patch(`/api/v1/episodes/${id}/unlock-settings`, request),
  );
}

export async function scheduleEpisodePublish(
  id: string,
  request: ScheduledPublishRequest,
) {
  return unwrapBaseResponse<EpisodeResponse>(
    httpClient.patch(`/api/v1/episodes/${id}/schedule-publish`, request),
  );
}

export async function cancelEpisodeSchedulePublish(id: string) {
  return unwrapBaseResponse<EpisodeResponse>(
    httpClient.patch(`/api/v1/episodes/${id}/cancel-schedule`),
  );
}

export async function publishEpisode(id: string) {
  return unwrapBaseResponse<EpisodeResponse>(
    httpClient.patch(`/api/v1/episodes/${id}/publish`),
  );
}

export async function deleteEpisode(id: string) {
  return unwrapBaseResponse<void>(
    httpClient.delete(`/api/v1/episodes/${id}`),
  );
}

export async function hideEpisode(id: string) {
  return unwrapBaseResponse<EpisodeResponse>(
    httpClient.patch(`/api/v1/episodes/${id}/hide`),
  );
}

export async function unhideEpisode(id: string) {
  return unwrapBaseResponse<EpisodeResponse>(
    httpClient.patch(`/api/v1/episodes/${id}/unhide`),
  );
}

export async function listMediaByEpisode(episodeId: string) {
  return unwrapBaseResponse<MediaResponse[]>(
    httpClient.get(`/api/v1/episodes/${episodeId}/media`),
  );
}

export async function getMediaViolations(mediaId: string) {
  return unwrapBaseResponse<MediaViolationsResponseDto>(
    httpClient.get(`/api/v1/media/${mediaId}/violations`),
  );
}

export async function createEpisodeMedia(
  episodeId: string,
  request: MediaMetadataRequest,
) {
  return unwrapBaseResponse<MediaResponse>(
    httpClient.post(`/api/v1/episodes/${episodeId}/media`, request),
  );
}

export async function createComicPageMedia(
  episodeId: string,
  pages: MediaComicPageRequest[],
  actorId?: string,
) {
  return unwrapBaseResponse<MediaResponse[]>(
    httpClient.post(`/api/v1/episodes/${episodeId}/media/comic-pages`, {
      pages,
      actorId,
    }),
  );
}

export async function reorderEpisodeMedia(
  episodeId: string,
  request: MediaReorderRequest,
) {
  return unwrapBaseResponse<MediaResponse[]>(
    httpClient.put(`/api/v1/episodes/${episodeId}/media/reorder`, request),
  );
}

export async function updateMedia(id: string, request: MediaUpdateRequest) {
  return unwrapBaseResponse<MediaResponse>(
    httpClient.put(`/api/v1/media/${id}`, request),
  );
}

export async function replaceMediaUrl(
  id: string,
  request: MediaUrlUpdateRequest,
) {
  return unwrapBaseResponse<MediaResponse>(
    httpClient.put(`/api/v1/media/${id}/url`, request),
  );
}

export async function approveMedia(id: string) {
  return unwrapBaseResponse<MediaResponse>(
    httpClient.patch(`/api/v1/media/${id}/approve`),
  );
}

export async function rejectMedia(id: string) {
  return unwrapBaseResponse<MediaResponse>(
    httpClient.patch(`/api/v1/media/${id}/reject`),
  );
}

export async function deleteMedia(id: string, actorId?: string) {
  return unwrapBaseResponse<void>(
    httpClient.delete(`/api/v1/media/${id}`, {
      params: { actorId },
    }),
  );
}

export async function getCategories() {
  return unwrapBaseResponse<BasePageResponse<CategoryResponse>>(
    httpClient.get('/api/v1/categories?pageSize=100')
  );
}

export async function getTags() {
  return unwrapBaseResponse<BasePageResponse<TagResponse>>(
    httpClient.get('/api/v1/tags?pageSize=100')
  );
}
