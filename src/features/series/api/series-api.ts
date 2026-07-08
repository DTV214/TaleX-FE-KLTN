import {
  httpClient,
  unwrapBaseResponse,
  type BasePageResponse,
} from "@/shared/api/http-client";

export type ContentType = "VIDEO" | "COMIC";

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

export type PublicSeriesItem = {
  seriesId: string;
  creatorId: string;
  title: string;
  description?: string;
  coverUrl?: string;
  bannerUrl?: string;
  contentType: ContentType;
  status: string;
  ageRating?: string;
  language?: string;
  totalViews: number;
  totalSubscriptions: number;
  categories: CategoryResponse[];
  tags: TagResponse[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: string;
  updatedBy: string;
  deletedBy: string | null;
  isDeleted: boolean;
};

export type PublicSeasonItem = {
  seasonId: string;
  seriesId: string;
  creatorId: string;
  seasonNumber: number;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: string;
  updatedBy: string;
  deletedBy: string | null;
  isDeleted: boolean;
};

export type PublicEpisodeItem = {
  episodeId: string;
  seasonId: string;
  creatorId: string;
  episodeNumber: number;
  title: string;
  description?: string;
  contentType: ContentType;
  status: string;
  scheduledPublishAt: string | null;
  publishedAt: string;
  unlockType: "FREE" | "PAID";
  priceVnd: number;
  likes: number;
  views: number;
  totalPage: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: string;
  updatedBy: string;
  deletedBy: string | null;
  isDeleted: boolean;
};

export async function getPublicSeriesList(page = 1, pageSize = 20, contentType?: ContentType) {
  return unwrapBaseResponse<BasePageResponse<PublicSeriesItem>>(
    httpClient.get("/api/v1/public/series", {
      params: {
        page,
        pageSize,
        contentType,
      },
    })
  );
}

export async function getPublicSeriesDetail(seriesId: string) {
  return unwrapBaseResponse<PublicSeriesItem>(
    httpClient.get(`/api/v1/public/series/${seriesId}`)
  );
}

export async function getPublicSeasons(seriesId: string) {
  return unwrapBaseResponse<PublicSeasonItem[]>(
    httpClient.get(`/api/v1/public/series/${seriesId}/seasons`)
  );
}

export async function getPublicEpisodes(seasonId: string) {
  return unwrapBaseResponse<PublicEpisodeItem[]>(
    httpClient.get(`/api/v1/public/seasons/${seasonId}/episodes`)
  );
}

export type EpisodeMediaResponse = {
  mediaId: string;
  episodeId: string;
  mediaType: string;
  mimeType: string;
  fileUrl: string;
  status: string;
  approvalStatus: string;
  displayOrder: number;
};

export async function getPublicEpisodeMedia(episodeId: string) {
  return unwrapBaseResponse<EpisodeMediaResponse[]>(
    httpClient.get(`/api/v1/public/episodes/${episodeId}/media`)
  );
}

