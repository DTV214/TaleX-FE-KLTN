import type { BasePageResponse, BaseResponse } from "@/shared/api/http-client";

export type TrendingConfig = {
  configId?: string;
  totalBatch?: number;
  minBatch: number;
  threshold?: number;
  currentBatch?: number;
  percentile: number;
  minImpression: number;
  maxImpression: number;
  updatedAt?: string | null;
  gravity: number;
};

export type TrendingConfigRequest = {
  minBatch: number;
  percentile: number;
  minImpression: number;
  maxImpression: number;
  gravity: number;
};

export type TrendingCandidateParams = {
  page: number;
  size: number;
};

export type TrendingEvaluationStatus = "ON_GOING" | "SUCCESS" | "FAILED";

export type TrendingEvaluatedParams = {
  page: number;
  size: number;
  statuses?: TrendingEvaluationStatus[];
};

export type TrendingAnalyticData = {
  totalImpression: number;
  engageClick: number;
  interactionClick: number;
  sampleRatio: number;
  wilsonScore: number;
  rankingScore: number;
  impressionStatus?: string | null;
  wilsonUpdatedAt?: string | null;
};

export type SeriesAnalyticData = {
  likes: number;
  views: number;
  comments: number;
  shares: number;
  bookmarks: number;
  watchTime: number;
};

export type TrendingSeries = {
  seriesId: string;
  title: string;
  accountId?: string | null;
  creatorId?: string | null;
  creatorName?: string | null;
  creatorAvatar?: string | null;
  totalCreatorFollowers?: number | null;
  description?: string | null;
  coverUrl?: string | null;
  bannerUrl?: string | null;
  contentType?: string | null;
  ageRating?: string | null;
  language?: string | null;
  totalViews?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  releasedUpdateTime?: string | null;
  trendingAnalyticData?: Partial<TrendingAnalyticData> | null;
  analyticData?: Partial<SeriesAnalyticData> | null;
  totalRating?: number | null;
  ratingCount?: number | null;
  averageRating?: number | null;
  wilsonScore?: number | null;
  upperWilsonScore?: number | null;
  rankingScore?: number | null;
};

export type TrendingConfigResponse = BaseResponse<TrendingConfig | null>;
export type TrendingConfigMutationResponse = BaseResponse<TrendingConfig>;
export type TrendingSeriesListResponse = BaseResponse<TrendingSeries[]>;
export type TrendingSeriesPageResponse = BaseResponse<BasePageResponse<TrendingSeries>>;
export type ForceThresholdResponse = BaseResponse<string | null>;
