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
  const { mutateAsync } = heartbeatMutation;
  const missions = missionsQuery.data;

  const hasPendingOnline = useMemo(() => {
    if (!Array.isArray(missions)) return false;

    return missions.some(
      (mission) => !isMissionSatisfied(mission) && isOnlineMission(mission),
    );
  }, [missions]);

  const stateRef = useRef({
    canRun: canRunHeartbeat,
    hasPending: hasPendingOnline,
    isTabVisible:
      typeof document !== "undefined"
        ? document.visibilityState === "visible"
        : false,
  });
  const actionsRef = useRef({ mutateAsync });
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeStartedAtRef = useRef(0);
  const accumulatedActiveMsRef = useRef(0);
  const isHeartbeatInFlightRef = useRef(false);
  const startSchedulerRef = useRef(() => {});
  const stopSchedulerRef = useRef(() => {});

  useEffect(() => {
    actionsRef.current = { mutateAsync };
  }, [mutateAsync]);

  useEffect(() => {
    stateRef.current = {
      canRun: canRunHeartbeat,
      hasPending: hasPendingOnline,
      isTabVisible: document.visibilityState === "visible",
    };

    if (canRunHeartbeat && hasPendingOnline && stateRef.current.isTabVisible) {
      startSchedulerRef.current();
      return;
    }

    stopSchedulerRef.current();
  }, [canRunHeartbeat, hasPendingOnline]);

  useEffect(() => {
    const clearSchedule = () => {
      if (timeoutIdRef.current === null) return;

      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    };

    const scheduleHeartbeat = (delayMs: number) => {
      clearSchedule();
      activeStartedAtRef.current = Date.now();
      timeoutIdRef.current = setTimeout(() => {
        void triggerHeartbeat();
      }, delayMs);
    };

    const scheduleFromAccumulatedTime = () => {
      if (
        !stateRef.current.canRun ||
        !stateRef.current.hasPending ||
        !stateRef.current.isTabVisible ||
        timeoutIdRef.current !== null
      ) {
        return;
      }

      const remainingMs = Math.max(
        0,
        HEARTBEAT_INTERVAL_MS - accumulatedActiveMsRef.current,
      );
      scheduleHeartbeat(remainingMs);
    };

    const resetActiveTimer = () => {
      accumulatedActiveMsRef.current = 0;
      activeStartedAtRef.current = Date.now();
    };

    const pauseActiveTimer = () => {
      if (timeoutIdRef.current !== null) {
        accumulatedActiveMsRef.current +=
          Date.now() - activeStartedAtRef.current;
      }

      clearSchedule();
    };

    const triggerHeartbeat = async () => {
      clearSchedule();

      if (
        !stateRef.current.canRun ||
        !stateRef.current.hasPending ||
        !stateRef.current.isTabVisible ||
        isHeartbeatInFlightRef.current
      ) {
        return;
      }

      isHeartbeatInFlightRef.current = true;

      try {
        console.log("[Heartbeat] Đã đủ 60s active, tiến hành bắn API...");
        await actionsRef.current.mutateAsync();
        console.log("[Heartbeat] Bắn API thành công.");
      } catch (error) {
        console.error("[Heartbeat] Lỗi API:", error);
      } finally {
        isHeartbeatInFlightRef.current = false;
        resetActiveTimer();

        if (
          stateRef.current.canRun &&
          stateRef.current.hasPending &&
          stateRef.current.isTabVisible
        ) {
          scheduleHeartbeat(HEARTBEAT_INTERVAL_MS);
        }
      }
    };

    startSchedulerRef.current = scheduleFromAccumulatedTime;

    stopSchedulerRef.current = () => {
      clearSchedule();
      resetActiveTimer();
    };

    const handleVisibilityChange = () => {
      stateRef.current.isTabVisible = document.visibilityState === "visible";

      if (document.visibilityState === "visible") {
        console.log("[Heartbeat] Tab active trở lại, tiếp tục đếm giờ...");
        scheduleFromAccumulatedTime();
        return;
      }

      console.log("[Heartbeat] Tab bị ẩn, tạm dừng timer...");
      pauseActiveTimer();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    scheduleFromAccumulatedTime();

    return () => {
      clearSchedule();
      startSchedulerRef.current = () => {};
      stopSchedulerRef.current = () => {};
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}
