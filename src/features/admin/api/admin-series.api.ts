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

export type AdminSeriesItem = {
  id: string;
  title: string;
  contentType: AdminSeriesContentType;
  status: AdminSeriesStatus;
  views: number;
  creatorId?: string;
  coverUrl?: string;
  updatedAt?: string;
};

type AdminSeriesApiItem = {
  id?: string;
  seriesId?: string;
  title?: string | null;
  contentType?: string | null;
  status?: string | null;
  views?: number | null;
  totalViews?: number | null;
  creatorId?: string;
  coverUrl?: string | null;
  updatedAt?: string;
};

type AdminSeriesListPayload =
  | AdminSeriesApiItem[]
  | BasePageResponse<AdminSeriesApiItem>
  | {
      content?: AdminSeriesApiItem[];
      data?: AdminSeriesApiItem[] | BasePageResponse<AdminSeriesApiItem>;
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

function normalizeSeries(item: AdminSeriesApiItem): AdminSeriesItem {
  return {
    id: item.id ?? item.seriesId ?? "",
    title: item.title ?? "Untitled series",
    contentType: normalizeContentType(item.contentType),
    status: normalizeStatus(item.status),
    views: item.views ?? item.totalViews ?? 0,
    creatorId: item.creatorId,
    coverUrl: item.coverUrl ?? undefined,
    updatedAt: item.updatedAt,
  };
}

function extractSeriesItems(payload: unknown): AdminSeriesApiItem[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  if (Array.isArray(payload.content)) {
    return payload.content as AdminSeriesApiItem[];
  }

  if (Array.isArray(payload.data)) {
    return payload.data as AdminSeriesApiItem[];
  }

  if (isRecord(payload.data) && Array.isArray(payload.data.content)) {
    return payload.data.content as AdminSeriesApiItem[];
  }

  return [];
}

async function unwrapFlexible<T>(request: Promise<{ data: BaseResponse<T> | T }>) {
  const response = await request;

  if (isRecord(response.data) && "data" in response.data) {
    return unwrapBaseResponse<T>(
      Promise.resolve({ data: response.data as BaseResponse<T> }),
    );
  }

  return response.data as T;
}

export async function getAllSeries() {
  const payload = await unwrapFlexible<AdminSeriesListPayload>(
    httpClient.get(ADMIN_SERIES_ENDPOINT, {
      params: { pageSize: 100 },
    }),
  );

  return extractSeriesItems(payload)
    .map(normalizeSeries)
    .filter((series) => series.id);
}

export async function hideSeries(id: string) {
  const data = await unwrapBaseResponse<AdminSeriesApiItem>(
    httpClient.patch(`${ADMIN_SERIES_ENDPOINT}/${id}/hide`),
  );

  return normalizeSeries(data);
}

export async function unhideSeries(id: string) {
  const data = await unwrapBaseResponse<AdminSeriesApiItem>(
    httpClient.patch(`${ADMIN_SERIES_ENDPOINT}/${id}/unhide`),
  );

  return normalizeSeries(data);
}

export async function deleteAdminSeries(id: string) {
  return unwrapBaseResponse<void>(
    httpClient.delete(`${ADMIN_SERIES_ENDPOINT}/${id}`),
  );
}
