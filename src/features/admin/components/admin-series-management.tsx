"use client";

import {
  BookOpen,
  Eye,
  EyeOff,
  Film,
  Loader2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type AdminSeriesContentType,
  type AdminSeriesItem,
  type AdminSeriesStatus,
} from "@/features/admin/api/admin-series.api";
import {
  useGetAllSeries,
  useToggleSeriesVisibility,
} from "@/features/admin/hooks/use-admin-series";

type ConfirmAction = "hide" | "unhide";

const contentTypeStyles: Record<AdminSeriesContentType, string> = {
  VIDEO: "border-cyan-200 bg-cyan-50 text-cyan-700",
  COMIC: "border-amber-200 bg-amber-50 text-amber-700",
};

const statusStyles: Record<AdminSeriesStatus, string> = {
  DRAFT: "border-slate-200 bg-slate-100 text-slate-600",
  PUBLISHED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  HIDDEN: "border-yellow-200 bg-yellow-50 text-yellow-700",
  DELETED: "border-red-200 bg-red-50 text-red-700",
  SCHEDULED: "border-blue-200 bg-blue-50 text-blue-700",
  INACTIVE: "border-slate-200 bg-slate-100 text-slate-600",
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Thao tác thất bại.";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function ContentTypeBadge({ type }: { type: AdminSeriesContentType }) {
  const Icon = type === "VIDEO" ? Film : BookOpen;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${contentTypeStyles[type]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: AdminSeriesStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

function SeriesConfirmModal({
  action,
  isLoading,
  onClose,
  onConfirm,
  open,
  series,
}: {
  action: ConfirmAction | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  series: AdminSeriesItem | null;
}) {
  if (!open || !series || !action) return null;

  const title = action === "hide" ? "Ép Ẩn Tác phẩm?" : "Mở Ẩn Tác phẩm?";
  const description =
    action === "hide"
      ? "Tác phẩm sẽ bị ép ẩn khỏi các khu vực hiển thị công khai để xử lý vi phạm hoặc rà soát thêm."
      : "Tác phẩm sẽ được mở ẩn trở lại theo trạng thái backend cho phép.";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              <span className="font-bold text-slate-900">{series.title}</span>{" "}
              - {description}
            </p>
            {action === "hide" && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold leading-6 text-red-700">
                Lưu ý: Việc ép ẩn cấp độ Series sẽ vô hiệu hóa hoàn toàn quyền
                thao tác chỉnh sửa/upload/xóa của Creator lên các nội dung
                Season, Episode, Media bên trong.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {action === "hide" ? "Ép Ẩn" : "Mở Ẩn"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminSeriesManagement() {
  const seriesQuery = useGetAllSeries();
  const toggleVisibilityMutation = useToggleSeriesVisibility();
  const [selectedSeries, setSelectedSeries] = useState<AdminSeriesItem | null>(
    null,
  );
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const seriesList = seriesQuery.data ?? [];
  const isMutating = toggleVisibilityMutation.isPending;

  function openConfirm(series: AdminSeriesItem, action: ConfirmAction) {
    setSelectedSeries(series);
    setConfirmAction(action);
  }

  function closeConfirm() {
    if (isMutating) return;
    setSelectedSeries(null);
    setConfirmAction(null);
  }

  function handleConfirm() {
    if (!selectedSeries || !confirmAction) return;

    toggleVisibilityMutation.mutate(
      {
        id: selectedSeries.id,
        hidden: confirmAction === "unhide",
      },
      {
        onSuccess: () => {
          toast.success(
            confirmAction === "unhide"
              ? "Đã mở ẩn tác phẩm."
              : "Đã ép ẩn tác phẩm.",
          );
          setSelectedSeries(null);
          setConfirmAction(null);
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 bg-slate-50">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Quản lý Tác phẩm (Series)
        </h1>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
          Theo dõi toàn bộ phim bộ và truyện tranh trên hệ thống, xử lý ép
          ẩn/mở ẩn theo quyền đặc biệt của Admin khi có vi phạm.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Tên tác phẩm</th>
                <th className="px-6 py-4">Loại nội dung</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Lượt xem</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {seriesQuery.isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Đang tải danh sách tác phẩm...
                    </p>
                  </td>
                </tr>
              )}

              {seriesQuery.isError && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-14 text-center text-sm font-semibold text-red-600"
                  >
                    Không thể tải danh sách tác phẩm.
                  </td>
                </tr>
              )}

              {!seriesQuery.isLoading &&
                !seriesQuery.isError &&
                seriesList.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-14 text-center text-sm font-medium text-slate-500"
                    >
                      Chưa có tác phẩm nào trong hệ thống.
                    </td>
                  </tr>
                )}

              {seriesList.map((series) => {
                const isHidden = series.status === "HIDDEN";
                const isDeleted = series.status === "DELETED";

                return (
                  <tr key={series.id} className="transition hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-950">
                          {series.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          ID: {series.id}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <ContentTypeBadge type={series.contentType} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={series.status} />
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {formatNumber(series.views)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openConfirm(series, isHidden ? "unhide" : "hide")
                          }
                          disabled={isMutating || isDeleted}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-violet-50 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
                          title={isHidden ? "Mở ẩn" : "Ép ẩn"}
                        >
                          {isHidden ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <SeriesConfirmModal
        action={confirmAction}
        isLoading={isMutating}
        onClose={closeConfirm}
        onConfirm={handleConfirm}
        open={Boolean(confirmAction)}
        series={selectedSeries}
      />
    </div>
  );
}
