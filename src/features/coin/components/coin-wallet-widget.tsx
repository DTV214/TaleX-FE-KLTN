"use client";

import Link from "next/link";
import { CircleDollarSign, Target } from "lucide-react";
import { useDailyCheckInMutation } from "../hooks/useCoinMutations";
import {
  useCoinWallet,
  useDailyCheckInStatus,
} from "../hooks/useCoinQueries";
import { useMyMissions } from "@/features/mission/hooks/useMissionQueries";

function formatCoin(value?: number) {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0);
}

export function CoinWalletWidget() {
  const walletQuery = useCoinWallet();
  const checkInStatusQuery = useDailyCheckInStatus();
  const checkInMutation = useDailyCheckInMutation();
  const { data: missions, isLoading: isLoadingMissions } = useMyMissions();

  const balanceLabel = walletQuery.isLoading
    ? "..."
    : formatCoin(walletQuery.data?.balance);
  const shouldShowCheckInReminder =
    checkInStatusQuery.data?.isCheckedInToday === false;
  const isCheckedInToday =
    Boolean(checkInStatusQuery.data?.isCheckedInToday) ||
    Boolean(checkInMutation.data);
  const missionPreview = missions?.slice(0, 2) ?? [];

  return (
    <div className="group relative flex items-center">
      <button
        type="button"
        aria-label="Xem ví Coin và nhiệm vụ"
        className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-sm font-bold text-white transition hover:border-[#D4AF37]/45 hover:bg-[#D4AF37]/10 md:h-11 md:px-4"
      >
        <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">
          <CircleDollarSign className="h-5 w-5" />
          {shouldShowCheckInReminder && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-[#A52A2A] ring-2 ring-[#0B0B0C]" />
          )}
        </span>

        <span className="font-heading text-sm font-bold tabular-nums tracking-wide text-white transition group-hover:text-[#D4AF37]">
          {balanceLabel}
        </span>
      </button>

      <div className="invisible absolute right-0 top-full z-50 w-80 max-w-[calc(100vw-2rem)] pt-4 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0B0B0C] shadow-2xl">
          <div className="border-b border-white/10 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">
                  Điểm danh hằng ngày
                </p>
                <p className="mt-1 text-xs text-white/45">
                  Nhận Coin miễn phí mỗi ngày
                </p>
              </div>
              <CircleDollarSign className="h-5 w-5 shrink-0 text-[#D4AF37]" />
            </div>

            {isCheckedInToday ? (
              <div className="flex h-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-xs font-black uppercase tracking-wider text-white/40">
                Đã điểm danh
              </div>
            ) : (
              <button
                type="button"
                disabled={checkInMutation.isPending}
                onClick={() => checkInMutation.mutate()}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] text-xs font-black uppercase tracking-wider text-black transition hover:bg-[#E5C158] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {checkInMutation.isPending && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                )}
                Nhận Coin
              </button>
            )}
          </div>

          <div className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-[#D4AF37]" />
              <p className="text-xs font-black uppercase tracking-wider text-white/65">
                Nhiệm vụ hôm nay
              </p>
            </div>

            <div className="space-y-2">
              {isLoadingMissions && (
                <>
                  <div className="h-12 animate-pulse rounded-lg bg-white/[0.05]" />
                  <div className="h-12 animate-pulse rounded-lg bg-white/[0.05]" />
                </>
              )}

              {!isLoadingMissions && missionPreview.length === 0 && (
                <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-xs font-medium text-white/40">
                  Chưa có nhiệm vụ nào hôm nay.
                </p>
              )}

              {!isLoadingMissions &&
                missionPreview.map((mission) => (
                  <div
                    key={mission.missionId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
                  >
                    <p className="min-w-0 truncate text-xs font-bold text-white/80">
                      {mission.title}
                    </p>
                    <span
                      className={
                        mission.isCompleted
                          ? "shrink-0 text-xs font-bold text-emerald-400"
                          : "shrink-0 text-xs font-bold tabular-nums text-[#D4AF37]"
                      }
                    >
                      {mission.isCompleted
                        ? "Hoàn thành"
                        : `${mission.currentValue}/${mission.targetValue}`}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <Link
            href="/missions"
            className="block border-t border-white/10 p-3 text-center text-sm font-bold text-white/70 transition hover:bg-white/[0.03] hover:text-[#D4AF37]"
          >
            Xem tất cả nhiệm vụ ➔
          </Link>
        </div>
      </div>
    </div>
  );
}
