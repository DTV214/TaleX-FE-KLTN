import { useEffect } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useHeartbeatMutation } from "./useMissionMutations";

const HEARTBEAT_INTERVAL_MS = 60_000;

export function useMissionHeartbeat() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const heartbeatMutation = useHeartbeatMutation();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        heartbeatMutation.mutate();
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
    // TanStack Query guarantees a stable mutate callback. Depending on the
    // entire mutation result would restart this interval on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, heartbeatMutation.mutate]);
}
