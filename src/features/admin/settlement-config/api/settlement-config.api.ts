import axios from "axios";
import { httpClient, unwrapBaseResponse } from "@/shared/api/http-client";
import type {
  SettlementConfig,
  SettlementConfigMutationResponse,
  SettlementConfigRequest,
  SettlementConfigResponse,
} from "../types/settlement-config.types";

const SETTLEMENT_CONFIG_ENDPOINT = "/api/v1/settlement-config";

export const settlementConfigApi = {
  async getConfig() {
    try {
      const response = await httpClient.get<SettlementConfigResponse>(
        SETTLEMENT_CONFIG_ENDPOINT,
      );
      return response.data.data ?? null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  updateConfig(payload: SettlementConfigRequest) {
    return unwrapBaseResponse<SettlementConfig>(
      httpClient.put<SettlementConfigMutationResponse>(
        SETTLEMENT_CONFIG_ENDPOINT,
        payload,
      ),
    );
  },
};
