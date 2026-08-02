import { httpClient } from "@/shared/api/http-client";
import { listSeriesByCreator } from "@/features/creator-dashboard/api/creator-content-api";
import type {
    CreateEngagementOrderRequest,
    CreateEngagementOrderResponse,
    CreatorCampaignFilterParams,
    CreatorCampaignListResponse,
    CreatorCampaignPageResponse,
    CreatorCampaignServiceFilterParams,
    CreatorCampaignServiceListResponse,
    CreatorCampaignServicePageResponse,
    CreatorCampaignSeriesFilterParams,
    CreatorCampaignSeriesPageResponse,
} from "@/features/creator-dashboard/types/creator-campaigns.types";
import type { OrderResponse } from "@/features/payment/types/payment.types";

const CREATOR_CAMPAIGN_PLANS_ENDPOINT = "/api/v1/engagement-services/search";
const CREATOR_ENGAGEMENT_ORDER_ENDPOINT = "/api/v1/orders/engagement";
const CREATOR_OWN_CAMPAIGNS_ENDPOINT = "/api/v1/campaigns/own";

function buildCampaignSearchParams(params: CreatorCampaignFilterParams) {
    const searchParams = new URLSearchParams();

    if (params.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params.sortDirection) {
        searchParams.set("sortDirection", params.sortDirection);
    }
    if (params.page !== undefined) searchParams.set("page", String(params.page));
    if (params.pageSize !== undefined) {
        searchParams.set("pageSize", String(params.pageSize));
    }

    Object.entries(params.filters ?? {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim()) {
            searchParams.set(key, String(value).trim());
        }
    });

    return searchParams;
}

export async function getCreatorCampaignPlans(
    params: CreatorCampaignServiceFilterParams = { page: 1, pageSize: 20 },
): Promise<CreatorCampaignServicePageResponse> {
    const response = await httpClient.get<CreatorCampaignServiceListResponse>(
        CREATOR_CAMPAIGN_PLANS_ENDPOINT,
        {
            params,
        },
    );

    return response.data.data;
}

export async function getCreatorCampaignPublishedSeries(
    params: CreatorCampaignSeriesFilterParams = {
        statuses: ["PUBLISHED"],
        page: 1,
        pageSize: 6,
    },
): Promise<CreatorCampaignSeriesPageResponse> {
    return listSeriesByCreator(
        params.page ?? 1,
        params.pageSize ?? 6,
        params.statuses ?? ["PUBLISHED"],
    );
}

export async function createEngagementOrder(
    request: CreateEngagementOrderRequest,
): Promise<OrderResponse> {
    const response = await httpClient.post<CreateEngagementOrderResponse>(
        CREATOR_ENGAGEMENT_ORDER_ENDPOINT,
        request,
    );

    return response.data.data;
}

export async function getCreatorOwnCampaigns(
    params: CreatorCampaignFilterParams = {
        page: 1,
        pageSize: 10,
        sortBy: "createdAt",
        sortDirection: "DESC",
    },
): Promise<CreatorCampaignPageResponse> {
    const response = await httpClient.get<CreatorCampaignListResponse>(
        CREATOR_OWN_CAMPAIGNS_ENDPOINT,
        {
            params: buildCampaignSearchParams(params),
        },
    );

    return response.data.data;
}
