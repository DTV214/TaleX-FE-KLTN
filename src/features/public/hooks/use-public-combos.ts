import { useQuery } from "@tanstack/react-query";
import { getPublicCombos } from "@/features/public/api/public-content.api";

export const publicComboKeys = {
  all: ["public-combos"] as const,
  list: () => [...publicComboKeys.all, "list"] as const,
};

export function useGetPublicCombos() {
  return useQuery({
    queryKey: publicComboKeys.list(),
    queryFn: getPublicCombos,
    staleTime: 60 * 1000,
  });
}
