import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import {
    createEngagementOrder,
    getCreatorCampaignPlans,
    getCreatorOwnCampaigns,
    getCreatorCampaignPublishedSeries,
} from "@/features/creator-dashboard/api/creator-campaigns.api";
import type {
    CreateEngagementOrderRequest,
    CreatorCampaignFilterParams,
    CreatorCampaignPageResponse,
    CreatorCampaignServiceFilterParams,
    CreatorCampaignServicePageResponse,
    CreatorCampaignSeriesFilterParams,
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
