"use client";

import { useQuery } from "@tanstack/react-query";
import {
  adminTaxKeys,
  getAdminTaxSummary,
  getPayoutAccountBalance,
  getPitReport,
  getVatReport,
  type GetAdminTaxSummaryParams,
  type GetPitReportParams,
  type GetVatReportParams,
} from "@/features/admin/api/admin-tax.api";

export function useAdminTaxSummary(params?: GetAdminTaxSummaryParams) {
  return useQuery({
    queryKey: adminTaxKeys.summary(params),
    queryFn: () => getAdminTaxSummary(params),
    staleTime: 30 * 1000,
  });
}

export function useVatReport(params?: GetVatReportParams) {
  return useQuery({
    queryKey: adminTaxKeys.vatReport(params),
    queryFn: () => getVatReport(params),
    staleTime: 30 * 1000,
  });
}

export function usePitReport(params?: GetPitReportParams) {
  return useQuery({
    queryKey: adminTaxKeys.pitReport(params),
    queryFn: () => getPitReport(params),
    staleTime: 30 * 1000,
  });
}

export function usePayoutAccountBalance() {
  return useQuery({
    queryKey: adminTaxKeys.payoutBalance,
    queryFn: getPayoutAccountBalance,
    staleTime: 30 * 1000,
  });
}
