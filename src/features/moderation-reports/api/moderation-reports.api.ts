"use client";

import {
  httpClient,
  unwrapBaseResponse,
  type BasePageResponse,
  type BaseResponse,
} from "@/shared/api/http-client";

export type ReportTargetType = "EPISODE" | "SERIES" | "ACCOUNT" | "COMMENT" | "OTHER";
export type ReportReason =
  | "COPYRIGHT"
  | "ADULT_CONTENT"
  | "BAD_LANGUAGE"
  | "SPAM"
  | "OTHER";

export type ReportStatus = "PENDING" | "RESOLVED" | "REJECTED";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "DISMISSED";
export type PenaltyStatus = "ACTIVE" | "REVOKED";
export type AppealStatus = "PENDING" | "APPROVED" | "REJECTED";
export type PenaltyLevel =
  | "WARNING_COMMENT"
  | "WARNING_EPISODE"
  | "WARNING_SERIES"
  | "WARNING_ACCOUNT"
  | "FINE_EPISODE"
  | "FINE_SERIES"
  | "FINE_ACCOUNT";

export type CreateReportRequest = {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description: string;
  proofImages?: string[];
  proofVideos?: string[];
};

export type ReportItem = {
  reportId?: string;
  id?: string;
  reporterId?: string;
  reporterUsername?: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
  proofImages?: string[];
  proofVideos?: string[];
  status?: ReportStatus;
  createdAt?: string;
};

export type ModerationTicket = {
  ticketId: string;
  targetType: ReportTargetType;
  targetId: string;
  status: TicketStatus;
  reportCount: number;
  priorityScore: number;
  assignedStaffId?: string | null;
  assignedStaffUsername?: string | null;
  dominantReason?: ReportReason;
  createdAt?: string;
  updatedAt?: string;
  reports?: ReportItem[];
};

export type TicketSearchParams = {
  page?: number;
  pageSize?: number;
  status?: TicketStatus | "ALL";
  targetType?: ReportTargetType | "ALL";
  assignedStaffId?: string;
};

export type TicketProcessRequest =
  | {
      isApproved: false;
      reason: string;
    }
  | {
      isApproved: true;
      penaltyLevel: PenaltyLevel;
      reason: string;
    };

export type Penalty = {
  penaltyId: string;
  ticketId?: string;
  targetUserId?: string;
  targetUsername?: string;
  targetType?: ReportTargetType;
  targetId?: string;
  level: PenaltyLevel;
  status: PenaltyStatus;
  reason?: string;
  createdAt?: string;
  revokedAt?: string;
  revokeReason?: string;
  appealStatus?: AppealStatus;
};

export type PenaltySearchParams = {
  page?: number;
  pageSize?: number;
  targetUserId?: string;
  status?: PenaltyStatus | "ALL";
  level?: PenaltyLevel | "ALL";
  targetType?: ReportTargetType | "ALL";
};

export type Appeal = {
  appealId: string;
  penaltyId: string;
  appellantId?: string;
  appellantUsername?: string;
  reviewerId?: string;
  reviewerUsername?: string;
  status: AppealStatus;
  reason?: string;
  proofDocuments?: string;
  adminNote?: string;
  createdAt?: string;
  reviewedAt?: string;
  penalty?: Penalty;
};

export type AppealSearchParams = {
  page?: number;
  pageSize?: number;
  status?: AppealStatus | "ALL";
  appellantId?: string;
  reviewerId?: string;
};

export type CreateAppealRequest = {
  reason: string;
  proofDocuments?: string;
};

export type ProcessAppealRequest = {
  isApproved: boolean;
  adminNote: string;
};

export type ModerationTargetDetail = {
  targetType: ReportTargetType;
  targetId: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  metadata: Array<{ label: string; value: string | number | null | undefined }>;
};

type TargetDetailRecord = Record<string, unknown>;

function normalizePageParams(params: { page?: number; pageSize?: number }) {
  return {
    ...params,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
  };
}

