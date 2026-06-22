import {
  httpClient,
  unwrapBaseResponse,
} from "@/shared/api/http-client";

export type CoinEconomyConfigRequest = {
  dailyCheckInBase: number;
  milestone7Reward: number;
  milestone14Reward: number;
  milestone30Reward: number;
};

export type CoinEconomyConfigResponse = CoinEconomyConfigRequest & {
  configId: string;
  createdAt: string;
  createdBy: string;
};

const CONFIG_ENDPOINT = "/api/v1/admin/coin/economy/config";

export const coinAdminApi = {
  getConfig(): Promise<CoinEconomyConfigResponse> {
    return unwrapBaseResponse<CoinEconomyConfigResponse>(
      httpClient.get(CONFIG_ENDPOINT),
    );
  },

  updateConfig(
    data: CoinEconomyConfigRequest,
  ): Promise<CoinEconomyConfigResponse> {
    return unwrapBaseResponse<CoinEconomyConfigResponse>(
      httpClient.put(CONFIG_ENDPOINT, data),
    );
  },
};
