import { httpClient, type BaseResponse } from "@/shared/api/http-client";

const MODERATION_ENDPOINT = "/api/v1/media";

export type ModerationMediaType = "VIDEO" | "IMAGE";

export type ModerationMedia = {
  id: string;
  episodeId: string;
  mediaType: ModerationMediaType;
  url: string;
  thumbnailUrl?: string;
  mimeType?: string;
  status: string;
  approvalStatus: string;
  createdAt?: string;
};

export type ModerationPage = {
  content: ModerationMedia[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
};

type ModerationMediaApiItem = {
  id?: string;
  mediaId?: string;
  episodeId?: string;
  mediaType?: string;
  fileUrl?: string | null;
  originalUrl?: string | null;
  playbackUrl?: string | null;
  hlsUrl?: string | null;
  thumbnailUrl?: string | null;
  mimeType?: string;
  status?: string;
  approvalStatus?: string;
  createdAt?: string;
};

type ModerationPagePayload = {
  content?: ModerationMediaApiItem[];
  pageNumber?: number;
  pageSize?: number;
  totalElements?: number;
  totalPages?: number;
  isFirst?: boolean;
  isLast?: boolean;
  data?: ModerationMediaApiItem[] | ModerationPagePayload;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeMediaType(value: unknown): ModerationMediaType {
  return value === "VIDEO" ? "VIDEO" : "IMAGE";
}

function normalizeMedia(item: ModerationMediaApiItem): ModerationMedia {
  return {
    id: item.id ?? item.mediaId ?? "",
    episodeId: item.episodeId ?? "",
    mediaType: normalizeMediaType(item.mediaType),
    url:
      item.originalUrl ??
      item.fileUrl ??
      item.playbackUrl ??
      item.hlsUrl ??
      item.thumbnailUrl ??
      "",
    thumbnailUrl: item.thumbnailUrl ?? undefined,
    mimeType: item.mimeType,
    status: item.status ?? "PENDING",
    approvalStatus: item.approvalStatus ?? "PENDING_REVIEW",
    createdAt: item.createdAt,
  };
}

function unwrapPayload<T>(responseData: BaseResponse<T> | T): T {
  if (isRecord(responseData) && "data" in responseData) {
    return responseData.data as T;
  }

  return responseData as T;
}

function getNumber(value: unknown, fallback: number) {
  return typeof value === "number" ? value : fallback;
}

function getBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizePage(payload: unknown, page: number, size: number): ModerationPage {
  const unwrappedPayload = unwrapPayload<unknown>(payload);
  const nestedPayload =
    isRecord(unwrappedPayload) &&
    (Array.isArray(unwrappedPayload.data) || isRecord(unwrappedPayload.data))
      ? unwrappedPayload.data
      : unwrappedPayload;
  const pageRecord = isRecord(nestedPayload) ? nestedPayload : {};
  const rawContent = Array.isArray(nestedPayload)
    ? nestedPayload
    : Array.isArray(pageRecord.content)
      ? pageRecord.content
      : [];
  const content = rawContent
    .filter(isRecord)
    .map((item) => normalizeMedia(item))
    .filter((media) => media.id);
  const totalElements = getNumber(pageRecord.totalElements, content.length);
  const totalPages = getNumber(
    pageRecord.totalPages,
    content.length > 0 ? 1 : 0,
  );
  const pageNumber = getNumber(pageRecord.pageNumber, page);
  const pageSize = getNumber(pageRecord.pageSize, size);

  return {
    content,
    pageNumber,
    pageSize,
    totalElements,
    totalPages,
    isFirst: getBoolean(pageRecord.isFirst, pageNumber <= 0),
    isLast: getBoolean(
      pageRecord.isLast,
      totalPages <= 1 || pageNumber >= totalPages - 1,
    ),
  };
}

export async function getPendingMedia(page = 0, size = 12) {
  const response = await httpClient.get<BaseResponse<ModerationPagePayload> | ModerationPagePayload>(
    `${MODERATION_ENDPOINT}/pending-review`,
    {
      params: { page, size },
    },
  );

  return normalizePage(response.data, page, size);
}

export async function approveMedia(id: string) {
  await httpClient.patch(`${MODERATION_ENDPOINT}/${id}/approve`);
}

export async function rejectMedia(id: string, reason: string) {
  await httpClient.patch(`${MODERATION_ENDPOINT}/${id}/reject`, { reason });
}
