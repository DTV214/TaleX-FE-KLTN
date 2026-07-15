"use client";

import Link from "next/link";
import { CircleDollarSign, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import { useCoinWallet } from "../hooks/useCoinQueries";

function formatCoin(value?: number) {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0);
}

export function CoinBalanceSummary() {
  const walletQuery = useCoinWallet();
  const wallet = walletQuery.data;

  return (
    <section
      id="coin-balance"
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#121214]/88 p-5 shadow-[0_18px_54px_rgba(0,0,0,0.26)] transition hover:border-[#D4AF37]/35"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(212,175,55,0.16),transparent_34%),linear-gradient(135deg,rgba(212,175,55,0.05),transparent_40%)]" />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#D4AF37]">Số dư coin</p>
            <h2 className="mt-2 text-2xl font-semibold text-white/90">
              {walletQuery.isLoading ? "..." : formatCoin(wallet?.balance)} Coin
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Theo dõi tổng coin đã nhận, đã dùng và số dư hiện tại trong ví TaleX.
            </p>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
            <WalletCards className="h-6 w-6" />
          </span>
        </div>

        <Link
          href="/coin-history"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07] px-4 text-sm font-medium text-cyan-100 transition hover:border-cyan-200/35 hover:bg-cyan-300/[0.11]"
        >
          Xem lịch sử coin
        </Link>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <CircleDollarSign className="mb-2 h-4 w-4 text-[#D4AF37]" />
            <p className="text-xs text-slate-500">Hiện có</p>
            <p className="mt-1 text-sm font-semibold text-white/90">
              {walletQuery.isLoading ? "..." : formatCoin(wallet?.balance)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] p-3">
            <TrendingUp className="mb-2 h-4 w-4 text-emerald-300" />
            <p className="text-xs text-emerald-100/55">Đã nhận</p>
            <p className="mt-1 text-sm font-semibold text-emerald-100">
              {walletQuery.isLoading ? "..." : formatCoin(wallet?.totalEarned)}
            </p>
          </div>
          <div className="rounded-xl border border-rose-300/15 bg-rose-300/[0.06] p-3">
            <TrendingDown className="mb-2 h-4 w-4 text-rose-300" />
            <p className="text-xs text-rose-100/55">Đã dùng</p>
            <p className="mt-1 text-sm font-semibold text-rose-100">
              {walletQuery.isLoading ? "..." : formatCoin(wallet?.totalSpent)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
