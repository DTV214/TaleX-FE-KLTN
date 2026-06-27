"use client";

import axios from "axios";
import { AlertCircle, Edit2, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import type { BaseResponse } from "@/shared/api/http-client";
import type { CreatorTier } from "../types/creator-tiers.types";
import { useDeleteTier } from "../hooks/use-creator-tiers";

type CreatorTiersTableProps = {
  tiers: CreatorTier[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onEdit: (tier: CreatorTier) => void;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatRatio(value: number) {
  return `${Math.round(value * 100)}%`;
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

function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<BaseResponse<unknown>>(error)) {
    return error.response?.data?.message || error.message;
  }

  return error instanceof Error ? error.message : "Không thể xóa cấp Creator.";
}

export function CreatorTiersTable({
  tiers,
  page,
  pageSize,
  totalPages,
  totalElements,
  isLoading = false,
  onPageChange,
  onEdit,
}: CreatorTiersTableProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteTier();

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToastMessage(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  async function handleDelete(tier: CreatorTier) {
    const confirmed = window.confirm(
      `Xóa mềm cấp Creator "${tier.tierName}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(tier.creatorTierId);
    } catch (error) {
      setToastMessage(getApiErrorMessage(error));
    }
  }

  const firstItem = totalElements === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalElements);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {toastMessage && (
        <div className="fixed right-6 top-6 z-50 flex max-w-md items-start gap-3 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 shadow-2xl">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/80 text-xs font-bold uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-5 py-4">Tier</th>
              <th className="px-5 py-4">Level</th>
              <th className="px-5 py-4">Điều kiện</th>
              <th className="px-5 py-4">Chia sẻ doanh thu</th>
              <th className="px-5 py-4">Mặc định</th>
              <th className="px-5 py-4">Cập nhật</th>
              <th className="px-5 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải cấp Creator...
                  </span>
                </td>
              </tr>
            )}

            {!isLoading && tiers.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                >
                  Chưa có cấp Creator nào.
                </td>
              </tr>
            )}

            {!isLoading &&
              tiers.map((tier) => (
                <tr
                  key={tier.creatorTierId}
                  className="transition hover:bg-gray-50/80"
                >
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-black text-gray-900">
                        {tier.tierName}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#E6F7F9] px-2 text-sm font-black text-[#007A8A]">
                      {tier.tierLevel}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1 text-xs font-semibold text-gray-600">
                      <p>{formatNumber(tier.minFollowerRequired)} followers</p>
                      <p>{formatNumber(tier.minViewsRequired)} views</p>
                      <p>
                        {formatNumber(tier.minWatchTimeRequired)} giờ watch time
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1 text-xs font-bold text-gray-700">
                      <p>
                        Quỹ Premium: {formatRatio(tier.premiumFundShareRatio)}
                      </p>
                      <p>
                        Mua trực tiếp:{" "}
                        {formatRatio(tier.directPurchaseShareRatio)}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={
                        tier.isDefault
                          ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700"
                          : "inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-500"
                      }
                    >
                      {tier.isDefault ? "Mặc định" : "Tùy chỉnh"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-gray-500">
                    {formatDate(tier.updatedAt)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-gray-200 bg-white text-gray-700 hover:border-[#007A8A]/40 hover:bg-[#E6F7F9] hover:text-[#007A8A]"
                        onClick={() => onEdit(tier)}
                      >
                        <Edit2 className="h-4 w-4" />
                        Sửa
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        onClick={() => handleDelete(tier)}
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

      <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-gray-500">
          Hiển thị {firstItem}-{lastItem} / {totalElements} tiers
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
          >
            Trước
          </Button>
          <span className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-black text-gray-700 shadow-sm">
            {page} / {Math.max(totalPages, 1)}
          </span>
          <Button
            type="button"
            variant="outline"
            className="border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900"
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
