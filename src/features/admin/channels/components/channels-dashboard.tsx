"use client";

import { ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  GENERAL_CHANNELS,
  type ChannelKey,
  type ChannelSeriesCard,
  type MainTabKey,
} from "../types/channels.types";
import { ChannelSection } from "./channel-section";
import { PersonalRecommendationsTab } from "./personal-recommendations-tab";
import { RecommendationBrainTab } from "./recommendation-brain-tab";
import { SeriesChannelConfigModal } from "./series-channel-config-modal";
import { useTriggerChannelsPool } from "../hooks/use-admin-channels";
import {
  Layers,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  X,
  Star,
  Eye,
  Globe,
  Users,
  Calendar,
  Tv,
  Zap,
  CheckCircle2,
  AlertCircle,
  Brain,
} from "lucide-react";
import Image from "next/image";

export function AdminChannelsDashboard() {
  // Main Sub-tabs: "general" (Kênh chung) vs "personal" (Kênh đề xuất cá nhân)
  const [activeMainTab, setActiveMainTab] = useState<MainTabKey>("general");

  // Selected Channel Key in Dropdown (default: 1st channel "promoted")
  const [selectedChannelKey, setSelectedChannelKey] = useState<ChannelKey>("promoted");

  // Detail Modal state
  const [selectedCard, setSelectedCard] = useState<ChannelSeriesCard | null>(null);

  // Config Modal state
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedCard(null);
        setIsConfigModalOpen(false);
      }
    };
    if (selectedCard || isConfigModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [selectedCard, isConfigModalOpen]);

  // Trigger Pool Mutation (POST /api/v1/channels/pool)
  const triggerPoolMutation = useTriggerChannelsPool();
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleTriggerPool = async () => {
    setNotification(null);
    try {
      await triggerPoolMutation.mutateAsync();
      const successMsg = "Đồng bộ và khởi tạo dữ liệu pool kênh thành công!";
      toast.success(successMsg, { duration: 3000 });
      setNotification({
        type: "success",
        message: successMsg,
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra khi kích hoạt tiến trình tạo pool.";
      toast.error(errorMsg, { duration: 3000 });
      setNotification({
        type: "error",
        message: errorMsg,
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Metadata of currently selected channel
  const currentChannelMeta =
    GENERAL_CHANNELS.find((ch) => ch.key === selectedChannelKey) ||
    GENERAL_CHANNELS[0];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  function PageShell({ children }: { children: ReactNode }) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {children}
      </div>
    );
  }

  return (
    <PageShell>
      <div className="space-y-6 pb-12">
        {/* Top-Right Notification Toast */}
        {notification && (
          <div
            className={`fixed top-6 right-6 z-50 flex items-center justify-between gap-4 rounded-xl p-4 text-xs font-medium shadow-xl border transition-all animate-in fade-in slide-in-from-top-2 min-w-[280px] max-w-md ${notification.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
              }`}
          >
            <div className="flex items-center gap-2.5">
              {notification.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              )}
              <span className="font-semibold">{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="rounded-lg p-1 text-slate-500 hover:bg-black/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 backoffice-dark:text-white">
                Quản Lý Kênh Hiển Thị
              </h1>
            </div>
          </div>

          {/* Action Buttons (only on Kênh chung tab) */}
          {activeMainTab === "general" && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95 cursor-pointer backoffice-dark:border-white/10 backoffice-dark:bg-white/5 backoffice-dark:text-white backoffice-dark:hover:bg-white/10"
                title="Cài đặt giới hạn số lượng kênh"
              >
                <SlidersHorizontal className="h-4 w-4 text-violet-600 backoffice-dark:text-violet-400" />
                <span>Cài đặt</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerPool}
                disabled={triggerPoolMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-violet-700 active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Đồng bộ lại pool kênh"
              >
                <RefreshCw className={`h-4 w-4 ${triggerPoolMutation.isPending ? "animate-spin" : ""}`} />
                <span>Khởi Tạo Lại</span>
              </button>
            </div>
          )}
        </div>

        {/* Main Top-Level Tabs (2 Mục Con: Kênh chung & Kênh đề xuất cá nhân) */}
        <div className="flex justify-between border-b border-slate-200 bg-white px-2 pt-2 rounded-t-2xl">
          <button
            type="button"
            onClick={() => setActiveMainTab("general")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition-all ${activeMainTab === "general"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
          >
            <Layers className="h-4.5 w-4.5" />
            <span>Kênh chung</span>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
              7 kênh
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("personal")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition-all ${activeMainTab === "personal"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
          >
            <Sparkles className="h-4.5 w-4.5 text-amber-500" />
            <span>Kênh đề xuất cá nhân</span>

          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("ai-brain")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition-all ${activeMainTab === "ai-brain"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
          >
            <Brain className="h-4.5 w-4.5 text-violet-600" />
            <span>AI Recommendation Model</span>
          </button>
        </div>

        {/* Content for TAB 1: Kênh Chung */}
        {activeMainTab === "general" && (
          <div className="space-y-6">
            {/* Channel Selector Bar (Pill Buttons) */}
            <div className="flex flex-wrap justify-center items-center gap-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              {GENERAL_CHANNELS.map((ch) => (
                <button
                  key={ch.key}
                  type="button"
                  onClick={() => setSelectedChannelKey(ch.key)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap ${selectedChannelKey === ch.key
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>

            {/* Lazy-Loaded Channel Section for the selected channel */}
            <ChannelSection
              key={currentChannelMeta.key}
              meta={currentChannelMeta}
              onSelectCard={setSelectedCard}
            />
          </div>
        )}

        {/* Content for TAB 2: Kênh Đề Xuất Cá Nhân */}
        {activeMainTab === "personal" && (
          <PersonalRecommendationsTab onSelectCard={setSelectedCard} />
        )}

        {/* Content for TAB 3: Bộ Não AI Recommendation */}
        {activeMainTab === "ai-brain" && <RecommendationBrainTab />}


        {/* Series Detail Modal */}
        {selectedCard && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedCard(null)}
          >
            <div
              className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-200/80 backoffice-dark:border-white/10 backoffice-dark:bg-slate-900 backoffice-dark:text-white flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header (Close button outside image) */}
              <div className="flex items-center justify-between pb-3">
                <h3 className="text-base font-bold text-slate-900 backoffice-dark:text-white">
                  Chi tiết Series
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 backoffice-dark:bg-white/10 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/20 transition-all cursor-pointer"
                  title="Đóng"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Banner/Cover Header */}
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-100 backoffice-dark:bg-white/5 border border-slate-200/60 backoffice-dark:border-white/10">
                {selectedCard.bannerUrl || selectedCard.coverUrl ? (
                  <Image
                    src={selectedCard.bannerUrl || selectedCard.coverUrl}
                    alt={selectedCard.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-100 to-indigo-50 text-slate-400 backoffice-dark:from-violet-950/40 backoffice-dark:to-indigo-950/40 backoffice-dark:text-white/40">
                    <Layers className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="rounded-full bg-slate-900/85 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                    {selectedCard.contentType}
                  </span>
                  {selectedCard.ageRating && (
                    <span className="rounded-full bg-slate-900/85 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                      {selectedCard.ageRating}
                    </span>
                  )}
                </div>
              </div>

              {/* Info details */}
              <div className="mt-5 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 backoffice-dark:text-white">{selectedCard.title}</h3>
                  <p className="mt-1 text-xs text-slate-600 backoffice-dark:text-white/70 leading-relaxed">
                    {selectedCard.description || "Không có mô tả."}
                  </p>
                </div>

                {/* Creator bar */}
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100 backoffice-dark:border-white/10 backoffice-dark:bg-white/5">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-slate-200 backoffice-dark:bg-white/10">
                    {selectedCard.creatorAvatar ? (
                      <Image
                        src={selectedCard.creatorAvatar}
                        alt={selectedCard.creatorName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-violet-200 text-violet-800 font-bold backoffice-dark:bg-violet-950/50 backoffice-dark:text-violet-300">
                        {(selectedCard.creatorName || "C").charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="block font-bold text-sm text-slate-900 backoffice-dark:text-white">
                      {selectedCard.creatorName}
                    </span>
                    <span className="text-xs text-slate-500 backoffice-dark:text-white/60">
                      {selectedCard.totalCreatorFollowers ?? 0} người theo dõi
                    </span>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 backoffice-dark:border-white/10 backoffice-dark:bg-white/5">
                    <span className="flex items-center gap-1 text-slate-400 backoffice-dark:text-white/60 mb-1">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      Đánh giá
                    </span>
                    <span className="font-bold text-slate-900 backoffice-dark:text-white text-sm">
                      {selectedCard.averageRating != null ? Number(selectedCard.averageRating).toFixed(1) : "—"} / 5.0
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 backoffice-dark:border-white/10 backoffice-dark:bg-white/5">
                    <span className="flex items-center gap-1 text-slate-400 backoffice-dark:text-white/60 mb-1">
                      <Eye className="h-3.5 w-3.5 text-slate-400 backoffice-dark:text-white/60" />
                      Tổng lượt xem
                    </span>
                    <span className="font-bold text-slate-900 backoffice-dark:text-white text-sm">
                      {(selectedCard.totalViews ?? 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 backoffice-dark:border-white/10 backoffice-dark:bg-white/5">
                    <span className="flex items-center gap-1 text-slate-400 backoffice-dark:text-white/60 mb-1">
                      <Globe className="h-3.5 w-3.5 text-slate-400 backoffice-dark:text-white/60" />
                      Ngôn ngữ
                    </span>
                    <span className="font-bold text-slate-900 backoffice-dark:text-white text-sm">
                      {selectedCard.language || "—"}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 backoffice-dark:border-white/10 backoffice-dark:bg-white/5">
                    <span className="flex items-center gap-1 text-slate-400 backoffice-dark:text-white/60 mb-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 backoffice-dark:text-white/60" />
                      Cập nhật
                    </span>
                    <span className="font-bold text-slate-900 backoffice-dark:text-white text-xs">
                      {formatDate(selectedCard.releasedUpdateTime || selectedCard.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Series Channel Config Modal */}
        <SeriesChannelConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
        />
      </div>
    </PageShell>
  );
}
