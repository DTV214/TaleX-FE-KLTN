"use client";

import { Ban, CheckCircle2, Eye, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import type { AdminOrderListItem, OrderStatus } from "../types/orders.types";
import {
  STATUS_BADGE_CLASS,
  STATUS_LABELS,
  canInterveneOrder,
  getItemTypeLabel,
} from "../utils/order-labels";

type OrdersTableProps = {
  orders: AdminOrderListItem[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onViewDetail: (order: AdminOrderListItem) => void;
  onCancel: (order: AdminOrderListItem) => void;
  onForceComplete: (order: AdminOrderListItem) => void;
};

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

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_BADGE_CLASS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function OrdersTable({
  orders,
  page,
  pageSize,
  totalPages,
  totalElements,
  isLoading = false,
  onPageChange,
  onViewDetail,
  onCancel,
  onForceComplete,
}: OrdersTableProps) {
  const firstItem = totalElements === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalElements);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/80 text-xs font-bold uppercase tracking-wider text-gray-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.03] backoffice-dark:text-zinc-400">
            <tr>
              <th className="px-5 py-4">Mã đơn</th>
              <th className="px-5 py-4">Người mua</th>
              <th className="px-5 py-4">Loại</th>
              <th className="px-5 py-4">Tổng tiền</th>
              <th className="px-5 py-4">Trạng thái</th>
              <th className="px-5 py-4">Tiền thừa</th>
              <th className="px-5 py-4">Ngày tạo</th>
              <th className="px-5 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 backoffice-dark:divide-white/5">
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center">
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 backoffice-dark:text-zinc-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải đơn hàng...
                  </span>
                </td>
              </tr>
            )}

            {!isLoading && orders.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-12 text-center text-sm font-bold text-gray-500 backoffice-dark:text-zinc-400"
                >
                  Không có đơn hàng nào khớp bộ lọc.
                </td>
              </tr>
            )}

            {!isLoading &&
              orders.map((order) => (
                <tr
                  key={order.orderId}
                  className="cursor-pointer transition hover:bg-gray-50/80 backoffice-dark:hover:bg-white/[0.03]"
                  onClick={() => onViewDetail(order)}
                >
                  <td className="px-5 py-4 font-mono text-xs font-bold text-gray-900 backoffice-dark:text-white">
                    {order.paymentCode}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-gray-900 backoffice-dark:text-white">
                      {order.buyerUsername ?? "-"}
                    </p>
                    <p className="text-xs font-semibold text-gray-500 backoffice-dark:text-zinc-400">
                      {order.buyerEmail ?? "-"}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-700 backoffice-dark:text-zinc-300">
                    {getItemTypeLabel(order.itemType)}
                  </td>
                  <td className="px-5 py-4 font-bold text-violet-600 backoffice-dark:text-violet-400">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-4 text-sm font-bold">
                    {order.overpaidAmount && order.overpaidAmount > 0 ? (
                      <span className="text-orange-600 backoffice-dark:text-orange-400">
                        {formatCurrency(order.overpaidAmount)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-gray-500 backoffice-dark:text-zinc-400">
                    {formatDate(order.createdAt)}
                  </td>
                  <td
                    className="px-5 py-4"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetail(order)}
                        aria-label="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canInterveneOrder(order.status) && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                            onClick={() => onForceComplete(order)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Hoàn tất
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => onCancel(order)}
                          >
                            <Ban className="h-4 w-4" />
                            Hủy
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between backoffice-dark:border-white/10 backoffice-dark:bg-transparent">
        <p className="text-sm font-semibold text-gray-500 backoffice-dark:text-zinc-400">
          Hiển thị {firstItem}-{lastItem} / {totalElements} đơn
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-zinc-200 backoffice-dark:hover:bg-white/10"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
          >
            Trước
          </Button>
          <span className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-black text-gray-700 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-zinc-200">
            {page} / {Math.max(totalPages, 1)}
          </span>
          <Button
            type="button"
            variant="outline"
            className="border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-zinc-200 backoffice-dark:hover:bg-white/10"
            disabled={page >= totalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
          >
            Sau
          </Button>
        </div>
      </div>
    </section>
  );
}
