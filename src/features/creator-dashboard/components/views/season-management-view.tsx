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

export function SeasonManagementView({
  selectedSeries,
  seasons,
  isLoading,
  onBack,
  onSelectSeason,
  onCreateSeason,
  isCreatingSeason,
  onUpdateSeason,
  onDeleteSeason,
  onHideSeason,
  onUnhideSeason,
}: {
  selectedSeries: SeriesRow;
  seasons: SeasonRow[];
  isLoading: boolean;
  onBack: () => void;
  onSelectSeason: (seasonId: string) => void;
  onCreateSeason: () => void;
  isCreatingSeason: boolean;
  onUpdateSeason: (season: SeasonRow) => void;
  onDeleteSeason: (season: SeasonRow) => void;
  onHideSeason: (season: SeasonRow) => void;
  onUnhideSeason: (season: SeasonRow) => void;
}) {
  return (
    <div className="space-y-6">
      <CreatorBackButton onClick={onBack} />

      <Panel>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <SeriesCoverImage
              src={selectedSeries.coverUrl}
              className="h-20 w-20 rounded-2xl object-cover"
            />
            <div>
              <h2 className="text-2xl font-black text-white">
                {selectedSeries.title}
              </h2>
              <p className="text-sm font-bold text-creator-muted">
                {selectedSeries.contentType} series . {seasons.length} seasons
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCreateSeason}
            disabled={isCreatingSeason}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#007A8A] px-5 text-sm font-black text-white shadow-lg shadow-cyan-900/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-5 w-5" />
            {isCreatingSeason ? "Creating..." : "Tạo Mùa"}
          </button>
        </div>
        <ApiStateNote isLoading={isLoading} />
      </Panel>

      <div className="grid gap-4">
        {!isLoading && seasons.length === 0 && (
          <div className="rounded-2xl bg-creator-sidebar border border-creator-border px-5 py-8 text-center text-sm font-bold text-slate-500 shadow-sm">
            No seasons found for this series.
          </div>
        )}
        {seasons.map((season) => (
          <SeasonCard
            key={season.id}
            season={season}
            onSelect={() => onSelectSeason(season.id)}
            onUpdate={() => onUpdateSeason(season)}
            onDelete={() => onDeleteSeason(season)}
            onHide={() => onHideSeason(season)}
            onUnhide={() => onUnhideSeason(season)}
          />
        ))}
      </div>
    </div>
  );
}


export function SeasonCard({
  season,
  onSelect,
  onUpdate,
  onDelete,
  onHide,
  onUnhide,
}: {
  season: SeasonRow;
  onSelect: () => void;
  onUpdate: () => void;
  onDelete: () => void;
  onHide: () => void;
  onUnhide: () => void;
}) {
  const statusStyle = getStatusBadgeStyle(season.status);
  const isHidden = season.status === "HIDDEN";
  const isPublished = season.status === "PUBLISHED";

  return (
    <div className="rounded-[22px] border border-creator-border bg-creator-sidebar p-5 shadow-[0_16px_44px_rgba(30,42,68,0.05)]">
      <div className="grid gap-5 lg:grid-cols-[1fr_180px_180px_180px] lg:items-center">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#151A23] px-3 py-1 text-xs font-black text-white">
              Season {season.seasonNumber}
            </span>
            <span
              className={cx(
                "rounded-full border px-3 py-1 text-xs font-black",
                statusStyle,
              )}
            >
              {formatStatusLabel(season.status)}
            </span>
          </div>
          <h3 className="text-xl font-black text-white">{season.title}</h3>
          <p className="mt-1 max-w-2xl text-sm font-semibold text-creator-muted">
            {season.description}
          </p>
          <p className="mt-2 text-xs font-bold text-slate-400">{season.id}</p>
        </div>

        <MetricBox label="Số tập" value={String(season.episodes)} />
        <MetricBox
          label="Đã xuất bản"
          value={String(season.publishedEpisodes)}
        />
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onUpdate}
            className="rounded-full p-2 text-creator-muted transition hover:bg-[#F3E8EE] hover:text-[#B83268]"
            title="Update season"
          >
            <Edit3 className="h-5 w-5" />
          </button>
          {isPublished && (
            <button
              type="button"
              onClick={onHide}
              className="rounded-full p-2 text-creator-muted transition hover:bg-[#FFF3CD] hover:text-[#856404]"
              title="Hide season"
            >
              <Eye className="h-5 w-5" />
            </button>
          )}
          {isHidden && (
            <button
              type="button"
              onClick={onUnhide}
              className="rounded-full p-2 text-creator-muted transition hover:bg-[#E8F8FF] hover:text-creator-gold"
              title="Unhide season"
            >
              <Zap className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full p-2 text-creator-muted transition hover:bg-[#FFE8E8] hover:text-red-400"
            title="Delete season"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onSelect}
            className="rounded-full bg-creator-bg border border-creator-border text-creator-muted px-5 py-3 text-sm font-black text-white transition hover:text-white transition-colors"
          >
            Manage Episodes
          </button>
        </div>
      </div>
    </div>
  );
}