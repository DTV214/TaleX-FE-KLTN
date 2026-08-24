import type { BaseResponse } from "@/shared/api/http-client";

export type TaxConfig = {
  id?: string;
  vat: number;
  pit: number;
  minPitAmount: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type TaxConfigRequest = {
  vat: number;
  pit: number;
  minPitAmount: number;
};

export type TaxConfigResponse = BaseResponse<TaxConfig | null>;
export type TaxConfigMutationResponse = BaseResponse<TaxConfig>;


