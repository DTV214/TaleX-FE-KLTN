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

export type CreatorCampaignSeriesStatus =
    | "RUNNING"
    | "PAUSED"
    | "COMPLETED"
    | "CANCELLED"
    | "UNAVAILABLE"
    | string;

export type CampaignSeriesAnalyticData = {
    likes?: number;
    views?: number;
    comments?: number;
    shares?: number;
    bookmarks?: number;
    watchTime?: number;
    [key: string]: unknown;
};

export type CreatorCampaignSeries = {
    campaignSeriesId: string;
    campaignId: string;
    seriesId: string;
    status?: CreatorCampaignSeriesStatus | null;
    analyticData?: CampaignSeriesAnalyticData | null;
    totalImpression?: number | null;
};

export type CreatorCampaignSeriesListResponse = BaseResponse<CreatorCampaignSeries[]>;

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

export type CreatorCampaignFilterFields = {
    startAtFrom?: string;
    startAtTo?: string;
    endAtFrom?: string;
    endAtTo?: string;
    targetValueFrom?: string;
    targetValueTo?: string;
    currentValueFrom?: string;
    currentValueTo?: string;
    engagementServiceId?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
    updatedAtFrom?: string;
    updatedAtTo?: string;
};

export type CreatorCampaignFilterParams = {
    sortBy?: CreatorCampaignSortBy;
    sortDirection?: "ASC" | "DESC";
    page?: number;
    pageSize?: number;
    filters?: CreatorCampaignFilterFields;
};

export type CreatorCampaignPageResponse = BasePageResponse<CreatorCampaign>;

export type CreatorCampaignListResponse = BaseResponse<CreatorCampaignPageResponse>;

export type CreatorCampaignDetailResponse = BaseResponse<CreatorCampaign>;
