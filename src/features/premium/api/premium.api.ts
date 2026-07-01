import { useQuery } from "@tanstack/react-query";
import {
  httpClient,
  type BasePageResponse,
  type BaseResponse,
} from "@/shared/api/http-client";
import type { Subscription } from "@/features/admin/subscriptions/types/subscriptions.types";

export type PremiumPackagesResponse = BaseResponse<
  BasePageResponse<Subscription>
>;

const PREMIUM_PACKAGES_ENDPOINT = "/api/v1/subscriptions";

export const premiumKeys = {
  all: ["premium"] as const,
  packages: () => [...premiumKeys.all, "packages"] as const,
};

export function useGetPremiumPackages() {
  return useQuery({
    queryKey: premiumKeys.packages(),
    queryFn: async (): Promise<PremiumPackagesResponse> => {
      const response = await httpClient.get<PremiumPackagesResponse>(
        PREMIUM_PACKAGES_ENDPOINT,
        {
          params: {
            page: 1,
            pageSize: 20,
            sortBy: "price",
            sortDirection: "ASC",
          },
        },
      );

      return response.data;
    },
    staleTime: 60 * 1000,
  });
}
