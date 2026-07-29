import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getCreatorCampaignPlans } from "@/features/creator-dashboard/api/creator-campaigns.api";
import type {
    CreatorCampaignServiceFilterParams,
    CreatorCampaignServicePageResponse,
} from "@/features/creator-dashboard/types/creator-campaigns.types";
import { unwrapBaseResponse } from "@/shared/api/http-client";

export const creatorCampaignQueryKeys = {
    all: ["creator-dashboard", "creator-campaigns"] as const,
    lists: () => [...creatorCampaignQueryKeys.all, "list"] as const,
    list: (params: CreatorCampaignServiceFilterParams) =>
        [...creatorCampaignQueryKeys.lists(), params] as const,
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
