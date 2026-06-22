import {
  httpClient,
  unwrapBaseResponse,
  type BasePageResponse,
} from "@/shared/api/http-client";
import type {
  CoinTransaction,
  CoinWallet,
  DailyCheckInResponse,
  DailyCheckInStatus,
} from "./coin.dto";

export const coinApi = {
  getWallet(): Promise<CoinWallet> {
    return unwrapBaseResponse<CoinWallet>(
      httpClient.get("/api/v1/coins/wallet"),
    );
  },

  getTransactionHistory(
    page: number,
    size: number,
  ): Promise<BasePageResponse<CoinTransaction>> {
    return unwrapBaseResponse<BasePageResponse<CoinTransaction>>(
      httpClient.get("/api/v1/coins/transactions", {
        params: { page, size },
      }),
    );
  },

  getCheckInStatus(): Promise<DailyCheckInStatus> {
    return unwrapBaseResponse<DailyCheckInStatus>(
      httpClient.get("/api/v1/check-in/status"),
    );
  },

  performCheckIn(): Promise<DailyCheckInResponse> {
    return unwrapBaseResponse<DailyCheckInResponse>(
      httpClient.post("/api/v1/check-in"),
    );
  },
};
