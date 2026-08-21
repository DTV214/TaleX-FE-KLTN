import {
  httpClient,
  unwrapBaseResponse,
  type BasePageResponse,
} from "@/shared/api/http-client";
import type {
  RevenueDateRangeParams,
  RevenueSummary,
  RevenueSummaryResponse,
  RevenueTimeSeriesPoint,
  RevenueTimeSeriesResponse,
  RevenueTransaction,
  RevenueTransactionListParams,
  RevenueTransactionPageResponse,
} from "../types/revenue-transactions.types";

const REVENUE_TRANSACTIONS_ENDPOINT = "/api/v1/revenue-transactions";

function buildDateRangeParams(params: RevenueDateRangeParams) {
  const searchParams = new URLSearchParams();
  searchParams.set("startDate", params.startDate);
  searchParams.set("endDate", params.endDate);
  return searchParams;
}

function buildListParams(params: RevenueTransactionListParams = {}) {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("pageSize", String(params.pageSize ?? 20));
  return searchParams;
}

export const revenueTransactionsApi = {
  summary(params: RevenueDateRangeParams) {
    return unwrapBaseResponse<RevenueSummary>(
      httpClient.get<RevenueSummaryResponse>(
        `${REVENUE_TRANSACTIONS_ENDPOINT}/summary`,
        { params: buildDateRangeParams(params) },
      ),
    );
  },

  timeSeries(params: RevenueDateRangeParams) {
    return unwrapBaseResponse<RevenueTimeSeriesPoint[]>(
      httpClient.get<RevenueTimeSeriesResponse>(
        `${REVENUE_TRANSACTIONS_ENDPOINT}/time-series`,
        { params: buildDateRangeParams(params) },
      ),
    );
  },

  list(params: RevenueTransactionListParams = {}) {
    return unwrapBaseResponse<BasePageResponse<RevenueTransaction>>(
      httpClient.get<RevenueTransactionPageResponse>(
        REVENUE_TRANSACTIONS_ENDPOINT,
        { params: buildListParams(params) },
      ),
    );
  },
};
