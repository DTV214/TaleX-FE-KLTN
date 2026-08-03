import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import {
    createEngagementOrder,
    getCreatorCampaignById,
    getCreatorCampaignPlans,
    getCreatorCampaignSeriesByCampaignId,
    getCreatorCampaignSeriesLogs,
    getCreatorOwnCampaigns,
    getCreatorCampaignPublishedSeries,
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