function cleanFilters<T extends Record<string, unknown>>(params: T) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== "" && value !== "ALL"),
  );
}

function isRecord(value: unknown): value is TargetDetailRecord {
  return typeof value === "object" && value !== null;
}

function unwrapFlexiblePayload<T>(payload: BaseResponse<T> | T): T {
  if (isRecord(payload) && "data" in payload) {
    return payload.data as T;
  }

  return payload as T;
}

function toText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function compactMetadata(
  entries: Array<{ label: string; value: string | number | null | undefined }>,
) {
  return entries.filter((entry) => entry.value !== undefined && entry.value !== null && entry.value !== "");
}

function normalizeAccountTarget(
  payload: unknown,
  targetId: string,
): ModerationTargetDetail {
  const record = isRecord(payload) ? payload : {};
  const username = toText(record.username);
  const fullName = toText(record.fullName) ?? toText(record.name);
  const email = toText(record.email);

  return {
    targetType: "ACCOUNT",
    targetId,
    title: fullName ?? username ?? "Tài khoản bị báo cáo",
    subtitle: username ? `@${username}` : email,
    imageUrl: toText(record.avatarUrl) ?? toText(record.avatar),
    metadata: compactMetadata([
      { label: "Email", value: email },
      { label: "Vai trò", value: toText(record.roleName) ?? toText(record.role) },
      { label: "Trạng thái", value: toText(record.status) },
      { label: "Ngày tạo", value: toText(record.createdAt) },
    ]),
  };
}

function normalizeSeriesTarget(
  payload: unknown,
  targetId: string,
): ModerationTargetDetail {
  const record = isRecord(payload) ? payload : {};

  return {
    targetType: "SERIES",
    targetId,
    title: toText(record.title) ?? "Series bị báo cáo",
    subtitle:
      toText(record.creatorName) ??
      toText(record.username) ??
      toText(record.creatorId),
    imageUrl: toText(record.coverUrl) ?? toText(record.bannerUrl),
    metadata: compactMetadata([
      { label: "Loại nội dung", value: toText(record.contentType) },
      { label: "Độ tuổi", value: toText(record.ageRating) },
      { label: "Ngôn ngữ", value: toText(record.language) },
      { label: "Lượt xem", value: toNumber(record.totalViews) ?? toNumber(record.views) },
      { label: "Đánh giá", value: toNumber(record.averageRating) },
      { label: "Cập nhật", value: toText(record.updatedAt) },
    ]),
  };
}

function normalizeEpisodeTarget(
  payload: unknown,
  targetId: string,
): ModerationTargetDetail {
  const record = isRecord(payload) ? payload : {};
  const episodeNumber = toNumber(record.episodeNumber);

  return {
    targetType: "EPISODE",
    targetId,
    title: toText(record.title) ?? "Tập nội dung bị báo cáo",
    subtitle: episodeNumber ? `Tập ${episodeNumber}` : toText(record.seasonId),
    imageUrl: toText(record.thumbnail),
    metadata: compactMetadata([
      { label: "Loại nội dung", value: toText(record.contentType) },
      { label: "Trạng thái", value: toText(record.status) },
      { label: "Unlock", value: toText(record.unlockType) },
      { label: "Lượt xem", value: toNumber(record.views) },
      { label: "Đánh giá", value: toNumber(record.averageRating) },
      { label: "Cập nhật", value: toText(record.updatedAt) },
    ]),
  };
}

export function parseProofUrls(value?: string | null) {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    }
  } catch {
    // BE stores this as a plain string, so legacy comma-separated values still need display support.
  }

  return trimmed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function stringifyProofUrls(urls: string[]) {
  return JSON.stringify(urls.filter(Boolean));
}

export function createReport(payload: CreateReportRequest) {
  return unwrapBaseResponse<string>(httpClient.post("/api/v1/reports", payload));
}

export function getMyReports(params: { page?: number; pageSize?: number; sortBy?: string; sortDirection?: string } = {}) {
  return unwrapBaseResponse<BasePageResponse<ReportItem>>(
    httpClient.get("/api/v1/reports/my-reports", {
      params: cleanFilters(normalizePageParams(params)),
    }),
  );
}

