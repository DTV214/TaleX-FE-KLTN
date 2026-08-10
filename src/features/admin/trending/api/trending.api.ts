import axios from "axios";
import { httpClient, unwrapBaseResponse } from "@/shared/api/http-client";
import type {
  ForceThresholdResponse,
  TrendingCandidateParams,
  TrendingConfig,
  TrendingConfigMutationResponse,
  TrendingConfigRequest,
  TrendingConfigResponse,
  TrendingSeries,
  TrendingSeriesListResponse,
} from "../types/trending.types";

const TRENDING_CONFIGS_ENDPOINT = "/api/v1/trending-configs";
const TRENDING_DASHBOARD_ENDPOINT = "/api/v1/trending/dashboard";

export const adminTrendingApi = {
  async getConfig() {
    try {
      const response = await httpClient.get<TrendingConfigResponse>(
        TRENDING_CONFIGS_ENDPOINT,
      );
      return response.data.data ?? null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  createConfig(payload: TrendingConfigRequest) {
    return unwrapBaseResponse<TrendingConfig>(
      httpClient.post<TrendingConfigMutationResponse>(
        TRENDING_CONFIGS_ENDPOINT,
        payload,
      ),
    );
  },

  updateConfig(payload: TrendingConfigRequest) {
    return unwrapBaseResponse<TrendingConfig>(
      httpClient.put<TrendingConfigMutationResponse>(
        TRENDING_CONFIGS_ENDPOINT,
        payload,
      ),
    );
  },

  getCandidateNewReleases(params: TrendingCandidateParams) {
    return unwrapBaseResponse<TrendingSeries[]>(
      httpClient.get<TrendingSeriesListResponse>(
        `${TRENDING_DASHBOARD_ENDPOINT}/candidate-new-releases`,
        { params },
      ),
    );
  },

  getNewReleasesPool() {
    return unwrapBaseResponse<TrendingSeries[]>(
      httpClient.get<TrendingSeriesListResponse>(
        `${TRENDING_DASHBOARD_ENDPOINT}/new-releases-pool`,
      ),
    );
  },

  forceThreshold() {
    return unwrapBaseResponse<string | null>(
      httpClient.post<ForceThresholdResponse>(
        `${TRENDING_DASHBOARD_ENDPOINT}/force-threshold`,
      ),
    );
  },
};
