import type { OrderStatus } from "../types/orders.types";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "Chờ thanh toán",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
  OUT_OF_TIME: "Hết hạn",
};

export const STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  AWAITING_PAYMENT:
    "border-amber-200 bg-amber-50 text-amber-700 backoffice-dark:border-amber-500/30 backoffice-dark:bg-amber-500/10 backoffice-dark:text-amber-400",
  COMPLETED:
    "border-emerald-200 bg-emerald-50 text-emerald-700 backoffice-dark:border-emerald-500/30 backoffice-dark:bg-emerald-500/10 backoffice-dark:text-emerald-400",
  CANCELLED:
    "border-slate-200 bg-slate-100 text-slate-600 backoffice-dark:border-white/10 backoffice-dark:bg-white/5 backoffice-dark:text-white/50",
  OUT_OF_TIME:
    "border-red-200 bg-red-50 text-red-700 backoffice-dark:border-red-500/30 backoffice-dark:bg-red-500/10 backoffice-dark:text-red-400",
};

export const ITEM_TYPE_LABELS: Record<string, string> = {
  SUBSCRIPTION: "Gói Premium",
  EPISODE: "Tập lẻ",
  COMBO: "Combo",
  ENGAGEMENT: "Dịch vụ tương tác",
};

export function getItemTypeLabel(itemType: string): string {
  return ITEM_TYPE_LABELS[itemType] ?? itemType;
}
