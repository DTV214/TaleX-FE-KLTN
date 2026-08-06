import React, { useState, useRef, useEffect, useMemo, useCallback, FormEvent, DragEvent, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlayCircle, ImagePlus, Video, ShieldAlert, AlertTriangle, Fingerprint, BarChart3, ArrowDown, ArrowUp, BookOpen, Calendar, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Clapperboard, CloudUpload, Edit3, Eye, FileVideo, GripVertical, Image as ImageIcon, Info, Library, Loader2, Lock, Plus, RefreshCw, Search, Settings2, Tag, Trash2, UploadCloud, Wallet, X, Zap, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ResumableVideoUploader } from '@/features/creator-dashboard/components/resumable-video-uploader';
import { SignedHlsPlayer } from '@/features/playback/components/signed-hls-player';
import { type DashboardView, type SeriesRow, type SeasonRow, type EpisodeRow, type ComicPage, type ContentType, type ActiveScheduleModal, type EpisodeUnlockSettingsUpdate } from '@/features/creator-dashboard/types/dashboard.types';
import { formatNumber, formatBytes, formatApprovalStatusLabel, getApprovalChipClass, formatMediaStatusLabel, cx, formatDateTime, splitDateTimeLocalValue, isPastDateTimeLocalValue, combineDateAndTimeLocalValue, getStatusBadgeStyle, formatStatusLabel, FORCE_HIDDEN_REASON_TOOLTIP } from '../shared/utils';
import { type MediaStatus, type MediaResponse, type EpisodeUnlockType } from '@/features/creator-dashboard/api/creator-content-api';
import { Panel, PanelHeader, MetricBox, ApiStateNote, SelectionStatePanel, SeriesCoverImage } from "@/features/creator-dashboard/components/shared/panels";
import { DashboardNavButton, MobileTab, FilterTab, ModelStep } from "@/features/creator-dashboard/components/shared/tabs-nav";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { AIPolicyAndCopyright } from "@/features/creator-dashboard/components/ai-policy-and-copyright";
import { isMediaReadyForPublish } from "@/features/creator-dashboard/utils/media-violations";
import { CreatorBackButton } from "@/features/creator-dashboard/components/creator-back-button";
import { EpisodeAnalyticsModal } from "@/features/creator-dashboard/components/views/episode-analytics-modal";

export function SeriesManagementView({
  rows,
  isLoading,
  onSelectSeries,
  onUpdateSeries,
  onDeleteSeries,
  onHideSeries,
  onUnhideSeries,
}: {
  rows: SeriesRow[];
  isLoading: boolean;
  onSelectSeries: (seriesId: string) => void;
  onUpdateSeries: (series: SeriesRow) => void;
  onDeleteSeries: (series: SeriesRow) => void;
  onHideSeries: (series: SeriesRow) => void;
  onUnhideSeries: (series: SeriesRow) => void;
}) {
  const [filter, setFilter] = useState<"ALL" | ContentType>("ALL");

  const filteredRows =
    filter === "ALL" ? rows : rows.filter((row) => row.contentType === filter);

  return (
    <div className="space-y-7">
      <div className="rounded-[24px] border-creator-border bg-creator-sidebar p-4 shadow-[0_20px_60px_rgba(30,42,68,0.07)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative w-full lg:max-w-xl">
            <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7F6F7A]" />
            <input
              type="search"
              placeholder="Search series title..."
              className="h-14 w-full rounded-full border border-creator-border bg-creator-bg pl-14 pr-5 text-sm font-semibold text-white outline-none transition focus:border-creator-gold focus:bg-creator-bg text-white"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="grid h-12 grid-cols-3 rounded-xl bg-[#ECF1FA] p-1 text-sm font-black text-slate-600">
              <FilterTab
                active={filter === "ALL"}
                label="All"
                onClick={() => setFilter("ALL")}
              />
              <FilterTab
                active={filter === "COMIC"}
                label="Comics"
                onClick={() => setFilter("COMIC")}
              />
              <FilterTab
                active={filter === "VIDEO"}
                label="Videos"
                onClick={() => setFilter("VIDEO")}
              />
            </div>

            <button className="flex h-12 items-center justify-between gap-3 rounded-xl border border-creator-border bg-creator-bg px-5 text-sm font-bold text-white">
              All Statuses
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
        <ApiStateNote isLoading={isLoading} />
      </div>

      <div className="overflow-hidden rounded-[24px] border border-creator-border bg-creator-sidebar shadow-[0_20px_60px_rgba(30,42,68,0.07)]">
        <div className="grid grid-cols-[1.8fr_0.8fr_1fr_1fr_1.15fr] bg-creator-bg border border-creator-border text-creator-muted px-8 py-5 text-xs font-black uppercase tracking-[0.12em] text-creator-muted max-lg:hidden">
          <span>Chi tiết Series</span>
          <span>Loại</span>
          <span>Trạng thái</span>
          <span>Hiệu suất</span>
          <span className="text-right">Thao tác</span>
        </div>

        <div className="divide-y divide-[#E6EBF3]">
          {!isLoading && filteredRows.length === 0 && (
            <div className="px-8 py-10 text-center text-sm font-bold text-slate-500">
              No series found for this creator.
            </div>
          )}
          {filteredRows.map((series) => (
            <SeriesTableRow
              key={series.id}
              series={series}
              onSelectSeries={onSelectSeries}
              onUpdateSeries={onUpdateSeries}
              onDeleteSeries={onDeleteSeries}
              onHideSeries={onHideSeries}
              onUnhideSeries={onUnhideSeries}
            />
          ))}
        </div>

        <div className="flex items-center justify-between bg-creator-bg border border-creator-border text-creator-muted px-8 py-5 text-sm font-bold text-creator-muted">
          <span>Showing {filteredRows.length} series</span>
          <div className="flex items-center gap-3">
            <ChevronLeft className="h-5 w-5 text-slate-400" />
            <ChevronRight className="h-5 w-5 text-slate-900" />
          </div>
        </div>
      </div>
    </div>
  );
}


