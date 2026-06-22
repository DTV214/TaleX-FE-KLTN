import { useMutation, useQueryClient } from "@tanstack/react-query";
import { coinApi } from "../api/coin.api";
import { coinKeys } from "./useCoinQueries";
import { getApiErrorMessage } from "@/shared/api/http-client";

function notifyCoinError(error: unknown) {
  const message = getApiErrorMessage(error);

  if (typeof window !== "undefined") {
    window.alert(message);
  }
}

export function useDailyCheckInMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => coinApi.performCheckIn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coinKeys.wallet() });
      queryClient.invalidateQueries({ queryKey: coinKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: coinKeys.checkInStatus() });
    },
    onError: notifyCoinError,
  });
}
