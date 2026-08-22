"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Users,
  Eye,
  Clock,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Zap,
} from "lucide-react";
import {
  useGetNextCreatorTier,
  useGetCreatorTiers,
} from "../hooks/use-creator-tiers";

function formatWatchTime(seconds: number): string {
  if (seconds <= 0) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = (seconds / 3600).toFixed(1);
  return `${hours}h`;
}

interface CreatorTierHoverModalProps {
  currentTierLevel?: number;
  currentFollowers?: number;
  currentViews?: number;
  currentWatchTime?: number;
  children: React.ReactNode;
}

export function CreatorTierHoverModal({
  currentTierLevel = 0,
  currentFollowers = 0,
  currentViews = 0,
  currentWatchTime = 0,
  children,
}: CreatorTierHoverModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"progress" | "perks">("progress");

  // 1. Fetch all tiers
  const { data: tiersResponse, isLoading: isTiersLoading } = useGetCreatorTiers({
    page: 1,
    pageSize: 50,
    sortBy: "tierLevel",
    sortDirection: "ASC",
  });

  // 2. Fetch next tier target
  const { data: nextTier, isLoading: isNextLoading } = useGetNextCreatorTier(currentTierLevel);

  const tiersList = tiersResponse?.data?.content || [];
  const currentTier =
    tiersList.find((t) => t.tierLevel === currentTierLevel) ||
    (currentTierLevel === 0 ? tiersList.find((t) => t.isDefault) : null);

  const isLoading = isTiersLoading || isNextLoading;

  const minFollowers = nextTier?.minFollowerRequired || 1;
  const minViews = nextTier?.minViewsRequired || 1;
  const minWatchTime = nextTier?.minWatchTimeRequired || 1;

  const followerPct = Math.min(100, Math.round((currentFollowers / minFollowers) * 100));
  const viewsPct = Math.min(100, Math.round((currentViews / minViews) * 100));
  const watchTimePct = Math.min(100, Math.round((currentWatchTime / minWatchTime) * 100));

  const currentPremiumRatio =
    currentTier?.premiumFundShareRatio != null
      ? (currentTier.premiumFundShareRatio * 100).toFixed(0)
      : "0";
  const currentDirectRatio =
    currentTier?.directPurchaseShareRatio != null
      ? (currentTier.directPurchaseShareRatio * 100).toFixed(0)
      : "0";

  const nextPremiumRatio =
    nextTier?.premiumFundShareRatio != null
      ? (nextTier.premiumFundShareRatio * 100).toFixed(0)
      : null;
  const nextDirectRatio =
    nextTier?.directPurchaseShareRatio != null
      ? (nextTier.directPurchaseShareRatio * 100).toFixed(0)
      : null;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {children}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute left-0 bottom-full mb-3 z-[9999] w-[340px] sm:w-[380px] rounded-2xl border border-amber-500/40 bg-[#141417] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.98)] text-xs font-sans text-white pointer-events-auto"
          >
            {isLoading ? (
              <div className="flex h-28 items-center justify-center text-zinc-400 gap-2 font-medium">
                <Sparkles className="h-4 w-4 animate-spin text-[#FACC15]" /> Đang tải cấp bậc...
              </div>
            ) : !nextTier ? (
              /* Case: MAX LEVEL */
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/10">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-[#FACC15] border border-amber-500/30">
                    <Award size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white leading-tight">
                      Level {currentTierLevel}: {currentTier?.tierName || "Cấp Độ Tối Đa"}
                    </h4>
                    <span className="text-[10px] text-amber-400 font-bold">Hạng Creator cao nhất hệ thống</span>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-2.5 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <ShieldCheck size={12} /> Đặc quyền tối đa đang sở hữu
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-black/40 border border-white/5 p-2">
                      <span className="text-zinc-400 block text-[9.5px]">Quỹ Premium</span>
                      <span className="font-black text-emerald-400 text-xs">+{currentPremiumRatio}% chia sẻ</span>
                    </div>
                    <div className="rounded-lg bg-black/40 border border-white/5 p-2">
                      <span className="text-zinc-400 block text-[9.5px]">Bán trực tiếp</span>
                      <span className="font-black text-amber-400 text-xs">+{currentDirectRatio}% chia sẻ</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Case: HAS NEXT TIER */
              <div className="space-y-3">
                {/* 1. Header (Ultra Compact) */}
                <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-[#FACC15] border border-amber-500/30">
                      <Award size={17} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white">
                          Level {currentTierLevel}
                        </span>
                        {currentTier?.tierName && (
                          <span className="text-[10.5px] font-semibold text-[#FACC15]">
                            • {currentTier.tierName}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 font-medium">
                        Mục tiêu: <strong className="text-zinc-200">Level {nextTier.tierLevel} ({nextTier.tierName})</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Segmented Tabs for Compact Space */}
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-black/50 p-1 border border-white/5">
                  <button
                    type="button"
                    onClick={() => setActiveTab("progress")}
                    className={`h-7 rounded-lg text-[10.5px] font-bold transition cursor-pointer ${
                      activeTab === "progress"
                        ? "bg-[#25252b] text-[#FACC15] shadow-sm border border-yellow-500/30"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Tiến độ thăng cấp
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("perks")}
                    className={`h-7 rounded-lg text-[10.5px] font-bold transition cursor-pointer ${
                      activeTab === "perks"
                        ? "bg-[#25252b] text-[#FACC15] shadow-sm border border-yellow-500/30"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    So sánh đặc quyền
                  </button>
                </div>

                {/* Tab 1: Progress */}
                {activeTab === "progress" ? (
                  <div className="space-y-2.5 pt-0.5">
                    {/* Followers */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10.5px] font-semibold">
                        <span className="text-zinc-300 flex items-center gap-1">
                          <Users size={11} className="text-emerald-400" /> Followers
                        </span>
                        <span className="text-zinc-400 font-mono text-[10.5px]">
                          <strong className="text-emerald-400">{currentFollowers.toLocaleString("vi-VN")}</strong> / {minFollowers.toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${followerPct}%` }} />
                      </div>
                    </div>

                    {/* Views */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10.5px] font-semibold">
                        <span className="text-zinc-300 flex items-center gap-1">
                          <Eye size={11} className="text-[#D4AF37]" /> Tổng Lượt xem
                        </span>
                        <span className="text-zinc-400 font-mono text-[10.5px]">
                          <strong className="text-[#D4AF37]">{currentViews.toLocaleString("vi-VN")}</strong> / {minViews.toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full bg-[#D4AF37] rounded-full transition-all duration-500" style={{ width: `${viewsPct}%` }} />
                      </div>
                    </div>

                    {/* WatchTime */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10.5px] font-semibold">
                        <span className="text-zinc-300 flex items-center gap-1">
                          <Clock size={11} className="text-indigo-400" /> Thời gian xem
                        </span>
                        <span className="text-zinc-400 font-mono text-[10.5px]">
                          <strong className="text-indigo-400">{formatWatchTime(currentWatchTime)}</strong> / {formatWatchTime(minWatchTime)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${watchTimePct}%` }} />
                      </div>
                    </div>

                    {/* Quick Perk Hint */}
                    <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Mở khóa ở Lvl {nextTier.tierLevel}:</span>
                      <span className="font-bold text-[#FACC15]">
                        Premium +{nextPremiumRatio}% • Bán +{nextDirectRatio}%
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Tab 2: Perks Comparison Table */
                  <div className="space-y-2 pt-0.5">
                    {/* Comparison Cards */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Current Level Box */}
                      <div className="rounded-xl border border-white/10 bg-black/40 p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">
                            Cấp hiện tại
                          </span>
                          <span className="rounded bg-white/10 px-1 py-0.2 text-[8.5px] font-bold text-zinc-300">
                            Lvl {currentTierLevel}
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-zinc-400 text-[10px]">Premium:</span>
                            <span className="font-bold text-zinc-200">+{currentPremiumRatio}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400 text-[10px]">Bán trực tiếp:</span>
                            <span className="font-bold text-zinc-200">+{currentDirectRatio}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Next Level Box */}
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-400 uppercase">
                            Mục tiêu tiếp theo
                          </span>
                          <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[8.5px] font-bold text-amber-300">
                            Lvl {nextTier.tierLevel}
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-zinc-400 text-[10px]">Premium:</span>
                            <span className="font-black text-emerald-400">+{nextPremiumRatio}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400 text-[10px]">Bán trực tiếp:</span>
                            <span className="font-black text-amber-400">+{nextDirectRatio}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
