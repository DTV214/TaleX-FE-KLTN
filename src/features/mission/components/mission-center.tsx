"use client";

import {
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Film,
  Gift,
  Loader2,
  PlaySquare,
  Target,
  UserRoundCheck,
} from "lucide-react";
import { useDailyCheckInMutation } from "@/features/coin/hooks/useCoinMutations";
import { useDailyCheckInStatus } from "@/features/coin/hooks/useCoinQueries";
import { useMyMissions } from "../hooks/useMissionQueries";

function formatCoin(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function getProgressPercentage(currentValue: number, targetValue: number) {
  if (targetValue <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, (currentValue / targetValue) * 100));
}

function getMissionIcon(code: string) {
  switch (code) {
    case "ONLINE_DAILY":
      return Clock3;
    case "WATCH_AD_DAILY":
      return PlaySquare;
    case "READ_COMIC_DAILY":
      return BookOpen;
    case "WATCH_VIDEO_DAILY":
      return Film;
    case "COMPLETE_PROFILE":
      return UserRoundCheck;
    default:
      return Target;
  }
}

function MissionBarSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-white/5 bg-[#14151b]/80 p-4">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 shrink-0 rounded-xl bg-white/10" />
        <div className="flex-1">
          <div className="h-4 w-40 rounded-full bg-white/10" />
          <div className="mt-3 h-3 w-2/3 rounded-full bg-white/[0.07]" />
          <div className="mt-4 h-1.5 w-full rounded-full bg-black/50" />
        </div>
        <div className="hidden h-10 w-28 rounded-lg bg-white/10 sm:block" />
      </div>
    </div>
  );
}

