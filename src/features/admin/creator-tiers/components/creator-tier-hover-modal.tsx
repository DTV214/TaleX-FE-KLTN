"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Users, Eye, Clock, Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useGetNextCreatorTier } from "../hooks/use-creator-tiers";

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
  const { data: nextTier, isLoading } = useGetNextCreatorTier(currentTierLevel);

  const minFollowers = nextTier?.minFollowerRequired || 1;
  const minViews = nextTier?.minViewsRequired || 1;
  const minWatchTime = nextTier?.minWatchTimeRequired || 1;

  const followerPct = Math.min(100, Math.round((currentFollowers / minFollowers) * 100));
  const viewsPct = Math.min(100, Math.round((currentViews / minViews) * 100));
  const watchTimePct = Math.min(100, Math.round((currentWatchTime / minWatchTime) * 100));

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
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-0 bottom-full mb-3 z-50 w-80 sm:w-96 rounded-3xl border border-amber-500/30 bg-zinc-950/95 p-5 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-xl text-xs font-sans text-white pointer-events-auto"
          >
            {isLoading ? (
              <div className="flex h-32 items-center justify-center text-zinc-500 gap-2 font-medium">
                <Sparkles className="h-4 w-4 animate-spin text-amber-400" /> Đang tải tiến độ thăng cấp...
              </div>
            ) : !nextTier ? (
              <div className="p-3 text-center text-zinc-300 font-semibold space-y-1">
                <span className="text-2xl block">🏆</span>
                <p className="text-amber-400 font-bold text-sm">Cấp độ Tối Đa!</p>
                <p className="text-[11px] text-zinc-400">Bạn đã đạt hạng Creator cao nhất hệ thống TaleX.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Award size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                        Mục tiêu thăng cấp
                      </span>
                      <h4 className="text-sm font-black text-white leading-tight">
                        Level {nextTier.tierLevel}: {nextTier.tierName}
                      </h4>
                    </div>
                  </div>
                  <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold text-amber-300 shrink-0">
                    Cấp hiện tại: Lvl {currentTierLevel}
                  </span>
                </div>

                {/* Condition Progress Bars */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Điều kiện cần đạt để thăng cấp
                  </span>

                  {/* Followers */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-zinc-300 flex items-center gap-1.5">
                        <Users size={13} className="text-emerald-400" /> Người đăng ký (Followers)
                      </span>
                      <span className="text-white">
                        <strong className="text-emerald-400">{currentFollowers.toLocaleString("vi-VN")}</strong> / {minFollowers.toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${followerPct}%` }} />
                    </div>
                  </div>

                  {/* Views */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-zinc-300 flex items-center gap-1.5">
                        <Eye size={13} className="text-[#D4AF37]" /> Tổng Lượt xem (Views)
                      </span>
                      <span className="text-white">
                        <strong className="text-[#D4AF37]">{currentViews.toLocaleString("vi-VN")}</strong> / {minViews.toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-[#D4AF37] rounded-full transition-all duration-500" style={{ width: `${viewsPct}%` }} />
                    </div>
                  </div>

                  {/* WatchTime */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-zinc-300 flex items-center gap-1.5">
                        <Clock size={13} className="text-indigo-400" /> Thời gian xem tích lũy (Watch Time)
                      </span>
                      <span className="text-white">
                        <strong className="text-indigo-400">{formatWatchTime(currentWatchTime)}</strong> / {formatWatchTime(minWatchTime)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${watchTimePct}%` }} />
                    </div>
                  </div>
                </div>

                {/* Footer Perks */}
                <div className="pt-3 border-t border-white/10 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <ShieldCheck size={13} /> Quyền lợi khi đạt Level {nextTier.tierLevel}
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2">
                      <span className="text-zinc-400 block text-[10px]">Quỹ Premium</span>
                      <span className="font-bold text-emerald-400">+{(nextTier.premiumFundShareRatio * 100).toFixed(0)}% chia sẻ</span>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2">
                      <span className="text-zinc-400 block text-[10px]">Bán trực tiếp</span>
                      <span className="font-bold text-amber-400">+{(nextTier.directPurchaseShareRatio * 100).toFixed(0)}% chia sẻ</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
