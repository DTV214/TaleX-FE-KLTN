import type { ContentType } from "@/features/creator-dashboard/api/creator-content-api";

export type SearchSortBy = "popular" | "newest" | "name";
export type SearchContentFilter = "ALL" | "VIDEO" | "COMIC";

export type SearchSeries = {
  seriesId: string;
  creatorId?: string;
  creatorName?: string;
  creatorAvatar?: string | null;
  title: string;
  description?: string;
  coverUrl?: string | null;
  bannerUrl?: string | null;
  contentType?: ContentType;
  ageRating?: string;
  language?: string;
  totalViews?: number;
  averageRating?: number;
  createdAt?: string;
  updatedAt?: string;
  releasedUpdateTime?: string;
};

export type SearchSeriesParams = {
  keyword?: string;
  contentType?: SearchContentFilter;
  categoryId?: string;
  tagId?: string;
  yearFrom?: string;
  yearTo?: string;
  minViews?: string;
  sortBy?: SearchSortBy;
  page?: number;
  pageSize?: number;
};
