import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  coinAdminApi,
  type CoinEconomyConfigRequest,
} from "../api/coin-admin.api";
import { getApiErrorMessage } from "@/shared/api/http-client";

export const coinAdminKeys = {
  all: ["admin", "coin-economy"] as const,
  config: () => [...coinAdminKeys.all, "config"] as const,
};

function notify(message: string) {
  if (typeof window !== "undefined") {
    window.alert(message);
  }
}

export function useCoinEconomyConfig() {
  return useQuery({
    queryKey: coinAdminKeys.config(),
    queryFn: () => coinAdminApi.getConfig(),
  });
}

export function useUpdateCoinEconomyConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CoinEconomyConfigRequest) =>
      coinAdminApi.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coinAdminKeys.config() });
      notify("Cập nhật thành công");
    },
    onError: (error) => {
      notify(getApiErrorMessage(error));
    },
  });
}
