"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  FileText,
  Layers,
  ReceiptText,
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { parseBackendDate } from "@/shared/utils/backend-date";
import { cn } from "@/shared/utils/utils";
import type { OrderHistoryItem, OrderStatus } from "../types/payment.types";
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
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  COMPLETED: "Đã thanh toán",
  AWAITING_PAYMENT: "Chờ thanh toán",
  OUT_OF_TIME: "Đã hết hạn",
  CANCELLED: "Đã hủy",
};

const STATUS_CLASS: Record<OrderStatus, string> = {
  COMPLETED: "text-emerald-300",
  AWAITING_PAYMENT: "text-amber-300",
  OUT_OF_TIME: "text-slate-500",
  CANCELLED: "text-slate-500",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  COIN: "Coin",
  SEPAY: "Chuyển khoản (SePay)",
  APP_IAP: "App Store",
  GOOGLE_IAP: "Google Play",
};

function RowSkeleton() {
  return (
    <div className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
  );
}

export function ContentPurchaseHistory() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const historyQuery = useContentOrderHistory(page, pageSize);
  const items = historyQuery.data?.content ?? [];
  const totalElements = historyQuery.data?.totalElements ?? 0;
  const totalPages = historyQuery.data?.totalPages ?? 1;
  const pageNumber = historyQuery.data?.pageNumber ?? page;
  const isFirstPage = historyQuery.data?.isFirst ?? page <= 1;
  const isLastPage = historyQuery.data?.isLast ?? pageNumber >= totalPages;

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#101012] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-6 lg:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(125,211,252,0.14),transparent_34%),radial-gradient(circle_at_88%_12%,rgba(212,175,55,0.08),transparent_30%)]" />
        <div className="relative z-10">
          <Badge variant="outline" className="mb-4 px-3 py-1 text-xs font-medium">
            Lịch sử mua nội dung
          </Badge>
          <h1 className="text-3xl font-semibold tracking-normal text-white/92 md:text-4xl">
            Episode &amp; Combo đã mua
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
            Danh sách các tập truyện/phim và combo bạn đã mua, kèm trạng thái
            thanh toán và hóa đơn (nếu có).
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121214]/82 p-4 shadow-[0_18px_54px_rgba(0,0,0,0.24)] sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-sky-300" />
            <h2 className="text-base font-semibold text-white/90">
              Danh sách giao dịch
            </h2>
          </div>
          <Badge variant="outline" className="text-xs font-medium">
            {totalElements} mục
          </Badge>
        </div>

        {historyQuery.isLoading && (
          <div className="space-y-3">
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
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-center">
            <ReceiptText className="mx-auto h-8 w-8 text-slate-500" />
            <p className="mt-3 text-sm font-medium text-white/80">
              Chưa có giao dịch nào
            </p>
          </div>
        )}

        {items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.orderId}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300">
                    {item.itemType === "COMBO" ? (
                      <Layers className="h-5 w-5" />
                    ) : (
                      <Clapperboard className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-white/88">
                        {item.itemTitle}
                      </p>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {item.itemType === "COMBO" ? "Combo" : "Episode"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(item.createdAt)}
                      {item.paymentMethod &&
                        ` · ${PAYMENT_METHOD_LABEL[item.paymentMethod] ?? item.paymentMethod}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white/90">
                      {formatAmount(item.totalAmount)}
                    </p>
                    <p
                      className={cn(
                        "text-xs font-semibold",
                        STATUS_CLASS[item.status],
                      )}
                    >
                      {STATUS_LABEL[item.status]}
                    </p>
                  </div>

                  {item.invoiceUrl && (
                    <Button
                      asChild
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1.5 rounded-xl border-white/10 bg-white/[0.03] text-white/70 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
                    >
                      <a href={item.invoiceUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-3.5 w-3.5" />
                        Hóa đơn
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

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
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              className="h-9 w-9 rounded-xl border-white/10 bg-white/[0.03] text-white/70 hover:border-sky-300/35 hover:text-sky-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={isLastPage || historyQuery.isLoading}
              onClick={() => setPage((currentPage) => currentPage + 1)}
              className="h-9 w-9 rounded-xl border-white/10 bg-white/[0.03] text-white/70 hover:border-sky-300/35 hover:text-sky-300"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
