import type { BaseResponse } from "@/shared/api/http-client";

export type SettlementConfig = {
  id?: string;
  minBalanceThreshold: number;
  minPayoutThreshold: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type SettlementConfigRequest = {
  minBalanceThreshold: number;
  minPayoutThreshold: number;
};

export type SettlementConfigResponse = BaseResponse<SettlementConfig | null>;
export type SettlementConfigMutationResponse = BaseResponse<SettlementConfig>;
