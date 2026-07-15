"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Film,
  Gift,
  Loader2,
  PlayCircle,
  PlaySquare,
  ShieldCheck,
  Target,
  Trophy,
  UserRoundCheck,
  WalletCards,
} from "lucide-react";
import { useDailyCheckInMutation } from "@/features/coin/hooks/useCoinMutations";
import {
  useCoinWallet,
  useDailyCheckInStatus,
} from "@/features/coin/hooks/useCoinQueries";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";
import { cn } from "@/shared/utils/utils";
import { useMyMissions } from "../hooks/useMissionQueries";
import type { MissionProgressResponseDto } from "../api/mission.dto";
import { AdRewardModal } from "./ad-reward-modal";

function formatCoin(value?: number) {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0);
}

function getProgressPercentage(currentValue: number, targetValue: number) {
  if (targetValue <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, (currentValue / targetValue) * 100));
}

function MissionIconView({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  if (code.startsWith("WATCH_AD_")) {
    return <PlaySquare className={className} />;
  }

  switch (code) {
    case "ONLINE_DAILY":
      return <Clock3 className={className} />;
    case "WATCH_AD_DAILY":
      return <PlaySquare className={className} />;
    case "READ_COMIC_DAILY":
      return <BookOpen className={className} />;
    case "WATCH_VIDEO_DAILY":
      return <Film className={className} />;
    case "COMPLETE_PROFILE":
      return <UserRoundCheck className={className} />;
    default:
      return <Target className={className} />;
  }
}

function MissionListSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]"
        />
      ))}
    </div>
  );
}

