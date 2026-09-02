import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { creatorSettlementsApi } from "../api/creator-settlements.api";
import type {
  RunSettlementProcessParams,
  SettlementSearchParams,
  UpdateSettlementStatusRequest,
} from "../types/creator-settlements.types";

export const creatorSettlementKeys = {
  all: ["creator-settlements"] as const,
  adminList: (params: SettlementSearchParams) =>
    [...creatorSettlementKeys.all, "admin-list", params] as const,
  ownList: (params: SettlementSearchParams) =>
    [...creatorSettlementKeys.all, "own-list", params] as const,
  detail: (settlementId: string) =>
    [...creatorSettlementKeys.all, "detail", settlementId] as const,
  primaryPaymentProfile: (creatorId: string) =>
    [...creatorSettlementKeys.all, "primary-payment-profile", creatorId] as const,
};

export function useAdminCreatorSettlements(params: SettlementSearchParams) {
  return useQuery({
    queryKey: creatorSettlementKeys.adminList(params),
    queryFn: () => creatorSettlementsApi.search(params),
    staleTime: 30 * 1000,
  });
}

export function useOwnCreatorSettlements(params: SettlementSearchParams) {
  return useQuery({
    queryKey: creatorSettlementKeys.ownList(params),
    queryFn: () => creatorSettlementsApi.own(params),
    staleTime: 30 * 1000,
  });
}

export function useCreatorSettlementDetail(settlementId: string | null) {
  return useQuery({
    queryKey: creatorSettlementKeys.detail(settlementId ?? ""),
    queryFn: () => creatorSettlementsApi.detail(settlementId!),
    enabled: Boolean(settlementId),
    retry: false,
  });
}

export function useCreatorPrimaryPaymentProfile(creatorId: string | null) {
  return useQuery({
    queryKey: creatorSettlementKeys.primaryPaymentProfile(creatorId ?? ""),
    queryFn: () => creatorSettlementsApi.primaryPaymentProfile(creatorId!),
    enabled: Boolean(creatorId),
    retry: false,
  });
}

export function useUpdateCreatorSettlementStatus(settlementId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSettlementStatusRequest) =>
      creatorSettlementsApi.updateStatus(settlementId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creatorSettlementKeys.all });
    },
  });
}

export function useRunCreatorSettlementProcess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: RunSettlementProcessParams) =>
      creatorSettlementsApi.runProcess(params),
    onSuccess: (_data, variables) => {
      if (!variables.isDemo) {
        queryClient.invalidateQueries({ queryKey: creatorSettlementKeys.all });
      }
    },
  });
}

export function useRunSingleCreatorPayout(settlementId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => creatorSettlementsApi.runSinglePayout(settlementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creatorSettlementKeys.all });
    },
  });
}
