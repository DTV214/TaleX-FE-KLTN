import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settlementConfigApi } from "../api/settlement-config.api";
import type { SettlementConfigRequest } from "../types/settlement-config.types";

export const settlementConfigKeys = {
  all: ["admin", "settlement-config"] as const,
  config: () => [...settlementConfigKeys.all, "config"] as const,
};

export function useSettlementConfig() {
  return useQuery({
    queryKey: settlementConfigKeys.config(),
    queryFn: () => settlementConfigApi.getConfig(),
    staleTime: 60 * 1000,
  });
}

export function useUpdateSettlementConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SettlementConfigRequest) =>
      settlementConfigApi.updateConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settlementConfigKeys.config() });
    },
  });
}
