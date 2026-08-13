import type { BasePageResponse, BaseResponse } from "@/shared/api/http-client";

export type SettlementStatus =
  | "CALCULATED"
  | "APPROVED"
  | "PAID"
  | "UNDER_REVIEW"
  | "FROZEN_PENALTY"
  | "FORFEITED";

export type RevenueTransactionType =
  | "PREMIUM_SHARE"
  | "WITHDRAWAL"
  | "PENALTY_DEDUCTION"
  | "ADJUSTMENT"
  | "CONTENT_SHARE";

export type PayoutStatus = "PENDING" | "SUCCESS" | "FAILED";

export type CreatorSettlementSummary = {
  creatorMonthlySettlementId: string;
  settlementMonth: string;
  cutoffDate?: string | null;
  grossAmount: number;
  totalPenaltyAmount: number;
  taxRate: number;
  taxWithheldAmount: number;
  netPayoutAmount: number;
  status: SettlementStatus;
  creatorId?: string | null;
  creatorName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CreatorSettlementDetail = CreatorSettlementSummary & {
  creatorDetail?: {
    creatorId?: string | null;
    isBanned?: boolean | null;
    taxId?: string | null;
    taxStatus?: string | null;
    accountId?: string | null;
    username?: string | null;
    email?: string | null;
    accountStatus?: string | null;
  } | null;
  revenueTransactions?: RevenueTransaction[];
  payoutTransactions?: PayoutTransaction[];
};

export type RevenueTransaction = {
  revenueTransactionId: string;
  amount: number;
  revenueTransactionType: RevenueTransactionType;
  description?: string | null;
  monthYear?: string | null;
  createdAt?: string | null;
};

export type PayoutTransaction = {
  payoutTransactionId: string;
  batchReferenceId?: string | null;
  transactionReferenceId?: string | null;
  gatewayBatchId?: string | null;
  payoutReference?: string | null;
  amount: number;
  status: PayoutStatus;
  failureReason?: string | null;
  paidAt?: string | null;
  toBin?: string | null;
  toAccountNumber?: string | null;
  toAccountName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type SettlementSortBy =
  | "createdAt"
  | "settlementMonth"
  | "grossAmount"
  | "netPayoutAmount"
  | "status"
  | "updatedAt";

export type SortDirection = "ASC" | "DESC";

export type SettlementSearchParams = {
  page?: number;
  pageSize?: number;
  statuses?: SettlementStatus[];
  settlementMonth?: string;
  creatorId?: string;
  settlementId?: string;
  creatorMonthlySettlementId?: string;
  netPayoutFrom?: number;
  netPayoutTo?: number;
  createdAtFrom?: string;
  createdAtTo?: string;
  updatedAtFrom?: string;
  updatedAtTo?: string;
  sortBy?: SettlementSortBy;
  sortDirection?: SortDirection;
};

export type UpdateSettlementStatusRequest = {
  status: SettlementStatus;
  note?: string;
};

export type RunSettlementProcessParams = {
  isDemo: boolean;
  targetMonth?: string;
};

export type CreatorSettlementPageResponse =
  BaseResponse<BasePageResponse<CreatorSettlementSummary>>;

export type CreatorSettlementDetailResponse =
  BaseResponse<CreatorSettlementDetail>;

export type CreatorSettlementMutationResponse =
  BaseResponse<CreatorSettlementDetail | CreatorSettlementSummary | string | null>;

export type RunSettlementProcessResponse =
  BaseResponse<CreatorSettlementSummary[] | null>;
