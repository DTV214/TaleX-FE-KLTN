import {
  httpClient,
  unwrapBaseResponse,
  type BasePageResponse,
} from "@/shared/api/http-client";

export type ContentType = "VIDEO" | "COMIC";
export type SeriesStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "DELETED";
export type Visibility = "PUBLIC" | "PRIVATE";
export type SeasonStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "DELETED";
export type EpisodeStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "DELETED";
export type MediaType = "VIDEO" | "IMAGE";
export type MediaStatus =
  | "PROCESSING"
  | "ACTIVE"
  | "HIDDEN"
  | "DELETED"
  | "FAILED";

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
  episodeNumber?: number;
  title: string;
  description?: string;
  contentType: ContentType;
  status: EpisodeStatus;
  publishedAt?: string;
  likes?: number;
  views?: number;
  totalPage?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type MediaResponse = {
  mediaId: string;
  episodeId: string;
  mediaType: MediaType;
  mimeType: string;
  fileUrl: string;
  externalPublicId?: string;
  storageProvider?: string;
  fileSize: number;
  checksum?: string;
  width?: number;
  height?: number;
  resolution?: string;
  duration?: number;
  displayOrder?: number;
  status: MediaStatus;
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
  actorId?: string;
};

export type SeasonRequest = {
  seasonNumber?: number;
  title: string;
  description?: string;
  status?: SeasonStatus;
  actorId?: string;
};

export type EpisodeRequest = {
  episodeNumber?: number;
  title: string;
  description?: string;
  contentType?: ContentType;
  status?: EpisodeStatus;
  totalPage?: number;
  actorId?: string;
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

export async function listSeriesByCreator(
  creatorId: string,
  page = 1,
  pageSize = 20,
) {
  return unwrapBaseResponse<BasePageResponse<SeriesResponse>>(
    httpClient.get(`/api/v1/series/by-creator/${creatorId}`, {
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

export async function deleteSeries(id: string, actorId?: string) {
  return unwrapBaseResponse<void>(
    httpClient.delete(`/api/v1/series/${id}`, {
      params: { actorId },
    }),
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

export async function deleteSeason(id: string, actorId?: string) {
  return unwrapBaseResponse<void>(
    httpClient.delete(`/api/v1/seasons/${id}`, {
      params: { actorId },
    }),
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

export async function deleteEpisode(id: string, actorId?: string) {
  return unwrapBaseResponse<void>(
    httpClient.delete(`/api/v1/episodes/${id}`, {
      params: { actorId },
    }),
  );
}

export async function listMediaByEpisode(episodeId: string) {
  return unwrapBaseResponse<MediaResponse[]>(
    httpClient.get(`/api/v1/episodes/${episodeId}/media`),
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

export async function deleteMedia(id: string, actorId?: string) {
  return unwrapBaseResponse<void>(
    httpClient.delete(`/api/v1/media/${id}`, {
      params: { actorId },
    }),
  );
}
