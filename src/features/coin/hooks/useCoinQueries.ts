import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { coinApi } from "../api/coin.api";

export const coinKeys = {
  all: ["coin"] as const,
  wallet: () => [...coinKeys.all, "wallet"] as const,
  transactions: (page?: number, size?: number) =>
    page === undefined || size === undefined
      ? ([...coinKeys.all, "transactions"] as const)
      : ([...coinKeys.all, "transactions", page, size] as const),
  checkInStatus: () => [...coinKeys.all, "check-in-status"] as const,
};

export function useCoinWallet() {
  return useQuery({
    queryKey: coinKeys.wallet(),
    queryFn: () => coinApi.getWallet(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCoinTransactions(page: number, size: number) {
  return useQuery({
    queryKey: coinKeys.transactions(page, size),
    queryFn: () => coinApi.getTransactionHistory(page, size),
    placeholderData: keepPreviousData,
  });
}

export function useDailyCheckInStatus() {
  return useQuery({
    queryKey: coinKeys.checkInStatus(),
    queryFn: () => coinApi.getCheckInStatus(),
  });
}
