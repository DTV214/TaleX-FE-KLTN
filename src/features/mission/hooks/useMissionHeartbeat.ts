import { useEffect } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useHeartbeatMutation } from "./useMissionMutations";
import { useMyMissions } from "./useMissionQueries";

const HEARTBEAT_INTERVAL_MS = 60_000;

export function useMissionHeartbeat() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const missionsQuery = useMyMissions({ enabled: isAuthenticated });
  const heartbeatMutation = useHeartbeatMutation();
  const missions = missionsQuery.data;
  const hasPendingMissions = Array.isArray(missions)
    ? missions.some((mission) => !mission.isCompleted)
    : false;

  useEffect(() => {
    if (!isAuthenticated || !hasPendingMissions) {
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
  }, [isAuthenticated, hasPendingMissions, heartbeatMutation.mutate]);
}
