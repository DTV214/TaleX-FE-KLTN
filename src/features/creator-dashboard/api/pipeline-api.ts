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
  // "APPROVED" | "REJECTED" | "PENDING_REVIEW" — phân biệt "bị từ chối" thật với
  // "đang chờ Staff duyệt thủ công" (case series MATURE có nhãn nhạy cảm hợp lệ).
  approvalStatus?: string;
  // Lý do Staff gõ tay khi từ chối thủ công — chỉ có ở event "pipeline:staff_rejected",
  // khác primaryLabel (nhãn AI tự động phát hiện).
  reviewerNotes?: string;
}

export async function fetchMediaViolations(
  mediaId: string,
): Promise<MediaViolationsResponse> {
  return getMediaViolations(mediaId);
}
