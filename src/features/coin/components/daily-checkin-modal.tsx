"use client";

import { CircleDollarSign, Flame, Loader2, X } from "lucide-react";
import {
  useCoinWallet,
  useDailyCheckInStatus,
} from "../hooks/useCoinQueries";
import { useDailyCheckInMutation } from "../hooks/useCoinMutations";
import { getApiErrorMessage } from "@/shared/api/http-client";

type DailyCheckInModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatCoin(value?: number) {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0);
}

export function DailyCheckInModal({
  open,
  onOpenChange,
}: DailyCheckInModalProps) {
  const walletQuery = useCoinWallet();
  const checkInStatusQuery = useDailyCheckInStatus();
  const checkInMutation = useDailyCheckInMutation();

  if (!open) {
    return null;
  }

  const currentStreak =
    checkInMutation.data?.currentStreak ??
    checkInStatusQuery.data?.currentStreak ??
    0;
  const isCheckedInToday =
    Boolean(checkInStatusQuery.data?.isCheckedInToday) ||
    Boolean(checkInMutation.data);
  const isCheckingIn = checkInMutation.isPending;
  const isButtonDisabled = isCheckedInToday || isCheckingIn;
  const rewardAmount = checkInMutation.data?.rewardAmount;
  const errorMessage = checkInMutation.error
    ? getApiErrorMessage(checkInMutation.error)
    : null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <section
        aria-modal="true"
        role="dialog"
        aria-labelledby="daily-checkin-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0B0B0C] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(212,175,55,0.18),transparent_38%),radial-gradient(circle_at_100%_100%,rgba(165,42,42,0.18),transparent_34%)]" />

        <button
          type="button"
          aria-label="Đóng"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-[#D4AF37]/45 hover:text-[#D4AF37]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative z-10">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_28px_rgba(212,175,55,0.18)]">
            <CircleDollarSign className="h-8 w-8" />
          </div>

          <h2
            id="daily-checkin-title"
            className="font-heading text-2xl font-bold tracking-wide text-white"
          >
            Điểm Danh Hằng Ngày
          </h2>

          <p className="mt-2 text-sm font-medium leading-6 text-white/62">
            Nhận coin miễn phí mỗi ngày và giữ chuỗi điểm danh để mở thêm phần
            thưởng trong các giai đoạn tiếp theo.
          </p>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-3 text-sm font-bold text-[#D4AF37]">
              <Flame className="h-5 w-5" />
              <span>Chuỗi hiện tại: {currentStreak} ngày liên tiếp</span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-xs font-bold uppercase tracking-widest text-white/45">
                Số dư ví
              </span>
              <span className="font-heading text-lg font-bold text-white">
                {walletQuery.isLoading
                  ? "..."
                  : `${formatCoin(walletQuery.data?.balance)} coin`}
              </span>
            </div>
          </div>

          {rewardAmount !== undefined && (
            <div className="mt-4 rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-3 text-sm font-bold text-[#D4AF37]">
              Bạn vừa nhận {formatCoin(rewardAmount)} coin.
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 rounded-xl border border-[#A52A2A]/35 bg-[#A52A2A]/15 px-4 py-3 text-sm font-bold text-red-200">
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            disabled={isButtonDisabled}
            onClick={() => checkInMutation.mutate()}
            className={
              isCheckedInToday
                ? "mt-6 flex h-12 w-full items-center justify-center rounded-xl border border-white/10 bg-white/10 text-sm font-black uppercase tracking-widest text-white/45"
                : "mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] text-sm font-black uppercase tracking-widest text-black shadow-[0_10px_35px_rgba(212,175,55,0.25)] transition hover:bg-[#E5C158] disabled:cursor-not-allowed disabled:opacity-70"
            }
          >
            {isCheckingIn && <Loader2 className="h-4 w-4 animate-spin" />}
            {isCheckedInToday ? "ĐÃ ĐIỂM DANH" : "NHẬN COIN NGAY"}
          </button>
        </div>
      </section>
    </div>
  );
}
