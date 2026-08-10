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
  // Chỉ gửi field có giá trị thật — query param không gửi thì BE nhận null (@RequestParam
  // required=false), khớp đúng ngữ nghĩa "không lọc theo field này".
  const query: Record<string, string | number> = {};
  if (params.keyword?.trim()) query.keyword = params.keyword.trim();
  if (params.contentType && params.contentType !== "ALL") {
    query.contentType = params.contentType;
  }
  if (params.categoryId) query.categoryId = params.categoryId;
  if (params.tagId) query.tagId = params.tagId;
  if (params.yearFrom?.trim()) query.yearFrom = params.yearFrom.trim();
  if (params.yearTo?.trim()) query.yearTo = params.yearTo.trim();
  if (params.minViews?.trim()) query.minViews = params.minViews.trim();
  query.sortBy = params.sortBy ?? "popular";
  query.page = params.page ?? 1;
  query.pageSize = params.pageSize ?? 12;

  return unwrapBaseResponse<BasePageResponse<SearchSeries>>(
    httpClient.get("/api/v1/public/series/search", { params: query }),
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
