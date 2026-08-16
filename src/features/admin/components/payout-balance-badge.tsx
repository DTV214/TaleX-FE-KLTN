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
      className={`inline-flex h-11 items-center gap-2.5 rounded-2xl bg-white border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 shadow-sm shrink-0 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white ${className}`}
    >
      <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center backoffice-dark:bg-emerald-500/20 backoffice-dark:text-emerald-400">
        <Wallet className="w-4 h-4 shrink-0" />
      </div>
      <span className="text-gray-500 backoffice-dark:text-white/60 font-medium">Số dư ví chi hộ:</span>
      <strong className="text-sm font-extrabold text-emerald-600 backoffice-dark:text-emerald-400">
        {isLoading ? "..." : isError ? "-" : formatVND(data?.balance)}
      </strong>
    </div>
  );
}
