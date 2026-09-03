import {
  httpClient,
  unwrapBaseResponse,
  type BasePageResponse,
} from "@/shared/api/http-client";
import type {
  MonthYearParams,
  MonthlyAccountSubscription,
  MonthlyAccountSubscriptionPageResponse,
  PagedMonthYearParams,
  RuleXCalculationRequestDto,
  RuleXCalculationResponseDto,
  SubscriptionCalculationResponse,
  SubscriptionRevenueLog,
  SubscriptionRevenueLogPageResponse,
  SubscriptionResult,
  SubscriptionResultListResponse,
  SubscriptionStatsData,
  SubscriptionStatsResponse,
  SyncMetadata,
  SyncMetadataResponse,
} from "../types/subscription-revenue-sharing.types";

const SYNC_METADATA_ENDPOINT = "/api/v1/sync-metadata";
const SUBSCRIPTION_RESULTS_ENDPOINT = "/api/v1/subscription-results";
const SUBSCRIPTION_CALCULATION_ENDPOINT =
  "/api/v1/subscription-calculation-demo";
const ACCOUNT_SUBSCRIPTIONS_ENDPOINT = "/api/v1/account-subscriptions";
const SUBSCRIPTION_STAT_SYNC_TYPE = "SUBSCRIPTION_STAT";

function monthYearQuery(params: MonthYearParams) {
  return {
    year: params.year,
    month: params.month,
  };
}

function pagedMonthYearQuery(params: PagedMonthYearParams) {
  return {
    ...monthYearQuery(params),
    page: params.page,
    pageSize: params.pageSize,
  };
}

function formatMonthYear(params: MonthYearParams) {
  return `${params.year}-${String(params.month).padStart(2, "0")}`;
}

export const subscriptionRevenueSharingApi = {
  getSyncMetadata(syncType = SUBSCRIPTION_STAT_SYNC_TYPE) {
    return unwrapBaseResponse<SyncMetadata | null>(
      httpClient.get<SyncMetadataResponse>(
        `${SYNC_METADATA_ENDPOINT}/${syncType}`,
      ),
    );
  },

  getSubscriptionResults(params: MonthYearParams) {
    return unwrapBaseResponse<SubscriptionResult[]>(
      httpClient.get<SubscriptionResultListResponse>(
        `${SUBSCRIPTION_RESULTS_ENDPOINT}/by-month-year`,
        { params: monthYearQuery(params) },
      ),
    );
  },

  getRevenueLogs(subscriptionResultId: string, page = 1, pageSize = 20) {
    return unwrapBaseResponse<BasePageResponse<SubscriptionRevenueLog>>(
      httpClient.get<SubscriptionRevenueLogPageResponse>(
        `${SUBSCRIPTION_RESULTS_ENDPOINT}/${subscriptionResultId}/revenue-logs`,
        { params: { page, pageSize } },
      ),
    );
  },

  processStats(params: MonthYearParams) {
    return unwrapBaseResponse<string | null>(
      httpClient.post<BaseResponseString>(
        `${SUBSCRIPTION_CALCULATION_ENDPOINT}/process-stats`,
        null,
        { params: monthYearQuery(params) },
      ),
    );
  },

  getMonthlyAccountSubscriptions(params: PagedMonthYearParams) {
    return unwrapBaseResponse<BasePageResponse<MonthlyAccountSubscription>>(
      httpClient.get<MonthlyAccountSubscriptionPageResponse>(
        `${ACCOUNT_SUBSCRIPTIONS_ENDPOINT}/monthly`,
        { params: pagedMonthYearQuery(params) },
      ),
    );
  },

  getAccountSubscriptionStats(
    accountSubscriptionId: string,
    page = 1,
    pageSize = 20,
  ) {
    return unwrapBaseResponse<SubscriptionStatsData>(
      httpClient.get<SubscriptionStatsResponse>(
        `${ACCOUNT_SUBSCRIPTIONS_ENDPOINT}/${accountSubscriptionId}/stats`,
        { params: { page, pageSize } },
      ),
    );
  },

  calculateAndSave(params: MonthYearParams) {
    return unwrapBaseResponse<SubscriptionResult[] | SubscriptionResult | string | null>(
      httpClient.post<SubscriptionCalculationResponse>(
        `${SUBSCRIPTION_CALCULATION_ENDPOINT}/calculate-and-save`,
        null,
        {
          params: {
            monthYear: formatMonthYear(params),
            isDemo: true,
          },
        },
      ),
    );
  },

  exportRequestData(monthYear: string) {
    return unwrapBaseResponse<RuleXCalculationRequestDto[]>(
      httpClient.get(
        `${SUBSCRIPTION_CALCULATION_ENDPOINT}/export-request-data`,
        { params: { monthYear } },
      ),
    );
  },

  calculateRuleX(payload: RuleXCalculationRequestDto) {
    return unwrapBaseResponse<RuleXCalculationResponseDto>(
      httpClient.post(
        `${SUBSCRIPTION_CALCULATION_ENDPOINT}/calculate-rulex`,
        payload,
      ),
    );
  },
};

type BaseResponseString = {
  code: number;
  message: string;
  data: string | null;
};
