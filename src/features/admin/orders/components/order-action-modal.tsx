"use client";

import { AlertTriangle, Ban, CheckCircle2, Loader2, X } from "lucide-react";
import { useState } from "react";
import type { AdminOrderListItem } from "../types/orders.types";
import { STATUS_LABELS } from "../utils/order-labels";

export type OrderActionMode = "cancel" | "forceComplete";

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

const MODE_CONFIG: Record<
  OrderActionMode,
  {
    title: string;
    icon: typeof Ban;
    warning: string;
    reasonPlaceholder: string;
    confirmLabel: string;
    confirmClass: string;
    borderClass: string;
    titleClass: string;
  }
> = {
  cancel: {
    title: "Hủy đơn hàng",
    icon: Ban,
    warning:
      "Đơn sẽ chuyển sang trạng thái Đã hủy. Coin/Campaign Wallet đã áp (nếu có) sẽ được hoàn trả tự động. Hành động này được ghi vào nhật ký can thiệp.",
    reasonPlaceholder: "VD: Khách yêu cầu hủy, đã liên hệ xác nhận qua...",
    confirmLabel: "Xác nhận hủy đơn",
    confirmClass: "bg-red-600 hover:bg-red-700",
    borderClass: "border-red-200",
    titleClass: "text-red-700",
  },
  forceComplete: {
    title: "Đánh dấu hoàn tất thủ công",
    icon: CheckCircle2,
    warning:
      "CHỈ dùng khi đã xác nhận chắc chắn tiền đã về (VD: đã đối chiếu sao kê ngân hàng) nhưng hệ thống không tự ghi nhận được. Hành động này sẽ mở khóa nội dung/kích hoạt gói và ghi nhận doanh thu ngay lập tức, không thể hoàn tác qua giao diện này.",
    reasonPlaceholder: "VD: Đã đối chiếu sao kê ngân hàng ngày ..., giao dịch mã ...",
    confirmLabel: "Xác nhận hoàn tất",
    confirmClass: "bg-emerald-600 hover:bg-emerald-700",
    borderClass: "border-emerald-200",
    titleClass: "text-emerald-700",
  },
};

export function OrderActionModal({
  mode,
  order,
  open,
  isLoading,
  errorMessage,
  onClose,
  onConfirm,
}: {
  mode: OrderActionMode;
  order: AdminOrderListItem | null;
  open: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  if (!open || !order) {
    return null;
  }

  const config = MODE_CONFIG[mode];
  const Icon = config.icon;
  const canConfirm = reason.trim().length > 0;

  function handleClose() {
    setReason("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-2xl border-2 ${config.borderClass} bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className={`flex items-center gap-2 text-xl font-bold ${config.titleClass}`}>
              <Icon className="h-5 w-5" />
              {config.title}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {config.warning}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Mã đơn
            </p>
            <p className="mt-0.5 font-mono font-bold text-slate-900">
              {order.paymentCode}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Trạng thái hiện tại
            </p>
            <p className="mt-0.5 font-bold text-slate-900">
              {STATUS_LABELS[order.status]}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Tổng tiền
            </p>
            <p className="mt-0.5 font-bold text-slate-900">
              {formatCurrency(order.totalAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Người mua
            </p>
            <p className="mt-0.5 font-bold text-slate-900">
              {order.buyerUsername ?? "-"}
            </p>
          </div>
        </div>

        {mode === "forceComplete" && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Chỉ xác nhận khi chắc chắn tiền đã về tài khoản.
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Lý do (bắt buộc, ghi vào nhật ký can thiệp)
          </label>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={isLoading}
            rows={3}
            placeholder={config.reasonPlaceholder}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {errorMessage && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {errorMessage}
          </p>
        )}

        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason.trim())}
            disabled={isLoading || !canConfirm}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${config.confirmClass}`}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
