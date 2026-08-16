import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createEngagementOrder,
    getCreatorCampaignById,
    getCreatorCampaignPlans,
    getCreatorCampaignSeriesByCampaignId,
    getCreatorCampaignSeriesLogs,
    getCreatorOwnCampaigns,
    getCreatorCampaignPublishedSeries,
    updateCampaignSeriesStatus,
    getCampaignWalletBalance,
    getCampaignWalletHistory,
    getTransactionsByReference,
    getOrderWalletTransactions,
    createPayoutRequest,
    getPayoutRequests,
    processPayoutRequest,
    getOwnPayoutRequests,
    getPayoutRequestTransactions,
    cancelCreatorCampaign,
    executePayoutRequest,
} from "@/features/creator-dashboard/api/creator-campaigns.api";
import type {
    CreateEngagementOrderRequest,
    CreatorCampaignFilterParams,
    CreatorCampaign,
    CreatorCampaignPageResponse,
    CreatorCampaignServiceFilterParams,
    CreatorCampaignServicePageResponse,
    CreatorCampaignSeries,
    CreatorCampaignSeriesFilterParams,
    CreatorCampaignSeriesLog,
    CreatorCampaignSeriesLogParams,
    CreatorCampaignSeriesPageResponse,
    CampaignWallet,
    CampaignWalletHistoryFilterParams,
    CampaignWalletHistoryPageResponse,
    ReferenceTransaction,
    CampaignWalletTransaction,
    PayoutRequestFilterParams,
    PayoutRequestPageResponse,
    ProcessPayoutRequestRequest,
} from "@/features/creator-dashboard/types/creator-campaigns.types";

export const creatorCampaignQueryKeys = {
    all: ["creator-dashboard", "creator-campaigns"] as const,
    lists: () => [...creatorCampaignQueryKeys.all, "list"] as const,
    list: (params: CreatorCampaignServiceFilterParams) =>
        [...creatorCampaignQueryKeys.lists(), params] as const,
    seriesLists: () => [...creatorCampaignQueryKeys.all, "series-list"] as const,
    seriesList: (params: CreatorCampaignSeriesFilterParams) =>
        [...creatorCampaignQueryKeys.seriesLists(), params] as const,
    ownLists: () => [...creatorCampaignQueryKeys.all, "own-list"] as const,
    ownList: (params: CreatorCampaignFilterParams) =>
        [...creatorCampaignQueryKeys.ownLists(), params] as const,
    details: () => [...creatorCampaignQueryKeys.all, "detail"] as const,
    detail: (campaignId: string) =>
        [...creatorCampaignQueryKeys.details(), campaignId] as const,
    campaignSeries: (campaignId: string) =>
        [...creatorCampaignQueryKeys.all, "campaign-series", campaignId] as const,
    campaignSeriesLogs: (
        campaignSeriesId: string,
        params: CreatorCampaignSeriesLogParams,
    ) =>
        [
            ...creatorCampaignQueryKeys.all,
            "campaign-series-logs",
            campaignSeriesId,
            params,
        ] as const,
};

export function useGetCreatorCampaignPlans(
    params: CreatorCampaignServiceFilterParams = { page: 1, pageSize: 20 },
) {
    return useQuery<CreatorCampaignServicePageResponse>({
        queryKey: creatorCampaignQueryKeys.list(params),
        queryFn: () => getCreatorCampaignPlans(params),
        staleTime: 60 * 1000,
        placeholderData: keepPreviousData,
    });
}

export function useGetCreatorCampaignPublishedSeries(
    params: CreatorCampaignSeriesFilterParams = {
        statuses: ["PUBLISHED"],
        page: 1,
        pageSize: 6,
    },
    enabled = true,
) {
    return useQuery<CreatorCampaignSeriesPageResponse>({
        queryKey: creatorCampaignQueryKeys.seriesList(params),
        queryFn: () => getCreatorCampaignPublishedSeries(params),
        enabled,
        staleTime: 30 * 1000,
        placeholderData: keepPreviousData,
    });
}

export function useCreateEngagementOrder() {
    return useMutation({
        mutationFn: (request: CreateEngagementOrderRequest) =>
            createEngagementOrder(request),
    });
}

export function useGetCreatorOwnCampaigns(
    params: CreatorCampaignFilterParams = {
        page: 1,
        pageSize: 10,
        sortBy: "createdAt",
        sortDirection: "DESC",
    },
) {
    return useQuery<CreatorCampaignPageResponse>({
        queryKey: creatorCampaignQueryKeys.ownList(params),
        queryFn: () => getCreatorOwnCampaigns(params),
        staleTime: 30 * 1000,
        placeholderData: keepPreviousData,
    });
}

export function useGetCreatorCampaign(campaignId: string) {
    return useQuery<CreatorCampaign>({
        queryKey: creatorCampaignQueryKeys.detail(campaignId),
        queryFn: () => getCreatorCampaignById(campaignId),
        enabled: Boolean(campaignId),
        staleTime: 30 * 1000,
    });
}

export function useGetCreatorCampaignSeriesByCampaignId(campaignId?: string | null) {
    return useQuery<CreatorCampaignSeries[]>({
        queryKey: creatorCampaignQueryKeys.campaignSeries(campaignId ?? ""),
        queryFn: () => getCreatorCampaignSeriesByCampaignId(campaignId ?? ""),
        enabled: Boolean(campaignId),
        staleTime: 30 * 1000,
    });
}

