"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import type { AdminOrderDetail } from "../types/orders.types";
import {
  STATUS_BADGE_CLASS,
  STATUS_LABELS,
  getItemTypeLabel,
} from "../utils/order-labels";

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

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0 backoffice-dark:border-white/5">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="text-right text-sm font-bold text-slate-900 backoffice-dark:text-white">
        {value}
      </span>
    </div>
  );
}

export function OrderDetailModal({
  order,
  open,
  onClose,
}: {
  order: AdminOrderDetail | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !order) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 backoffice-dark:border-white/10 backoffice-dark:bg-[#141414]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 backoffice-dark:text-white">
              Chi tiết đơn hàng
            </h2>
            <p className="mt-1 font-mono text-sm font-bold text-violet-600 backoffice-dark:text-violet-400">
              {order.paymentCode}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_BADGE_CLASS[order.status]}`}
            >
              {STATUS_LABELS[order.status]}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          <DetailRow label="Mã đơn" value={order.orderId} />
          <DetailRow label="Người mua" value={order.buyerUsername ?? "-"} />
          <DetailRow label="Email" value={order.buyerEmail ?? "-"} />
          <DetailRow label="Loại đơn" value={getItemTypeLabel(order.itemType)} />
          <DetailRow label="ID nội dung" value={order.itemId} />
          <DetailRow label="Tổng tiền" value={formatCurrency(order.totalAmount)} />
          <DetailRow label="Coin đã dùng" value={order.coinAmount ?? 0} />
          <DetailRow
            label="Tiền mặt (SePay)"
            value={formatCurrency(order.fiatAmount)}
          />
          <DetailRow
            label="Campaign Wallet"
            value={formatCurrency(order.campaignWalletAmount)}
          />
          <DetailRow label="VAT" value={formatCurrency(order.vatAmount)} />
          <DetailRow
            label="Tiền thừa"
            value={
              order.overpaidAmount && order.overpaidAmount > 0 ? (
                <span className="text-orange-600 backoffice-dark:text-orange-400">
                  {formatCurrency(order.overpaidAmount)}
                </span>
              ) : (
                "-"
              )
            }
          />
          <DetailRow label="Ngày tạo" value={formatDate(order.createdAt)} />
          <DetailRow label="Cập nhật lúc" value={formatDate(order.updatedAt)} />
          <DetailRow label="Hạn thanh toán" value={formatDate(order.expiresAt)} />
        </div>
      </div>
    </div>
  );
}
