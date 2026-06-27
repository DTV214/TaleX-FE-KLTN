import { httpClient } from "@/shared/api/http-client";
import type {
  CreateCreatorTierRequest,
  CreatorTierDetailResponse,
  CreatorTierFilterParams,
  CreatorTierListResponse,
  CreatorTierMutationResponse,
  DeleteCreatorTierResponse,
  UpdateCreatorTierRequest,
} from "../types/creator-tiers.types";

const CREATOR_TIERS_ENDPOINT = "/api/v1/creator-tiers";

export const creatorTiersApi = {
  async getCreatorTiers(
    params: CreatorTierFilterParams,
  ): Promise<CreatorTierListResponse> {
    const response = await httpClient.get<CreatorTierListResponse>(
      CREATOR_TIERS_ENDPOINT,
      { params },
    );

    return response.data;
  },

  async getCreatorTierById(
    creatorTierId: string,
  ): Promise<CreatorTierDetailResponse> {
    const response = await httpClient.get<CreatorTierDetailResponse>(
      `${CREATOR_TIERS_ENDPOINT}/${creatorTierId}`,
    );

    return response.data;
  },

  async createCreatorTier(
    payload: CreateCreatorTierRequest,
  ): Promise<CreatorTierMutationResponse> {
    const response = await httpClient.post<CreatorTierMutationResponse>(
      CREATOR_TIERS_ENDPOINT,
      payload,
    );

    return response.data;
  },

  async updateCreatorTier(
    creatorTierId: string,
    payload: UpdateCreatorTierRequest,
  ): Promise<CreatorTierMutationResponse> {
    const response = await httpClient.put<CreatorTierMutationResponse>(
      `${CREATOR_TIERS_ENDPOINT}/${creatorTierId}`,
      payload,
    );

    return response.data;
  },

  async deleteCreatorTier(
    creatorTierId: string,
  ): Promise<DeleteCreatorTierResponse> {
    const response = await httpClient.delete<DeleteCreatorTierResponse>(
      `${CREATOR_TIERS_ENDPOINT}/${creatorTierId}`,
    );

    return response.data;
  },
};
