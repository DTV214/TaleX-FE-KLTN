import type { BasePageResponse, BaseResponse } from "@/shared/api/http-client";

export type SubscriptionDurationUnit = "Days" | "Months" | "Years";

export type Subscription = {
  subscriptionId: string;
  tier: string;
  description: string;
  price: number;
  duration: number;
  durationUnit: string;
  isAdBlocked: boolean;
  isMovieUnlocked: boolean;
  isStoryUnlocked: boolean;
  totalPurchases: number;
  createdAt: string;
  updatedAt: string;
};

export type SubscriptionRequest = {
  tier: string;
  description: string;
  price: number;
  duration: number;
  durationUnit: SubscriptionDurationUnit;
};

export type CreateSubscriptionRequest = SubscriptionRequest;

export type UpdateSubscriptionRequest = SubscriptionRequest;

export type SubscriptionSortBy =
  | "price"
  | "duration"
  | "totalPurchases"
  | "createdAt"
  | "updatedAt";

export type SortDirection = "ASC" | "DESC";

export type SubscriptionFilterParams = {
  searchKey?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  durationUnits?: SubscriptionDurationUnit[];
  minTotalPurchases?: number;
  maxTotalPurchases?: number;
  isAdBlocked?: boolean;
  isMovieUnlocked?: boolean;
  isStoryUnlocked?: boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
  updatedAtFrom?: string;
  updatedAtTo?: string;
  page: number;
  pageSize: number;
  sortBy?: SubscriptionSortBy;
  sortDirection?: SortDirection;
};

export type SubscriptionListResponse = BaseResponse<
  BasePageResponse<Subscription>
>;

export type SubscriptionDetailResponse = BaseResponse<Subscription>;

export type SubscriptionMutationResponse = BaseResponse<Subscription>;

export type DeleteSubscriptionResponse = BaseResponse<null>;
