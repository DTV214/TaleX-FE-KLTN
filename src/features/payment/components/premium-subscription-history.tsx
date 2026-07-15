"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crown,
  History,
  ReceiptText,
  ShieldCheck,
  Timer,
  XCircle,
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";
import { parseBackendDate } from "@/shared/utils/backend-date";
import { cn } from "@/shared/utils/utils";
import type { AccountSubscription } from "../types/payment.types";
import { useSubscriptionHistory } from "../api/payment.api";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parseBackendDate(value));
}

function getDurationDays(subscription: AccountSubscription) {
  const startMs = parseBackendDate(subscription.startTime).getTime();
  const endMs = parseBackendDate(subscription.endTime).getTime();
  return Math.max(0, Math.ceil((endMs - startMs) / 86_400_000));
}

function getRemainingDays(subscription: AccountSubscription) {
  const endMs = parseBackendDate(subscription.endTime).getTime();
  return Math.max(0, Math.ceil((endMs - Date.now()) / 86_400_000));
}

function getSubscriptionProgress(subscription: AccountSubscription) {
  const startMs = parseBackendDate(subscription.startTime).getTime();
  const endMs = parseBackendDate(subscription.endTime).getTime();
  const totalMs = endMs - startMs;

  if (totalMs <= 0) {
    return 100;
  }

  return Math.min(100, Math.max(0, ((Date.now() - startMs) / totalMs) * 100));
}

function isActiveSubscription(subscription: AccountSubscription) {
  return (
    !subscription.isCancelled &&
    parseBackendDate(subscription.endTime).getTime() > Date.now()
  );
}

function SubscriptionSkeleton() {
  return (
    <div className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-white/88">
        {value}
      </p>
    </div>
  );
}

