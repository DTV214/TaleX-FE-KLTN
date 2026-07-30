"use client";

import {
  BarChart3,
  CalendarClock,
  Edit2,
  Loader2,
  Megaphone,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { Button } from "@/shared/ui/button";
import { parseBackendDate } from "@/shared/utils/backend-date";
import { cn } from "@/shared/utils/utils";
import {
  getAdminCampaignStatusClass,
  getAdminCampaignStatusLabel,
} from "../campaigns/components/campaign-status";
import { useDeleteAdminCampaign } from "../campaigns/hooks/use-admin-campaigns";
import type { AdminCampaign } from "../campaigns/types/campaigns.types";

type CampaignManagementTableProps = {
  campaigns: AdminCampaign[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  isLoading?: boolean;
  isError?: boolean;
  onPageChange: (page: number) => void;
  onEdit: (campaign: AdminCampaign) => void;
};

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Chưa có";
  }

  const parsedDate = parseBackendDate(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Chưa có";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

function shortenId(value?: string | null) {
  if (!value) {
    return "Chưa có";
  }

  return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-6)}` : value;
}

function getProgress(campaign: AdminCampaign) {
  const current = campaign.currentImpression ?? 0;
  const target = campaign.targetImpression ?? 0;

  if (target <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((current / target) * 100));
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index}>
          <td colSpan={6} className="px-5 py-4">
            <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
          </td>
        </tr>
      ))}
    </>
  );
}

function AnalyticsValue({
  label,
  value,
}: {
  label: string;
  value?: unknown;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs font-bold text-slate-600">
      <span className="text-slate-400">{label}</span>
      {typeof value === "number" ? formatNumber(value) : String(value ?? 0)}
    </span>
  );
}

export function CampaignManagementTable({
  campaigns,
  page,
  pageSize,
  totalPages,
  totalElements,
  isLoading = false,
  isError = false,
  onPageChange,
  onEdit,
}: CampaignManagementTableProps) {
  const deleteMutation = useDeleteAdminCampaign();
  const firstItem = totalElements === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalElements);

  async function handleDelete(campaign: AdminCampaign) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn hủy chiến dịch ${shortenId(campaign.campaignId)} không?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(campaign.campaignId);
      toast.success("Hủy chiến dịch thành công.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm text-gray-600">
          <thead className="border-b border-gray-100 bg-gray-50/80 text-xs font-bold uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-5 py-4">Chiến dịch</th>
              <th className="px-5 py-4">Tiến độ</th>
              <th className="px-5 py-4">Tương tác</th>
              <th className="px-5 py-4">Thời gian</th>
              <th className="px-5 py-4">Trạng thái</th>
              <th className="px-5 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && <TableSkeleton />}

            {!isLoading && isError && (
              <tr>
                <td colSpan={6} className="px-5 py-10">
                  <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                    Không thể tải danh sách chiến dịch. Vui lòng kiểm tra API
                    `/api/v1/campaigns`.
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && !isError && campaigns.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <div className="mx-auto flex max-w-md flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#E6F7F9] text-[#007A8A]">
                      <Megaphone className="h-6 w-6" />
                    </div>
                    <p className="mt-4 text-lg font-black text-gray-900">
                      Chưa có chiến dịch tương tác
                    </p>
                    <p className="mt-2 text-sm font-medium leading-6 text-gray-500">
                      Khi creator mua gói tăng tương tác, chiến dịch sẽ xuất
                      hiện tại đây để admin theo dõi, cập nhật hoặc hủy.
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              !isError &&
              campaigns.map((campaign) => {
                const progress = getProgress(campaign);
                const analyticData = campaign.analyticData ?? {};
                const isDeleting =
                  deleteMutation.isPending &&
                  deleteMutation.variables === campaign.campaignId;

                return (
                  <tr
                    key={campaign.campaignId}
                    className="transition hover:bg-gray-50/80"
                  >
                    <td className="px-5 py-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#E6F7F9] text-[#007A8A]">
                          <Megaphone className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-gray-900">
                            Campaign {shortenId(campaign.campaignId)}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-gray-500">
                            Order: {shortenId(campaign.orderId)}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-gray-500">
                            Service: {shortenId(campaign.engagementServiceId)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-5">
                      <div className="min-w-[180px]">
                        <div className="mb-2 flex items-center justify-between text-xs font-bold text-gray-500">
                          <span>{progress}%</span>
                          <span>
                            {formatNumber(campaign.currentImpression)} /{" "}
                            {formatNumber(campaign.targetImpression)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-[#007A8A] transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex max-w-xs flex-wrap gap-2">
                        <AnalyticsValue label="Views" value={analyticData.views} />
                        <AnalyticsValue label="Likes" value={analyticData.likes} />
                        <AnalyticsValue
                          label="Comments"
                          value={analyticData.comments}
                        />
                        <AnalyticsValue
                          label="Shares"
                          value={analyticData.shares}
                        />
                      </div>
                    </td>

                    <td className="px-5 py-5">
                      <div className="space-y-2 text-xs font-semibold text-gray-500">
                        <p className="flex items-center gap-2">
                          <CalendarClock className="h-4 w-4 text-[#007A8A]" />
                          Bắt đầu:{" "}
                          <span className="font-bold text-gray-800">
                            {formatDateTime(campaign.startAt)}
                          </span>
                        </p>
                        <p className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-[#7B42FF]" />
                          Cập nhật:{" "}
                          <span className="font-bold text-gray-800">
                            {formatDateTime(campaign.updatedAt)}
                          </span>
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-5">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-1 text-xs font-black",
                          getAdminCampaignStatusClass(campaign.status),
                        )}
                      >
                        {getAdminCampaignStatusLabel(campaign.status)}
                      </span>
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(campaign)}
                          className="border-gray-200 bg-white text-gray-700 hover:border-[#007A8A]/40 hover:bg-[#E6F7F9] hover:text-[#007A8A]"
                        >
                          <Edit2 className="h-4 w-4" />
                          Sửa
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={deleteMutation.isPending}
                          onClick={() => void handleDelete(campaign)}
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Hủy
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-gray-500">
          Hiển thị {firstItem}-{lastItem} / {totalElements} chiến dịch
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
