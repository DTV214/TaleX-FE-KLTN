import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  rateSeries,
  deleteSeriesRating,
  getSeriesRatings,
  getMyRatings,
  type RatingFilterParams,
  type RateSeriesRequest,
} from "../api/series-ratings-api";

export const ratingKeys = {
  all: ["series-ratings"] as const,
  series: (seriesId: string, params?: RatingFilterParams) =>
    [...ratingKeys.all, "series", seriesId, params] as const,
  me: (params?: RatingFilterParams) =>
    [...ratingKeys.all, "me", params] as const,
};

export function useRateSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RateSeriesRequest) => rateSeries(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ratingKeys.all });
      queryClient.invalidateQueries({ queryKey: ["series-detail", variables.seriesId] });
      queryClient.invalidateQueries({ queryKey: ["public-series", variables.seriesId] });
    },
  });
}

export function useDeleteSeriesRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (seriesId: string) => deleteSeriesRating(seriesId),
    onSuccess: (_, seriesId) => {
      queryClient.invalidateQueries({ queryKey: ratingKeys.all });
      queryClient.invalidateQueries({ queryKey: ["series-detail", seriesId] });
      queryClient.invalidateQueries({ queryKey: ["public-series", seriesId] });
    },
  });
}

export function useGetSeriesRatings(seriesId: string, params?: RatingFilterParams) {
  return useQuery({
    queryKey: ratingKeys.series(seriesId, params),
    queryFn: () => getSeriesRatings(seriesId, params),
    enabled: Boolean(seriesId),
  });
}

export function useGetMyRatings(params?: RatingFilterParams) {
  return useQuery({
    queryKey: ratingKeys.me(params),
    queryFn: () => getMyRatings(params),
  });
}
