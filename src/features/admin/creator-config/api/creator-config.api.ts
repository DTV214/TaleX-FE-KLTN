import axios from "axios";
import { httpClient, unwrapBaseResponse } from "@/shared/api/http-client";
import type {
  CreatorConfig,
  CreatorConfigMutationResponse,
  CreatorConfigRequest,
  CreatorConfigResponse,
} from "../types/creator-config.types";

const CREATOR_CONFIG_ENDPOINT = "/api/v1/creator-config";

export const creatorConfigApi = {
  async getConfig() {
    try {
      const response = await httpClient.get<CreatorConfigResponse>(
        CREATOR_CONFIG_ENDPOINT,
      );
      return response.data.data ?? null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  createConfig(payload: CreatorConfigRequest) {
    return unwrapBaseResponse<CreatorConfig>(
      httpClient.post<CreatorConfigMutationResponse>(
        CREATOR_CONFIG_ENDPOINT,
        payload,
      ),
    );
  },

  updateConfig(payload: CreatorConfigRequest) {
    return unwrapBaseResponse<CreatorConfig>(
      httpClient.put<CreatorConfigMutationResponse>(
        CREATOR_CONFIG_ENDPOINT,
        payload,
      ),
    );
  },
};
