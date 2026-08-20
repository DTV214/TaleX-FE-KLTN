import type { BasePageResponse, BaseResponse } from "@/shared/api/http-client";
import type {
    SeriesResponse,
    SeriesStatus,
} from "@/features/creator-dashboard/api/creator-content-api";
import type { OrderResponse } from "@/features/payment/types/payment.types";

export type CreatorCampaignService = {
    engagementServiceId: string;
    name: string;
    description: string;
    price: number;
    targetValue: number;
    isActive: boolean;
};

export type CreatorCampaignServiceFilterParams = {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDirection?: "ASC" | "DESC";
};

export type CreatorCampaignServicePageResponse = BasePageResponse<CreatorCampaignService>;

export type CreatorCampaignServiceListResponse = BaseResponse<CreatorCampaignServicePageResponse>;

export type CreatorCampaignSeriesFilterParams = {
    statuses?: SeriesStatus[];
    page?: number;
    pageSize?: number;
};

export type CreatorCampaignSeriesPageResponse = BasePageResponse<SeriesResponse>;

export type CreatorCampaignSeriesStatus =
    | "RUNNING"
    | "PAUSED"
    | "COMPLETED"
    | "CANCELLED"
    | "UNAVAILABLE"
    | string;

export type CampaignSeriesAnalyticData = {
    likes?: number;
    views?: number;
    comments?: number;
    shares?: number;
    bookmarks?: number;
    watchTime?: number;
    [key: string]: unknown;
};

export type CreatorCampaignSeries = {
    campaignSeriesId: string;
    campaignId: string;
    seriesId: string;
    status?: CreatorCampaignSeriesStatus | null;
    analyticData?: CampaignSeriesAnalyticData | null;
    totalImpression?: number | null;
};

export type CreatorCampaignSeriesListResponse = BaseResponse<CreatorCampaignSeries[]>;
export type CreatorCampaignSeriesSingleResponse = BaseResponse<CreatorCampaignSeries>;

export type CreatorCampaignSeriesLog = {
    campaignSeriesLogId: string;
    campaignSeriesId: string;
    hourBucket: string;
    analyticData?: CampaignSeriesAnalyticData | null;
    totalImpression?: number | null;
};

export type CreatorCampaignSeriesLogParams = {
    startTime: string;
    endTime: string;
};

export type CreatorCampaignSeriesLogListResponse =
    BaseResponse<CreatorCampaignSeriesLog[]>;

export type CreateEngagementOrderRequest = {
    engagementServiceId: string;
    seriesIds: string[];
    useCampaignWallet?: boolean;
};

export type CreateEngagementOrderResponse = BaseResponse<OrderResponse>;

export type CreatorCampaignStatus =
    | "RUNNING"
    | "PAUSED"
    | "COMPLETED"
    | "CANCELLED"
    | "UNAVAILABLE"
    | "PENDING"
    | "ACTIVE"
    | "FAILED"
    | string;

export type CreatorCampaignSortBy =
    | "startAt"
    | "endAt"
    | "currentImpression"
    | "targetImpression"
    | "createdAt"
    | "updatedAt";

export type CreatorCampaign = {
    campaignId: string;
    engagementServiceId?: string | null;
    orderId?: string | null;
    status?: CreatorCampaignStatus | null;
    startAt?: string | null;
    endAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    targetImpression?: number | null;
    currentImpression?: number | null;
    analyticData?: Record<string, unknown> | null;
};

export type CreatorCampaignFilterFields = {
    startAtFrom?: string;
    startAtTo?: string;
    endAtFrom?: string;
    endAtTo?: string;
    targetValueFrom?: string;
    targetValueTo?: string;
    currentValueFrom?: string;
    currentValueTo?: string;
    engagementServiceId?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
    updatedAtFrom?: string;
    updatedAtTo?: string;
};

export type CreatorCampaignFilterParams = {
    sortBy?: CreatorCampaignSortBy;
    sortDirection?: "ASC" | "DESC";
    page?: number;
    pageSize?: number;
    filters?: CreatorCampaignFilterFields;
};

export type CreatorCampaignPageResponse = BasePageResponse<CreatorCampaign>;

export type CreatorCampaignListResponse = BaseResponse<CreatorCampaignPageResponse>;

export type CreatorCampaignDetailResponse = BaseResponse<CreatorCampaign>;

export type CampaignWallet = {
  walletId: string;
  balance: number;
  updatedAt?: string | null;
};

export type CampaignWalletBalanceResponse = BaseResponse<CampaignWallet | null>;

export type CampaignWalletTransactionType =
  | "REFUND"
  | "DEPOSIT"
  | "WITHDRAW"
  | "PAYMENT"
  | string;

export type CampaignWalletTransaction = {
  transactionId: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  transactionType?: CampaignWalletTransactionType | null;
  referenceType?: string | null;
  referenceId?: string | null;
  description?: string | null;
  createdAt: string;
};

export type CampaignWalletHistoryFilterParams = {
  page?: number;
  pageSize?: number;
};

export type CampaignWalletHistoryPageResponse =
  BasePageResponse<CampaignWalletTransaction>;

export type CampaignWalletHistoryListResponse =
  BaseResponse<CampaignWalletHistoryPageResponse>;

export type ReferenceTransactionType =
  | "ORDER"
  | "SETTLEMENT"
  | "PREMIUM_RESULT"
  | "PENALTY"
  | string;

export type PaymentTransactionStatus = "SUCCESS" | "PENDING" | "FAILED" | string;

export type ReferenceTransaction = {
  transactionId: string;
  paidAmount: number;
  paymentMethod: string;
  status: PaymentTransactionStatus;
  referenceType: ReferenceTransactionType;
  referenceId: string;
  createdAt: string;
  updatedAt: string;
};

export type GetTransactionsByReferenceResponse = BaseResponse<ReferenceTransaction[]>;

export type OrderWalletTransactionsResponse = BaseResponse<CampaignWalletTransaction[]>;

export type PayoutRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "PAID"
  | string;

export type ProcessPayoutRequestRequest = {
  status: "APPROVED" | "REJECTED";
  adminNote?: string;
};

export type PayoutRequest = {
  payoutRequestId: string;
  accountId: string;
  amount: number;
  status: PayoutRequestStatus;
  paymentProfileId?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  adminNote?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type PayoutRequestFilterParams = {
  page?: number;
  pageSize?: number;
  status?: PayoutRequestStatus | "";
  accountId?: string;
  fromDate?: string;
  toDate?: string;
};

export type PayoutRequestSingleResponse = BaseResponse<PayoutRequest>;

export type PayoutRequestPageResponse = BasePageResponse<PayoutRequest>;

export type PayoutRequestListResponse = BaseResponse<PayoutRequestPageResponse>;

export type WalletPayoutTransaction = {
  walletPayoutTransactionId: string;
  batchReferenceId?: string | null;
  transactionReferenceId?: string | null;
  gatewayBatchId?: string | null;
  payoutReference?: string | null;
  amount: number;
  status: string;
  failureReason?: string | null;
  paidAt?: string | null;
  toBin?: string | null;
  toAccountNumber?: string | null;
  toAccountName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type WalletPayoutTransactionsResponse = BaseResponse<WalletPayoutTransaction[]>;




