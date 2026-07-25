import { useEffect, useMemo, useRef } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import type { MissionProgressResponseDto } from "../api/mission.dto";
import { useHeartbeatMutation } from "./useMissionMutations";
import { useMyMissions } from "./useMissionQueries";

const HEARTBEAT_INTERVAL_MS = 60_000;

type UseMissionHeartbeatOptions = {
  enabled?: boolean;
};

function normalizeMissionText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]/g, " ")
    .toLowerCase();
}

function isOnlineMission(mission: MissionProgressResponseDto) {
  const source = normalizeMissionText(
    `${mission.code} ${mission.title} ${mission.description}`,
  );

  return source.includes("online") || source.includes("truc tuyen");
}

function isMissionSatisfied(mission: MissionProgressResponseDto) {
  return (
    mission.isCompleted ||
    (mission.targetValue > 0 && mission.currentValue >= mission.targetValue)
  );
}

export function useMissionHeartbeat(options: UseMissionHeartbeatOptions = {}) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isEnabled = options.enabled ?? true;
  const canRunHeartbeat = isEnabled && isAuthenticated;
  const missionsQuery = useMyMissions({ enabled: canRunHeartbeat });
  const heartbeatMutation = useHeartbeatMutation();
  const activeSegmentStartedAtRef = useRef<number | null>(null);
  const accumulatedVisibleMsRef = useRef(0);
  const missions = missionsQuery.data;
  const { refetch } = missionsQuery;
  const { isPending, mutateAsync } = heartbeatMutation;

  const serverPendingOnlineMissions = useMemo(
    () =>
      Array.isArray(missions)
        ? missions.filter(
            (mission) =>
              !isMissionSatisfied(mission) && isOnlineMission(mission),
          )
        : [],
    [missions],
  );

  const hasServerPendingOnlineMissions = serverPendingOnlineMissions.length > 0;

  useEffect(() => {
    let timeoutId: number | undefined;

    const clearSchedule = () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    const getVisibleElapsedMs = () => {
      if (activeSegmentStartedAtRef.current === null) {
        return accumulatedVisibleMsRef.current;
      }

      return (
        accumulatedVisibleMsRef.current +
        Date.now() -
        activeSegmentStartedAtRef.current
      );
    };

    const resetVisibleTimer = () => {
      accumulatedVisibleMsRef.current = 0;
      activeSegmentStartedAtRef.current =
        document.visibilityState === "visible" ? Date.now() : null;
    };

    const pauseVisibleTimer = () => {
      if (activeSegmentStartedAtRef.current === null) return;

      accumulatedVisibleMsRef.current = getVisibleElapsedMs();
      activeSegmentStartedAtRef.current = null;
    };

    const resumeVisibleTimer = () => {
      if (activeSegmentStartedAtRef.current !== null) return;

      activeSegmentStartedAtRef.current = Date.now();
    };

    if (!canRunHeartbeat || !hasServerPendingOnlineMissions) {
      clearSchedule();
      resetVisibleTimer();
      return;
    }

    if (
      document.visibilityState === "visible" &&
      activeSegmentStartedAtRef.current === null
    ) {
      resumeVisibleTimer();
    }

    const scheduleNextHeartbeat = () => {
      clearSchedule();

      if (document.visibilityState !== "visible") return;

      const elapsedMs = getVisibleElapsedMs();
      const nextDelayMs = Math.max(0, HEARTBEAT_INTERVAL_MS - elapsedMs);

      timeoutId = window.setTimeout(() => {
        void triggerHeartbeat();
      }, nextDelayMs);
    };

    const triggerHeartbeat = async () => {
      if (document.visibilityState !== "visible" || isPending) return;

      resetVisibleTimer();

      try {
        await mutateAsync();
        await refetch();
      } finally {
        scheduleNextHeartbeat();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resumeVisibleTimer();
        scheduleNextHeartbeat();
        return;
      }

      pauseVisibleTimer();
      clearSchedule();
    };

    scheduleNextHeartbeat();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearSchedule();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    canRunHeartbeat,
    hasServerPendingOnlineMissions,
    refetch,
    isPending,
    mutateAsync,
  ]);
}
