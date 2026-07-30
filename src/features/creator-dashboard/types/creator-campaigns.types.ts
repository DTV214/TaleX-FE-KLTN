import type { BasePageResponse, BaseResponse } from "@/shared/api/http-client";
import type {
    SeriesResponse,
    SeriesStatus,
} from "@/features/creator-dashboard/api/creator-content-api";
import type { OrderResponse } from "@/features/payment/types/payment.types";

export type CreatorCampaignService = {
    engagementServiceId: string;
    name: string;
    description: string;
    price: number;
    targetValue: number;
    isActive: boolean;
};

export type CreatorCampaignServiceFilterParams = {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDirection?: "ASC" | "DESC";
};

export type CreatorCampaignServicePageResponse = BasePageResponse<CreatorCampaignService>;

export type CreatorCampaignServiceListResponse = BaseResponse<CreatorCampaignServicePageResponse>;

export type CreatorCampaignSeriesFilterParams = {
    statuses?: SeriesStatus[];
    page?: number;
    pageSize?: number;
};

export type CreatorCampaignSeriesPageResponse = BasePageResponse<SeriesResponse>;

export type CreateEngagementOrderRequest = {
    engagementServiceId: string;
    seriesIds: string[];
};

export type CreateEngagementOrderResponse = BaseResponse<OrderResponse>;

export type CreatorCampaignStatus =
    | "PENDING"
    | "ACTIVE"
    | "RUNNING"
    | "COMPLETED"
    | "PAUSED"
    | "CANCELLED"
    | "FAILED"
    | string;

export type CreatorCampaignSortBy =
    | "startAt"
    | "endAt"
    | "currentImpression"
    | "targetImpression"
    | "createdAt"
    | "updatedAt";

export type CreatorCampaign = {
    campaignId: string;
    engagementServiceId?: string | null;
    orderId?: string | null;
    status?: CreatorCampaignStatus | null;
    startAt?: string | null;
    endAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    targetImpression?: number | null;
    currentImpression?: number | null;
    analyticData?: Record<string, unknown> | null;
};

export type CreatorCampaignFilterParams = {
    targets?: string[];
    statuses?: CreatorCampaignStatus[];
    sortBy?: CreatorCampaignSortBy;
    sortDirection?: "ASC" | "DESC";
    page?: number;
    pageSize?: number;
};

export type CreatorCampaignPageResponse = BasePageResponse<CreatorCampaign>;

export type CreatorCampaignListResponse = BaseResponse<CreatorCampaignPageResponse>;

export type CreatorCampaignDetailResponse = BaseResponse<CreatorCampaign>;
