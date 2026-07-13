"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  banAccount,
  createStaff,
  getAdminAccounts,
  unbanAccount,
  type CreateStaffPayload,
  type GetAdminAccountsParams,
} from "@/features/admin/api/account.api";

export const adminAccountKeys = {
  all: ["admin", "accounts"] as const,
  lists: () => [...adminAccountKeys.all, "list"] as const,
  list: (params: GetAdminAccountsParams) =>
    [...adminAccountKeys.lists(), params] as const,
};

export function useGetAdminAccounts(params: GetAdminAccountsParams) {
  return useQuery({
    queryKey: adminAccountKeys.list(params),
    queryFn: () => getAdminAccounts(params),
    staleTime: 30 * 1000,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStaffPayload) => createStaff(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminAccountKeys.lists() });
    },
  });
}

export function useBanAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) => banAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminAccountKeys.lists() });
    },
  });
}

export function useUnbanAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) => unbanAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminAccountKeys.lists() });
    },
  });
}
