export type MissionProgressResponseDto = {
  missionId: string;
  code: string;
  title: string;
  description: string;
  rewardAmount: number;
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
};

export type MissionRequestDto = {
  code: string;
  title: string;
  description: string;
  rewardAmount: number;
  targetValue: number;
  isActive: boolean;
};

export type Mission = MissionRequestDto & {
  missionId: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
};
