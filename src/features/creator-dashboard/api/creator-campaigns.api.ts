import { httpClient } from "@/shared/api/http-client";
import { listSeriesByCreator, listSeriesByCreatorAndCampaign } from "@/features/creator-dashboard/api/creator-content-api";
import type {
    CreateEngagementOrderRequest,
    CreateEngagementOrderResponse,
    CreatorCampaignFilterParams,
    CreatorCampaignDetailResponse,
    CreatorCampaignListResponse,
    CreatorCampaignPageResponse,
    CreatorCampaignServiceFilterParams,
    CreatorCampaignServiceListResponse,
    CreatorCampaignServicePageResponse,
    CreatorCampaignSeries,
    CreatorCampaignSeriesFilterParams,
    CreatorCampaignSeriesLog,
    CreatorCampaignSeriesLogListResponse,
    CreatorCampaignSeriesLogParams,
    CreatorCampaignSeriesListResponse,
    CreatorCampaignSeriesPageResponse,
    CreatorCampaignSeriesSingleResponse,
    CampaignWallet,
    CampaignWalletBalanceResponse,
    CampaignWalletHistoryFilterParams,
    CampaignWalletHistoryListResponse,
    CampaignWalletHistoryPageResponse,
    ReferenceTransaction,
    GetTransactionsByReferenceResponse,
    OrderWalletTransactionsResponse,
    CampaignWalletTransaction,
    PayoutRequest,
    PayoutRequestFilterParams,
    PayoutRequestSingleResponse,
    PayoutRequestPageResponse,
    PayoutRequestListResponse,
    WalletPayoutTransaction,
    WalletPayoutTransactionsResponse,
    ProcessPayoutRequestRequest,
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
    return listSeriesByCreatorAndCampaign(
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

export async function getCreatorCampaignById(
    campaignId: string,
): Promise<CreatorCampaignDetailResponse["data"]> {
    const response = await httpClient.get<CreatorCampaignDetailResponse>(
        `/api/v1/campaigns/${campaignId}`,
    );

    return response.data.data;
}

export async function getCreatorCampaignSeriesByCampaignId(
    campaignId: string,
): Promise<CreatorCampaignSeries[]> {
    const response = await httpClient.get<CreatorCampaignSeriesListResponse>(
        `/api/v1/campaign-series/campaign/${campaignId}`,
    );

    return response.data.data;
}

export async function getCreatorCampaignSeriesLogs(
    campaignSeriesId: string,
    params: CreatorCampaignSeriesLogParams,
): Promise<CreatorCampaignSeriesLog[]> {
    const response = await httpClient.get<CreatorCampaignSeriesLogListResponse>(
        `/api/v1/campaign-series/${campaignSeriesId}/logs`,
        { params },
    );

    return response.data.data;
}

export async function updateCampaignSeriesStatus(
    campaignSeriesId: string,
    status: "RUNNING" | "PAUSED" | "PAUSE",
): Promise<CreatorCampaignSeries> {
    const bodyStatus = status === "PAUSE" ? "PAUSED" : status;

    const response = await httpClient.patch<CreatorCampaignSeriesSingleResponse>(
        `/api/v1/campaign-series/${campaignSeriesId}/status`,
        JSON.stringify(bodyStatus),
        {
            headers: {
                "Content-Type": "application/json",
            },
        },
    );

    return response.data.data;
}

export async function getCampaignWalletBalance(): Promise<CampaignWallet | null> {
    const response = await httpClient.get<CampaignWalletBalanceResponse>(
        "/api/v1/campaign-wallets/balance",
    );

    return response.data.data;
}

export async function getCampaignWalletHistory(
    params: CampaignWalletHistoryFilterParams = { page: 1, pageSize: 10 },
): Promise<CampaignWalletHistoryPageResponse> {
    const response = await httpClient.get<CampaignWalletHistoryListResponse>(
        "/api/v1/campaign-wallets/history",
        { params },
    );

    return response.data.data;
}

export async function getTransactionsByReference(
    refType: string,
    refId: string,
): Promise<ReferenceTransaction[]> {
    const response = await httpClient.get<GetTransactionsByReferenceResponse>(
        "/api/v1/transactions/by-reference",
        {
            params: {
                refType,
                refId,
                referenceType: refType,
                referenceId: refId,
            },
        },
    );

    return response.data.data;
}

export async function getOrderWalletTransactions(
    orderId: string,
): Promise<CampaignWalletTransaction[]> {
    const response = await httpClient.get<OrderWalletTransactionsResponse>(
        `/api/v1/campaign-wallets/${orderId}/wallet-transactions`,
    );

    return response.data.data;
}

export async function getCampaignWalletTransactionsByCampaign(
    campaignId: string,
): Promise<CampaignWalletTransaction[]> {
    const response = await httpClient.get<OrderWalletTransactionsResponse>(
        `/api/v1/campaign-wallets/campaigns/${campaignId}/wallet-transactions`,
    );

    return response.data.data;
}

export async function createPayoutRequest(): Promise<PayoutRequest> {
    const response = await httpClient.post<PayoutRequestSingleResponse>(
        "/api/v1/payout-requests",
        {},
    );

    return response.data.data;
}

export async function getPayoutRequests(
    params: PayoutRequestFilterParams = { page: 1, pageSize: 20 },
): Promise<PayoutRequestPageResponse> {
    const response = await httpClient.get<PayoutRequestListResponse>(
        "/api/v1/payout-requests",
        { params },
    );

    return response.data.data;
}

export async function processPayoutRequest(
    payoutRequestId: string,
    body: ProcessPayoutRequestRequest,
): Promise<PayoutRequest> {
    const response = await httpClient.put<PayoutRequestSingleResponse>(
        `/api/v1/payout-requests/${payoutRequestId}/process`,
        body,
        {
            params: {
                status: body.status,
                adminNote: body.adminNote,
            },
        },
    );

    return response.data.data;
}

export async function getOwnPayoutRequests(
    params: PayoutRequestFilterParams = { page: 1, pageSize: 20 },
): Promise<PayoutRequestPageResponse> {
    const response = await httpClient.get<PayoutRequestListResponse>(
        "/api/v1/payout-requests/own",
        { params },
    );

    return response.data.data;
}

export async function getPayoutRequestTransactions(
    payoutRequestId: string,
): Promise<WalletPayoutTransaction[]> {
    const response = await httpClient.get<WalletPayoutTransactionsResponse>(
        `/api/v1/payout-requests/${payoutRequestId}/transactions`,
    );

    return response.data.data ?? [];
}

export async function cancelCreatorCampaign(campaignId: string): Promise<void> {
    await httpClient.delete(`/api/v1/campaigns/${campaignId}`);
}

export async function executePayoutRequest(
    payoutRequestId: string,
): Promise<PayoutRequest> {
    const response = await httpClient.post<PayoutRequestSingleResponse>(
        `/api/v1/payout-requests/${payoutRequestId}/execute`,
        {},
    );

    return response.data.data;
}
