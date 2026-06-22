"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import { useCoinTransactions } from "../hooks/useCoinQueries";
import type { CoinTransaction } from "../api/coin.dto";

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

function formatCoin(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.abs(amount));
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
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="space-y-3">
        <div className="h-4 w-40 rounded-full bg-white/10" />
        <div className="h-3 w-28 rounded-full bg-white/10" />
      </div>
      <div className="h-5 w-20 rounded-full bg-white/10" />
    </div>
  );
}

export function CoinTransactionHistory() {
  const [page, setPage] = useState(1);
  const size = 10;

  const { data, isLoading, isError } = useCoinTransactions(page, size);
  const transactions = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const pageNumber = data?.pageNumber ?? page;
  const totalPages = data?.totalPages ?? 1;
  const isFirstPage = data?.isFirst ?? page <= 1;
  const isLastPage = data?.isLast ?? pageNumber >= totalPages;

  return (
    <section className="w-full rounded-2xl border border-white/10 bg-[#0B0B0C] p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-6">
      <div className="flex flex-col gap-2 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-wide text-white">
            Lịch Sử Giao Dịch
          </h2>
          <p className="mt-1 text-sm font-medium text-white/50">
            Theo dõi các lần nhận và sử dụng coin của bạn.
          </p>
        </div>

        {data && (
          <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
            {totalElements} bản ghi
          </span>
        )}
      </div>

      <div className="mt-5">
        {isLoading && (
          <div className="space-y-3 animate-pulse">
            <TransactionSkeleton />
            <TransactionSkeleton />
            <TransactionSkeleton />
            <TransactionSkeleton />
          </div>
        )}

        {!isLoading && isError && (
          <div className="rounded-xl border border-[#A52A2A]/35 bg-[#A52A2A]/15 px-4 py-5 text-sm font-bold text-red-200">
            Không thể tải lịch sử giao dịch. Vui lòng thử lại sau.
          </div>
        )}

        {!isLoading && !isError && transactions.length === 0 && (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-6 text-center">
            <History className="h-10 w-10 text-[#D4AF37]" />
            <p className="mt-4 font-heading text-base font-bold text-white">
              Bạn chưa có giao dịch nào
            </p>
            <p className="mt-2 max-w-xs text-sm font-medium leading-6 text-white/45">
              Khi bạn điểm danh, nhận thưởng hoặc sử dụng coin, lịch sử sẽ xuất
              hiện tại đây.
            </p>
          </div>
        )}

        {!isLoading && !isError && transactions.length > 0 && (
          <ul className="space-y-3">
            {transactions.map((transaction) => {
              const isCredit = isCreditTransaction(transaction);
              const sign = isCredit ? "+" : "-";
              const amountClassName = isCredit
                ? "text-[#D4AF37]"
                : "text-[#A52A2A]";

              return (
                <li
                  key={transaction.transactionId}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-[#D4AF37]/30 hover:bg-white/[0.05]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">
                      {transaction.description || transaction.transactionType}
                    </p>
                    <p className="mt-1 text-xs font-medium text-white/45">
                      {formatDate(transaction.changedAt)}
                    </p>
                  </div>

                  <p
                    className={`shrink-0 font-heading text-base font-bold tabular-nums ${amountClassName}`}
                  >
                    {sign}
                    {formatCoin(transaction.amount)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-white/50">
          Trang{" "}
          <span className="font-bold text-white">
            {pageNumber || page}
          </span>{" "}
          /{" "}
          <span className="font-bold text-white">
            {Math.max(1, totalPages)}
          </span>
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isFirstPage || isLoading}
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 text-sm font-bold text-white/70 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </button>

          <button
            type="button"
            disabled={isLastPage || isLoading}
            onClick={() => setPage((currentPage) => currentPage + 1)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 text-sm font-bold text-white/70 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Sau
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
