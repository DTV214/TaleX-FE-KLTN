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

// Nhãn gốc trả về từ AWS Rekognition (taxonomy kiểm duyệt nội dung) — dịch sang tiếng
// Việt để hiển thị cho Creator, dùng chung cho toast SSE và panel quy trình xử lý.
const VIOLATION_LABEL_VI: Record<string, string> = {
  // Danh mục cấp cao (parent category)
  "Explicit": "Nội dung khiêu dâm / nhạy cảm",
  "Explicit Nudity": "Nội dung khỏa thân",
  "Non-Explicit Nudity of Intimate parts and Kissing": "Khỏa thân không lộ liễu / hôn",
  "Swimwear or Underwear": "Đồ bơi / nội y",
  "Violence": "Bạo lực",
  "Visually Disturbing": "Hình ảnh gây khó chịu",
  "Drugs": "Ma túy / chất cấm",
  "Drugs & Tobacco": "Ma túy / thuốc lá",
  "Tobacco": "Thuốc lá",
  "Alcohol": "Rượu bia",
  "Gambling": "Cờ bạc",
  "Hate Symbols": "Biểu tượng thù hận",
  "Rude Gestures": "Cử chỉ thô tục",
  // Nhãn con (sub-label) — chi tiết hơn, thường đi kèm nhãn cha ở trên
  "Explicit Sexual Activity": "Hoạt động tình dục lộ liễu",
  "Sexual Activity": "Hoạt động tình dục",
  "Illustrated Explicit Nudity": "Khỏa thân lộ liễu (hình vẽ)",
  "Adult Toys": "Dụng cụ tình dục",
  "Sex Toys": "Dụng cụ tình dục",
  "Exposed Male Genitalia": "Lộ bộ phận sinh dục nam",
  "Exposed Female Genitalia": "Lộ bộ phận sinh dục nữ",
  "Exposed Buttocks or Anus": "Lộ mông / hậu môn",
  "Exposed Female Nipple": "Lộ đầu ngực nữ",
  "Obstructed Intimate Parts": "Che bộ phận nhạy cảm không hoàn toàn",
  "Kissing on the Lips": "Hôn môi",
  "Bare-chested Male": "Nam cởi trần",
  "Male Swimwear or Underwear": "Đồ bơi / nội y nam",
  "Female Swimwear or Underwear": "Đồ bơi / nội y nữ",
  "Partially Exposed Buttocks": "Lộ một phần mông",
  "Sexual Situations": "Tình huống nhạy cảm",
  "Graphic Violence or Gore": "Bạo lực / máu me chi tiết",
  "Physical Violence": "Bạo lực thể chất",
  "Weapon Violence": "Bạo lực dùng vũ khí",
  "Weapons": "Vũ khí",
  "Self Injury": "Tự gây thương tích",
  "Emaciated Bodies": "Cơ thể suy kiệt",
  "Corpses": "Xác chết",
  "Hanging": "Treo cổ",
  "Drug Products": "Sản phẩm ma túy",
  "Drug Use": "Sử dụng ma túy",
  "Pills": "Thuốc / viên nén",
  "Drug Paraphernalia": "Dụng cụ sử dụng ma túy",
  "Tobacco Products": "Sản phẩm thuốc lá",
  "Smoking": "Hút thuốc",
  "Drinking": "Uống rượu bia",
  "Alcoholic Beverages": "Đồ uống có cồn",
  "Middle Finger": "Cử chỉ ngón tay thô tục",
  "Nazi Party": "Biểu tượng Đức Quốc xã",
  "White Supremacy": "Biểu tượng phân biệt chủng tộc",
  "Extremist": "Biểu tượng cực đoan",
};

export function translateViolationLabel(label?: string | null): string {
  if (!label) return "nội dung không phù hợp";
  return VIOLATION_LABEL_VI[label] || label;
}
