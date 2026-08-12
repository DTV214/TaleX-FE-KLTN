import type {
  AppealStatus,
  PenaltyLevel,
  PenaltyStatus,
  ReportReason,
  ReportTargetType,
  TicketStatus,
} from "../api/moderation-reports.api";

export const reportTargetOptions: Array<{
  value: ReportTargetType;
  label: string;
}> = [
  { value: "EPISODE", label: "Tập nội dung" },
  { value: "SERIES", label: "Series" },
  { value: "ACCOUNT", label: "Tài khoản" },
  { value: "COMMENT", label: "Bình luận" },
];

export const reportReasonOptions: Array<{
  value: ReportReason;
  label: string;
  description: string;
}> = [
  {
    value: "COPYRIGHT",
    label: "Vi phạm bản quyền",
    description: "Nội dung sao chép, re-up hoặc sử dụng tài sản không có quyền.",
  },
  {
    value: "ADULT_CONTENT",
    label: "Nội dung người lớn",
    description: "Hình ảnh, lời thoại hoặc chủ đề không phù hợp độ tuổi.",
  },
  {
    value: "BAD_LANGUAGE",
    label: "Ngôn từ không phù hợp",
    description: "Lăng mạ, kích động thù ghét, quấy rối hoặc xúc phạm.",
  },
  {
    value: "SPAM",
    label: "Spam / lừa đảo",
    description: "Quảng cáo rác, link độc hại hoặc hành vi làm phiền.",
  },
  {
    value: "OTHER",
    label: "Lý do khác",
    description: "Vấn đề khác cần đội ngũ TaleX kiểm tra thủ công.",
  },
];

export const ticketStatusOptions: Array<{ value: TicketStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "OPEN", label: "Mới mở" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "RESOLVED", label: "Đã xử lý" },
  { value: "DISMISSED", label: "Đã bác bỏ" },
];

export const penaltyStatusOptions: Array<{ value: PenaltyStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "ACTIVE", label: "Đang hiệu lực" },
  { value: "REVOKED", label: "Đã gỡ" },
];

export const appealStatusOptions: Array<{ value: AppealStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã chấp nhận" },
  { value: "REJECTED", label: "Đã từ chối" },
];

export const penaltyLevelOptions: Array<{
  value: PenaltyLevel;
  label: string;
  description: string;
}> = [
  {
    value: "WARNING_COMMENT",
    label: "Cảnh báo bình luận",
    description: "Nhắc nhở nhẹ cho vi phạm ở bình luận.",
  },
  {
    value: "WARNING_EPISODE",
    label: "Cảnh báo tập",
    description: "Ghi nhận vi phạm ở một tập nội dung.",
  },
  {
    value: "WARNING_SERIES",
    label: "Cảnh báo series",
    description: "Ghi nhận vi phạm ảnh hưởng toàn bộ series.",
  },
  {
    value: "WARNING_ACCOUNT",
    label: "Cảnh báo tài khoản",
    description: "Cảnh báo cấp tài khoản khi nhiều hành vi có rủi ro.",
  },
  {
    value: "FINE_EPISODE",
    label: "Phạt tập",
    description: "Áp dụng hình phạt mạnh hơn cho một tập.",
  },
  {
    value: "FINE_SERIES",
    label: "Phạt series",
    description: "Áp dụng hình phạt cho toàn bộ series.",
  },
  {
    value: "FINE_ACCOUNT",
    label: "Phạt tài khoản",
    description: "Mức nặng nhất ở cấp tài khoản.",
  },
];

export function labelForTargetType(value?: string) {
  return reportTargetOptions.find((option) => option.value === value)?.label ?? value ?? "-";
}

export function labelForReason(value?: string) {
  return reportReasonOptions.find((option) => option.value === value)?.label ?? value ?? "-";
}

export function labelForTicketStatus(value?: string) {
  return ticketStatusOptions.find((option) => option.value === value)?.label ?? value ?? "-";
}

export function labelForPenaltyStatus(value?: string) {
  return penaltyStatusOptions.find((option) => option.value === value)?.label ?? value ?? "-";
}

export function labelForAppealStatus(value?: string) {
  return appealStatusOptions.find((option) => option.value === value)?.label ?? value ?? "-";
}

export function labelForPenaltyLevel(value?: string) {
  return penaltyLevelOptions.find((option) => option.value === value)?.label ?? value ?? "-";
}

export function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function statusTone(status?: string) {
  switch (status) {
    case "OPEN":
    case "PENDING":
    case "ACTIVE":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "IN_PROGRESS":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "RESOLVED":
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "DISMISSED":
    case "REJECTED":
    case "REVOKED":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-slate-200 bg-white text-slate-600";
  }
}
