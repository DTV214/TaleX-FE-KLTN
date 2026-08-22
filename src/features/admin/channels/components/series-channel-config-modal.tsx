"use client";

import { useEffect, useState } from "react";
import {
  X,
  SlidersHorizontal,
  Flame,
  Sparkles,
  Zap,
  Clock,
  Star,
  Trophy,
  Shuffle,
  Bell,
  Layers,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/api/http-client";
import {
  useSeriesChannelConfig,
  useUpdateSeriesChannelConfig,
} from "../hooks/use-admin-channels";
import type { UpdateSeriesChannelConfigRequest } from "../types/channels.types";

interface SeriesChannelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChannelFieldConfig {
  key: keyof UpdateSeriesChannelConfigRequest;
  label: string;
  description: string;
  icon: typeof Flame;
  colorClass: string;
  bgClass: string;
  min: number;
  max: number;
}

const CONFIG_FIELDS: ChannelFieldConfig[] = [
  {
    key: "trendingPoolNumber",
    label: "Kênh Xu Hướng",
    description: "Số lượng series top trending",
    icon: Flame,
    colorClass: "text-amber-500",
    bgClass: "bg-amber-500/10 text-amber-600 border-amber-200/60 dark:border-amber-800/40",
    min: 0,
    max: 500,
  },
  {
    key: "promotedPoolNumber",
    label: "Kênh Quảng Bá",
    description: "Số lượng series được tài trợ và quảng bá trên trang chủ",
    icon: Sparkles,
    colorClass: "text-violet-500",
    bgClass: "bg-violet-500/10 text-violet-600 border-violet-200/60 dark:border-violet-800/40",
    min: 0,
    max: 500,
  },
  {
    key: "newReleasedPoolNumber",
    label: "Kênh Mới Ra Mắt",
    description: "Số lượng series vừa được xuất bản gần đây",
    icon: Zap,
    colorClass: "text-blue-500",
    bgClass: "bg-blue-500/10 text-blue-600 border-blue-200/60 dark:border-blue-800/40",
    min: 0,
    max: 500,
  },
  {
    key: "recentlyUpdatedPoolNumber",
    label: "Kênh Mới Cập Nhật",
    description: "Số lượng series vừa cập nhật chương/tập mới",
    icon: Clock,
    colorClass: "text-emerald-500",
    bgClass: "bg-emerald-500/10 text-emerald-600 border-emerald-200/60 dark:border-emerald-800/40",
    min: 0,
    max: 500,
  },
  {
    key: "latestCommunityChoicePoolNumber",
    label: "Bình Chọn Mới Nhất",
    description: "Số lượng series được cộng đồng đánh giá cao gần đây",
    icon: Star,
    colorClass: "text-purple-500",
    bgClass: "bg-purple-500/10 text-purple-600 border-purple-200/60 dark:border-purple-800/40",
    min: 0,
    max: 500,
  },
  {
    key: "communityChoicePoolNumber",
    label: "Bình Chọn Toàn Thời Gian",
    description: "Số lượng series được đánh giá cao nhất mọi thời đại",
    icon: Trophy,
    colorClass: "text-rose-500",
    bgClass: "bg-rose-500/10 text-rose-600 border-rose-200/60 dark:border-rose-800/40",
    min: 0,
    max: 500,
  },
  {
    key: "randomCategoryPoolNumber",
    label: "Thể Loại Ngẫu Nhiên",
    description: "Số lượng series ngẫu nhiên theo thể loại khám phá",
    icon: Shuffle,
    colorClass: "text-indigo-500",
    bgClass: "bg-indigo-500/10 text-indigo-600 border-indigo-200/60 dark:border-indigo-800/40",
    min: 0,
    max: 500,
  },
  {
    key: "subscribedPoolNumber",
    label: "Kênh Đang Theo Dõi",
    description: "Số lượng series đề xuất từ các các kênh theo dõi",
    icon: Bell,
    colorClass: "text-sky-500",
    bgClass: "bg-sky-500/10 text-sky-600 border-sky-200/60 dark:border-sky-800/40",
    min: 0,
    max: 500,
  },
  {
    key: "numberPerCategory",
    label: "Giới Hạn Mỗi Thể Loại",
    description: "Số lượng series tối đa phân bổ cho mỗi danh mục thể loại",
    icon: Layers,
    colorClass: "text-teal-500",
    bgClass: "bg-teal-500/10 text-teal-600 border-teal-200/60 dark:border-teal-800/40",
    min: 0,
    max: 500,
  },
];

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "Chưa cập nhật";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function SeriesChannelConfigModal({
  isOpen,
  onClose,
}: SeriesChannelConfigModalProps) {
  const { data: config, isLoading, isError, error } = useSeriesChannelConfig(isOpen);
  const updateMutation = useUpdateSeriesChannelConfig();

  const [formData, setFormData] = useState<Record<string, number>>({});

  // Sync form state whenever data is loaded
  useEffect(() => {
    if (config) {
      setFormData({
        trendingPoolNumber: config.trendingPoolNumber ?? 0,
        promotedPoolNumber: config.promotedPoolNumber ?? 0,
        newReleasedPoolNumber: config.newReleasedPoolNumber ?? 0,
        latestCommunityChoicePoolNumber: config.latestCommunityChoicePoolNumber ?? 0,
        communityChoicePoolNumber: config.communityChoicePoolNumber ?? 0,
        recentlyUpdatedPoolNumber: config.recentlyUpdatedPoolNumber ?? 0,
        randomCategoryPoolNumber: config.randomCategoryPoolNumber ?? 0,
        subscribedPoolNumber: config.subscribedPoolNumber ?? 0,
        numberPerCategory: config.numberPerCategory ?? 0,
      });
    }
  }, [config]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleInputChange = (key: string, value: number) => {
    const safeVal = Math.max(0, Math.min(500, isNaN(value) ? 0 : value));
    setFormData((prev) => ({
      ...prev,
      [key]: safeVal,
    }));
  };

  const handleStep = (key: string, delta: number) => {
    setFormData((prev) => {
      const current = prev[key] ?? 0;
      const next = Math.max(0, Math.min(500, current + delta));
      return { ...prev, [key]: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateMutation.mutateAsync(formData);
      toast.success("Cập nhật cấu hình giới hạn kênh thành công!");
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err) || "Không thể lưu cấu hình kênh.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[92vh] w-full max-w-5xl xl:max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200/80 backoffice-dark:border-white/10 backoffice-dark:bg-slate-900 backoffice-dark:text-white flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5 backoffice-dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 border border-violet-200/60 backoffice-dark:bg-violet-950/50 backoffice-dark:text-violet-300 backoffice-dark:border-violet-800/40">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-950 backoffice-dark:text-white">
                Cài Đặt Cấu Hình Kênh
              </h3>
              <p className="text-xs text-slate-500 backoffice-dark:text-white/60 mt-0.5">
                Cập nhật lần cuối:{" "}
                <span className="font-bold text-slate-700 backoffice-dark:text-white/90">
                  {formatDateTime(config?.updatedAt)}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white cursor-pointer"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-5">

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 py-4">
              {Array.from({ length: 9 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-28 animate-pulse rounded-2xl border border-slate-100 bg-slate-50 backoffice-dark:border-white/5 backoffice-dark:bg-white/5"
                />
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && !isLoading && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-xs text-red-700 backoffice-dark:border-red-900/40 backoffice-dark:bg-red-950/30 backoffice-dark:text-red-300">
              <AlertCircle className="mx-auto mb-2 h-7 w-7 text-red-500" />
              <p className="font-bold">Không thể tải thông tin cấu hình kênh</p>
              <p className="mt-1 text-slate-500 backoffice-dark:text-white/60">
                {error instanceof Error ? error.message : "Đã có lỗi xảy ra khi kết nối máy chủ."}
              </p>
            </div>
          )}

          {/* Configuration Form Grid */}
          {!isLoading && !isError && (
            <form id="channel-config-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {CONFIG_FIELDS.map((field) => {
                const IconComponent = field.icon;
                const currentValue = formData[field.key] ?? 0;

                return (
                  <div
                    key={field.key}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:border-violet-300 hover:bg-white backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.03] backoffice-dark:hover:border-white/20"
                  >
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${field.bgClass}`}
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 backoffice-dark:text-white truncate">
                          {field.label}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 backoffice-dark:text-white/60 line-clamp-2 leading-relaxed">
                        {field.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/60 backoffice-dark:border-white/10 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-400">
                        Số lượng series:
                      </span>

                      {/* Stepper Input */}
                      <div className="flex items-center gap-1.5 bg-white rounded-xl border border-slate-200 p-1 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-black/40">
                        <button
                          type="button"
                          onClick={() => handleStep(field.key, -1)}
                          disabled={currentValue <= field.min || updateMutation.isPending}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10 cursor-pointer font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={field.min}
                          max={field.max}
                          value={currentValue}
                          onChange={(e) =>
                            handleInputChange(field.key, parseInt(e.target.value, 10))
                          }
                          disabled={updateMutation.isPending}
                          className="h-7 w-12 text-center text-xs font-black text-slate-900 outline-none backoffice-dark:bg-transparent backoffice-dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleStep(field.key, 1)}
                          disabled={currentValue >= field.max || updateMutation.isPending}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10 cursor-pointer font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50/50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.02] shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/5 backoffice-dark:text-white cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="channel-config-form"
            disabled={updateMutation.isPending || isLoading || isError}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-violet-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Lưu Cấu Hình</span>
          </button>
        </div>
      </div>
    </div>
  );
}
