"use client";

import { useAdminChannelCards } from "../hooks/use-admin-channels";
import type { ChannelMeta, ChannelSeriesCard } from "../types/channels.types";
import { ChannelCardItem } from "./channel-card-item";
import { AlertCircle, RefreshCw, Layers } from "lucide-react";

interface ChannelSectionProps {
  meta: ChannelMeta;
  onSelectCard?: (card: ChannelSeriesCard) => void;
}

export function ChannelSection({ meta, onSelectCard }: ChannelSectionProps) {
  const { data: cards, isLoading, isError, error, refetch, isRefetching } = useAdminChannelCards(meta.key);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold border ${meta.badgeBg}`}>
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">{meta.label}</h3>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${meta.badgeBg}`}>
                {cards?.length ?? 0} series
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{meta.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            title="Tải lại kênh này"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin text-violet-600" : ""}`} />
            <span>Tải lại dữ liệu</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-5">
        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="animate-pulse rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3"
              >
                <div className="aspect-[16/9] w-full rounded-lg bg-slate-200" />
                <div className="h-4 w-3/4 rounded bg-slate-200" />
                <div className="h-3 w-1/2 rounded bg-slate-200" />
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <div className="h-7 w-7 rounded-full bg-slate-200" />
                  <div className="h-3 w-1/3 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/70 p-4 text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="flex-1 text-xs">
              <span className="font-semibold">Không thể tải dữ liệu kênh {meta.label}:</span>{" "}
              {error instanceof Error ? error.message : "Đã có lỗi xảy ra."}
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-red-700"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && (!cards || cards.length === 0) && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 px-4 text-center">
            <Layers className="h-10 w-10 text-slate-300 stroke-[1.5]" />
            <p className="mt-3 text-sm font-semibold text-slate-700">Kênh này chưa có dữ liệu series nào</p>
            <p className="mt-1 text-xs text-slate-500">
              Nhấn &quot;Cập nhật Pool Kênh&quot; ở trên hoặc nút &quot;Tải lại dữ liệu&quot; để làm mới danh sách.
            </p>
          </div>
        )}

        {/* Cards Grid */}
        {!isLoading && !isError && cards && cards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cards.map((card, idx) => (
              <ChannelCardItem
                key={card.seriesId || `${meta.key}-${idx}`}
                card={card}
                onSelect={onSelectCard}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
