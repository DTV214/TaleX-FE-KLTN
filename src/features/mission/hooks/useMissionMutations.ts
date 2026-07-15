import { useMutation, useQueryClient } from "@tanstack/react-query";
import { coinKeys } from "@/features/coin/hooks/useCoinQueries";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { missionApi } from "../api/mission.api";
import type { Mission, MissionRequestDto } from "../api/mission.dto";
import { missionKeys } from "./useMissionQueries";

function logMissionError(error: unknown) {
  console.error("Mission request failed:", getApiErrorMessage(error));
}

export function useHeartbeatMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => missionApi.processOnlineHeartbeat(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: missionKeys.myMissions() });
      queryClient.invalidateQueries({ queryKey: coinKeys.wallet() });
      queryClient.invalidateQueries({ queryKey: coinKeys.transactions() });
    },
    onError: logMissionError,
  });
}

export function useStartAdSessionMutation() {
  return useMutation({
    mutationFn: (missionCode: string) => missionApi.startAdSession(missionCode),
    onError: logMissionError,
  });
}

export function useCompleteAdSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => missionApi.completeAdSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: missionKeys.myMissions() });
      queryClient.invalidateQueries({ queryKey: coinKeys.wallet() });
      queryClient.invalidateQueries({ queryKey: coinKeys.transactions() });
    },
    onError: logMissionError,
  });
}

export function useCreateMissionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MissionRequestDto) => missionApi.createMission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: missionKeys.adminMissions() });
    },
    onError: logMissionError,
  });
}

export function useUpdateMissionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; data: MissionRequestDto }) =>
      missionApi.updateMission(params),
    onSuccess: (updatedMission) => {
      queryClient.setQueryData<Mission[]>(
        missionKeys.adminMissions(),
        (old) => {
          if (!old) return old;

          return old.map((mission) =>
            mission.missionId === updatedMission.missionId
              ? updatedMission
              : mission,
          );
        },
      );
    },
    onError: logMissionError,
  });
}

export function useToggleMissionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => missionApi.toggleMissionStatus(id),
    onSuccess: (updatedMission) => {
      queryClient.setQueryData<Mission[]>(
        missionKeys.adminMissions(),
        (old) => {
          if (!old) return old;

          return old.map((mission) =>
            mission.missionId === updatedMission.missionId
              ? updatedMission
              : mission,
          );
        },
      );
    },
    onError: logMissionError,
  });
}