export function PremiumSubscriptionHistory() {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pageSize = 10;
  const historyQuery = useSubscriptionHistory(page, pageSize);
  const subscriptions = useMemo(
    () => historyQuery.data?.content ?? [],
    [historyQuery.data?.content],
  );
  const totalElements = historyQuery.data?.totalElements ?? 0;
  const totalPages = historyQuery.data?.totalPages ?? 1;
  const pageNumber = historyQuery.data?.pageNumber ?? page;
  const isFirstPage = historyQuery.data?.isFirst ?? page <= 1;
  const isLastPage = historyQuery.data?.isLast ?? pageNumber >= totalPages;
  const selectedSubscription =
    subscriptions.find((subscription) => subscription.accountSubscriptionId === selectedId) ??
    subscriptions[0];
  const activeCount = subscriptions.filter(isActiveSubscription).length;

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#101012] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-6 lg:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(212,175,55,0.18),transparent_34%),radial-gradient(circle_at_88%_12%,rgba(125,211,252,0.08),transparent_30%),linear-gradient(135deg,rgba(212,175,55,0.06),transparent_42%)]" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <Badge variant="premium" className="mb-4 px-3 py-1 text-xs font-medium">
              TaleX Premium
            </Badge>
            <h1 className="text-3xl font-semibold tracking-normal text-white/92 md:text-4xl">
              Lịch sử gói Premium
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              Theo dõi các gói Premium đã kích hoạt, thời hạn sử dụng và trạng
              thái hiện tại của từng lần mua.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4">
              <Crown className="mb-3 h-5 w-5 text-[#D4AF37]" />
              <p className="text-xs font-medium text-[#F5D46E]/75">Tổng gói</p>
              <p className="mt-1 text-xl font-semibold text-white/90">
                {historyQuery.isLoading ? "..." : totalElements}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-1">
              <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] p-4">
                <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-300" />
                <p className="text-xs font-medium text-emerald-100/55">
                  Đang chạy
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-100">
                  {historyQuery.isLoading ? "..." : activeCount}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <ReceiptText className="mb-3 h-5 w-5 text-slate-300" />
                <p className="text-xs font-medium text-slate-500">Bản ghi</p>
                <p className="mt-1 text-sm font-semibold text-white/88">
                  {historyQuery.isLoading ? "..." : subscriptions.length}
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
                Danh sách gói
              </h2>
            </div>
            <Badge variant="outline" className="text-xs font-medium">
              {totalElements} mục
            </Badge>
          </div>

          {historyQuery.isLoading && (
            <div className="max-h-[552px] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(212,175,55,0.45)_rgba(255,255,255,0.06)] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D4AF37]/35 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/[0.04]">
              <SubscriptionSkeleton />
              <SubscriptionSkeleton />
              <SubscriptionSkeleton />
              <SubscriptionSkeleton />
            </div>
          )}

          {!historyQuery.isLoading && historyQuery.isError && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-5 text-sm font-medium text-red-200">
              Không thể tải lịch sử Premium. Vui lòng thử lại sau.
            </div>
          )}

          {!historyQuery.isLoading &&
            !historyQuery.isError &&
            subscriptions.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center">
                <Crown className="mx-auto h-8 w-8 text-[#D4AF37]/60" />
                <p className="mt-3 text-sm font-medium text-white/80">
                  Chưa có lịch sử Premium
                </p>
              </div>
            )}

          <div className="max-h-[552px] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(212,175,55,0.45)_rgba(255,255,255,0.06)] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D4AF37]/35 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/[0.04]">
            {subscriptions.map((subscription) => {
              const active = isActiveSubscription(subscription);
              const isSelected =
                selectedSubscription?.accountSubscriptionId ===
                subscription.accountSubscriptionId;

              return (
                <button
                  key={subscription.accountSubscriptionId}
                  type="button"
                  onClick={() => setSelectedId(subscription.accountSubscriptionId)}
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
                        active
                          ? "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]"
                          : "border-white/10 bg-white/[0.04] text-slate-500",
                      )}
                    >
                      <Crown className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-white/88">
                          Premium {getDurationDays(subscription)} ngày
                        </p>
                        <span
                          className={cn(
                            "shrink-0 text-xs font-semibold",
                            active ? "text-emerald-300" : "text-slate-500",
                          )}
                        >
                          {active ? "Đang dùng" : "Đã hết hạn"}
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(subscription.startTime)}
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

        {selectedSubscription ? (
          <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#121214]/88 p-5 shadow-[0_20px_58px_rgba(0,0,0,0.28)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,55,0.14),transparent_36%),radial-gradient(circle_at_92%_12%,rgba(125,211,252,0.08),transparent_30%)]" />
            <div className="relative z-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
                    <Crown className="h-6 w-6" />
                  </span>
                  <div>
                    <Badge variant="premium" className="px-3 py-1 text-xs font-medium">
                      Chi tiết Premium
                    </Badge>
                    <h3 className="mt-2 text-xl font-semibold text-white/90">
                      Premium {getDurationDays(selectedSubscription)} ngày
                    </h3>
                  </div>
                </div>

                <div
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-right",
                    isActiveSubscription(selectedSubscription)
                      ? "border-emerald-300/20 bg-emerald-300/[0.06]"
                      : "border-white/10 bg-white/[0.04]",
                  )}
                >
                  <p className="text-xs font-medium text-slate-400">Trạng thái</p>
                  <p
                    className={cn(
                      "mt-1 flex items-center gap-1.5 text-lg font-semibold",
                      isActiveSubscription(selectedSubscription)
                        ? "text-emerald-300"
                        : "text-slate-300",
                    )}
                  >
                    {isActiveSubscription(selectedSubscription) ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                    {isActiveSubscription(selectedSubscription)
                      ? "Đang hoạt động"
                      : "Không còn hiệu lực"}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-400">
                  <span>Tiến độ sử dụng</span>
                  <span className="tabular-nums text-[#F5D46E]">
                    {Math.round(getSubscriptionProgress(selectedSubscription))}%
                  </span>
                </div>
                <Progress value={getSubscriptionProgress(selectedSubscription)} />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <DetailRow
                  label="Ngày bắt đầu"
                  value={formatDate(selectedSubscription.startTime)}
                />
                <DetailRow
                  label="Ngày kết thúc"
                  value={formatDate(selectedSubscription.endTime)}
                />
                <DetailRow
                  label="Thời lượng"
                  value={`${getDurationDays(selectedSubscription)} ngày`}
                />
                <DetailRow
                  label="Còn lại"
                  value={`${getRemainingDays(selectedSubscription)} ngày`}
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <ShieldCheck className="mb-2 h-5 w-5 text-[#D4AF37]" />
                  <p className="text-xs text-slate-500">Không quảng cáo</p>
                  <p className="mt-1 text-sm font-semibold text-white/88">
                    {selectedSubscription.isAdBlocked ? "Có" : "Không"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <Timer className="mb-2 h-5 w-5 text-[#D4AF37]" />
                  <p className="text-xs text-slate-500">Mở phim</p>
                  <p className="mt-1 text-sm font-semibold text-white/88">
                    {selectedSubscription.isMovieUnlocked ? "Có" : "Không"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <ReceiptText className="mb-2 h-5 w-5 text-[#D4AF37]" />
                  <p className="text-xs text-slate-500">Mở truyện</p>
                  <p className="mt-1 text-sm font-semibold text-white/88">
                    {selectedSubscription.isStoryUnlocked ? "Có" : "Không"}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs font-medium text-slate-500">Mã gói</p>
                <p className="mt-2 break-all text-sm font-semibold text-white/88">
                  {selectedSubscription.accountSubscriptionId}
                </p>
              </div>
            </div>
          </article>
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#121214]/70 p-6 text-center">
            <Crown className="h-10 w-10 text-[#D4AF37]" />
            <p className="mt-4 text-lg font-semibold text-white/90">
              Chọn một gói Premium
            </p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
              Danh sách bên trái sẽ hiển thị chi tiết thời hạn và quyền lợi của
              từng lần mua.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
