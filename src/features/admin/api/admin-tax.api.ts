import {
  httpClient,
  unwrapBaseResponse,
  type BasePageResponse,
} from "@/shared/api/http-client";

export type AdminTaxSummary = {
  companyName: string;
  enterpriseTaxCode: string;
  companyAddress: string;
  platformVatAmount: number;
  creatorVatAmount: number;
  totalVatAmount: number;
  totalGrossAmount: number;
  totalPitWithheld: number;
  totalNetPayout: number;
  totalSettlementsCount: number;
};

export type GetAdminTaxSummaryParams = {
  year?: number;
  quarter?: number;
};

export type VatReportItem = {
  orderId: string;
  itemType: string;
  itemId: string;
  fiatAmount: number;
  vatRate: number;
  vatAmount: number;
  paymentCode: string;
  createdAt: string;
  revenueGroup: string;
};

export type GetVatReportParams = {
  itemType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
};

export type PitReportItem = {
  settlementId: string;
  settlementMonth: string;
  creatorId: string;
  creatorFullName: string | null;
  taxId: string | null;
  idNumber: string | null;
  grossAmount: number;
  taxRate: number;
  taxWithheldAmount: number;
  netPayoutAmount: number;
  status: string;
  createdAt: string;
};

export type GetPitReportParams = {
  yearMonth?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

export type PayoutAccountBalance = {
  accountNumber?: string;
  accountName?: string;
  currency?: string;
  balance?: string | number;
};

export const adminTaxKeys = {
  all: ["admin-tax"] as const,
  summary: (params?: GetAdminTaxSummaryParams) =>
    [...adminTaxKeys.all, "summary", params ?? {}] as const,
  vatReport: (params?: GetVatReportParams) =>
    [...adminTaxKeys.all, "vat-report", params ?? {}] as const,
  pitReport: (params?: GetPitReportParams) =>
    [...adminTaxKeys.all, "pit-report", params ?? {}] as const,
  payoutBalance: ["payout-balance"] as const,
};

export async function getAdminTaxSummary(
  params?: GetAdminTaxSummaryParams,
): Promise<AdminTaxSummary> {
  const queryParams: Record<string, number> = {};
  if (params?.year !== undefined) queryParams.year = params.year;
  if (params?.quarter !== undefined) queryParams.quarter = params.quarter;

  return unwrapBaseResponse<AdminTaxSummary>(
    httpClient.get("/api/v1/admin/tax/summary", { params: queryParams }),
  );
}

export async function getVatReport(
  params?: GetVatReportParams,
): Promise<BasePageResponse<VatReportItem>> {
  const queryParams: Record<string, string | number> = {};
  if (params?.itemType) queryParams.itemType = params.itemType;
  if (params?.startDate) queryParams.startDate = params.startDate;
  if (params?.endDate) queryParams.endDate = params.endDate;
  if (params?.page !== undefined) queryParams.page = params.page;
  if (params?.pageSize !== undefined) queryParams.pageSize = params.pageSize;

  return unwrapBaseResponse<BasePageResponse<VatReportItem>>(
    httpClient.get("/api/v1/admin/tax/vat-report", { params: queryParams }),
  );
}

export async function getPitReport(
  params?: GetPitReportParams,
): Promise<BasePageResponse<PitReportItem>> {
  const queryParams: Record<string, string | number> = {};
  if (params?.yearMonth) queryParams.yearMonth = params.yearMonth;
  if (params?.status) queryParams.status = params.status;
  if (params?.page !== undefined) queryParams.page = params.page;
  if (params?.pageSize !== undefined) queryParams.pageSize = params.pageSize;

  return unwrapBaseResponse<BasePageResponse<PitReportItem>>(
    httpClient.get("/api/v1/admin/tax/pit-report", { params: queryParams }),
  );
}

export async function getPayoutAccountBalance(): Promise<PayoutAccountBalance> {
  const res = await httpClient.get("/api/v1/payouts/balance");
  if (res.data?.data) {
    return res.data.data;
  }
  return res.data;
}

export async function exportBk052Excel(taxYear: number): Promise<Blob> {
  const response = await httpClient.get("/api/v1/admin/tax/export/bk05-2", {
    params: { taxYear },
    responseType: "blob",
  });
  return response.data;
}

export async function exportVatExcel(
  startDate?: string,
  endDate?: string,
): Promise<Blob> {
  const queryParams: Record<string, string> = {};
  if (startDate) queryParams.startDate = startDate;
  if (endDate) queryParams.endDate = endDate;

  const response = await httpClient.get("/api/v1/admin/tax/export/vat-excel", {
    params: queryParams,
    responseType: "blob",
  });
  return response.data;
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
