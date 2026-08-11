"use client";

import { Edit2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { useDeleteEngagementService } from "../hooks/use-engagement-services";
import type { EngagementService } from "../types/engagement-services.types";

type EngagementServicesTableProps = {
  services: EngagementService[];
  isLoading?: boolean;
  isError?: boolean;
  onEdit: (service: EngagementService) => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-6">
      {[0, 1, 2, 3, 4].map((item) => (
        <div key={item} className="h-14 animate-pulse rounded-lg bg-slate-100 backoffice-dark:bg-white/10" />
      ))}
    </div>
  );
}

export function EngagementServicesTable({
  services,
  isLoading = false,
  isError = false,
  onEdit,
}: EngagementServicesTableProps) {
  const deleteMutation = useDeleteEngagementService();

  async function handleDelete(service: EngagementService) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa dịch vụ "${service.name}" không?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(service.engagementServiceId);
      toast.success("Xóa dịch vụ tương tác thành công.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
      {isLoading && <TableSkeleton />}

      {!isLoading && isError && (
        <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
          Không thể tải danh sách dịch vụ tương tác. Vui lòng thử lại sau.
        </div>
      )}

      {!isLoading && !isError && services.length === 0 && (
        <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
          <p className="text-lg font-black text-slate-900 backoffice-dark:text-white">
            Chưa có dịch vụ tương tác
          </p>
          <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500 backoffice-dark:text-white/55">
            Tạo dịch vụ đầu tiên để admin có thể cấu hình gói đẩy tương tác cho
            nội dung TaleX.
          </p>
        </div>
      )}

      {!isLoading && !isError && services.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/5">
              <tr className="text-xs font-black uppercase tracking-wider text-slate-500 backoffice-dark:text-white/45">
                <th className="px-6 py-4">Tên gói</th>
                <th className="px-6 py-4">Giá tiền</th>
                <th className="px-6 py-4">Target Value</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="w-[240px] px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white backoffice-dark:divide-white/10 backoffice-dark:bg-transparent">
              {services.map((service) => {
                const isDeleting =
                  deleteMutation.isPending &&
                  deleteMutation.variables === service.engagementServiceId;

                return (
                  <tr
                    key={service.engagementServiceId}
                    className="transition hover:bg-slate-50/80 backoffice-dark:hover:bg-white/[0.05]"
                  >
                    <td className="max-w-sm px-6 py-4">
                      <p className="truncate text-sm font-black text-slate-900">
                        {service.name}
                      </p>
                      <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-500">
                        {service.description}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900">
                      {formatCurrency(service.price)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">
                      {service.targetValue}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={
                          service.isActive
                            ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700"
                            : "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500"
                        }
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${service.isActive ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                        />
                        {service.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => onEdit(service)}
                          className="h-9 border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
                        >
                          <Edit2 className="h-4 w-4" />
                          Sửa
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={deleteMutation.isPending}
                          onClick={() => void handleDelete(service)}
                          className="h-9 border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 hover:border-red-300 hover:bg-red-100 hover:text-red-800 disabled:opacity-70"
                          aria-label={`Xóa dịch vụ ${service.name}`}
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          {isDeleting ? "Đang xóa" : "Xóa"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
