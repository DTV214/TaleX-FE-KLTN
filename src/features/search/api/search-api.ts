import {
  httpClient,
  unwrapBaseResponse,
  type BasePageResponse,
} from "@/shared/api/http-client";
import type {
  CategoryResponse,
  TagResponse,
} from "@/features/creator-dashboard/api/creator-content-api";
import type { SearchSeries, SearchSeriesParams } from "../types/search.types";

export async function searchSeries(params: SearchSeriesParams) {
  const query = new URLSearchParams();

  if (params.search?.trim()) {
    query.append("search", params.search.trim());
  }

  if (params.contentType && params.contentType !== "ALL") {
    query.append("contentType", params.contentType);
  }

  if (params.categoryIds && Array.isArray(params.categoryIds)) {
    params.categoryIds.forEach((id) => {
      if (id) query.append("categoryIds", id);
    });
  }

  if (params.tagIds && Array.isArray(params.tagIds)) {
    params.tagIds.forEach((id) => {
      if (id) query.append("tagIds", id);
    });
  }

  if (params.ageRatings && Array.isArray(params.ageRatings)) {
    params.ageRatings.forEach((rating) => {
      if (rating) query.append("ageRatings", rating);
    });
  }

  query.append("status", params.status ?? "PUBLISHED");
  query.append("sortBy", params.sortBy ?? "releasedupdatetime");
  query.append("sortDirection", params.sortDirection ?? "DESC");

  // Backend Spring Boot uses 0-based page index
  const uiPage = params.page ?? 1;
  query.append("page", String(Math.max(0, uiPage - 1)));
  query.append("size", String(params.size ?? 12));

  return unwrapBaseResponse<BasePageResponse<SearchSeries>>(
    httpClient.get(`/api/v1/public/series/search?${query.toString()}`),
  );
}

export async function getPublicCategories() {
  return unwrapBaseResponse<BasePageResponse<CategoryResponse>>(
    httpClient.get("/api/v1/public/categories", { params: { pageSize: 100 } }),
  );
}

export async function getPublicTags() {
  return unwrapBaseResponse<BasePageResponse<TagResponse>>(
    httpClient.get("/api/v1/public/tags", { params: { pageSize: 100 } }),
  );
}
