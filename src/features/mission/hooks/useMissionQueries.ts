import { useQuery } from "@tanstack/react-query";
import { missionApi } from "../api/mission.api";

export const missionKeys = {
  all: ["mission"] as const,
  myMissions: () => [...missionKeys.all, "my-missions"] as const,
  adminMissions: () => [...missionKeys.all, "admin-missions"] as const,
};

export function useMyMissions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: missionKeys.myMissions(),
    queryFn: () => missionApi.getMyDailyMissions(),
    enabled: options?.enabled ?? true,
    staleTime: 60 * 1000,
  });
}

export function useAdminMissions() {
  return useQuery({
    queryKey: missionKeys.adminMissions(),
    queryFn: () => missionApi.getAllMissionsForAdmin(),
  });
}
