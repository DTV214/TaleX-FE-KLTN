import type { ContentType } from "@/features/creator-dashboard/api/creator-content-api";

export type SearchSortBy =
  | "releasedupdatetime"
  | "views"
  | "averagerating"
  | "likes"
  | "watchtime";

export type SearchSortDirection = "ASC" | "DESC";

export type SearchContentFilter = "ALL" | "VIDEO" | "COMIC";

export type SearchAgeRating = "EVERYONE" | "TEEN" | "MATURE";

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
  search?: string;
  contentType?: SearchContentFilter;
  categoryIds?: string[];
  tagIds?: string[];
  ageRatings?: SearchAgeRating[];
  status?: string;
  sortBy?: SearchSortBy;
  sortDirection?: SearchSortDirection;
  page?: number;
  size?: number;
};
