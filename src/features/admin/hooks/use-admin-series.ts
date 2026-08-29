"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  forceHideSeries,
  forceUnhideSeries,
  getAdminSeries,
  getAllSeries,
  type AdminSeriesFilterParams,
} from "@/features/admin/api/admin-series.api";

export const adminSeriesKeys = {
  all: ["admin", "series"] as const,
  lists: () => [...adminSeriesKeys.all, "list"] as const,
  list: (filters: AdminSeriesFilterParams) =>
    [...adminSeriesKeys.lists(), filters] as const,
};

export function useGetAllSeries() {
  return useQuery({
    queryKey: adminSeriesKeys.lists(),
    queryFn: getAllSeries,
    staleTime: 60 * 1000,
  });
}

export function useGetAdminSeries(filters: AdminSeriesFilterParams) {
  return useQuery({
    queryKey: adminSeriesKeys.list(filters),
    queryFn: () => getAdminSeries(filters),
    staleTime: 60 * 1000,
  });
}

export function useToggleSeriesVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ hidden, id }: { hidden: boolean; id: string }) =>
      hidden ? forceUnhideSeries(id) : forceHideSeries(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminSeriesKeys.lists() });
    },
  });
}
