import {
  httpClient,
  unwrapBaseResponse,
  type BasePageResponse,
  type BaseResponse,
} from "@/shared/api/http-client";
import type {
  CreatorSettlementDetail,
  CreatorSettlementDetailResponse,
  CreatorPaymentProfile,
  CreatorPaymentProfileResponse,
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

  primaryPaymentProfile(creatorId: string) {
    return unwrapBaseResponse<CreatorPaymentProfile | null>(
      httpClient.get<CreatorPaymentProfileResponse>(
        `/api/v1/payment-profiles/${creatorId}/primary`,
      ),
    );
  },

  runSinglePayout(settlementId: string) {
    return unwrapBaseResponse<unknown>(
      httpClient.post<BaseResponse<unknown>>(
        `/api/v1/creator-payout/single-request/${settlementId}`,
        null,
        { params: { isDemo: false } },
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

  async exportTaxCertificate(params?: {
    taxYear?: number;
    year?: number;
    settlementMonth?: string;
    settlementId?: string;
  }): Promise<Blob> {
    const queryParams: Record<string, string | number> = {};
    if (params?.taxYear !== undefined) queryParams.taxYear = params.taxYear;
    if (params?.year !== undefined) queryParams.year = params.year;
    if (params?.settlementMonth) queryParams.settlementMonth = params.settlementMonth;
    if (params?.settlementId) queryParams.settlementId = params.settlementId;

    const response = await httpClient.get("/api/v1/creator/tax/export-certificate", {
      params: queryParams,
      responseType: "blob",
    });
    return response.data;
  },
};

export async function exportCreatorTaxCertificate(params?: {
  taxYear?: number;
  year?: number;
  settlementMonth?: string;
  settlementId?: string;
}): Promise<Blob> {
  return creatorSettlementsApi.exportTaxCertificate(params);
}

export function triggerFileDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(link);
}
