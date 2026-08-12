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

export const adminStatisticsKeys = {
  all: ["admin-statistics"] as const,
  list: (params?: GetStatisticsParams) =>
    [...adminStatisticsKeys.all, params ?? {}] as const,
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
