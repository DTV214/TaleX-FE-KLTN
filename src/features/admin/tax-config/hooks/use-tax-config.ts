import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { taxConfigApi } from "../api/tax-config.api";
import type { TaxConfigRequest } from "../types/tax-config.types";

export const taxConfigKeys = {
  all: ["admin", "tax-config"] as const,
  config: () => [...taxConfigKeys.all, "config"] as const,
};

export function useTaxConfig() {
  return useQuery({
    queryKey: taxConfigKeys.config(),
    queryFn: () => taxConfigApi.getConfig(),
    staleTime: 60 * 1000,
  });
}

export function useCreateTaxConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TaxConfigRequest) => taxConfigApi.createConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxConfigKeys.config() });
    },
  });
}

export function useUpdateTaxConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TaxConfigRequest) => taxConfigApi.updateConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxConfigKeys.config() });
    },
  });
}
