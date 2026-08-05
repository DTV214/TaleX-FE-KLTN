import { httpClient, type BaseResponse } from "@/shared/api/http-client";

const MODERATION_ENDPOINT = "/api/v1/media";

export type ModerationMediaType = "VIDEO" | "IMAGE";

export type ModerationMedia = {
  id: string;
  episodeId: string;
  // Trạng thái của EPISODE chứa media này (khác `status` — trạng thái riêng của media) —
  // dùng để biết Admin có đang ép ẩn cả episode hay không (xem tab "Đã duyệt").
  episodeStatus?: string;
  mediaType: ModerationMediaType;
  url: string;
  thumbnailUrl?: string;
  mimeType?: string;
  status: string;
  approvalStatus: string;
  createdAt?: string;
  approvalReviewedAt?: string;
  approvalReviewedBy?: string;
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
  episodeStatus?: string;
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
  approvalReviewedAt?: string;
  approvalReviewedBy?: string;
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
    episodeStatus: item.episodeStatus,
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
    approvalReviewedAt: item.approvalReviewedAt,
    approvalReviewedBy: item.approvalReviewedBy,
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

export async function getApprovedMedia(page = 0, size = 12) {
  const response = await httpClient.get<BaseResponse<ModerationPagePayload> | ModerationPagePayload>(
    `${MODERATION_ENDPOINT}/approved`,
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

// Ép ẩn CẢ EPISODE chứa nội dung vi phạm (không chỉ riêng 1 trang/media đã duyệt) — theo
// đúng quyết định nghiệp vụ: nếu 1 trang trong episode có vấn đề nghiêm trọng, cả episode
// đó cần tạm ngừng công khai chứ không phải chỉ ẩn riêng trang đó. BE tự cắt truy cập công
// khai tới toàn bộ media trong episode (findPublicEntity chặn theo status episode).
export async function forceHideEpisode(episodeId: string) {
  await httpClient.patch(`/api/v1/episodes/${episodeId}/force-hide`);
}

// Gỡ ép ẩn — khôi phục THẲNG về PUBLISHED (không cần Creator xuất bản lại), khác hẳn
// hành vi forceUnhide ở Media (chỉ về HIDDEN, chờ Creator tự bấm Bỏ ẩn).
export async function forceUnhideEpisode(episodeId: string) {
  await httpClient.patch(`/api/v1/episodes/${episodeId}/force-unhide`);
}

export type MediaCopyrightViolation = {
  mediaCopyrightId: string;
  mediaId: string;
  sourceMediaId?: string;
  similarityScore?: number;
  violationType?: string;
  isValid?: boolean;
  note?: string;
  checkedAt?: string;
  // Chỉ có giá trị khi caller là STAFF/ADMIN (BE ẩn với chính creator bị flag) — xem
  // MediaServiceImpl.mapCopyrightToDto.
  sourceEpisodeTitle?: string;
  sourceSeriesTitle?: string;
  sourceCreatorUsername?: string;
  sourceThumbnailUrl?: string;
  sourceMediaDeleted?: boolean;
};

export type ViolationDetail = {
  violationDetailId: string;
  label: string;
  confidence?: number;
  suggestion?: string;
};

export type CensorshipResult = {
  censorshipId: string;
  mediaId: string;
  primaryViolationLabel?: string;
  confidenceScore?: number;
  checkedAt?: string;
  reviewedBy?: string;
  reviewerNotes?: string;
  status: "APPROVED" | "REJECTED";
  violationDetails: ViolationDetail[];
};

export type MediaViolations = {
  mediaId: string;
  contentId?: string;
  copyrightViolations: MediaCopyrightViolation[];
  censorshipResults: CensorshipResult[];
};

export async function getMediaViolations(mediaId: string) {
  const response = await httpClient.get<BaseResponse<MediaViolations>>(
    `${MODERATION_ENDPOINT}/${mediaId}/violations`,
  );
  return unwrapPayload<MediaViolations>(response.data);
}

export type MediaDetail = {
  mediaId: string;
  episodeId?: string;
  creatorId?: string;
  mediaType?: ModerationMediaType;
  originalUrl?: string;
  thumbnailUrl?: string;
  status?: string;
  approvalStatus?: string;
  createdAt?: string;
  isDeleted?: boolean;
};

// Dùng cho nút "Xem nội dung gốc" ở modal kiểm duyệt — endpoint này đã tự bypass ownership
// check cho STAFF/ADMIN (ContentOwnershipService.assertCanView), nên admin xem được media
// của bất kỳ creator nào, không cần endpoint riêng.
export async function getMediaById(mediaId: string) {
  const response = await httpClient.get<BaseResponse<MediaDetail>>(
    `${MODERATION_ENDPOINT}/${mediaId}`,
  );
  return unwrapPayload<MediaDetail>(response.data);
}
