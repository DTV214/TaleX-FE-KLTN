"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Clock3,
  FileText,
  History,
  Layers,
  ReceiptText,
  XCircle,
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { parseBackendDate } from "@/shared/utils/backend-date";
import { cn } from "@/shared/utils/utils";
import type {
  ContentOrderItemType,
  OrderHistoryItem,
  OrderStatus,
} from "../types/payment.types";
import { useContentOrderHistory } from "../api/payment.api";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parseBackendDate(value));
}

function formatAmount(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  COMPLETED: "Đã thanh toán",
  AWAITING_PAYMENT: "Chờ thanh toán",
  OUT_OF_TIME: "Hết hạn",
  CANCELLED: "Đã hủy",
};

const STATUS_CLASS: Record<OrderStatus, string> = {
  COMPLETED: "text-emerald-300",
  AWAITING_PAYMENT: "text-amber-300",
  OUT_OF_TIME: "text-slate-500",
  CANCELLED: "text-slate-500",
};

const ITEM_TYPE_LABEL: Record<ContentOrderItemType, string> = {
  EPISODE: "Episode",
  COMBO: "Combo",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  COIN: "Coin",
  SEPAY: "SePay",
  APP_IAP: "App Store",
  GOOGLE_IAP: "Google Play",
};

function RowSkeleton() {
  return (
    <div className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
  );
}

function DetailTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-white/88">
        {value}
      </p>
    </div>
  );
}

function getItemIcon(type: ContentOrderItemType) {
  return type === "COMBO" ? Layers : Clapperboard;
}

function isPaid(item: OrderHistoryItem) {
  return item.status === "COMPLETED";
}

