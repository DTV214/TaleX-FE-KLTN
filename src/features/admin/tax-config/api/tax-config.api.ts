import axios from "axios";
import { httpClient, unwrapBaseResponse } from "@/shared/api/http-client";
import type {
  TaxConfig,
  TaxConfigMutationResponse,
  TaxConfigRequest,
  TaxConfigResponse,
} from "../types/tax-config.types";

const TAX_CONFIG_ENDPOINT = "/api/v1/tax-config";

export const taxConfigApi = {
  async getConfig() {
    try {
      const response = await httpClient.get<TaxConfigResponse>(
        TAX_CONFIG_ENDPOINT,
      );
      return response.data.data ?? null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  createConfig(payload: TaxConfigRequest) {
    return unwrapBaseResponse<TaxConfig>(
      httpClient.post<TaxConfigMutationResponse>(TAX_CONFIG_ENDPOINT, payload),
    );
  },

  updateConfig(payload: TaxConfigRequest) {
    return unwrapBaseResponse<TaxConfig>(
      httpClient.put<TaxConfigMutationResponse>(TAX_CONFIG_ENDPOINT, payload),
    );
  },
};
