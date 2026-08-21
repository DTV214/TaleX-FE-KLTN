import type { BasePageResponse, BaseResponse } from "@/shared/api/http-client";

export type RevenueTransactionType =
  | "PREMIUM_SHARE"
  | "WITHDRAWAL"
  | "PENALTY_DEDUCTION"
  | "ADJUSTMENT"
  | "CONTENT_SHARE";

export type RevenueReferenceType =
  | "ORDER"
  | "SETTLEMENT"
  | "PREMIUM_RESULT"
  | "PENALTY"
  | string;

export type RevenueDateRangeParams = {
  startDate: string;
  endDate: string;
};

export type RevenueTransactionListParams = {
  page?: number;
  pageSize?: number;
};

export type RevenueSummary = {
  totalRevenueAmount: number;
  totalPenaltyAmount: number;
  totalAdjustmentAmount: number;
  amountByType: Partial<Record<RevenueTransactionType, number>>;
};

export type RevenueTimeSeriesPoint = {
  timePeriod: string;
  totalRevenueAmount: number;
  totalPenaltyAmount: number;
  totalAdjustmentAmount: number;
  groupUnit?: "HOUR" | "DAY" | "MONTH" | "YEAR" | string;
};

export type RevenueTransaction = {
  revenueTransactionId: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  revenueTransactionType: RevenueTransactionType;
  description?: string | null;
  createdAt?: string | null;
  monthYear?: string | null;
  referenceType?: RevenueReferenceType | null;
  referenceId?: string | null;
  creatorId?: string | null;
};

export type RevenueSummaryResponse = BaseResponse<RevenueSummary>;

export type RevenueTimeSeriesResponse = BaseResponse<RevenueTimeSeriesPoint[]>;

export type RevenueTransactionPageResponse =
  BaseResponse<BasePageResponse<RevenueTransaction>>;
