import type {
  ContentCensorshipResponseDto,
  MediaCopyrightResponseDto,
  MediaResponse,
  MediaViolationsResponseDto,
} from "@/features/creator-dashboard/api/creator-content-api";

export function getBlockingCopyrightViolations(
  violations?: MediaViolationsResponseDto,
): MediaCopyrightResponseDto[] {
  return violations?.copyrightViolations.filter((item) => item.isValid !== true) ?? [];
}

export function getPermittedCopyrightMatches(
  violations?: MediaViolationsResponseDto,
): MediaCopyrightResponseDto[] {
  return violations?.copyrightViolations.filter((item) => item.isValid === true) ?? [];
}

export function getRejectedCensorshipResults(
  violations?: MediaViolationsResponseDto,
): ContentCensorshipResponseDto[] {
  return violations?.censorshipResults.filter((item) => item.status === "REJECTED") ?? [];
}

export function getApprovedCensorshipResults(
  violations?: MediaViolationsResponseDto,
): ContentCensorshipResponseDto[] {
  return violations?.censorshipResults.filter((item) => item.status === "APPROVED") ?? [];
}

export function getHighestSimilarityScore(
  violations?: MediaViolationsResponseDto,
): number {
  return Math.max(
    0,
    ...(violations?.copyrightViolations.map((item) => item.similarityScore ?? 0) ?? []),
  );
}

export function isMediaReadyForPublish(
  media?: Partial<Pick<MediaResponse, "status" | "approvalStatus">>,
): boolean {
  return Boolean(
    media?.approvalStatus === "APPROVED" &&
      (media.status === "ACTIVE" || media.status === "HLS_READY"),
  );
}

export function isMediaPipelinePending(
  media?: Partial<Pick<MediaResponse, "status" | "approvalStatus">>,
): boolean {
  return Boolean(
    media &&
      (media.approvalStatus === "PENDING_REVIEW" ||
        media.status === "PENDING" ||
        media.status === "PROCESSING" ||
        media.status === "HLS_PROCESSING"),
  );
}
