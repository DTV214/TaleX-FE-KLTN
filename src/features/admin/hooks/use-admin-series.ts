"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAdminSeries,
  getAllSeries,
  hideSeries,
  unhideSeries,
} from "@/features/admin/api/admin-series.api";

export const adminSeriesKeys = {
  all: ["admin", "series"] as const,
  lists: () => [...adminSeriesKeys.all, "list"] as const,
};

export function useGetAllSeries() {
  return useQuery({
    queryKey: adminSeriesKeys.lists(),
    queryFn: getAllSeries,
    staleTime: 60 * 1000,
  });
}

export function useToggleSeriesVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ hidden, id }: { hidden: boolean; id: string }) =>
      hidden ? unhideSeries(id) : hideSeries(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminSeriesKeys.lists() });
    },
  });
}

export function useDeleteSeriesAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAdminSeries(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminSeriesKeys.lists() });
    },
  });
}
