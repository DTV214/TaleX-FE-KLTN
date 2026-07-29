import type { BasePageResponse, BaseResponse } from "@/shared/api/http-client";

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