export function useGetCreatorCampaignSeriesLogs(
    campaignSeriesId?: string | null,
    params?: CreatorCampaignSeriesLogParams,
    enabled = true,
) {
    const fallbackParams: CreatorCampaignSeriesLogParams = {
        startTime: "",
        endTime: "",
    };
    const queryParams = params ?? fallbackParams;

    return useQuery<CreatorCampaignSeriesLog[]>({
        queryKey: creatorCampaignQueryKeys.campaignSeriesLogs(
            campaignSeriesId ?? "",
            queryParams,
        ),
        queryFn: () =>
            getCreatorCampaignSeriesLogs(campaignSeriesId ?? "", queryParams),
        enabled:
            Boolean(campaignSeriesId) &&
            Boolean(queryParams.startTime) &&
            Boolean(queryParams.endTime) &&
            enabled,
        staleTime: 30 * 1000,
    });
}

export function useUpdateCampaignSeriesStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            campaignSeriesId,
            status,
        }: {
            campaignSeriesId: string;
            status: "RUNNING" | "PAUSED" | "PAUSE";
        }) => updateCampaignSeriesStatus(campaignSeriesId, status),
        onSuccess: () => {
            queryClient.invalidateQueries();
        },
    });
}

export function useGetCampaignWalletBalance() {
    return useQuery<CampaignWallet | null>({
        queryKey: [...creatorCampaignQueryKeys.all, "campaign-wallet-balance"] as const,
        queryFn: () => getCampaignWalletBalance(),
        staleTime: 30 * 1000,
    });
}

export function useGetCampaignWalletHistory(
    params: CampaignWalletHistoryFilterParams = { page: 1, pageSize: 10 },
) {
    return useQuery<CampaignWalletHistoryPageResponse>({
        queryKey: [...creatorCampaignQueryKeys.all, "campaign-wallet-history", params] as const,
        queryFn: () => getCampaignWalletHistory(params),
        staleTime: 30 * 1000,
        placeholderData: keepPreviousData,
    });
}

export function useGetTransactionsByReference(
    refType?: string,
    refId?: string,
    enabled = true,
) {
    return useQuery<ReferenceTransaction[]>({
        queryKey: [...creatorCampaignQueryKeys.all, "transactions-by-reference", refType, refId] as const,
        queryFn: () => getTransactionsByReference(refType!, refId!),
        enabled: Boolean(refType) && Boolean(refId) && enabled,
        staleTime: 30 * 1000,
    });
}

export function useGetOrderWalletTransactions(orderId?: string, enabled = true) {
    return useQuery<CampaignWalletTransaction[]>({
        queryKey: [...creatorCampaignQueryKeys.all, "order-wallet-transactions", orderId] as const,
        queryFn: () => getOrderWalletTransactions(orderId!),
        enabled: Boolean(orderId) && enabled,
        staleTime: 30 * 1000,
    });
}

export function useCreatePayoutRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => createPayoutRequest(),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: creatorCampaignQueryKeys.all,
            });
        },
    });
}

export function useGetPayoutRequests(
    params: PayoutRequestFilterParams = { page: 1, pageSize: 20 },
) {
    return useQuery<PayoutRequestPageResponse>({
        queryKey: [...creatorCampaignQueryKeys.all, "payout-requests", params] as const,
        queryFn: () => getPayoutRequests(params),
        staleTime: 30 * 1000,
        placeholderData: keepPreviousData,
    });
}

export function useProcessPayoutRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            payoutRequestId,
            body,
        }: {
            payoutRequestId: string;
            body: ProcessPayoutRequestRequest;
        }) => processPayoutRequest(payoutRequestId, body),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: creatorCampaignQueryKeys.all,
            });
        },
    });
}

export function useGetOwnPayoutRequests(
    params: PayoutRequestFilterParams = { page: 1, pageSize: 20 },
) {
    return useQuery<PayoutRequestPageResponse>({
        queryKey: [...creatorCampaignQueryKeys.all, "payout-requests-own", params] as const,
        queryFn: () => getOwnPayoutRequests(params),
        staleTime: 30 * 1000,
        placeholderData: keepPreviousData,
    });
}

export function useGetPayoutRequestTransactions(
    payoutRequestId?: string,
    params: PayoutRequestFilterParams = { page: 1, pageSize: 20 },
    enabled = true,
) {
    return useQuery<PayoutRequestPageResponse>({
        queryKey: [...creatorCampaignQueryKeys.all, "payout-request-transactions", payoutRequestId, params] as const,
        queryFn: () => getPayoutRequestTransactions(payoutRequestId!, params),
        enabled: Boolean(payoutRequestId) && enabled,
        staleTime: 30 * 1000,
    });
}

export function useCancelCreatorCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (campaignId: string) => cancelCreatorCampaign(campaignId),
        onSuccess: () => {
            queryClient.invalidateQueries();
        },
    });
}

export function useExecutePayoutRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payoutRequestId: string) => executePayoutRequest(payoutRequestId),
        onSuccess: () => {
            queryClient.invalidateQueries();
        },
    });
}