export function SeriesTableRow({
  series,
  onSelectSeries,
  onUpdateSeries,
  onDeleteSeries,
  onHideSeries,
  onUnhideSeries,
}: {
  series: SeriesRow;
  onSelectSeries: (seriesId: string) => void;
  onUpdateSeries: (series: SeriesRow) => void;
  onDeleteSeries: (series: SeriesRow) => void;
  onHideSeries: (series: SeriesRow) => void;
  onUnhideSeries: (series: SeriesRow) => void;
}) {
  const isComic = series.contentType === "COMIC";
  const isPublished = series.status === "PUBLISHED";
  const isDraft = series.status === "DRAFT";
  const isHidden = series.status === "HIDDEN";

  return (
    <div className="grid min-h-[116px] grid-cols-1 gap-4 px-5 py-5 lg:grid-cols-[1.8fr_0.8fr_1fr_1fr_1.15fr] lg:items-center lg:px-8">
      <div className="flex items-center gap-4">
        <SeriesCoverImage
          src={series.coverUrl}
          className="h-20 w-20 rounded-xl object-cover shadow-sm"
        />
        <div className="min-w-0">
          <p className="truncate text-lg font-black text-white">
            {series.title}
          </p>
          <p className="text-sm font-bold text-creator-muted">
            {series.subtitle} <span className="text-slate-300">.</span>{" "}
            {series.episodes} Episodes
          </p>
          <p className="mt-1 text-xs font-bold text-slate-400">{series.id}</p>
        </div>
      </div>

      <div>
        <span
          className={cx(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black",
            isComic
              ? "bg-[#E9D3FF] text-[#5E1AA3]"
              : "bg-[#CDEEFF] text-[#075985]",
          )}
        >
          {isComic ? (
            <BookOpen className="h-4 w-4" />
          ) : (
            <Clapperboard className="h-4 w-4" />
          )}
          {isComic ? "Comic" : "Video"}
        </span>
      </div>

      <div className="space-y-2">
        <span
          className={cx(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black",
            getStatusBadgeStyle(series.status),
          )}
        >
          {formatStatusLabel(series.status)}
        </span>
      </div>

      <div className="text-sm font-bold text-creator-muted">
        {series.revenue ? (
          <div className="space-y-1">
            <p className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {series.views}
            </p>
            <p className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              {series.revenue}
            </p>
          </div>
        ) : (
          <span>{series.views}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
        <button
          type="button"
          onClick={() => onUpdateSeries(series)}
          className="rounded-full p-2 text-creator-muted transition hover:bg-[#F3E8EE] hover:text-[#B83268]"
          title="Update series"
        >
          <Edit3 className="h-5 w-5" />
        </button>
        {isPublished && (
          <button
            type="button"
            onClick={() => onHideSeries(series)}
            className="rounded-full p-2 text-creator-muted transition hover:bg-[#FFF3CD] hover:text-[#856404]"
            title="Hide series"
          >
            <Eye className="h-5 w-5" />
          </button>
        )}
        {isHidden && (
          <button
            type="button"
            onClick={() => onUnhideSeries(series)}
            className="rounded-full p-2 text-creator-muted transition hover:bg-[#E8F8FF] hover:text-creator-gold"
            title="Unhide series"
          >
            <Zap className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDeleteSeries(series)}
          className="rounded-full p-2 text-creator-muted transition hover:bg-[#FFE8E8] hover:text-red-400"
          title="Delete series"
        >
          <Trash2 className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => onSelectSeries(series.id)}
          className={cx(
            "rounded-full px-5 py-3 text-sm font-black transition",
            isDraft
              ? "bg-[#B83268] text-white"
              : "bg-creator-bg border border-creator-border text-creator-muted text-white hover:text-white transition-colors",
          )}
        >
          Manage Seasons
        </button>
      </div>
    </div>
  );
}