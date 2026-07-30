import type { AdminCampaignStatus } from "../types/campaigns.types";

export const adminCampaignStatusOptions: Array<{
  value: AdminCampaignStatus;
  label: string;
}> = [
  { value: "PENDING", label: "Đang chờ" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "RUNNING", label: "Đang phân phối" },
  { value: "COMPLETED", label: "Hoàn tất" },
  { value: "PAUSED", label: "Tạm dừng" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "FAILED", label: "Thất bại" },
];

export function getAdminCampaignStatusLabel(
  status?: AdminCampaignStatus | null,
) {
  if (!status) {
    return "Chưa rõ";
  }

  return (
    adminCampaignStatusOptions.find((option) => option.value === status)
      ?.label ?? status
  );
}

export function getAdminCampaignStatusClass(
  status?: AdminCampaignStatus | null,
) {
  switch (status) {
    case "ACTIVE":
    case "RUNNING":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "COMPLETED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "PAUSED":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "CANCELLED":
    case "FAILED":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}
