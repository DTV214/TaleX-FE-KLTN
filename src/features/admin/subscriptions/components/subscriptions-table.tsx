"use client";

import axios from "axios";
import { AlertCircle, Check, Edit2, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import type { BaseResponse } from "@/shared/api/http-client";
import type { Subscription } from "../types/subscriptions.types";
import { useDeleteSubscription } from "../hooks/use-subscriptions";

type SubscriptionsTableProps = {
  subscriptions: Subscription[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onEdit: (subscription: Subscription) => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(subscription: Subscription) {
  const unitMap: Record<string, string> = {
    Days: "ngày",
    Months: "tháng",
    Years: "năm",
    DAYS: "ngày",
    MONTHS: "tháng",
    YEARS: "năm",
    DAY: "ngày",
    MONTH: "tháng",
    YEAR: "năm",
  };

  return `${subscription.duration} ${
    unitMap[subscription.durationUnit] ?? subscription.durationUnit
  }`;
}

function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<BaseResponse<unknown>>(error)) {
    return error.response?.data?.message || error.message;
  }

  return error instanceof Error ? error.message : "Không thể xóa gói Premium.";
}

function BenefitIcon({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <span
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${
        enabled
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 backoffice-dark:border-emerald-500/30 backoffice-dark:bg-emerald-500/10 backoffice-dark:text-emerald-400"
          : "border-slate-200 bg-slate-100 text-slate-400 backoffice-dark:border-white/10 backoffice-dark:bg-white/5 backoffice-dark:text-white/30"
      }`}
    >
      {enabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
    </span>
  );
}

export function SubscriptionsTable({
  subscriptions,
  page,
  pageSize,
  totalPages,
  totalElements,
  isLoading = false,
  onPageChange,
  onEdit,
}: SubscriptionsTableProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteSubscription();

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToastMessage(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  async function handleDelete(subscription: Subscription) {
    const confirmed = window.confirm(`Xóa gói Premium "${subscription.tier}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(subscription.subscriptionId);
    } catch (error) {
      setToastMessage(getApiErrorMessage(error));
    }
  }

  const firstItem = totalElements === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalElements);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
      {toastMessage && (
        <div className="fixed right-6 top-6 z-50 flex max-w-md items-start gap-3 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 shadow-2xl backoffice-dark:border-red-500/30 backoffice-dark:bg-red-950 backoffice-dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/80 text-xs font-bold uppercase tracking-wider text-gray-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.03] backoffice-dark:text-zinc-400">
            <tr>
              <th className="px-5 py-4">Gói</th>
              <th className="px-5 py-4">Giá</th>
              <th className="px-5 py-4">Thời hạn</th>
              <th className="px-5 py-4">Quyền lợi</th>
              <th className="px-5 py-4">Lượt mua</th>
              <th className="px-5 py-4">Cập nhật</th>
              <th className="px-5 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 backoffice-dark:divide-white/5">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 backoffice-dark:text-zinc-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải gói Premium...
                  </span>
                </td>
              </tr>
            )}

            {!isLoading && subscriptions.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-12 text-center text-sm font-bold text-gray-500 backoffice-dark:text-zinc-400"
                >
                  Chưa có gói Premium nào.
                </td>
              </tr>
            )}

            {!isLoading &&
              subscriptions.map((subscription) => (
                <tr
                  key={subscription.subscriptionId}
                  className="transition hover:bg-gray-50/80 backoffice-dark:hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-black text-gray-900 backoffice-dark:text-white">
                        {subscription.tier}
                      </p>
                      <p className="mt-1 max-w-xs truncate text-xs font-semibold text-gray-500 backoffice-dark:text-zinc-400">
                        {subscription.description || "Không có mô tả"}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-bold text-violet-600 backoffice-dark:text-violet-400">
                    {formatCurrency(subscription.price)}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-700 backoffice-dark:text-zinc-300">
                    {formatDuration(subscription)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <BenefitIcon
                        enabled={subscription.isAdBlocked}
                        label="Chặn quảng cáo"
                      />
                      <BenefitIcon
                        enabled={subscription.isMovieUnlocked}
                        label="Mở khóa phim"
                      />
                      <BenefitIcon
                        enabled={subscription.isStoryUnlocked}
                        label="Mở khóa truyện"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-gray-900 backoffice-dark:text-zinc-200">
                    {(subscription.totalPurchases || 0).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-gray-500 backoffice-dark:text-zinc-400">
                    {formatDate(subscription.updatedAt)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-gray-200 bg-white text-gray-700 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
                        onClick={() => onEdit(subscription)}
                      >
                        <Edit2 className="h-4 w-4" />
                        Sửa
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        onClick={() => handleDelete(subscription)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between backoffice-dark:border-white/10 backoffice-dark:bg-transparent">
        <p className="text-sm font-semibold text-gray-500 backoffice-dark:text-zinc-400">
          Hiển thị {firstItem}-{lastItem} / {totalElements} gói
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
