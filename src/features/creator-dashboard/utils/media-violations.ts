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

// Nhãn gốc trả về từ AWS Rekognition (taxonomy kiểm duyệt nội dung, 3 cấp L1/L2/L3 —
// https://docs.aws.amazon.com/rekognition/latest/dg/moderation-api.html#moderation-api-categories,
// model version 7) — dịch sang tiếng Việt để hiển thị cho Creator/Staff, dùng chung cho
// toast SSE, panel quy trình xử lý, và modal chi tiết kiểm duyệt.
const VIOLATION_LABEL_VI: Record<string, string> = {
  // ── L1: Explicit ──────────────────────────────────────────────────
  "Explicit": "Nội dung khiêu dâm / nhạy cảm",
  "Explicit Nudity": "Nội dung khỏa thân lộ liễu",
  "Exposed Male Genitalia": "Lộ bộ phận sinh dục nam",
  "Exposed Female Genitalia": "Lộ bộ phận sinh dục nữ",
  "Exposed Buttocks or Anus": "Lộ mông / hậu môn",
  "Exposed Female Nipple": "Lộ đầu ngực nữ",
  "Explicit Sexual Activity": "Hoạt động tình dục lộ liễu",
  "Sex Toys": "Dụng cụ tình dục",
  // ── L1: Non-Explicit Nudity of Intimate parts and Kissing ────────────
  "Non-Explicit Nudity of Intimate parts and Kissing": "Khỏa thân không lộ liễu / hôn",
  "Non-Explicit Nudity": "Khỏa thân không lộ liễu",
  "Bare Back": "Lộ lưng trần",
  "Exposed Male Nipple": "Lộ đầu ngực nam",
  "Partially Exposed Buttocks": "Lộ một phần mông",
  "Partially Exposed Female Breast": "Lộ một phần ngực nữ",
  "Implied Nudity": "Khỏa thân gợi ý (che phần nhạy cảm)",
  "Obstructed Intimate Parts": "Che bộ phận nhạy cảm không hoàn toàn",
  "Obstructed Female Nipple": "Che đầu ngực nữ không hoàn toàn",
  "Obstructed Male Genitalia": "Che bộ phận sinh dục nam không hoàn toàn",
  "Kissing on the Lips": "Hôn môi",
  // ── L1: Swimwear or Underwear ─────────────────────────────────────
  "Swimwear or Underwear": "Đồ bơi / nội y",
  "Female Swimwear or Underwear": "Đồ bơi / nội y nữ",
  "Male Swimwear or Underwear": "Đồ bơi / nội y nam",
  // ── L1: Violence ──────────────────────────────────────────────────
  "Violence": "Bạo lực",
  "Weapons": "Vũ khí",
  "Graphic Violence": "Bạo lực chi tiết",
  "Weapon Violence": "Bạo lực dùng vũ khí",
  "Physical Violence": "Bạo lực thể chất",
  "Self-Harm": "Tự gây thương tích",
  "Blood & Gore": "Máu me / cảnh rùng rợn",
  "Explosions and Blasts": "Vụ nổ",
  // ── L1: Visually Disturbing ───────────────────────────────────────
  "Visually Disturbing": "Hình ảnh gây khó chịu",
  "Death and Emaciation": "Tử vong / suy kiệt cơ thể",
  "Emaciated Bodies": "Cơ thể suy kiệt",
  "Corpses": "Xác chết",
  "Crashes": "Tai nạn/va chạm phương tiện",
  "Air Crash": "Tai nạn máy bay",
  // ── L1: Drugs & Tobacco ───────────────────────────────────────────
  "Drugs & Tobacco": "Ma túy / thuốc lá",
  "Products": "Sản phẩm ma túy / thuốc lá",
  "Pills": "Thuốc / viên nén",
  "Drugs & Tobacco Paraphernalia & Use": "Dụng cụ và hành vi sử dụng ma túy/thuốc lá",
  "Smoking": "Hút thuốc",
  // ── L1: Alcohol ───────────────────────────────────────────────────
  "Alcohol": "Rượu bia",
  "Alcohol Use": "Hành vi uống rượu bia",
  "Drinking": "Uống rượu bia",
  "Alcoholic Beverages": "Đồ uống có cồn",
  // ── L1: Rude Gestures ─────────────────────────────────────────────
  "Rude Gestures": "Cử chỉ thô tục",
  "Middle Finger": "Cử chỉ ngón tay thô tục",
  // ── L1: Gambling (không có L2/L3) ─────────────────────────────────
  "Gambling": "Cờ bạc",
  // ── L1: Hate Symbols ──────────────────────────────────────────────
  "Hate Symbols": "Biểu tượng thù hận",
  "Nazi Party": "Biểu tượng Đức Quốc xã",
  "White Supremacy": "Biểu tượng phân biệt chủng tộc",
  "Extremist": "Biểu tượng cực đoan",
  // ── Nhãn taxonomy cũ (model version 6.1) — giữ lại phòng khi dữ liệu cũ trong DB
  // còn tham chiếu tên nhãn trước khi tài khoản AWS tự động chuyển sang version 7.
  "Sexual Activity": "Hoạt động tình dục",
  "Illustrated Explicit Nudity": "Khỏa thân lộ liễu (hình vẽ)",
  "Adult Toys": "Dụng cụ tình dục",
  "Bare-chested Male": "Nam cởi trần",
  "Sexual Situations": "Tình huống nhạy cảm",
  "Graphic Violence or Gore": "Bạo lực / máu me chi tiết",
  "Self Injury": "Tự gây thương tích",
  "Hanging": "Treo cổ",
  "Drug Products": "Sản phẩm ma túy",
  "Drug Use": "Sử dụng ma túy",
  "Drug Paraphernalia": "Dụng cụ sử dụng ma túy",
  "Tobacco": "Thuốc lá",
  "Tobacco Products": "Sản phẩm thuốc lá",
  "Drugs": "Ma túy / chất cấm",
};

export function translateViolationLabel(label?: string | null): string {
  if (!label) return "nội dung không phù hợp";
  return VIOLATION_LABEL_VI[label] || label;
}