export function ContentPurchaseHistory() {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pageSize = 10;
  const historyQuery = useContentOrderHistory(page, pageSize);
  const items = useMemo(
    () => historyQuery.data?.content ?? [],
    [historyQuery.data?.content],
  );
  const totalElements = historyQuery.data?.totalElements ?? 0;
  const totalPages = historyQuery.data?.totalPages ?? 1;
  const pageNumber = historyQuery.data?.pageNumber ?? page;
  const isFirstPage = historyQuery.data?.isFirst ?? page <= 1;
  const isLastPage = historyQuery.data?.isLast ?? pageNumber >= totalPages;
  const completedCount = items.filter(isPaid).length;
  const selectedItem =
    items.find((item) => item.orderId === selectedId) ?? items[0];

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#101012] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-6 lg:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(125,211,252,0.14),transparent_34%),radial-gradient(circle_at_88%_12%,rgba(212,175,55,0.10),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.035),transparent_44%)]" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <Badge variant="premium" className="mb-4 px-3 py-1 text-xs font-medium">
              TaleX Orders
            </Badge>
            <h1 className="text-3xl font-semibold tracking-normal text-white/92 md:text-4xl">
              Lịch sử Episode &amp; Combo
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              Theo dõi nội dung đã mua, trạng thái thanh toán và hóa đơn của
              từng giao dịch.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4">
              <ReceiptText className="mb-3 h-5 w-5 text-[#D4AF37]" />
              <p className="text-xs font-medium text-[#F5D46E]/75">Tổng đơn</p>
              <p className="mt-1 text-xl font-semibold text-white/90">
                {historyQuery.isLoading ? "..." : totalElements}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-1">
              <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] p-4">
                <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-300" />
                <p className="text-xs font-medium text-emerald-100/55">
                  Hoàn tất
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-100">
                  {historyQuery.isLoading ? "..." : completedCount}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <History className="mb-3 h-5 w-5 text-slate-300" />
                <p className="text-xs font-medium text-slate-500">Trang này</p>
                <p className="mt-1 text-sm font-semibold text-white/88">
                  {historyQuery.isLoading ? "..." : items.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-white/10 bg-[#121214]/82 p-4 shadow-[0_18px_54px_rgba(0,0,0,0.24)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-[#D4AF37]" />
              <h2 className="text-base font-semibold text-white/90">
                Danh sách giao dịch
              </h2>
            </div>
            <Badge variant="outline" className="text-xs font-medium">
              {totalElements} mục
            </Badge>
          </div>

          {historyQuery.isLoading && (
            <div className="max-h-[552px] space-y-3 overflow-y-auto pr-1">
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
            </div>
          )}

          {!historyQuery.isLoading && historyQuery.isError && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-5 text-sm font-medium text-red-200">
              Không thể tải lịch sử giao dịch. Vui lòng thử lại sau.
            </div>
          )}

          {!historyQuery.isLoading && !historyQuery.isError && items.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center">
              <ReceiptText className="mx-auto h-8 w-8 text-[#D4AF37]/60" />
              <p className="mt-3 text-sm font-medium text-white/80">
                Chưa có giao dịch nội dung
              </p>
            </div>
          )}

          <div className="max-h-[552px] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(212,175,55,0.45)_rgba(255,255,255,0.06)] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D4AF37]/35 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/[0.04]">
            {items.map((item) => {
              const Icon = getItemIcon(item.itemType);
              const isSelected = selectedItem?.orderId === item.orderId;

              return (
                <button
                  key={item.orderId}
                  type="button"
                  onClick={() => setSelectedId(item.orderId)}
                  className={cn(
                    "group w-full rounded-2xl border p-3 text-left transition hover:border-[#D4AF37]/35 hover:bg-white/[0.04]",
                    isSelected
                      ? "border-[#D4AF37]/40 bg-[#D4AF37]/[0.08]"
                      : "border-white/10 bg-white/[0.025]",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                        isPaid(item)
                          ? "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]"
                          : "border-white/10 bg-white/[0.04] text-slate-500",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-white/88">
                          {item.itemTitle}
                        </p>
                        <span
                          className={cn(
                            "shrink-0 text-xs font-semibold",
                            STATUS_CLASS[item.status],
                          )}
                        >
                          {STATUS_LABEL[item.status]}
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <p className="text-sm font-medium text-slate-500">
              Trang{" "}
              <span className="font-semibold text-white/85">
                {pageNumber || page}
              </span>
              /
              <span className="font-semibold text-white/85">
                {Math.max(1, totalPages)}
              </span>
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={isFirstPage || historyQuery.isLoading}
                onClick={() =>
                  setPage((currentPage) => Math.max(1, currentPage - 1))
                }
                className="h-9 w-9 rounded-xl border-white/10 bg-white/[0.03] text-white/70 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={isLastPage || historyQuery.isLoading}
                onClick={() => setPage((currentPage) => currentPage + 1)}
                className="h-9 w-9 rounded-xl border-white/10 bg-white/[0.03] text-white/70 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>

        {selectedItem ? (
          <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#121214]/88 p-5 shadow-[0_20px_58px_rgba(0,0,0,0.28)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,55,0.14),transparent_36%),radial-gradient(circle_at_92%_12%,rgba(125,211,252,0.08),transparent_30%)]" />
            <div className="relative z-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
                    {selectedItem.itemType === "COMBO" ? (
                      <Layers className="h-6 w-6" />
                    ) : (
                      <Clapperboard className="h-6 w-6" />
                    )}
                  </span>
                  <div>
                    <Badge variant="premium" className="px-3 py-1 text-xs font-medium">
                      Chi tiết giao dịch
                    </Badge>
                    <h3 className="mt-2 text-xl font-semibold text-white/90">
                      {selectedItem.itemTitle}
                    </h3>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
                  <p className="text-xs font-medium text-slate-400">Trạng thái</p>
                  <p
                    className={cn(
                      "mt-1 flex items-center gap-1.5 text-lg font-semibold",
                      STATUS_CLASS[selectedItem.status],
                    )}
                  >
                    {selectedItem.status === "COMPLETED" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                    {STATUS_LABEL[selectedItem.status]}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <DetailTile
                  label="Loại nội dung"
                  value={ITEM_TYPE_LABEL[selectedItem.itemType]}
                />
                <DetailTile
                  label="Tổng tiền"
                  value={formatAmount(selectedItem.totalAmount)}
                />
                <DetailTile
                  label="Phương thức"
                  value={
                    selectedItem.paymentMethod
                      ? PAYMENT_METHOD_LABEL[selectedItem.paymentMethod] ??
                        selectedItem.paymentMethod
                      : "Đang chờ"
                  }
                />
                <DetailTile
                  label="Ngày tạo"
                  value={formatDate(selectedItem.createdAt)}
                />
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs font-medium text-slate-500">Mã đơn hàng</p>
                <p className="mt-2 break-all text-sm font-semibold text-white/88">
                  {selectedItem.orderId}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                {selectedItem.invoiceUrl && (
                  <Button
                    asChild
                    variant="outline"
                    className="h-10 rounded-xl border-white/10 bg-white/[0.03] text-white/70 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
                  >
                    <a
                      href={selectedItem.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Hóa đơn
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </article>
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#121214]/70 p-6 text-center">
            <ReceiptText className="h-10 w-10 text-[#D4AF37]" />
            <p className="mt-4 text-lg font-semibold text-white/90">
              Chọn một giao dịch
            </p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
              Danh sách bên trái sẽ hiển thị chi tiết từng đơn Episode hoặc Combo.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
