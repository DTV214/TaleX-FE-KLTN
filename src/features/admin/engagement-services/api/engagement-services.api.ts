import { httpClient } from "@/shared/api/http-client";
import type {
  DeleteEngagementServiceResponse,
  EngagementServiceDetailResponse,
  EngagementServiceFilterParams,
  EngagementServiceListResponse,
  EngagementServiceMutationResponse,
  EngagementServiceRequest,
} from "../types/engagement-services.types";

type QsStringifyOptions = {
  arrayFormat: "repeat";
  encodeValuesOnly: boolean;
  skipNulls: boolean;
};

type QsModule = {
  stringify(params: unknown, options: QsStringifyOptions): string;
};

// qs is required here because Spring Boot expects repeated array keys and
// bracketed nested criteria keys: types=BROAD&criteria[searchKey]=abc.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const qs = require("qs") as QsModule;

const ENGAGEMENT_SERVICES_ENDPOINT = "/api/v1/engagement-services";
const ENGAGEMENT_SERVICES_SEARCH_ENDPOINT = `${ENGAGEMENT_SERVICES_ENDPOINT}/search`;

function serializeEngagementServiceParams(
  params: Record<string, unknown>,
) {
  return qs.stringify(params, {
    arrayFormat: "repeat",
    encodeValuesOnly: true,
    skipNulls: true,
  });
}

export const engagementServicesApi = {
  async getEngagementServices(
    params: EngagementServiceFilterParams,
  ): Promise<EngagementServiceListResponse> {
    const response = await httpClient.get<EngagementServiceListResponse>(
      ENGAGEMENT_SERVICES_SEARCH_ENDPOINT,
      {
        params,
        paramsSerializer: {
          serialize: serializeEngagementServiceParams,
        },
      },
    );

    return response.data;
  },

  async getEngagementServiceById(
    engagementServiceId: string,
  ): Promise<EngagementServiceDetailResponse> {
    const response = await httpClient.get<EngagementServiceDetailResponse>(
      `${ENGAGEMENT_SERVICES_ENDPOINT}/${engagementServiceId}`,
    );

    return response.data;
  },

  async createEngagementService(
    payload: EngagementServiceRequest,
  ): Promise<EngagementServiceMutationResponse> {
    const response = await httpClient.post<EngagementServiceMutationResponse>(
      ENGAGEMENT_SERVICES_ENDPOINT,
      payload,
    );

    return response.data;
  },

  async updateEngagementService(
    engagementServiceId: string,
    payload: EngagementServiceRequest,
  ): Promise<EngagementServiceMutationResponse> {
    const response = await httpClient.put<EngagementServiceMutationResponse>(
      `${ENGAGEMENT_SERVICES_ENDPOINT}/${engagementServiceId}`,
      payload,
    );

    return response.data;
  },

  async deleteEngagementService(
    engagementServiceId: string,
  ): Promise<DeleteEngagementServiceResponse> {
    const response = await httpClient.delete<DeleteEngagementServiceResponse>(
      `${ENGAGEMENT_SERVICES_ENDPOINT}/${engagementServiceId}`,
    );

    return response.data;
  },
};
