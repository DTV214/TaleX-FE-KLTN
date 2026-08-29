import {
  httpClient,
  unwrapBaseResponse,
  type BasePageResponse,
  type BaseResponse,
} from "@/shared/api/http-client";

const ADMIN_SERIES_ENDPOINT = "/api/v1/series";

export type AdminSeriesContentType = "VIDEO" | "COMIC";
export type AdminSeriesStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "HIDDEN"
  | "DELETED"
  | "SCHEDULED"
  | "INACTIVE";

export type AdminSeriesSortBy =
  | "createdAt"
  | "updatedAt"
  | "title"
  | "views"
  | "averageRating";

export type AdminSeriesFilterParams = {
  page?: number;
  pageSize?: number;
  keyword?: string;
  contentType?: AdminSeriesContentType;
  status?: AdminSeriesStatus;
  sortBy?: AdminSeriesSortBy;
  sortDirection?: "ASC" | "DESC";
};

export type AdminSeriesCategory = {
  id: string;
  name: string;
};

export type AdminSeriesTag = {
  id: string;
  name: string;
};

export type AdminSeriesAnalyticData = {
  likes?: number;
  views?: number;
  comments?: number;
  shares?: number;
  bookmarks?: number;
  watchTime?: number;
};

export type AdminSeriesItem = {
  id: string;
  title: string;
  contentType: AdminSeriesContentType;
  status: AdminSeriesStatus;
  views: number;
  accountId?: string;
  creatorId?: string;
  creatorName?: string;
  creatorAvatar?: string | null;
  coverUrl?: string;
  bannerUrl?: string;
  language?: string;
  averageRating?: number;
  categories: AdminSeriesCategory[];
  tags: AdminSeriesTag[];
  analyticData?: AdminSeriesAnalyticData;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  isDeleted?: boolean;
};

export type AdminSeriesPage = BasePageResponse<AdminSeriesItem>;

type AdminSeriesApiCategory = {
  id?: string;
  categoryId?: string;
  name?: string | null;
  categoryName?: string | null;
};

type AdminSeriesApiTag = {
  id?: string;
  tagId?: string;
  name?: string | null;
  tagName?: string | null;
};

type AdminSeriesApiItem = {
  id?: string;
  seriesId?: string;
  title?: string | null;
  contentType?: string | null;
  status?: string | null;
  views?: number | null;
  totalViews?: number | null;
  accountId?: string;
  creatorId?: string;
  creatorName?: string | null;
  creatorAvatar?: string | null;
  coverUrl?: string | null;
  bannerUrl?: string | null;
  language?: string | null;
  averageRating?: number | null;
  categories?: AdminSeriesApiCategory[] | null;
  tags?: AdminSeriesApiTag[] | null;
  analyticData?: AdminSeriesAnalyticData | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  isDeleted?: boolean;
};

