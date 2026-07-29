import { httpClient } from "@/shared/api/http-client";
import type {
    CreatorCampaignServiceFilterParams,
    CreatorCampaignServiceListResponse,
    CreatorCampaignServicePageResponse,
} from "@/features/creator-dashboard/types/creator-campaigns.types";

const CREATOR_CAMPAIGN_PLANS_ENDPOINT = "/api/v1/engagement-services/search";

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
