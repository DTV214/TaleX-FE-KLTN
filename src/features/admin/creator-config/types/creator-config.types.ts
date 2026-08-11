import type { BaseResponse } from "@/shared/api/http-client";

export type CreatorConfig = {
  id?: string;
  configId?: string;
  basePremiumShare: number;
  baseUnlockShare: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CreatorConfigRequest = {
  basePremiumShare: number;
  baseUnlockShare: number;
};

export type CreatorConfigResponse = BaseResponse<CreatorConfig | null>;
export type CreatorConfigMutationResponse = BaseResponse<CreatorConfig>;
