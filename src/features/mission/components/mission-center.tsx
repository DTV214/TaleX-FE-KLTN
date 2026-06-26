"use client";

import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Film,
  Gift,
  Loader2,
  PlaySquare,
  ShieldCheck,
  Sparkles,
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

function MissionCardSkeleton() {
  return (
    <div className="h-full animate-pulse rounded-2xl border border-white/5 bg-[#171923]/60 p-6 backdrop-blur-xl">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div className="h-14 w-14 rounded-xl bg-white/10" />
        <div className="space-y-2 text-right">
          <div className="ml-auto h-2 w-14 rounded-full bg-white/10" />
          <div className="h-6 w-24 rounded-full bg-white/10" />
        </div>
      </div>
      <div className="h-5 w-3/4 rounded-full bg-white/10" />
      <div className="mt-4 h-3 w-full rounded-full bg-white/[0.07]" />
      <div className="mt-2 h-3 w-2/3 rounded-full bg-white/[0.07]" />
      <div className="mt-8 h-1.5 w-full rounded-full bg-white/[0.07]" />
      <div className="mt-8 h-11 w-full rounded-lg bg-white/[0.07]" />
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
  const isCheckingIn =
    checkInStatusQuery.isLoading || checkInMutation.isPending;

  return (
    <>
      <section className="mb-16 grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h1 className="font-heading font-display-lg mb-4 bg-gradient-to-r from-[#f2ca50] to-[#d4af37] bg-clip-text text-4xl font-black text-transparent md:text-5xl">
            Thử Thách Hằng Ngày
          </h1>
          <p className="max-w-xl text-lg leading-8 text-white/60">
            Chinh phục nhiệm vụ mỗi ngày, duy trì chuỗi điểm danh và tích lũy
            Coin để mở khóa thêm nhiều trải nghiệm trong TaleX Universe.
          </p>
          <div className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#d4af37]">
            <Sparkles className="h-4 w-4" />
            Premium Rewards Available
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#171923]/60 p-8 text-center backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-[#d4af37]/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
            <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[#d4af37]/10 blur-3xl transition-all group-hover:bg-[#d4af37]/20" />
            <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[#8f191d]/10 blur-3xl" />

            <div className="relative">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37] shadow-[0_0_28px_rgba(212,175,55,0.16)] transition-transform group-hover:scale-105">
                <CalendarDays className="h-12 w-12" strokeWidth={1.7} />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/35">
                Daily Check-in
              </p>
              <h2 className="mt-3 text-2xl font-black text-white">
                Check-in Ngày {currentStreak + (isCheckedInToday ? 0 : 1)}
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/50">
                Chuỗi hiện tại:{" "}
                <span className="font-bold text-[#d4af37]">
                  {currentStreak} ngày
                </span>
                . Điểm danh để nhận Coin và giữ nhịp phần thưởng hằng ngày.
              </p>

              <button
                type="button"
                disabled={isCheckingIn || isCheckedInToday}
                onClick={() => checkInMutation.mutate()}
                className={
                  isCheckedInToday
                    ? "mt-8 flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/5 py-4 text-sm font-black uppercase tracking-widest text-white/40 transition disabled:cursor-not-allowed"
                    : "mt-8 flex w-full items-center justify-center gap-3 rounded-lg bg-[#d4af37] py-4 text-sm font-black uppercase tracking-widest text-black shadow-lg shadow-[#d4af37]/10 transition hover:bg-[#f2ca50] active:scale-[0.98] disabled:cursor-wait disabled:opacity-75"
                }
              >
                {isCheckingIn && !isCheckedInToday ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isCheckedInToday ? (
                  <CheckCircle2 className="h-5 w-5 text-[#d4af37]" />
                ) : (
                  <Gift className="h-5 w-5" />
                )}
                {isCheckedInToday
                  ? "Đã Điểm Danh"
                  : checkInMutation.isPending
                    ? "Đang Nhận Quà..."
                    : checkInStatusQuery.isLoading
                      ? "Đang Kiểm Tra..."
                      : "Điểm Danh"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-center gap-3">
          <Target className="h-6 w-6 text-[#d4af37]" />
          <h2 className="text-xl font-bold uppercase tracking-widest text-white">
            Nhiệm Vụ Kích Hoạt
          </h2>
        </div>

        {missionsQuery.isError && (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.06] px-6 py-10 text-center text-sm font-semibold text-red-200 backdrop-blur-xl">
            Không thể tải danh sách nhiệm vụ. Vui lòng thử lại sau.
          </div>
        )}

        {!missionsQuery.isLoading &&
          !missionsQuery.isError &&
          !missionsQuery.data?.length && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#171923]/60 px-6 py-16 text-center backdrop-blur-xl">
              <Target className="mx-auto h-12 w-12 text-[#d4af37]/55" />
              <p className="mt-4 text-lg font-bold text-white">
                Chưa có nhiệm vụ hôm nay
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">
                Các thử thách mới sẽ xuất hiện tại đây khi hệ thống kích hoạt.
              </p>
            </div>
          )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {missionsQuery.isLoading &&
            [0, 1, 2, 3, 4, 5].map((item) => (
              <MissionCardSkeleton key={item} />
            ))}

          {missionsQuery.data?.map((mission) => {
            const MissionIcon = getMissionIcon(mission.code);
            const progressPercentage = getProgressPercentage(
              mission.currentValue,
              mission.targetValue,
            );
            const passiveStatusText = mission.currentValue > 0
              ? "Đang Tiến Hành..."
              : "Lắng Nghe Hệ Thống...";

            return (
              <article
                key={mission.missionId}
                className="group flex h-full flex-col rounded-2xl border border-white/5 bg-[#171923]/60 p-6 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-[#d4af37]/40 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
              >
                <div className="mb-7 flex items-start justify-between gap-6">
                  <div className="rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/10 p-3 text-[#d4af37] shadow-[0_0_18px_rgba(212,175,55,0.08)]">
                    <MissionIcon className="h-7 w-7" />
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                      Reward
                    </p>
                    <div className="mt-1 flex items-center justify-end gap-1.5 text-[#d4af37]">
                      <CircleDollarSign className="h-5 w-5" />
                      <span className="text-xl font-black">
                        + {formatCoin(mission.rewardAmount)} Coin
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-7">
                  <h4 className="text-xl font-black leading-7 text-white transition-colors group-hover:text-[#d4af37]">
                    {mission.title}
                  </h4>
                  <p className="mt-3 text-sm leading-6 text-white/45">
                    {mission.description}
                  </p>
                </div>

                <div className="mb-8">
                  <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-widest">
                    <span className="text-white/35">Tiến độ</span>
                    <span className="tabular-nums text-[#d4af37]">
                      {mission.currentValue}/{mission.targetValue}
                    </span>
                  </div>
                  <div
                    className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5"
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
                      className="h-full rounded-full bg-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.6)] transition-[width] duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="mt-auto border-t border-white/5 pt-5">
                  {mission.isCompleted ? (
                    <div
                      role="status"
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#d4af37]/20 bg-[#d4af37]/10 py-3 text-xs font-bold uppercase tracking-widest text-[#d4af37]"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Đã Nhận Thưởng
                    </div>
                  ) : (
                    <div
                      aria-disabled="true"
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-3 text-xs font-bold uppercase tracking-widest text-white/40"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      {passiveStatusText}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
