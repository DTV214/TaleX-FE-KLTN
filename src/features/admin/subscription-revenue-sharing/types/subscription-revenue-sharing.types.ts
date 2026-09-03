import type { BasePageResponse, BaseResponse } from "@/shared/api/http-client";

export type MonthYearParams = {
  year: number;
  month: number;
};

export type PagedMonthYearParams = MonthYearParams & {
  page: number;
  pageSize: number;
};

export type SubscriptionResult = {
  id: string | null;
  alpha: number;
  gamma: number;
  subscriptionFee: number;
  totalBudget: number;
  targetBudget: number;
  calculatedBudget: number;
  monthYear: string;
  revenueLogs?: SubscriptionRevenueLog[];
};

export type MonthlyAccountSubscription = {
  accountSubscriptionId: string;
  subscriptionId: string;
  orderId: string | null;
  totalAmount: number;
  vatAmount: number;
  amount: number;
  accountId: string;
  username: string;
  email: string;
  startTime: string;
  endTime: string;
  totalViews: number;
  isHasStat: boolean;
};

export type SyncMetadata = {
  id?: string | null;
  syncType?: string | null;
  lastSyncAt?: string | null;
  lastSyncedAt?: string | null;
  lastSyncTime?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  status?: string | null;
  message?: string | null;
  [key: string]: unknown;
};

export type SubscriptionRevenueLog = {
  id?: string | null;
  subscriptionRevenueLogId?: string | null;
  creatorId?: string | null;
  creatorName?: string | null;
  creatorUsername?: string | null;
  creatorEmail?: string | null;
  email?: string | null;
  seriesId?: string | null;
  seriesTitle?: string | null;
  episodeId?: string | null;
  episodeTitle?: string | null;
  totalViews?: number | null;
  views?: number | null;
  watchCount?: number | null;
  score?: number | null;
  weight?: number | null;
  shareRatio?: number | null;
  amount?: number | null;
  revenueAmount?: number | null;
  creatorShareAmount?: number | null;
  createdAt?: string | null;
  [key: string]: unknown;
};

export type SubscriptionStatItem = {
  id?: string | null;
  subscriptionStatId?: string | null;
  accountSubscriptionId?: string | null;
  creatorId?: string | null;
  creatorName?: string | null;
  creatorUsername?: string | null;
  creatorEmail?: string | null;
  email?: string | null;
  seriesId?: string | null;
  seriesTitle?: string | null;
  episodeId?: string | null;
  episodeTitle?: string | null;
  mediaId?: string | null;
  mediaTitle?: string | null;
  totalViews?: number | null;
  views?: number | null;
  watchCount?: number | null;
  watchSeconds?: number | null;
  durationSeconds?: number | null;
  createdAt?: string | null;
  [key: string]: unknown;
};

export type SubscriptionStatsData =
  | SubscriptionStatItem[]
  | BasePageResponse<SubscriptionStatItem>;

export type SubscriptionResultListResponse =
  BaseResponse<SubscriptionResult[]>;

export type MonthlyAccountSubscriptionPageResponse = BaseResponse<
  BasePageResponse<MonthlyAccountSubscription>
>;

export type SubscriptionRevenueLogPageResponse = BaseResponse<
  BasePageResponse<SubscriptionRevenueLog>
>;

export type SubscriptionStatsResponse = BaseResponse<SubscriptionStatsData>;

export type SyncMetadataResponse = BaseResponse<SyncMetadata | null>;

export type SubscriptionCalculationResponse = BaseResponse<
  SubscriptionResult[] | SubscriptionResult | string | null
>;

export type ArtistEpisodeStreams = Record<string, Record<string, number>>;

export type UserStreamRequest = {
  userId: string;
  artistEpisodeStreams: ArtistEpisodeStreams;
};

export type RuleXCalculationRequestDto = {
  alpha: number;
  subscriptionFee: number;
  users: UserStreamRequest[];
};

export type UserAllocationResponse = {
  userId: string;
  totalStreams: number;
  artistPayouts: Record<string, number>;
  episodePayouts: Record<string, Record<string, number>>;
  effectiveWeight: number;
  perStreamWeight: number;
  allocatedAmount: number;
};

export type RuleXCalculationResponseDto = {
  episodePayouts: Record<string, number>;
  gamma: number;
  totalBudget: number;
  targetBudget: number;
  calculatedBudget: number;
  artistPayouts: Record<string, number>;
  userAllocations: UserAllocationResponse[];
};

