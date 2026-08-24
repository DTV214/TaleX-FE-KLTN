"use client";

import { useState } from "react";
import { useOverpaidOrders } from "../hooks/use-orders";
import { getItemTypeLabel } from "../utils/order-labels";

const PAGE_SIZE = 20;

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

export function OverpaidOrdersTable() {
  const [page, setPage] = useState(1);
  const overpaidQuery = useOverpaidOrders({ page, pageSize: PAGE_SIZE });
  const pageData = overpaidQuery.data?.data;
  const orders = pageData?.content ?? [];
  const totalElements = pageData?.totalElements ?? 0;
  const totalPages = Math.max(pageData?.totalPages ?? 1, 1);

  const firstItem = totalElements === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, totalElements);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
        Các đơn dưới đây có số tiền khách chuyển thừa qua SePay. Admin cần hoàn
        tiền thủ công bên ngoài hệ thống — danh sách này chỉ để theo dõi,
        chưa có cơ chế đánh dấu &quot;đã hoàn&quot;.
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/80 text-xs font-bold uppercase tracking-wider text-gray-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.03] backoffice-dark:text-zinc-400">
              <tr>
                <th className="px-5 py-4">Mã đơn</th>
                <th className="px-5 py-4">Người mua</th>
                <th className="px-5 py-4">Loại</th>
                <th className="px-5 py-4">Tổng phải trả</th>
                <th className="px-5 py-4">Tiền thừa</th>
                <th className="px-5 py-4">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 backoffice-dark:divide-white/5">
              {overpaidQuery.isLoading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm font-bold text-gray-500 backoffice-dark:text-zinc-400"
                  >
                    Đang tải...
                  </td>
                </tr>
              )}

              {!overpaidQuery.isLoading && orders.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm font-bold text-gray-500 backoffice-dark:text-zinc-400"
                  >
                    Không có đơn nào bị chuyển thừa tiền.
                  </td>
                </tr>
              )}

              {!overpaidQuery.isLoading &&
                orders.map((order) => (
                  <tr
                    key={order.orderId}
                    className="transition hover:bg-gray-50/80 backoffice-dark:hover:bg-white/[0.03]"
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
                    <td className="px-5 py-4 font-bold text-orange-600 backoffice-dark:text-orange-400">
                      {formatCurrency(order.overpaidAmount)}
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-gray-500 backoffice-dark:text-zinc-400">
                      {formatDate(order.createdAt)}
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
            <button
              type="button"
              disabled={page <= 1 || overpaidQuery.isLoading}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-zinc-200"
            >
              Trước
            </button>
            <span className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-black text-gray-700 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-zinc-200">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || overpaidQuery.isLoading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-zinc-200"
            >
              Sau
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
