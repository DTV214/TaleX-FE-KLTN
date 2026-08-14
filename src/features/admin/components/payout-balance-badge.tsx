"use client";

import { Wallet } from "lucide-react";
import { usePayoutAccountBalance } from "@/features/admin/hooks/use-admin-tax-summary";

function formatVND(value: string | number = 0): string {
  const num = typeof value === "string" ? parseFloat(value) || 0 : value;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
}

export function PayoutBalanceBadge({ className = "" }: { className?: string }) {
  const { data, isLoading, isError } = usePayoutAccountBalance();

  return (
    <div
      className={`inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-4 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-sm shrink-0 ${className}`}
    >
      <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <span>Số dư ví chi hộ:</span>
      <strong className="text-sm font-extrabold text-emerald-950 dark:text-emerald-100">
        {isLoading ? "..." : isError ? "-" : formatVND(data?.balance)}
      </strong>
    </div>
  );
}