export function MissionCenter() {
  const missionsQuery = useMyMissions();
  const checkInStatusQuery = useDailyCheckInStatus();
  const checkInMutation = useDailyCheckInMutation();

  const isCheckedInToday =
    Boolean(checkInStatusQuery.data?.isCheckedInToday) ||
    Boolean(checkInMutation.data);
  const currentStreak =
    checkInMutation.data?.currentStreak ??
    checkInStatusQuery.data?.currentStreak ??
    0;

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <aside className="w-full lg:w-1/3">
        <div className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-[linear-gradient(145deg,#14151b_0%,#0B0B0C_100%)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:p-8 lg:sticky lg:top-24">
          <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[#D4AF37]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-[#D4AF37]/5 blur-3xl" />

          <div className="relative text-center">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#D4AF37]">
              NHIỆM VỤ HẰNG NGÀY
            </p>
            <h2 className="mt-3 font-heading text-2xl font-extrabold text-white">
              Nhiệm Vụ Hằng Ngày
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/45">
              Hoàn thành thử thách và nhận Coin mỗi ngày.
            </p>

            <div className="mx-auto my-9 flex h-36 w-36 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[radial-gradient(circle,rgba(212,175,55,0.2)_0%,rgba(212,175,55,0.04)_65%,transparent_70%)] shadow-[0_0_30px_rgba(212,175,55,0.2)]">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#D4AF37]/20 bg-black/30 text-[#D4AF37] shadow-inner">
                <Gift className="h-12 w-12" strokeWidth={1.6} />
              </div>
            </div>

            <div className="mb-5 flex items-center justify-center gap-2 text-sm font-semibold text-white/55">
              <Clock3 className="h-4 w-4 text-[#D4AF37]" />
              Chuỗi điểm danh: 
              <span className="font-black text-white">{currentStreak} ngày</span>
            </div>

            <button
              type="button"
              disabled={
                checkInStatusQuery.isLoading ||
                checkInMutation.isPending ||
                isCheckedInToday
              }
              onClick={() => checkInMutation.mutate()}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 text-sm font-black uppercase tracking-wide text-black shadow-[0_0_24px_rgba(212,175,55,0.18)] transition hover:bg-[#E5C158] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] disabled:cursor-not-allowed disabled:border disabled:border-emerald-400/25 disabled:bg-white/[0.06] disabled:text-emerald-300"
            >
              {(checkInStatusQuery.isLoading || checkInMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {isCheckedInToday ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Đã điểm danh
                </>
              ) : checkInMutation.isPending ? (
                "Đang nhận quà..."
              ) : checkInStatusQuery.isLoading ? (
                "Đang kiểm tra..."
              ) : (
                <>
                  <Gift className="h-4 w-4" />
                  Điểm danh nhận quà
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      <section className="w-full lg:w-2/3 flex-1">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D4AF37]">
              DANH SÁCH NHIỆM VỤ
            </p>
            <h2 className="mt-2 font-heading text-2xl font-extrabold text-white">
              Danh Sách Nhiệm Vụ
            </h2>
          </div>
          {!missionsQuery.isLoading && !missionsQuery.isError && (
            <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-white/50">
              {missionsQuery.data?.length ?? 0} nhiệm vụ
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {missionsQuery.isLoading &&
            [0, 1, 2, 3].map((item) => <MissionBarSkeleton key={item} />)}

          {missionsQuery.isError && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-6 py-10 text-center text-sm font-semibold text-red-200">
              Không thể tải danh sách nhiệm vụ. Vui lòng thử lại sau.
            </div>
          )}

          {!missionsQuery.isLoading &&
            !missionsQuery.isError &&
            !missionsQuery.data?.length && (
              <div className="rounded-xl border border-dashed border-white/10 bg-[#14151b]/60 px-6 py-16 text-center">
                <Target className="mx-auto h-10 w-10 text-[#D4AF37]/50" />
                <p className="mt-4 font-heading text-lg font-bold text-white">
                  Chưa có nhiệm vụ hôm nay
                </p>
                <p className="mt-2 text-sm text-white/45">
                  Các thử thách mới sẽ xuất hiện tại đây khi được kích hoạt.
                </p>
              </div>
            )}

          {missionsQuery.data?.map((mission) => {
            const MissionIcon = getMissionIcon(mission.code);
            const progressPercentage = getProgressPercentage(
              mission.currentValue,
              mission.targetValue,
            );
            return (
              <article
                key={mission.missionId}
                className="group rounded-xl border border-white/5 bg-[#14151b]/80 p-4 transition hover:border-[#D4AF37]/40 hover:bg-[#17181f]/90"
              >
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <div className="flex min-w-0 flex-1 items-start gap-4 self-stretch">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37] transition group-hover:shadow-[0_0_20px_rgba(212,175,55,0.12)]">
                      <MissionIcon className="h-6 w-6" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading text-base font-bold text-white sm:text-lg">
                        {mission.title}
                      </h3>
                      <p className="mt-1 text-sm leading-5 text-white/45">
                        {mission.description}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-wider">
                        <span className="text-white/35">Tiến độ</span>
                        <span className="tabular-nums text-white/65">
                          {mission.currentValue}/{mission.targetValue}
                        </span>
                      </div>
                      <div
                        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/50"
                        role="progressbar"
                        aria-label={`Tiến độ nhiệm vụ ${mission.title}`}
                        aria-valuemin={0}
                        aria-valuemax={mission.targetValue}
                        aria-valuenow={Math.min(
                          mission.currentValue,
                          mission.targetValue,
                        )}
                      >
                        <div
                          className="h-full rounded-full bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.45)] transition-[width] duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full shrink-0 items-center justify-between gap-3 border-t border-white/5 pt-4 sm:w-auto sm:min-w-40 sm:flex-col sm:items-stretch sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                    <div className="flex items-center justify-center gap-2 text-sm font-black text-[#D4AF37]">
                      <CircleDollarSign className="h-5 w-5" />
                      {formatCoin(mission.rewardAmount)} Coin
                    </div>

                    {mission.isCompleted ? (
                      <div
                        role="status"
                        className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 text-xs font-bold text-emerald-400"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Đã nhận thưởng
                      </div>
                    ) : (
                      <div
                        aria-disabled="true"
                        className="flex h-9 items-center justify-center rounded-lg bg-white/[0.04] px-4 text-xs font-bold text-white/40 border border-white/10 cursor-not-allowed"
                      >
                        Đang tiến hành...
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
