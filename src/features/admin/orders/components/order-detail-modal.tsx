"use client";

import { Calendar, Copy, CreditCard, Receipt, User, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/utils/utils";
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

function shortenId(value: string) {
  return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}

function handleCopy(value: string, label: string) {
  navigator.clipboard.writeText(value);
  toast.success(`Đã sao chép ${label}`);
}

function CopyableId({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 backoffice-dark:border-white/5 backoffice-dark:bg-white/5">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="truncate font-mono text-xs font-bold text-slate-700 backoffice-dark:text-white/90">
          {shortenId(value)}
        </p>
      </div>
      <button
        type="button"
        onClick={() => handleCopy(value, label.toLowerCase())}
        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
        aria-label={`Sao chép ${label}`}
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function PaymentRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0 backoffice-dark:border-white/5">
      <span className="text-xs font-semibold text-slate-500 backoffice-dark:text-zinc-400">
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-bold text-slate-800 backoffice-dark:text-white/90",
          highlight && "text-orange-600 backoffice-dark:text-orange-400",
        )}
      >
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

  const hasOverpaid = Boolean(order.overpaidAmount && order.overpaidAmount > 0);

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_30px_100px_rgba(0,0,0,0.25)] animate-in fade-in zoom-in-95 duration-200 backoffice-dark:border-white/10 backoffice-dark:bg-[#141414]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-4 backoffice-dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-600 backoffice-dark:border-[var(--backoffice-primary)]/30 backoffice-dark:bg-[var(--backoffice-primary)]/10 backoffice-dark:text-[var(--backoffice-primary)]">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 backoffice-dark:text-white">
                Chi tiết đơn hàng
              </h2>
              <p className="mt-0.5 font-mono text-xs font-bold text-violet-600 backoffice-dark:text-violet-400">
                {order.paymentCode}
              </p>
            </div>
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
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Hero: total amount + buyer */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 backoffice-dark:border-white/10 backoffice-dark:bg-white/5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Tổng tiền &middot; {getItemTypeLabel(order.itemType)}
            </p>
            <p className="mt-1 text-2xl font-black text-violet-600 backoffice-dark:text-[var(--backoffice-primary)]">
              {formatCurrency(order.totalAmount)}
            </p>
          </div>
          <div className="flex items-center gap-2.5 text-right">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Người mua
              </p>
              <p className="font-bold text-slate-800 backoffice-dark:text-white">
                {order.buyerUsername ?? "-"}
              </p>
              <p className="text-xs text-slate-500 backoffice-dark:text-zinc-400">
                {order.buyerEmail ?? "-"}
              </p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm backoffice-dark:bg-black/30 backoffice-dark:text-zinc-500">
              <User className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Payment breakdown */}
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 backoffice-dark:text-zinc-400">
              Chi tiết thanh toán
            </h3>
          </div>
          <div className="rounded-2xl border border-slate-100 px-4 backoffice-dark:border-white/5">
            <PaymentRow label="Coin đã dùng" value={String(order.coinAmount ?? 0)} />
            <PaymentRow label="Tiền mặt (SePay)" value={formatCurrency(order.fiatAmount)} />
            <PaymentRow label="Campaign Wallet" value={formatCurrency(order.campaignWalletAmount)} />
            <PaymentRow label="VAT" value={formatCurrency(order.vatAmount)} />
            {hasOverpaid && (
              <PaymentRow
                label="Tiền thừa"
                value={formatCurrency(order.overpaidAmount)}
                highlight
              />
            )}
          </div>
        </div>

        {/* IDs */}
        <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <CopyableId label="Mã đơn" value={order.orderId} />
          <CopyableId label="ID nội dung" value={order.itemId} />
        </div>

        {/* Timeline */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 backoffice-dark:text-zinc-400">
              Thời gian
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 text-xs">
            <TimelineField label="Ngày tạo" value={formatDate(order.createdAt)} />
            <TimelineField label="Cập nhật lúc" value={formatDate(order.updatedAt)} />
            <TimelineField label="Hạn thanh toán" value={formatDate(order.expiresAt)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2 backoffice-dark:border-white/5 backoffice-dark:bg-white/[0.02]">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 font-semibold text-slate-700 backoffice-dark:text-white/80">
        {value}
      </p>
    </div>
  );
}
