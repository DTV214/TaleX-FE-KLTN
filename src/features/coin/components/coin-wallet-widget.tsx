"use client";

import { useState } from "react";
import { CircleDollarSign } from "lucide-react";
import {
  useCoinWallet,
  useDailyCheckInStatus,
} from "../hooks/useCoinQueries";
import { DailyCheckInModal } from "./daily-checkin-modal";

function formatCoin(value?: number) {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0);
}

export function CoinWalletWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const walletQuery = useCoinWallet();
  const checkInStatusQuery = useDailyCheckInStatus();

  const balanceLabel = walletQuery.isLoading
    ? "..."
    : formatCoin(walletQuery.data?.balance);
  const shouldShowCheckInReminder =
    checkInStatusQuery.data?.isCheckedInToday === false;

  return (
    <>
      <button
        type="button"
        aria-label="Mở ví coin và điểm danh hằng ngày"
        onClick={() => setIsOpen(true)}
        className="group inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-sm font-bold text-white transition hover:border-[#D4AF37]/45 hover:bg-[#D4AF37]/10 md:h-11 md:px-4"
      >
        <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">
          <CircleDollarSign className="h-5 w-5" />
          {shouldShowCheckInReminder && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#A52A2A] ring-2 ring-[#0B0B0C] animate-pulse" />
          )}
        </span>

        <span className="font-heading text-sm font-bold tabular-nums tracking-wide text-white group-hover:text-[#D4AF37]">
          {balanceLabel}
        </span>
      </button>

      <DailyCheckInModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
