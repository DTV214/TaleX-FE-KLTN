import {
  httpClient,
  unwrapBaseResponse,
  type BasePageResponse,
} from "@/shared/api/http-client";
import type {
  CreatorSettlementDetail,
  CreatorSettlementDetailResponse,
  CreatorSettlementMutationResponse,
  CreatorSettlementPageResponse,
  CreatorSettlementSummary,
  RunSettlementProcessParams,
  RunSettlementProcessResponse,
  SettlementSearchParams,
  UpdateSettlementStatusRequest,
} from "../types/creator-settlements.types";

const CREATOR_SETTLEMENT_ENDPOINT = "/api/v1/creator-settlement";

function appendIfPresent(
  params: URLSearchParams,
  key: string,
  value?: string | number | null,
) {
  if (value === undefined || value === null || value === "") return;
  params.set(key, String(value));
}

function buildSettlementSearchParams(params: SettlementSearchParams = {}) {
  const searchParams = new URLSearchParams();

  appendIfPresent(searchParams, "page", params.page ?? 1);
  appendIfPresent(searchParams, "pageSize", params.pageSize ?? 20);

  params.statuses?.forEach((status) => {
    searchParams.append("statuses", status);
  });

  appendIfPresent(searchParams, "settlementMonth", params.settlementMonth);
  appendIfPresent(searchParams, "creatorId", params.creatorId);
  appendIfPresent(searchParams, "settlementId", params.settlementId);
  appendIfPresent(
    searchParams,
    "creatorMonthlySettlementId",
    params.creatorMonthlySettlementId,
  );
  appendIfPresent(searchParams, "netPayoutFrom", params.netPayoutFrom);
  appendIfPresent(searchParams, "netPayoutTo", params.netPayoutTo);
  appendIfPresent(searchParams, "createdAtFrom", params.createdAtFrom);
  appendIfPresent(searchParams, "createdAtTo", params.createdAtTo);
  appendIfPresent(searchParams, "updatedAtFrom", params.updatedAtFrom);
  appendIfPresent(searchParams, "updatedAtTo", params.updatedAtTo);
  appendIfPresent(searchParams, "sortBy", params.sortBy);
  appendIfPresent(searchParams, "sortDirection", params.sortDirection);

  return searchParams;
}

export const creatorSettlementsApi = {
  search(params: SettlementSearchParams = {}) {
    return unwrapBaseResponse<BasePageResponse<CreatorSettlementSummary>>(
      httpClient.get<CreatorSettlementPageResponse>(
        `${CREATOR_SETTLEMENT_ENDPOINT}/search`,
        {
          params: buildSettlementSearchParams(params),
        },
      ),
    );
  },

  own(params: SettlementSearchParams = {}) {
    const safeParams = { ...params };
    delete safeParams.creatorId;

    return unwrapBaseResponse<BasePageResponse<CreatorSettlementSummary>>(
      httpClient.get<CreatorSettlementPageResponse>(
        `${CREATOR_SETTLEMENT_ENDPOINT}/own`,
        {
          params: buildSettlementSearchParams(safeParams),
        },
      ),
    );
  },

  detail(settlementId: string) {
    return unwrapBaseResponse<CreatorSettlementDetail>(
      httpClient.get<CreatorSettlementDetailResponse>(
        `${CREATOR_SETTLEMENT_ENDPOINT}/${settlementId}`,
      ),
    );
  },

  updateStatus(settlementId: string, payload: UpdateSettlementStatusRequest) {
    return unwrapBaseResponse<CreatorSettlementDetail | CreatorSettlementSummary | string | null>(
      httpClient.patch<CreatorSettlementMutationResponse>(
        `${CREATOR_SETTLEMENT_ENDPOINT}/${settlementId}/status`,
        payload,
      ),
    );
  },

  runProcess(params: RunSettlementProcessParams) {
    const searchParams = new URLSearchParams();
    appendIfPresent(searchParams, "isDemo", String(params.isDemo));
    appendIfPresent(searchParams, "targetMonth", params.targetMonth);

    return unwrapBaseResponse<CreatorSettlementSummary[] | null>(
      httpClient.post<RunSettlementProcessResponse>(
        `${CREATOR_SETTLEMENT_ENDPOINT}/demo-process`,
        null,
        { params: searchParams },
      ),
    );
  },
};