type AdminSeriesListPayload =
  | AdminSeriesApiItem[]
  | BasePageResponse<AdminSeriesApiItem>
  | {
      content?: AdminSeriesApiItem[];
      data?: AdminSeriesApiItem[] | BasePageResponse<AdminSeriesApiItem>;
      pageNumber?: number;
      pageSize?: number;
      totalElements?: number;
      totalPages?: number;
      isFirst?: boolean;
      isLast?: boolean;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeContentType(value: unknown): AdminSeriesContentType {
  return value === "VIDEO" ? "VIDEO" : "COMIC";
}

function normalizeStatus(value: unknown): AdminSeriesStatus {
  if (
    value === "DRAFT" ||
    value === "PUBLISHED" ||
    value === "HIDDEN" ||
    value === "DELETED" ||
    value === "SCHEDULED" ||
    value === "INACTIVE"
  ) {
    return value;
  }

  return "DRAFT";
}

function normalizeCategories(
  categories?: AdminSeriesApiCategory[] | null,
): AdminSeriesCategory[] {
  return (categories ?? [])
    .map((category) => ({
      id: category.id ?? category.categoryId ?? "",
      name: category.name ?? category.categoryName ?? "",
    }))
    .filter((category) => category.id || category.name);
}

function normalizeTags(tags?: AdminSeriesApiTag[] | null): AdminSeriesTag[] {
  return (tags ?? [])
    .map((tag) => ({
      id: tag.id ?? tag.tagId ?? "",
      name: tag.name ?? tag.tagName ?? "",
    }))
    .filter((tag) => tag.id || tag.name);
}

function normalizeSeries(item: AdminSeriesApiItem): AdminSeriesItem {
  const views =
    item.views ??
    item.totalViews ??
    item.analyticData?.views ??
    0;

  return {
    id: item.id ?? item.seriesId ?? "",
    title: item.title ?? "Untitled series",
    contentType: normalizeContentType(item.contentType),
    status: normalizeStatus(item.status),
    views,
    accountId: item.accountId,
    creatorId: item.creatorId,
    creatorName: item.creatorName ?? undefined,
    creatorAvatar: item.creatorAvatar,
    coverUrl: item.coverUrl ?? undefined,
    bannerUrl: item.bannerUrl ?? undefined,
    language: item.language ?? undefined,
    averageRating: item.averageRating ?? undefined,
    categories: normalizeCategories(item.categories),
    tags: normalizeTags(item.tags),
    analyticData: item.analyticData ?? undefined,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt,
    isDeleted: item.isDeleted,
  };
}

function extractPagePayload(
  payload: unknown,
  fallbackPage: number,
  fallbackPageSize: number,
): BasePageResponse<AdminSeriesApiItem> {
  const emptyPage: BasePageResponse<AdminSeriesApiItem> = {
    content: [],
    pageNumber: fallbackPage,
    pageSize: fallbackPageSize,
    totalElements: 0,
    totalPages: 0,
    isFirst: fallbackPage <= 1,
    isLast: true,
  };

  if (Array.isArray(payload)) {
    return {
      ...emptyPage,
      content: payload,
      totalElements: payload.length,
      totalPages: payload.length > 0 ? 1 : 0,
    };
  }

  if (!isRecord(payload)) {
    return emptyPage;
  }

  const nestedData = payload.data;
  if (Array.isArray(nestedData)) {
    return {
      ...emptyPage,
      content: nestedData as AdminSeriesApiItem[],
      totalElements: nestedData.length,
      totalPages: nestedData.length > 0 ? 1 : 0,
    };
  }

  if (isRecord(nestedData) && Array.isArray(nestedData.content)) {
    return nestedData as unknown as BasePageResponse<AdminSeriesApiItem>;
  }

  if (Array.isArray(payload.content)) {
    return payload as BasePageResponse<AdminSeriesApiItem>;
  }

  return emptyPage;
}

function isArrayListPayload(payload: unknown) {
  return (
    Array.isArray(payload) ||
    (isRecord(payload) && Array.isArray(payload.data))
  );
}

function includesText(value: unknown, keyword: string) {
  return String(value ?? "").toLowerCase().includes(keyword);
}

function applyLocalFilters(
  items: AdminSeriesApiItem[],
  params: AdminSeriesFilterParams,
) {
  const keyword = params.keyword?.trim().toLowerCase();

  return items.filter((item) => {
    const contentType = normalizeContentType(item.contentType);
    const status = normalizeStatus(item.status);

    if (params.contentType && contentType !== params.contentType) {
      return false;
    }

    if (params.status && status !== params.status) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    return (
      includesText(item.title, keyword) ||
      includesText(item.id, keyword) ||
      includesText(item.seriesId, keyword) ||
      includesText(item.creatorName, keyword) ||
      includesText(item.creatorId, keyword) ||
      includesText(item.accountId, keyword) ||
      (item.categories ?? []).some((category) =>
        includesText(category.name ?? category.categoryName, keyword),
      ) ||
      (item.tags ?? []).some((tag) =>
        includesText(tag.name ?? tag.tagName, keyword),
      )
    );
  });
}

function getSortValue(item: AdminSeriesApiItem, sortBy: AdminSeriesSortBy) {
  if (sortBy === "views") {
    return item.views ?? item.totalViews ?? item.analyticData?.views ?? 0;
  }

  if (sortBy === "averageRating") {
    return item.averageRating ?? 0;
  }

  return String(item[sortBy] ?? "").toLowerCase();
}

function applyLocalSort(
  items: AdminSeriesApiItem[],
  sortBy: AdminSeriesSortBy,
  sortDirection: "ASC" | "DESC",
) {
  const direction = sortDirection === "ASC" ? 1 : -1;

  return [...items].sort((first, second) => {
    const firstValue = getSortValue(first, sortBy);
    const secondValue = getSortValue(second, sortBy);

    if (typeof firstValue === "number" && typeof secondValue === "number") {
      return (firstValue - secondValue) * direction;
    }

    return String(firstValue).localeCompare(String(secondValue)) * direction;
  });
}

function paginateLocalItems(
  items: AdminSeriesApiItem[],
  page: number,
  pageSize: number,
): BasePageResponse<AdminSeriesApiItem> {
  const totalElements = items.length;
  const totalPages =
    pageSize > 0 ? Math.ceil(totalElements / pageSize) : 0;
  const safePage = totalPages === 0 ? 1 : Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    content: items.slice(start, start + pageSize),
    pageNumber: safePage,
    pageSize,
    totalElements,
    totalPages,
    isFirst: safePage <= 1,
    isLast: totalPages === 0 || safePage >= totalPages,
  };
}

