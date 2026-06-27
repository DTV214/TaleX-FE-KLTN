import { httpClient } from "@/shared/api/http-client";

export interface CopyrightViolation {
  mediaCopyrightId: string;
  mediaId: string;
  sourceMediaId?: string;
  startTimeTarget?: number;
  endTimeTarget?: number;
  startTimeSource?: number;
  endTimeSource?: number;
  similarityScore?: number;
  violationType?: string;
  isValid?: boolean;
  note?: string;
  checkedAt?: string;
}

export interface ViolationDetail {
  violationDetailId: string;
  violationAt?: number;
  endViolationAt?: number;
  label?: string;
  confidence?: number;
  suggestion?: string;
}

export interface CensorshipResult {
  censorshipId: string;
  mediaId: string;
  primaryViolationLabel?: string;
  confidenceScore?: number;
  checkedAt?: string;
  reviewedBy?: string;
  reviewerNotes?: string;
  status?: string;
  violationDetails?: ViolationDetail[];
}

export interface MediaViolationsResponse {
  mediaId: string;
  contentId?: string;
  copyrightViolations: CopyrightViolation[];
  censorshipResults: CensorshipResult[];
}

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
  const response = await httpClient.get(
    `/api/v1/media/${mediaId}/violations`,
  );
  return response.data;
}
