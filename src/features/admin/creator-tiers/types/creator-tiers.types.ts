import type { BasePageResponse, BaseResponse } from "@/shared/api/http-client";

export type CreatorTier = {
  creatorTierId: string;
  tierName: string;
  tierLevel: number;
  minFollowerRequired: number;
  minViewsRequired: number;
  minWatchTimeRequired: number;
  premiumFundShareRatio: number;
  directPurchaseShareRatio: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreatorTierRequest = {
  tierName: string;
  tierLevel: number;
  minFollowerRequired: number;
  minViewsRequired: number;
  minWatchTimeRequired: number;
  premiumFundShareRatio: number;
  directPurchaseShareRatio: number;
  isDefault: boolean;
};

export type CreateCreatorTierRequest = CreatorTierRequest;

export type UpdateCreatorTierRequest = CreatorTierRequest;

export type CreatorTierSortBy =
  | "tierName"
  | "tierLevel"
  | "isDefault"
  | "createdAt"
  | "updatedAt";

export type SortDirection = "ASC" | "DESC";

export type CreatorTierFilterParams = {
  tierName?: string;
  tierLevel?: number;
  isDefault?: boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
  updatedAtFrom?: string;
  updatedAtTo?: string;
  page: number;
  pageSize: number;
  sortBy?: CreatorTierSortBy;
  sortDirection?: SortDirection;
};

export type CreatorTierListResponse = BaseResponse<
  BasePageResponse<CreatorTier>
>;

export type CreatorTierDetailResponse = BaseResponse<CreatorTier>;

export type CreatorTierMutationResponse = BaseResponse<CreatorTier>;

export type DeleteCreatorTierResponse = BaseResponse<null>;