function normalizePage(
  page: BasePageResponse<AdminSeriesApiItem>,
  fallbackPage: number,
  fallbackPageSize: number,
): AdminSeriesPage {
  const content = page.content
    .map(normalizeSeries)
    .filter((series) => series.id);
  const pageSize = page.pageSize ?? fallbackPageSize;
  const totalElements = page.totalElements ?? content.length;
  const totalPages =
    page.totalPages ??
    (pageSize > 0 ? Math.ceil(totalElements / pageSize) : 0);
  const pageNumber = page.pageNumber ?? fallbackPage;

  return {
    content,
    pageNumber,
    pageSize,
    totalElements,
    totalPages,
    isFirst: page.isFirst ?? pageNumber <= 1,
    isLast:
      page.isLast ?? (totalPages === 0 || pageNumber >= totalPages),
  };
}

async function unwrapFlexible<T>(
  request: Promise<{ data: BaseResponse<T> | T }>,
) {
  const response = await request;

  if (isRecord(response.data) && "data" in response.data) {
    return unwrapBaseResponse<T>(
      Promise.resolve({ data: response.data as BaseResponse<T> }),
    );
  }

  return response.data as T;
}

function buildSeriesParams(params: AdminSeriesFilterParams) {
  const queryParams: Record<string, string | number> = {};

  if (params.page !== undefined) queryParams.page = params.page;
  if (params.pageSize !== undefined) queryParams.pageSize = params.pageSize;
  if (params.keyword?.trim()) queryParams.keyword = params.keyword.trim();
  if (params.contentType) queryParams.contentType = params.contentType;
  if (params.status) queryParams.status = params.status;
  if (params.sortBy) queryParams.sortBy = params.sortBy;
  if (params.sortDirection) {
    queryParams.sortDirection = params.sortDirection;
  }

  return queryParams;
}

export async function getAdminSeries(
  params: AdminSeriesFilterParams = { page: 1, pageSize: 10 },
) {
  const fallbackPage = params.page ?? 1;
  const fallbackPageSize = params.pageSize ?? 10;
  const payload = await unwrapFlexible<AdminSeriesListPayload>(
    httpClient.get(ADMIN_SERIES_ENDPOINT, {
      params: buildSeriesParams(params),
    }),
  );
  let page = extractPagePayload(payload, fallbackPage, fallbackPageSize);

  if (isArrayListPayload(payload)) {
    const filteredItems = applyLocalFilters(page.content, params);
    const sortedItems = applyLocalSort(
      filteredItems,
      params.sortBy ?? "updatedAt",
      params.sortDirection ?? "DESC",
    );
    page = paginateLocalItems(sortedItems, fallbackPage, fallbackPageSize);
  }

  return normalizePage(page, fallbackPage, fallbackPageSize);
}

export async function getAllSeries() {
  const page = await getAdminSeries({
    page: 1,
    pageSize: 100,
  });

  return page.content;
}

export async function forceHideSeries(id: string) {
  const data = await unwrapBaseResponse<AdminSeriesApiItem>(
    httpClient.patch(`${ADMIN_SERIES_ENDPOINT}/${id}/force-hide`),
  );

  return normalizeSeries(data);
}

export async function forceUnhideSeries(id: string) {
  const data = await unwrapBaseResponse<AdminSeriesApiItem>(
    httpClient.patch(`${ADMIN_SERIES_ENDPOINT}/${id}/force-unhide`),
  );

  return normalizeSeries(data);
}
