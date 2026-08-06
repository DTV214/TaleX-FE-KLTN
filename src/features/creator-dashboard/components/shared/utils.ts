import { type ContentApprovalStatus, type SeriesStatus, type SeasonStatus, type EpisodeStatus, type ComicPage } from '@/features/creator-dashboard/types/dashboard.types';
import { type MediaStatus, type MediaResponse } from '@/features/creator-dashboard/api/creator-content-api';



export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}


export function formatNumber(value?: number) {
  if (value == null) {
    return "-";
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}K`;
  }

  return String(value);
}


export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${bytes} B`;
}


export function formatApprovalStatusLabel(status: ContentApprovalStatus) {
  switch (status) {
    case "APPROVED":
      return "Đã duyệt";
    case "REJECTED":
      return "Bị từ chối";
    default:
      return "Chờ duyệt";
  }
}


export function getApprovalChipClass(status: ContentApprovalStatus) {
  switch (status) {
    case "APPROVED":
      return "border-[#25B67A] bg-[#E9FBF2] text-[#067647]";
    case "REJECTED":
      return "border-red-500/50 bg-red-500/10 text-red-400";
    default:
      return "border-[#F4B9CC] bg-[#FFF4F8] text-[#B83268]";
  }
}


export function formatMediaStatusLabel(status: MediaStatus) {
  if (status === "PENDING") return "Đang kiểm duyệt";
  if (status === "INACTIVE") return "Vi phạm chính sách";
  if (status === "HLS_PROCESSING") return "Processing";
  if (status === "HLS_READY") return "Ready";
  // Đã được duyệt trước đó nhưng quản trị viên tạm ẩn khỏi công khai sau đó — khác
  // "Vi phạm chính sách" (chưa từng đạt), tránh rơi vào formatStatusLabel() bên dưới sẽ
  // hiện thẳng chuỗi enum "FORCE_HIDDEN" chưa dịch.
  if (status === "FORCE_HIDDEN") return "Tạm ẩn bởi quản trị viên";
  return formatStatusLabel(status as EpisodeStatus);
}


export function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}


export function splitDateTimeLocalValue(value?: string) {
  const [date, time = ""] = toDateTimeLocalValue(value).split("T");

  return { date, time };
}


export function isPastDateTimeLocalValue(dateTime: string) {
  const selectedDate = new Date(dateTime);

  return (
    Number.isNaN(selectedDate.getTime()) || selectedDate.getTime() <= Date.now()
  );
}


export function combineDateAndTimeLocalValue(date: string, time: string) {
  return `${date}T${time}`;
}


export function getStatusBadgeStyle(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "border-[#25B67A] bg-[#E9FBF2] text-[#067647]"; // xanh lá
    case "SCHEDULED":
      return "border-[#24B5FF] bg-[#E8F8FF] text-[#0074A6]"; // xanh dương
    case "FORCE_HIDDEN":
    case "REVIEW":
      return "border-creator-gold/50 bg-creator-gold/10 text-creator-gold"; // vàng cam
    case "DELETED":
      return "border-red-500/50 bg-red-500/10 text-red-400"; // đỏ
    case "HIDDEN":
    case "DRAFT":
    default:
      return "border-creator-border bg-creator-bg text-creator-muted"; // xám/màu hiện tại
  }
}


export function formatStatusLabel(
  status: SeriesStatus | SeasonStatus | EpisodeStatus,
) {
  if (status === "ACTION_REQUIRED") {
    return "Cần xử lý";
  }

  if (status === "REVIEW") {
    return "Đang xem xét";
  }

  // Đã được duyệt/xuất bản trước đó nhưng quản trị viên tạm ẩn khỏi công khai sau đó —
  // trước đây rơi vào default bên dưới, hiện thẳng chuỗi enum "FORCE_HIDDEN" chưa dịch.
  if (status === "FORCE_HIDDEN") {
    return "Tạm ẩn";
  }

  return status;
}


export function reorderPages(pages: ComicPage[], fromId: string, toId: string) {
  const fromIndex = pages.findIndex((page) => page.id === fromId);
  const toIndex = pages.findIndex((page) => page.id === toId);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return pages;
  }

  const nextPages = [...pages];
  const [movedPage] = nextPages.splice(fromIndex, 1);
  nextPages.splice(toIndex, 0, movedPage);

  return nextPages.map((page, index) => ({
    ...page,
    displayOrder: index + 1,
  }));
}


export function isLocalPageId(id: string) {
  return id.startsWith("LOCAL-");
}


export function isRenderableAssetUrl(value?: string) {
  if (!value) {
    return false;
  }

  return /^(https?:\/\/|blob:|data:image\/)/.test(value);
}


export function normalizeAssetUrl(value: string | undefined, fallback = "") {
  return isRenderableAssetUrl(value) ? value! : fallback;
}


export function readFormString(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}


export function readFormNumber(form: FormData, key: string, fallback?: number) {
  const value = Number(readFormString(form, key));

  if (!Number.isFinite(value)) {
    return fallback;
  }

  return value;
}


export function splitIdList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}


export function openNativePicker(input: HTMLInputElement) {
  input.showPicker?.();
}


export function isPlayableVideoStatus(status: MediaStatus) {
  return status === "ACTIVE" || status === "HLS_READY";
}


export function isProcessingVideoStatus(status: MediaStatus) {
  return status === "PROCESSING" || status === "HLS_PROCESSING";
}


export function isBackendMediaTarget(
  media: ComicPage | MediaResponse,
): media is MediaResponse {
  return "mediaId" in media;
}


export function getMediaTargetId(media: ComicPage | MediaResponse) {
  return isBackendMediaTarget(media) ? media.mediaId : media.id;
}


export const FORCE_HIDDEN_REASON_TOOLTIP =
  "Tập nội dung này đã được duyệt/xuất bản trước đó nhưng hiện đang tạm ngừng hiển thị công khai theo quyết định của đội ngũ quản trị. Vui lòng liên hệ bộ phận hỗ trợ để được giải thích chi tiết.";
export function toDateTimeLocalValue(value?: string) {
  const source = value
    ? new Date(value)
    : new Date(Date.now() + 60 * 60 * 1000);
  const date = Number.isNaN(source.getTime())
    ? new Date(Date.now() + 60 * 60 * 1000)
    : source;
  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
