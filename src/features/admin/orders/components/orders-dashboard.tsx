"use client";

import axios from "axios";
import { ChevronDown, Filter, RefreshCw, RotateCcw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import type { BaseResponse } from "@/shared/api/http-client";
import type {
  AdminOrderDetail,
  AdminOrderListItem,
  OrderItemType,
  OrderSearchParams,
  OrderStatus,
} from "../types/orders.types";
import {
  useCancelOrder,
  useForceCompleteOrder,
  useOrderDetail,
  useSearchOrders,
} from "../hooks/use-orders";
import type { OrderActionMode } from "./order-action-modal";
import { OrderActionModal } from "./order-action-modal";
import { OrderDetailModal } from "./order-detail-modal";
import { OrderStatsWidget } from "./order-stats-widget";
import { OrdersTable } from "./orders-table";
import { OverpaidOrdersTable } from "./overpaid-orders-table";

const DEFAULT_PAGE_SIZE = 20;

type StatusFilter = "ALL" | OrderStatus;
type ItemTypeFilter = "ALL" | OrderItemType;
type DashboardTab = "all" | "overpaid" | "stats";

const TABS: Array<{ key: DashboardTab; label: string }> = [
  { key: "all", label: "Tất cả đơn" },
  { key: "overpaid", label: "Tiền thừa" },
  { key: "stats", label: "Thống kê" },
];

function toOptionalDateTime(value: string) {
  return value.trim() || undefined;
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<BaseResponse<unknown>>(error)) {
    return error.response?.data?.message || error.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
}

export function OrdersDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("all");
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [itemType, setItemType] = useState<ItemTypeFilter>("ALL");
  const [createdAtFrom, setCreatedAtFrom] = useState("");
  const [createdAtTo, setCreatedAtTo] = useState("");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<{
    mode: OrderActionMode;
    order: AdminOrderListItem;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setKeyword(searchDraft);
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchDraft]);

  const filters = useMemo<OrderSearchParams>(() => {
    const trimmedKeyword = keyword.trim();
    const parsedCreatedAtFrom = toOptionalDateTime(createdAtFrom);
    const parsedCreatedAtTo = toOptionalDateTime(createdAtTo);

    return {
      ...(status !== "ALL" ? { status } : {}),
      ...(itemType !== "ALL" ? { itemType } : {}),
      ...(trimmedKeyword ? { keyword: trimmedKeyword } : {}),
      ...(parsedCreatedAtFrom ? { createdAtFrom: parsedCreatedAtFrom } : {}),
      ...(parsedCreatedAtTo ? { createdAtTo: parsedCreatedAtTo } : {}),
      page,
      pageSize: DEFAULT_PAGE_SIZE,
    };
  }, [createdAtFrom, createdAtTo, itemType, keyword, page, status]);

  const activeFilterCount = useMemo(() => {
    return [
      status !== "ALL",
      itemType !== "ALL",
      createdAtFrom.trim(),
      createdAtTo.trim(),
    ].filter(Boolean).length;
  }, [createdAtFrom, createdAtTo, itemType, status]);

  const ordersQuery = useSearchOrders(filters);
  const pageData = ordersQuery.data?.data;
  const orders = pageData?.content ?? [];

  const detailQuery = useOrderDetail(detailOrderId ?? "");
  const detail: AdminOrderDetail | null = detailQuery.data?.data ?? null;

  const cancelMutation = useCancelOrder();
  const forceCompleteMutation = useForceCompleteOrder();
  const isActionLoading =
    cancelMutation.isPending || forceCompleteMutation.isPending;

  function resetFilters() {
    setPage(1);
    setSearchDraft("");
    setKeyword("");
    setStatus("ALL");
    setItemType("ALL");
    setCreatedAtFrom("");
    setCreatedAtTo("");
  }

  function updateFilter<T>(setter: (value: T) => void, value: T) {
    setPage(1);
    setter(value);
  }

  function openDetail(order: AdminOrderListItem) {
    setDetailOrderId(order.orderId);
  }

  function closeDetail() {
    setDetailOrderId(null);
  }

  function openAction(mode: OrderActionMode, order: AdminOrderListItem) {
    setActionError(null);
    setActionState({ mode, order });
  }

  function closeAction() {
    setActionState(null);
    setActionError(null);
  }

  async function handleConfirmAction(reason: string) {
    if (!actionState) {
      return;
    }

    const { mode, order } = actionState;
    setActionError(null);

    try {
      if (mode === "cancel") {
        await cancelMutation.mutateAsync({
          orderId: order.orderId,
          payload: { reason },
        });
        toast.success(`Đã hủy đơn ${order.paymentCode}.`, { duration: 3000 });
      } else {
        await forceCompleteMutation.mutateAsync({
          orderId: order.orderId,
          payload: { reason },
        });
        toast.success(`Đã đánh dấu hoàn tất đơn ${order.paymentCode}.`, {
          duration: 3000,
        });
      }
      setActionState(null);
    } catch (error) {
      setActionError(
        getApiErrorMessage(error, "Có lỗi xảy ra, vui lòng thử lại."),
      );
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 backoffice-dark:text-white">
            Quản lý Đơn hàng
          </h1>
          <p className="mt-1 text-sm font-semibold text-gray-500 backoffice-dark:text-zinc-400">
            Tra cứu, đối soát và can thiệp thủ công (hủy / hoàn tất) đơn hàng của toàn hệ thống.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => ordersQuery.refetch()}
            disabled={ordersQuery.isFetching}
            className="border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
          >
            <RefreshCw
              className={
                ordersQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"
              }
            />
            Làm mới
          </Button>
        </div>
      </header>

      <div className="flex gap-2 border-b border-slate-200 backoffice-dark:border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`border-b-2 px-4 py-3 text-sm font-bold transition ${
              activeTab === tab.key
                ? "border-violet-600 text-violet-600 backoffice-dark:border-[var(--backoffice-primary)] backoffice-dark:text-[var(--backoffice-primary)]"
                : "border-transparent text-gray-500 hover:text-gray-800 backoffice-dark:text-zinc-400 backoffice-dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overpaid" && <OverpaidOrdersTable />}

      {activeTab === "stats" && <OrderStatsWidget />}

      {activeTab === "all" && (
        <>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <div className="grid gap-4 lg:grid-cols-[minmax(280px,1fr)_200px_200px_auto] lg:items-end">
          <label className="relative block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500 backoffice-dark:text-white/45">
              Tìm kiếm
            </span>
            <Search className="absolute bottom-3.5 left-3 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Mã đơn, mã giao dịch, username hoặc email..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white backoffice-dark:focus:ring-[rgba(212,175,55,0.16)]"
            />
          </label>

          <FilterSelect
            label="Trạng thái"
            value={status}
            onChange={(value) =>
              updateFilter(setStatus, value as StatusFilter)
            }
            options={[
              { label: "Tất cả", value: "ALL" },
              { label: "Chờ thanh toán", value: "AWAITING_PAYMENT" },
              { label: "Hoàn tất", value: "COMPLETED" },
              { label: "Hết hạn", value: "OUT_OF_TIME" },
              { label: "Đã hủy", value: "CANCELLED" },
            ]}
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFilterPanelOpen((current) => !current)}
              aria-expanded={isFilterPanelOpen}
              className="h-11 border-gray-200 bg-white px-4 text-gray-700 shadow-sm hover:bg-gray-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
            >
              <Filter className="h-4 w-4 text-violet-600 backoffice-dark:text-[var(--backoffice-primary)]" />
              Bộ lọc
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-violet-600 px-2 py-0.5 text-xs font-black text-white backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isFilterPanelOpen ? "rotate-180" : ""}`}
              />
            </Button>
            {activeFilterCount > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
                className="h-11 border-gray-200 bg-white px-3 text-gray-700 shadow-sm hover:bg-gray-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
                aria-label="Xóa lọc"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {isFilterPanelOpen && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4 backoffice-dark:border-white/10 backoffice-dark:bg-black/20">
            <div className="grid gap-4 lg:grid-cols-3">
              <FilterSelect
                label="Loại đơn"
                value={itemType}
                onChange={(value) =>
                  updateFilter(setItemType, value as ItemTypeFilter)
                }
                options={[
                  { label: "Tất cả", value: "ALL" },
                  { label: "Gói Premium", value: "SUBSCRIPTION" },
                  { label: "Tập lẻ", value: "EPISODE" },
                  { label: "Combo", value: "COMBO" },
                  { label: "Dịch vụ tương tác", value: "ENGAGEMENT" },
                ]}
              />

              <DateTimeFilter
                label="Tạo từ"
                value={createdAtFrom}
                onChange={(value) => updateFilter(setCreatedAtFrom, value)}
              />
              <DateTimeFilter
                label="Tạo đến"
                value={createdAtTo}
                onChange={(value) => updateFilter(setCreatedAtTo, value)}
              />
            </div>
          </div>
        )}
      </section>

      {ordersQuery.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          Không thể tải danh sách đơn hàng. Kiểm tra API
          `/api/v1/admin/orders`.
        </div>
      )}

      <OrdersTable
        orders={orders}
        page={pageData?.pageNumber ?? page}
        pageSize={pageData?.pageSize ?? DEFAULT_PAGE_SIZE}
        totalPages={pageData?.totalPages ?? 0}
        totalElements={pageData?.totalElements ?? 0}
        isLoading={ordersQuery.isLoading}
        onPageChange={setPage}
        onViewDetail={openDetail}
        onCancel={(order) => openAction("cancel", order)}
        onForceComplete={(order) => openAction("forceComplete", order)}
      />
        </>
      )}

      <OrderDetailModal
        order={detail}
        open={Boolean(detailOrderId)}
        onClose={closeDetail}
      />

      <OrderActionModal
        mode={actionState?.mode ?? "cancel"}
        order={actionState?.order ?? null}
        open={Boolean(actionState)}
        isLoading={isActionLoading}
        errorMessage={actionError}
        onClose={closeAction}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500 backoffice-dark:text-zinc-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white backoffice-dark:focus:ring-[rgba(212,175,55,0.16)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateTimeFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500 backoffice-dark:text-zinc-400">
        {label}
      </span>
      <input
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white backoffice-dark:focus:ring-[rgba(212,175,55,0.16)]"
      />
    </label>
  );
}
