"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAdminCreators,
  getCreatorViolations,
} from "@/features/admin/api/creator-admin.api";

export const creatorAdminKeys = {
  all: ["admin", "creators"] as const,
  lists: () => [...creatorAdminKeys.all, "list"] as const,
  violations: (creatorId: string) =>
    [...creatorAdminKeys.all, "violations", creatorId] as const,
};

export function useGetAdminCreators() {
  return useQuery({
    queryKey: creatorAdminKeys.lists(),
    queryFn: getAdminCreators,
    staleTime: 60 * 1000,
  });
}

export function useGetCreatorViolations(creatorId?: string | null) {
  return useQuery({
    queryKey: creatorAdminKeys.violations(creatorId ?? ""),
    queryFn: () => getCreatorViolations(creatorId ?? ""),
    enabled: Boolean(creatorId),
    staleTime: 30 * 1000,
  });
}