export function searchTickets(params: TicketSearchParams = {}) {
  return unwrapBaseResponse<BasePageResponse<ModerationTicket>>(
    httpClient.get("/api/v1/moderation/tickets/search", {
      params: cleanFilters(normalizePageParams(params)),
    }),
  );
}

export function assignTicket(ticketId: string) {
  return unwrapBaseResponse<string>(
    httpClient.put(`/api/v1/moderation/tickets/${ticketId}/assign`),
  );
}

export function processTicket(ticketId: string, payload: TicketProcessRequest) {
  return unwrapBaseResponse<Penalty | null>(
    httpClient.post(`/api/v1/moderation/tickets/${ticketId}/process`, payload),
  );
}

export async function getModerationTargetDetail(
  targetType: ReportTargetType,
  targetId: string,
) {
  if (targetType === "ACCOUNT") {
    const response = await httpClient.get<BaseResponse<TargetDetailRecord> | TargetDetailRecord>(
      `/api/v1/admin/accounts/${targetId}`,
    );

    return normalizeAccountTarget(unwrapFlexiblePayload(response.data), targetId);
  }

  if (targetType === "SERIES") {
    const response = await httpClient.get<BaseResponse<TargetDetailRecord> | TargetDetailRecord>(
      `/api/v1/public/series/${targetId}`,
    );

    return normalizeSeriesTarget(unwrapFlexiblePayload(response.data), targetId);
  }

  if (targetType === "EPISODE") {
    const response = await httpClient.get<BaseResponse<TargetDetailRecord> | TargetDetailRecord>(
      `/api/v1/public/episodes/${targetId}`,
    );

    return normalizeEpisodeTarget(unwrapFlexiblePayload(response.data), targetId);
  }

  return null;
}

export function searchPenalties(params: PenaltySearchParams = {}) {
  return unwrapBaseResponse<BasePageResponse<Penalty>>(
    httpClient.get("/api/v1/penalties/search", {
      params: cleanFilters(normalizePageParams(params)),
    }),
  );
}

export function getMyPenalties(params: { page?: number; pageSize?: number } = {}) {
  return unwrapBaseResponse<BasePageResponse<Penalty>>(
    httpClient.get("/api/v1/penalties/my-penalties", {
      params: normalizePageParams(params),
    }),
  );
}

export function getPenalty(penaltyId: string) {
  return unwrapBaseResponse<Penalty>(httpClient.get(`/api/v1/penalties/${penaltyId}`));
}

export function revokePenalty(penaltyId: string, reason: string) {
  return unwrapBaseResponse<string>(
    httpClient.put(`/api/v1/penalties/${penaltyId}/revoke`, null, {
      params: { reason },
    }),
  );
}

export function createAppeal(penaltyId: string, payload: CreateAppealRequest) {
  return unwrapBaseResponse<Appeal>(
    httpClient.post(`/api/v1/appeals/penalties/${penaltyId}`, payload),
  );
}

export function getMyAppeals(params: { page?: number; pageSize?: number } = {}) {
  return unwrapBaseResponse<BasePageResponse<Appeal>>(
    httpClient.get("/api/v1/appeals/own", { params: normalizePageParams(params) }),
  );
}

export function getAppealByPenalty(penaltyId: string) {
  return unwrapBaseResponse<Appeal>(
    httpClient.get(`/api/v1/appeals/penalties/${penaltyId}`),
  );
}

export function searchAppeals(params: AppealSearchParams = {}) {
  return unwrapBaseResponse<BasePageResponse<Appeal>>(
    httpClient.get("/api/v1/appeals/search", {
      params: cleanFilters(normalizePageParams(params)),
    }),
  );
}

export function processAppeal(appealId: string, payload: ProcessAppealRequest) {
  return unwrapBaseResponse<string>(
    httpClient.put(`/api/v1/appeals/${appealId}/process`, payload),
  );
}
