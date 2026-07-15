import { useEffect, useRef } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import type { MissionProgressResponseDto } from "../api/mission.dto";
import { useHeartbeatMutation } from "./useMissionMutations";
import { useMyMissions } from "./useMissionQueries";

const FALLBACK_ONLINE_DURATION_MS = 60_000;
const MIN_HEARTBEAT_DELAY_MS = 1_000;
const MUTATION_THROTTLE_MS = 5_000;

function isOnlineMission(mission: MissionProgressResponseDto) {
  const source = `${mission.code} ${mission.title} ${mission.description}`.toLowerCase();
  return source.includes("online") || source.includes("truc tuyen") || source.includes("trực tuyến");
}

function getOnlineMissionDurationMs(mission: MissionProgressResponseDto) {
  const source = `${mission.code} ${mission.title} ${mission.description}`
    .replace(/[_-]/g, " ")
    .toLowerCase();

  const minuteMatch = source.match(/(\d+)\s*(phut|phút|minute|minutes|min|m)\b/);
  if (minuteMatch) {
    return Math.max(Number(minuteMatch[1]) * 60_000, FALLBACK_ONLINE_DURATION_MS);
  }

  const secondMatch = source.match(/(\d+)\s*(giay|giây|second|seconds|sec|s)\b/);
  if (secondMatch) {
    return Math.max(Number(secondMatch[1]) * 1_000, MIN_HEARTBEAT_DELAY_MS);
  }

  return FALLBACK_ONLINE_DURATION_MS;
}

export function useMissionHeartbeat() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const missionsQuery = useMyMissions({ enabled: isAuthenticated });
  const heartbeatMutation = useHeartbeatMutation();
  const onlineStartedAtRef = useRef<number | null>(null);
  const lastHeartbeatAtRef = useRef(0);
  const missions = missionsQuery.data;
  const pendingOnlineMissions = Array.isArray(missions)
    ? missions.filter((mission) => !mission.isCompleted && isOnlineMission(mission))
    : [];
  const hasPendingOnlineMissions = pendingOnlineMissions.length > 0;

  useEffect(() => {
    let timeoutId: number | undefined;

    if (!isAuthenticated || !hasPendingOnlineMissions) {
      onlineStartedAtRef.current = null;
      return;
    }

    if (onlineStartedAtRef.current === null) {
      onlineStartedAtRef.current = Date.now();
    }

    const clearSchedule = () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    const triggerHeartbeat = () => {
      if (
        document.visibilityState !== "visible" ||
        heartbeatMutation.isPending ||
        Date.now() - lastHeartbeatAtRef.current < MUTATION_THROTTLE_MS
      ) {
        return;
      }

      lastHeartbeatAtRef.current = Date.now();
      heartbeatMutation.mutate();
    };

    const scheduleNextHeartbeat = () => {
      clearSchedule();

      if (document.visibilityState !== "visible") {
        return;
      }

      const startedAt = onlineStartedAtRef.current ?? Date.now();
      const elapsedMs = Date.now() - startedAt;
      const nextDelayMs = Math.min(
        ...pendingOnlineMissions.map((mission) =>
          Math.max(
            MIN_HEARTBEAT_DELAY_MS,
            getOnlineMissionDurationMs(mission) - elapsedMs,
          ),
        ),
      );

      timeoutId = window.setTimeout(() => {
        triggerHeartbeat();
        scheduleNextHeartbeat();
      }, nextDelayMs);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        scheduleNextHeartbeat();
        return;
      }

      clearSchedule();
    };

    scheduleNextHeartbeat();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearSchedule();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // TanStack Query guarantees a stable mutate callback. Depending on the
    // entire mutation result would restart this schedule on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isAuthenticated,
    hasPendingOnlineMissions,
    missions,
    heartbeatMutation.isPending,
    heartbeatMutation.mutate,
  ]);
}
