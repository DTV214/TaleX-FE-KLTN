import type { BasePageResponse, BaseResponse } from "@/shared/api/http-client";

export type AdminCampaignStatus =
  | "PENDING"
  | "ACTIVE"
  | "RUNNING"
  | "COMPLETED"
  | "PAUSED"
  | "CANCELLED"
  | "FAILED"
  | string;

export type AdminCampaignSortBy =
  | "startAt"
  | "endAt"
  | "currentImpression"
  | "targetImpression"
  | "createdAt"
  | "updatedAt";

export type AdminCampaignAnalytics = {
  likes?: number;
  views?: number;
  comments?: number;
  shares?: number;
  bookmarks?: number;
  watchTime?: number;
  [key: string]: unknown;
};

export type AdminCampaign = {
  campaignId: string;
  engagementServiceId?: string | null;
  orderId?: string | null;
  status?: AdminCampaignStatus | null;
  startAt?: string | null;
  endAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  targetImpression?: number | null;
  currentImpression?: number | null;
  analyticData?: AdminCampaignAnalytics | null;
};

export type AdminCampaignFilterParams = {
  page?: number;
  pageSize?: number;
  sortBy?: AdminCampaignSortBy;
  sortDirection?: "ASC" | "DESC";
  statuses?: AdminCampaignStatus[];
  targets?: string[];
};

export type AdminCampaignStatusUpdateRequest = {
  status: AdminCampaignStatus;
};

export type AdminCampaignPageResponse = BasePageResponse<AdminCampaign>;

export type AdminCampaignListResponse =
  BaseResponse<AdminCampaignPageResponse>;

export type AdminCampaignDetailResponse = BaseResponse<AdminCampaign>;

export type AdminCampaignMutationResponse =
  BaseResponse<AdminCampaign | string | null>;

export type AdminCampaignDeleteResponse = BaseResponse<string | null>;