function MissionRewardTimeline({ currentStreak }: { currentStreak: number }) {
  const milestones = [1, 3, 7, 16, 30];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121214]/80 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#D4AF37]">Chuỗi nhiệm vụ</p>
          <p className="mt-1 text-xs text-slate-400">
            Giữ nhịp điểm danh để mở các mốc thưởng dài ngày.
          </p>
        </div>
        <Trophy className="h-5 w-5 text-[#D4AF37]" />
      </div>

      <div className="relative">
        <div className="absolute left-5 right-5 top-5 h-px bg-white/10" />
        <div className="relative grid grid-cols-5 gap-2">
          {milestones.map((day) => {
            const isReached = currentStreak >= day;

            return (
              <div key={day} className="flex flex-col items-center gap-2 text-center">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold transition",
                    isReached
                      ? "border-[#D4AF37] bg-[#D4AF37] text-black shadow-[0_0_18px_rgba(212,175,55,0.28)]"
                      : "border-white/10 bg-black/30 text-slate-500",
                  )}
                >
                  {day}
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  ngày
                </span>
                <Gift
                  className={cn(
                    "h-4 w-4",
                    isReached ? "text-[#D4AF37]" : "text-slate-600",
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MissionDetail({
  mission,
  onStartAd,
}: {
  mission: MissionProgressResponseDto | undefined;
  onStartAd: (missionCode: string) => void;
}) {
  if (!mission) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#121214]/70 p-6 text-center">
        <Target className="h-10 w-10 text-[#D4AF37]" />
        <p className="mt-4 text-lg font-semibold text-white/90">
          Chọn một nhiệm vụ
        </p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
          Danh sách bên trái sẽ hiển thị chi tiết, tiến độ và phần thưởng tại đây.
        </p>
      </div>
    );
  }

  const isAdMission = mission.code.startsWith("WATCH_AD_");
  const progressPercentage = getProgressPercentage(
    mission.currentValue,
    mission.targetValue,
  );
  const passiveStatusText =
    mission.currentValue > 0 ? "Đang tiến hành" : "Lắng nghe hệ thống";

  return (
    <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#121214]/88 p-5 shadow-[0_20px_58px_rgba(0,0,0,0.28)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(212,175,55,0.14),transparent_36%),radial-gradient(circle_at_92%_10%,rgba(125,211,252,0.08),transparent_30%)]" />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
              <MissionIconView code={mission.code} className="h-6 w-6" />
            </span>
            <div>
              <Badge variant="premium" className="px-3 py-1 text-xs font-medium">
                Nhiệm vụ đang chọn
              </Badge>
              <h3 className="mt-2 text-xl font-semibold text-white/90">
                {mission.title}
              </h3>
            </div>
          </div>

          <div className="rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-2 text-right">
            <p className="text-[11px] font-medium text-[#F5D46E]/75">
              Thưởng
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-[#F5D46E]">
              <CircleDollarSign className="h-4 w-4" />
              + {formatCoin(mission.rewardAmount)}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-400">
          {mission.description}
        </p>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="mb-3 flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Tiến độ</span>
            <span className="tabular-nums text-[#F5D46E]">
              {mission.currentValue}/{mission.targetValue}
            </span>
          </div>
          <Progress value={progressPercentage} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-xs text-slate-500">Trạng thái</p>
            <p className="mt-1 text-sm font-medium text-slate-200">
              {mission.isCompleted ? "Đã hoàn thành" : passiveStatusText}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-xs text-slate-500">Mục tiêu</p>
            <p className="mt-1 text-sm font-medium text-slate-200">
              {mission.targetValue} lần
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-xs text-slate-500">Phần thưởng</p>
            <p className="mt-1 text-sm font-medium text-[#F5D46E]">
              {formatCoin(mission.rewardAmount)} Coin
            </p>
          </div>
        </div>

        <div className="mt-5">
          {mission.isCompleted ? (
            <div className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-sm font-medium text-[#D4AF37]">
              <CheckCircle2 className="h-4 w-4" />
              Đã nhận thưởng
            </div>
          ) : isAdMission ? (
            <Button
              type="button"
              onClick={() => onStartAd(mission.code)}
              className="h-11 w-full rounded-xl bg-[#D4AF37] text-sm font-semibold text-black hover:bg-[#F3CE5E]"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Làm nhiệm vụ
            </Button>
          ) : (
            <div className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] text-sm font-medium text-slate-400">
              <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
              {passiveStatusText}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function MissionCenter() {
  const [activeAdMission, setActiveAdMission] = useState<string | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const missionsQuery = useMyMissions();
  const walletQuery = useCoinWallet();
  const checkInStatusQuery = useDailyCheckInStatus();
  const checkInMutation = useDailyCheckInMutation();

  const missions = useMemo(() => missionsQuery.data ?? [], [missionsQuery.data]);
  const selectedMission = useMemo(() => {
    if (missions.length === 0) return undefined;
    return (
      missions.find((mission) => mission.missionId === selectedMissionId) ??
      missions[0]
    );
  }, [missions, selectedMissionId]);

  const isCheckedInToday =
    Boolean(checkInStatusQuery.data?.isCheckedInToday) ||
    Boolean(checkInMutation.data);
  const currentStreak =
    checkInMutation.data?.currentStreak ??
    checkInStatusQuery.data?.currentStreak ??
    0;
  const isCheckingIn =
    checkInStatusQuery.isLoading || checkInMutation.isPending;
  const walletBalance = walletQuery.isLoading
    ? "..."
    : formatCoin(walletQuery.data?.balance);

  return (
    <>
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#101012] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-6 lg:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(212,175,55,0.18),transparent_32%),radial-gradient(circle_at_88%_12%,rgba(125,211,252,0.08),transparent_30%),linear-gradient(135deg,rgba(212,175,55,0.06),transparent_38%)]" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-center">
          <div>
            <Badge variant="premium" className="mb-4 px-3 py-1 text-xs font-medium">
              TaleX Reward Hub
            </Badge>
            <h1 className="text-3xl font-semibold tracking-normal text-white/92 md:text-4xl">
              Thử thách hằng ngày
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              Hoàn thành nhiệm vụ, giữ chuỗi điểm danh và tích lũy Coin để mở
              khóa thêm nội dung trong TaleX Universe.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Nhiệm vụ", value: missions.length || 0, icon: Target },
                { label: "Chuỗi ngày", value: currentStreak, icon: CalendarDays },
                { label: "Số dư", value: walletBalance, icon: WalletCards },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-[#D4AF37]/35"
                  >
                    <Icon className="mb-3 h-5 w-5 text-[#D4AF37]" />
                    <p className="text-xs font-medium text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white/90">
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121214]/86 p-5 text-center shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
              <CalendarDays className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-white/90">
              Điểm danh ngày {currentStreak + (isCheckedInToday ? 0 : 1)}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
              Chuỗi hiện tại:{" "}
              <span className="font-semibold text-[#D4AF37]">
                {currentStreak} ngày
              </span>
              .
            </p>

            <Button
              type="button"
              disabled={isCheckingIn || isCheckedInToday}
              onClick={() => checkInMutation.mutate()}
              className={cn(
                "mt-5 h-12 w-full rounded-xl text-sm font-semibold",
                isCheckedInToday
                  ? "border border-white/10 bg-white/[0.05] text-slate-400 hover:bg-white/[0.05]"
                  : "bg-[#D4AF37] text-black hover:bg-[#F3CE5E]",
              )}
            >
              {isCheckingIn && !isCheckedInToday ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isCheckedInToday ? (
                <CheckCircle2 className="mr-2 h-4 w-4 text-[#D4AF37]" />
              ) : (
                <Gift className="mr-2 h-4 w-4" />
              )}
              {isCheckedInToday
                ? "Đã điểm danh"
                : checkInMutation.isPending
                  ? "Đang nhận quà..."
                  : checkInStatusQuery.isLoading
                    ? "Đang kiểm tra..."
                    : "Điểm danh"}
            </Button>

            <Link
              href="/coin-history"
              className="mt-3 flex h-10 items-center justify-between rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07] px-4 text-sm text-cyan-100 transition hover:border-cyan-200/35 hover:bg-cyan-300/[0.11]"
            >
              <span className="inline-flex items-center gap-2 font-medium text-cyan-200/85">
                <WalletCards className="h-4 w-4" />
                Số dư coin
              </span>
              <span className="font-semibold tabular-nums text-white">
                {walletBalance}
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <MissionRewardTimeline currentStreak={currentStreak} />

          <div className="rounded-2xl border border-white/10 bg-[#121214]/80 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[#D4AF37]" />
                <h2 className="text-base font-semibold text-white/90">
                  Nhiệm vụ hôm nay
                </h2>
              </div>
              <Badge variant="outline" className="text-xs font-medium">
                {missions.length} mục
              </Badge>
            </div>

            {missionsQuery.isLoading && <MissionListSkeleton />}

            {missionsQuery.isError && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-5 text-sm font-medium text-red-200">
                Không thể tải danh sách nhiệm vụ. Vui lòng thử lại sau.
              </div>
            )}

            {!missionsQuery.isLoading &&
              !missionsQuery.isError &&
              missions.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center">
                  <Target className="mx-auto h-8 w-8 text-[#D4AF37]/60" />
                  <p className="mt-3 text-sm font-medium text-white/80">
                    Chưa có nhiệm vụ hôm nay
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Các thử thách mới sẽ xuất hiện khi hệ thống kích hoạt.
                  </p>
                </div>
              )}

            <div className="space-y-3">
              {missions.map((mission) => {
                const progressPercentage = getProgressPercentage(
                  mission.currentValue,
                  mission.targetValue,
                );
                const isSelected =
                  selectedMission?.missionId === mission.missionId;

                return (
                  <button
                    key={mission.missionId}
                    type="button"
                    onClick={() => setSelectedMissionId(mission.missionId)}
                    className={cn(
                      "group w-full rounded-2xl border p-3 text-left transition hover:border-[#D4AF37]/35 hover:bg-white/[0.04]",
                      isSelected
                        ? "border-[#D4AF37]/40 bg-[#D4AF37]/[0.08]"
                        : "border-white/10 bg-white/[0.025]",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
                        <MissionIconView code={mission.code} className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-semibold text-white/88">
                            {mission.title}
                          </p>
                          <span className="shrink-0 text-xs font-semibold text-[#F5D46E]">
                            +{formatCoin(mission.rewardAmount)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <Progress value={progressPercentage} className="h-1.5" />
                          <span className="shrink-0 text-xs tabular-nums text-slate-500">
                            {mission.currentValue}/{mission.targetValue}
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 shrink-0 transition",
                          isSelected
                            ? "text-[#D4AF37]"
                            : "text-slate-600 group-hover:text-[#D4AF37]",
                        )}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <MissionDetail
          mission={selectedMission}
          onStartAd={(missionCode) => setActiveAdMission(missionCode)}
        />
      </section>

      <AdRewardModal
        isOpen={Boolean(activeAdMission)}
        onClose={() => setActiveAdMission(null)}
        missionCode={activeAdMission || ""}
      />
    </>
  );
}
