"use client";

import { useState } from "react";
import {
  GENERAL_CHANNELS,
  type ChannelKey,
  type ChannelSeriesCard,
  type MainTabKey,
} from "../types/channels.types";
import { ChannelSection } from "./channel-section";
import { PersonalRecommendationsTab } from "./personal-recommendations-tab";
import { RecommendationBrainTab } from "./recommendation-brain-tab";
import { useTriggerChannelsPool } from "../hooks/use-admin-channels";
import {
  Layers,
  Sparkles,
  RefreshCw,
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
      setNotification({
        type: "success",
        message: "Kích hoạt tiến trình tạo pool cho các series thành công!",
      });
    } catch (err) {
      setNotification({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Có lỗi xảy ra khi kích hoạt tiến trình tạo pool.",
      });
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

  return (
    <div className="space-y-6 pb-12">
      {/* Notification Toast Banner */}
      {notification && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-xs font-medium shadow-sm transition-all animate-in fade-in ${
            notification.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            )}
            <span>{notification.message}</span>
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
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-200">
              <Tv className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Quản Lý Kênh Hiển Thị</h1>
              <p className="text-xs text-slate-500">
                Theo dõi & quản lý các kênh nội dung tổng hợp và kênh đề xuất cá nhân trên TaleX
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: POST /api/v1/channels/pool */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTriggerPool}
            disabled={triggerPoolMutation.isPending}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95 disabled:opacity-50"
            title="Cập nhật pool kênh (POST /api/v1/channels/pool)"
          >
            <RefreshCw className={`h-4 w-4 text-violet-600 ${triggerPoolMutation.isPending ? "animate-spin" : ""}`} />
            <span>Cập nhật</span>
          </button>
        </div>
      </div>

      {/* Main Top-Level Tabs (2 Mục Con: Kênh chung & Kênh đề xuất cá nhân) */}
      <div className="flex border-b border-slate-200 bg-white px-2 pt-2 rounded-t-2xl">
        <button
          type="button"
          onClick={() => setActiveMainTab("general")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition-all ${
            activeMainTab === "general"
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
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition-all ${
            activeMainTab === "personal"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Sparkles className="h-4.5 w-4.5 text-amber-500" />
          <span>Kênh đề xuất cá nhân</span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
            Cá nhân hóa
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab("ai-brain")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition-all ${
            activeMainTab === "ai-brain"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Brain className="h-4.5 w-4.5 text-violet-600" />
          <span>Bộ Não AI Recommendation</span>
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
            LightGBM Engine
          </span>
        </button>
      </div>

      {/* Content for TAB 1: Kênh Chung */}
      {activeMainTab === "general" && (
        <div className="space-y-6">
          {/* Channel Selector Bar (Pill Buttons) */}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            {GENERAL_CHANNELS.map((ch) => (
              <button
                key={ch.key}
                type="button"
                onClick={() => setSelectedChannelKey(ch.key)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedChannelKey === ch.key
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedCard(null)}
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Banner/Cover Header */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-100">
              {selectedCard.bannerUrl || selectedCard.coverUrl ? (
                <Image
                  src={selectedCard.bannerUrl || selectedCard.coverUrl}
                  alt={selectedCard.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-100 to-indigo-50 text-slate-400">
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
                <h3 className="text-xl font-bold text-slate-900">{selectedCard.title}</h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  {selectedCard.description || "Không có mô tả."}
                </p>
              </div>

              {/* Creator bar */}
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="relative h-10 w-10 overflow-hidden rounded-full bg-slate-200">
                  {selectedCard.creatorAvatar ? (
                    <Image
                      src={selectedCard.creatorAvatar}
                      alt={selectedCard.creatorName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-violet-200 text-violet-800 font-bold">
                      {(selectedCard.creatorName || "C").charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <span className="block font-bold text-sm text-slate-900">
                    {selectedCard.creatorName}
                  </span>
                  <span className="text-xs text-slate-500">
                    ID: {selectedCard.creatorId || selectedCard.accountId} • {selectedCard.totalCreatorFollowers ?? 0} người theo dõi
                  </span>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="flex items-center gap-1 text-slate-400 mb-1">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    Đánh giá trung bình
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedCard.averageRating != null ? Number(selectedCard.averageRating).toFixed(1) : "N/A"} / 5.0
                  </span>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="flex items-center gap-1 text-slate-400 mb-1">
                    <Eye className="h-3.5 w-3.5 text-slate-400" />
                    Tổng lượt xem
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {(selectedCard.totalViews ?? 0).toLocaleString()}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="flex items-center gap-1 text-slate-400 mb-1">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    Ngôn ngữ
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedCard.language || "N/A"}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="flex items-center gap-1 text-slate-400 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Cập nhật mới
                  </span>
                  <span className="font-bold text-slate-900 text-xs">
                    {formatDate(selectedCard.releasedUpdateTime || selectedCard.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
