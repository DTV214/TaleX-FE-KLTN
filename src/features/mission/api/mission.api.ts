import {
  httpClient,
  unwrapBaseResponse,
} from "@/shared/api/http-client";
import type {
  AdSessionResponseDto,
  Mission,
  MissionProgressResponseDto,
  MissionRequestDto,
} from "./mission.dto";

const USER_MISSIONS_ENDPOINT = "/api/v1/missions";
const ADMIN_MISSIONS_ENDPOINT = "/api/v1/admin/missions";

export const missionApi = {
  getMyDailyMissions(): Promise<MissionProgressResponseDto[]> {
    return unwrapBaseResponse<MissionProgressResponseDto[]>(
      httpClient.get(USER_MISSIONS_ENDPOINT),
    );
  },

  processOnlineHeartbeat(): Promise<null> {
    return unwrapBaseResponse<null>(
      httpClient.post(`${USER_MISSIONS_ENDPOINT}/heartbeat`),
    );
  },

  startAdSession(missionCode: string): Promise<AdSessionResponseDto> {
    return unwrapBaseResponse<AdSessionResponseDto>(
      httpClient.post(`${USER_MISSIONS_ENDPOINT}/ads/start`, {
        missionCode,
      }),
    );
  },

  completeAdSession(sessionId: string): Promise<null> {
    return unwrapBaseResponse<null>(
      httpClient.post(`${USER_MISSIONS_ENDPOINT}/ads/complete`, {
        sessionId,
      }),
    );
  },

  getAllMissionsForAdmin(): Promise<Mission[]> {
    return unwrapBaseResponse<Mission[]>(
      httpClient.get(ADMIN_MISSIONS_ENDPOINT),
    );
  },

  createMission(data: MissionRequestDto): Promise<Mission> {
    return unwrapBaseResponse<Mission>(
      httpClient.post(ADMIN_MISSIONS_ENDPOINT, data),
    );
  },

  updateMission(params: {
    id: string;
    data: MissionRequestDto;
  }): Promise<Mission> {
    return unwrapBaseResponse<Mission>(
      httpClient.put(`${ADMIN_MISSIONS_ENDPOINT}/${params.id}`, params.data),
    );
  },

  toggleMissionStatus(id: string): Promise<Mission> {
    return unwrapBaseResponse<Mission>(
      httpClient.patch(`${ADMIN_MISSIONS_ENDPOINT}/${id}/toggle`),
    );
  },
};
