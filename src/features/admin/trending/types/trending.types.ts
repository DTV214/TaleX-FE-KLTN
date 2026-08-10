import type { BaseResponse } from "@/shared/api/http-client";

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
  coverUrl?: string | null;
  bannerUrl?: string | null;
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
export type ForceThresholdResponse = BaseResponse<string | null>;
