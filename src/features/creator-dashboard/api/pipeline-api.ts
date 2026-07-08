import {
  getMediaViolations,
  type MediaViolationsResponseDto,
} from "@/features/creator-dashboard/api/creator-content-api";

export type MediaViolationsResponse = MediaViolationsResponseDto;

export interface PipelineEvent {
  mediaId: string;
  status: string;
  contentId?: string;
  isDuplicate?: boolean;
  violationsCount?: number;
  isSafe?: boolean;
  primaryLabel?: string;
  errorMessage?: string;
  failedStep?: string;
}

export async function fetchMediaViolations(
  mediaId: string,
): Promise<MediaViolationsResponse> {
  return getMediaViolations(mediaId);
}
