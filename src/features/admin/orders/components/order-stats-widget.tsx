"use client";

import { Ban, Clock3, DollarSign, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useOrderStats } from "../hooks/use-orders";
import { getItemTypeLabel } from "../utils/order-labels";

function formatVND(value = 0): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toIsoDateTime(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function defaultFrom(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  date.setHours(0, 0, 0, 0);
  return toIsoDateTime(date);
}

function defaultTo(): string {
  const date = new Date();
  date.setHours(23, 59, 59, 0);
  return toIsoDateTime(date);
}

export function OrderStatsWidget() {
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());

  const statsQuery = useOrderStats({ from, to });
  const stats = statsQuery.data?.data;

  const chartData = useMemo(() => {
    return (stats?.revenueByItemType ?? []).map((item) => ({
      itemType: getItemTypeLabel(item.itemType),
      "Doanh thu": item.totalRevenue,
    }));
  }, [stats]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500 backoffice-dark:text-zinc-400">
            Từ ngày
          </span>
          <input
            type="datetime-local"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500 backoffice-dark:text-zinc-400">
            Đến ngày
          </span>
          <input
            type="datetime-local"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
          />
        </label>
      </div>

      {statsQuery.isLoading && (
        <div className="py-8 text-center text-xs font-medium text-gray-400">
          Đang tải thống kê...
        </div>
      )}

      {statsQuery.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          Không thể tải thống kê đơn hàng.
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={ShoppingCart}
              iconClass="bg-violet-50 text-violet-600 backoffice-dark:bg-violet-500/20 backoffice-dark:text-violet-300"
              label="Tổng đơn"
              value={stats.totalOrders.toLocaleString("vi-VN")}
            />
            <StatCard
              icon={DollarSign}
              iconClass="bg-emerald-50 text-emerald-600 backoffice-dark:bg-emerald-500/20 backoffice-dark:text-emerald-300"
              label="Đơn hoàn tất"
              value={(stats.countByStatus.COMPLETED ?? 0).toLocaleString(
                "vi-VN",
              )}
            />
            <StatCard
              icon={Ban}
              iconClass="bg-slate-100 text-slate-600 backoffice-dark:bg-white/10 backoffice-dark:text-white/70"
              label="Tỷ lệ hủy"
              value={`${stats.cancelledRatePercent.toFixed(1)}%`}
            />
            <StatCard
              icon={Clock3}
              iconClass="bg-red-50 text-red-600 backoffice-dark:bg-red-500/20 backoffice-dark:text-red-300"
              label="Tỷ lệ hết hạn"
              value={`${stats.expiredRatePercent.toFixed(1)}%`}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
            <h3 className="mb-4 text-sm font-bold text-gray-900 backoffice-dark:text-white">
              Doanh thu theo loại đơn (đã hoàn tất)
            </h3>
            {chartData.length === 0 ? (
              <p className="py-8 text-center text-xs font-medium text-gray-400">
                Không có doanh thu trong khoảng thời gian này.
              </p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="itemType" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value: number) => formatVND(value)}
                      width={90}
                    />
                    <Tooltip formatter={(value) => formatVND(Number(value))} />
                    <Bar dataKey="Doanh thu" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  iconClass,
  label,
  value,
}: {
  icon: typeof ShoppingCart;
  iconClass: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 backoffice-dark:text-white/60">
        {label}
      </p>
      <h3 className="text-xl font-bold text-gray-900 backoffice-dark:text-white">
        {value}
      </h3>
    </div>
  );
}
