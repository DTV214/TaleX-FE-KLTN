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
      return "border-emerald-200 bg-emerald-50 text-emerald-700 backoffice-dark:border-emerald-500/30 backoffice-dark:bg-emerald-500/10 backoffice-dark:text-emerald-400";
    case "COMPLETED":
      return "border-sky-200 bg-sky-50 text-sky-700 backoffice-dark:border-sky-500/30 backoffice-dark:bg-sky-500/10 backoffice-dark:text-sky-400";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700 backoffice-dark:border-amber-500/30 backoffice-dark:bg-amber-500/10 backoffice-dark:text-amber-400";
    case "PAUSED":
      return "border-orange-200 bg-orange-50 text-orange-700 backoffice-dark:border-orange-500/30 backoffice-dark:bg-orange-500/10 backoffice-dark:text-orange-400";
    case "CANCELLED":
    case "FAILED":
      return "border-red-200 bg-red-50 text-red-700 backoffice-dark:border-red-500/30 backoffice-dark:bg-red-500/10 backoffice-dark:text-red-400";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600 backoffice-dark:border-white/10 backoffice-dark:bg-white/5 backoffice-dark:text-white/60";
  }
}
