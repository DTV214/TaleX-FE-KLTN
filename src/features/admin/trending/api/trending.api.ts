import axios from "axios";
import { httpClient, unwrapBaseResponse } from "@/shared/api/http-client";
import type {
  ForceThresholdResponse,
  TrendingCandidateParams,
  TrendingConfig,
  TrendingConfigMutationResponse,
  TrendingConfigRequest,
  TrendingConfigResponse,
  TrendingEvaluatedParams,
  TrendingSeries,
  TrendingSeriesListResponse,
  TrendingSeriesPageResponse,
} from "../types/trending.types";

const TRENDING_CONFIGS_ENDPOINT = "/api/v1/trending-configs";
const TRENDING_DASHBOARD_ENDPOINT = "/api/v1/trending/dashboard";
const TRENDING_CHANNEL_CARDS_ENDPOINT = "/api/v1/trending/dashboard/trending-pool";
const CHANNEL_POOL_ENDPOINT = "/api/v1/channels/pool";

function unwrapSeriesListPayload(payload: unknown): TrendingSeries[] {
  if (Array.isArray(payload)) {
    return payload as TrendingSeries[];
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data?: unknown }).data;
    return Array.isArray(data) ? (data as TrendingSeries[]) : [];
  }

  return [];
}

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

  getEvaluatedSeries(params: TrendingEvaluatedParams) {
    return unwrapBaseResponse<TrendingSeriesPageResponse["data"]>(
      httpClient.get<TrendingSeriesPageResponse>(
        `${TRENDING_DASHBOARD_ENDPOINT}/evaluated-series`,
        { params },
      ),
    );
  },

  async getTrendingCards() {
    const response = await httpClient.get<
      TrendingSeriesListResponse | TrendingSeries[]
    >(TRENDING_CHANNEL_CARDS_ENDPOINT);

    return unwrapSeriesListPayload(response.data);
  },

  async triggerChannelsPool() {
    await httpClient.post(CHANNEL_POOL_ENDPOINT);
  },

  forceThreshold() {
    return unwrapBaseResponse<string | null>(
      httpClient.post<ForceThresholdResponse>(
        `${TRENDING_DASHBOARD_ENDPOINT}/force-threshold`,
      ),
    );
  },
};
