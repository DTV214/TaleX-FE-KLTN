"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileText,
  History,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils/utils";
import type { CoinTransaction } from "../api/coin.dto";
import { useCoinTransactions, useCoinWallet } from "../hooks/useCoinQueries";

const CREDIT_TYPES = new Set(["CREDIT", "EARN", "EARNED", "REWARD"]);
const DEBIT_TYPES = new Set(["DEBIT", "SPEND", "SPENT", "PAYMENT"]);

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCoin(amount?: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.abs(amount ?? 0));
}

function isCreditTransaction(transaction: CoinTransaction) {
  const transactionType = transaction.transactionType.toUpperCase();

  if (CREDIT_TYPES.has(transactionType)) {
    return true;
  }

  if (DEBIT_TYPES.has(transactionType)) {
    return false;
  }

  return transaction.amount >= 0;
}

function TransactionSkeleton() {
  return (
    <div className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
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

function EmptyState() {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#121214]/70 p-6 text-center">
      <History className="h-10 w-10 text-[#D4AF37]" />
      <p className="mt-4 text-lg font-semibold text-white/90">
        Chưa có giao dịch coin
      </p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
        Khi bạn điểm danh, nhận thưởng nhiệm vụ hoặc dùng coin để mua nội dung,
        lịch sử sẽ được hiển thị tại đây.
      </p>
    </div>
  );
}

export function CoinTransactionHistory() {
  const [page, setPage] = useState(1);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(
    null,
  );
  const size = 10;

  const walletQuery = useCoinWallet();
  const { data, isLoading, isError } = useCoinTransactions(page, size);
  const transactions = useMemo(() => data?.content ?? [], [data?.content]);
  const totalElements = data?.totalElements ?? 0;
  const pageNumber = data?.pageNumber ?? page;
  const totalPages = data?.totalPages ?? 1;
  const isFirstPage = data?.isFirst ?? page <= 1;
  const isLastPage = data?.isLast ?? pageNumber >= totalPages;
  const selectedTransaction =
    transactions.find(
      (transaction) => transaction.transactionId === selectedTransactionId,
    ) ?? transactions[0];

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#101012] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-6 lg:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(212,175,55,0.18),transparent_34%),radial-gradient(circle_at_88%_12%,rgba(125,211,252,0.08),transparent_30%),linear-gradient(135deg,rgba(212,175,55,0.06),transparent_42%)]" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <Badge variant="premium" className="mb-4 px-3 py-1 text-xs font-medium">
              TaleX Wallet
            </Badge>
            <h1 className="text-3xl font-semibold tracking-normal text-white/92 md:text-4xl">
              Số dư coin
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              Theo dõi từng lần coin đi vào và đi ra khỏi ví. Chọn một giao dịch
              bên dưới để xem mô tả, số dư trước sau và nguồn phát sinh.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4">
              <WalletCards className="mb-3 h-5 w-5 text-[#D4AF37]" />
              <p className="text-xs font-medium text-[#F5D46E]/75">Hiện có</p>
              <p className="mt-1 text-xl font-semibold text-white/90">
                {walletQuery.isLoading
                  ? "..."
                  : `${formatCoin(walletQuery.data?.balance)} Coin`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-1">
              <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] p-4">
                <ArrowDownLeft className="mb-3 h-5 w-5 text-emerald-300" />
                <p className="text-xs font-medium text-emerald-100/55">
                  Đã nhận
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-100">
                  {walletQuery.isLoading
                    ? "..."
                    : formatCoin(walletQuery.data?.totalEarned)}
                </p>
              </div>
              <div className="rounded-2xl border border-rose-300/15 bg-rose-300/[0.06] p-4">
                <ArrowUpRight className="mb-3 h-5 w-5 text-rose-300" />
                <p className="text-xs font-medium text-rose-100/55">Đã dùng</p>
                <p className="mt-1 text-sm font-semibold text-rose-100">
                  {walletQuery.isLoading
                    ? "..."
                    : formatCoin(walletQuery.data?.totalSpent)}
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
              <ReceiptText className="h-5 w-5 text-[#D4AF37]" />
              <h2 className="text-base font-semibold text-white/90">
                Lịch sử thu chi
              </h2>
            </div>
            <Badge variant="outline" className="text-xs font-medium">
              {totalElements} mục
            </Badge>
          </div>

          {isLoading && (
            <div className="max-h-[552px] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(212,175,55,0.45)_rgba(255,255,255,0.06)] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D4AF37]/35 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/[0.04]">
              <TransactionSkeleton />
              <TransactionSkeleton />
              <TransactionSkeleton />
              <TransactionSkeleton />
            </div>
          )}

          {!isLoading && isError && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-5 text-sm font-medium text-red-200">
              Không thể tải lịch sử coin. Vui lòng thử lại sau.
            </div>
          )}

          {!isLoading && !isError && transactions.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center">
              <History className="mx-auto h-8 w-8 text-[#D4AF37]/60" />
              <p className="mt-3 text-sm font-medium text-white/80">
                Chưa có dữ liệu
              </p>
            </div>
          )}

          <div className="max-h-[552px] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(212,175,55,0.45)_rgba(255,255,255,0.06)] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D4AF37]/35 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/[0.04]">
            {transactions.map((transaction) => {
              const isCredit = isCreditTransaction(transaction);
              const isSelected =
                selectedTransaction?.transactionId === transaction.transactionId;
              const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;

              return (
                <button
                  key={transaction.transactionId}
                  type="button"
                  onClick={() => setSelectedTransactionId(transaction.transactionId)}
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
                        isCredit
                          ? "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-300"
                          : "border-rose-300/20 bg-rose-300/[0.08] text-rose-300",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-white/88">
                          {transaction.description ||
                            transaction.referenceType ||
                            transaction.transactionType}
                        </p>
                        <span
                          className={cn(
                            "shrink-0 text-sm font-semibold tabular-nums",
                            isCredit ? "text-emerald-300" : "text-rose-300",
                          )}
                        >
                          {isCredit ? "+" : "-"}
                          {formatCoin(transaction.amount)}
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatDate(transaction.changedAt)}
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
              <span className="font-semibold text-white/85">{pageNumber || page}</span>
              /<span className="font-semibold text-white/85">{Math.max(1, totalPages)}</span>
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={isFirstPage || isLoading}
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
                disabled={isLastPage || isLoading}
                onClick={() => setPage((currentPage) => currentPage + 1)}
                className="h-9 w-9 rounded-xl border-white/10 bg-white/[0.03] text-white/70 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>

        {selectedTransaction ? (
          <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#121214]/88 p-5 shadow-[0_20px_58px_rgba(0,0,0,0.28)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,55,0.14),transparent_36%),radial-gradient(circle_at_92%_12%,rgba(125,211,252,0.08),transparent_30%)]" />
            <div className="relative z-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
                    <FileText className="h-6 w-6" />
                  </span>
                  <div>
                    <Badge variant="premium" className="px-3 py-1 text-xs font-medium">
                      Chi tiết giao dịch
                    </Badge>
                    <h3 className="mt-2 text-xl font-semibold text-white/90">
                      {selectedTransaction.description ||
                        selectedTransaction.transactionType}
                    </h3>
                  </div>
                </div>

                <div
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-right",
                    isCreditTransaction(selectedTransaction)
                      ? "border-emerald-300/20 bg-emerald-300/[0.06]"
                      : "border-rose-300/20 bg-rose-300/[0.06]",
                  )}
                >
                  <p className="text-xs font-medium text-slate-400">
                    Biến động
                  </p>
                  <p
                    className={cn(
                      "mt-1 flex items-center gap-1.5 text-2xl font-semibold tabular-nums",
                      isCreditTransaction(selectedTransaction)
                        ? "text-emerald-300"
                        : "text-rose-300",
                    )}
                  >
                    <CircleDollarSign className="h-5 w-5" />
                    {isCreditTransaction(selectedTransaction) ? "+" : "-"}
                    {formatCoin(selectedTransaction.amount)}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-400">
                Giao dịch này được ghi nhận vào{" "}
                <span className="font-semibold text-white/85">
                  {formatDate(selectedTransaction.changedAt)}
                </span>
                . Bạn có thể đối chiếu số dư trước và sau để biết coin đã được
                cộng hoặc trừ như thế nào.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <DetailRow
                  label="Loại giao dịch"
                  value={selectedTransaction.transactionType}
                />
                <DetailRow
                  label="Nguồn phát sinh"
                  value={selectedTransaction.referenceType || "Không có"}
                />
                <DetailRow
                  label="Số dư trước"
                  value={`${formatCoin(selectedTransaction.balanceBefore)} Coin`}
                />
                <DetailRow
                  label="Số dư sau"
                  value={`${formatCoin(selectedTransaction.balanceAfter)} Coin`}
                />
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs font-medium text-slate-500">Mã giao dịch</p>
                <p className="mt-2 break-all text-sm font-semibold text-white/88">
                  {selectedTransaction.transactionId}
                </p>
              </div>
            </div>
          </article>
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  );
}
