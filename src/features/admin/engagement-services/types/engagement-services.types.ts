import type { BasePageResponse, BaseResponse } from "@/shared/api/http-client";

export type EngagementType = "BROAD" | "TARGETED";

export type EngagementTarget = "VIEW" | "FOLLOW" | "LIKE";

export type SortDirection = "ASC" | "DESC";

export type EngagementServiceSortBy =
  | "name"
  | "engagementType"
  | "engagementTarget"
  | "price"
  | "targetValue"
  | "isActive"
  | "createdAt"
  | "updatedAt";

export type EngagementService = {
  engagementServiceId: string;
  name: string;
  description: string;
  engagementType: EngagementType;
  engagementTarget: EngagementTarget;
  price: number;
  targetValue: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EngagementServiceRequest = {
  name: string;
  description: string;
  engagementType: EngagementType;
  engagementTarget: EngagementTarget;
  price: number;
  targetValue: number;
  isActive: boolean;
};

export type EngagementServiceSearchCriteria = {
  searchKey?: string;
  isActive?: boolean;
  priceFrom?: number;
  priceTo?: number;
  targetValueFrom?: number;
  targetValueTo?: number;
  createdAtFrom?: string;
  createdAtTo?: string;
  updatedAtFrom?: string;
  updatedAtTo?: string;
};

export type EngagementServiceFilterParams = {
  page: number;
  pageSize: number;
  sortBy?: EngagementServiceSortBy;
  sortDirection?: SortDirection;
  types?: EngagementType[];
  targets?: EngagementTarget[];
  criteria?: EngagementServiceSearchCriteria;
};

export type EngagementServiceListResponse = BaseResponse<
  BasePageResponse<EngagementService>
>;

export type EngagementServiceDetailResponse =
  BaseResponse<EngagementService>;

export type EngagementServiceMutationResponse =
  BaseResponse<EngagementService>;

export type DeleteEngagementServiceResponse = BaseResponse<null>;
