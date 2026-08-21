import { httpClient, unwrapBaseResponse } from "@/shared/api/http-client";

export type StatisticsOverview = {
  gmv: number;
  totalNetRevenue: number;
  totalVat: number;
  totalCoin: number;
};

export type StatisticsTrendItem = {
  period: string;
  gmv: number;
  netRevenue: number;
  vatAmount: number;
  totalCoin: number;
};

export type StatisticsData = {
  overview: StatisticsOverview;
  trends: StatisticsTrendItem[];
};

export type GetStatisticsParams = {
  startTime?: string;
  endTime?: string;
};

export type CampaignOverviewStatistics = {
  totalGrossRevenue: number;
  totalVatAmount: number;
  totalNetRevenue: number;
};

export type CampaignDetailItem = {
  period: string;
  grossRevenue: number;
  vatAmount: number;
  netRevenue: number;
  groupUnit: "HOUR" | "DAY" | "MONTH" | "YEAR" | string;
};

export type GetCampaignOverviewParams = {
  startTime: string;
  endTime: string;
};

export type SubscriptionOverviewStatistics = {
  totalGrossRevenue: number;
  totalVatAmount: number;
  totalNetRevenue: number;
};

export type SubscriptionDetailItem = {
  period: string;
  grossRevenue: number;
  vatAmount: number;
  netRevenue: number;
  groupUnit: "HOUR" | "DAY" | "MONTH" | "YEAR" | string;
};

export type GetSubscriptionOverviewParams = {
  startTime: string;
  endTime: string;
};

export type ContentOverviewStatistics = {
  totalGrossRevenue: number;
  totalVatAmount: number;
  totalCoinAmount: number;
  totalCreatorShareAmount: number;
  totalNetRevenue: number;
};

export type ContentDetailItem = {
  period: string;
  grossRevenue: number;
  vatAmount: number;
  coinAmount: number;
  creatorShareAmount: number;
  netRevenue: number;
  groupUnit: "HOUR" | "DAY" | "MONTH" | "YEAR" | string;
};

export type GetContentOverviewParams = {
  startTime: string;
  endTime: string;
};

export const adminStatisticsKeys = {
  all: ["admin-statistics"] as const,
  list: (params?: GetStatisticsParams) =>
    [...adminStatisticsKeys.all, params ?? {}] as const,
  campaignOverview: (params: GetCampaignOverviewParams) =>
    [...adminStatisticsKeys.all, "campaign-overview", params] as const,
  campaignDetails: (params: GetCampaignOverviewParams) =>
    [...adminStatisticsKeys.all, "campaign-details", params] as const,
  subscriptionOverview: (params: GetSubscriptionOverviewParams) =>
    [...adminStatisticsKeys.all, "subscription-overview", params] as const,
  subscriptionDetails: (params: GetSubscriptionOverviewParams) =>
    [...adminStatisticsKeys.all, "subscription-details", params] as const,
  contentOverview: (params: GetContentOverviewParams) =>
    [...adminStatisticsKeys.all, "content-overview", params] as const,
  contentDetails: (params: GetContentOverviewParams) =>
    [...adminStatisticsKeys.all, "content-details", params] as const,
};

export async function getAdminStatistics(
  params?: GetStatisticsParams,
): Promise<StatisticsData> {
  const queryParams: Record<string, string> = {};
  if (params?.startTime) queryParams.startTime = params.startTime;
  if (params?.endTime) queryParams.endTime = params.endTime;

  return unwrapBaseResponse<StatisticsData>(
    httpClient.get("/api/v1/statistics", { params: queryParams }),
  );
}

export async function getCampaignOverviewStatistics(
  params: GetCampaignOverviewParams,
): Promise<CampaignOverviewStatistics> {
  const queryParams: Record<string, string> = {
    startTime: params.startTime,
    endTime: params.endTime,
  };

  return unwrapBaseResponse<CampaignOverviewStatistics>(
    httpClient.get("/api/v1/statistics/campaign/overview", { params: queryParams }),
  );
}

export async function getCampaignDetailStatistics(
  params: GetCampaignOverviewParams,
): Promise<CampaignDetailItem[]> {
  const queryParams: Record<string, string> = {
    startTime: params.startTime,
    endTime: params.endTime,
  };

  return unwrapBaseResponse<CampaignDetailItem[]>(
    httpClient.get("/api/v1/statistics/campaign/details", { params: queryParams }),
  );
}

export async function getSubscriptionOverviewStatistics(
  params: GetSubscriptionOverviewParams,
): Promise<SubscriptionOverviewStatistics> {
  const queryParams: Record<string, string> = {
    startTime: params.startTime,
    endTime: params.endTime,
  };

  return unwrapBaseResponse<SubscriptionOverviewStatistics>(
    httpClient.get("/api/v1/statistics/subscription/overview", { params: queryParams }),
  );
}

export async function getSubscriptionDetailStatistics(
  params: GetSubscriptionOverviewParams,
): Promise<SubscriptionDetailItem[]> {
  const queryParams: Record<string, string> = {
    startTime: params.startTime,
    endTime: params.endTime,
  };

  return unwrapBaseResponse<SubscriptionDetailItem[]>(
    httpClient.get("/api/v1/statistics/subscription/details", { params: queryParams }),
  );
}

export async function getContentOverviewStatistics(
  params: GetContentOverviewParams,
): Promise<ContentOverviewStatistics> {
  const queryParams: Record<string, string> = {
    startTime: params.startTime,
    endTime: params.endTime,
  };

  return unwrapBaseResponse<ContentOverviewStatistics>(
    httpClient.get("/api/v1/statistics/content/overview", { params: queryParams }),
  );
}

export async function getContentDetailStatistics(
  params: GetContentOverviewParams,
): Promise<ContentDetailItem[]> {
  const queryParams: Record<string, string> = {
    startTime: params.startTime,
    endTime: params.endTime,
  };

  return unwrapBaseResponse<ContentDetailItem[]>(
    httpClient.get("/api/v1/statistics/content/details", { params: queryParams }),
  );
}




