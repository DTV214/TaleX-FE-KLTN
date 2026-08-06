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

// ============================================================================
// EPISODE MANAGEMENT VIEW
// ============================================================================
export function EpisodeManagementView({
  selectedSeries,
  selectedSeason,
  episodes,
  isLoading,
  onBack,
  onCreateEpisode,
  isCreatingEpisode,
  onOpenUpload,
  onUpdateEpisode,
  onDeleteEpisode,
}: {
  selectedSeries: SeriesRow;
  selectedSeason: SeasonRow;
  episodes: EpisodeRow[];
  isLoading: boolean;
  onBack: () => void;
  onCreateEpisode: () => void;
  isCreatingEpisode: boolean;
  onOpenUpload: (episode: EpisodeRow) => void;
  onUpdateEpisode: (episode: EpisodeRow) => void;
  onDeleteEpisode: (episode: EpisodeRow) => void;
}) {
  const [analyticsEpisode, setAnalyticsEpisode] = useState<EpisodeRow | null>(
    null,
  );

  return (
    <div className="w-full space-y-6 py-6 text-creator-text">
      {/* Header */}
      <div className="mb-2 flex flex-col justify-between gap-4 rounded-[28px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)] md:flex-row md:items-end">
        <div>
          <CreatorBackButton onClick={onBack} className="mb-4" />
          <h2 className="creator-spotlight-text mb-2 text-3xl font-bold text-white">
            {selectedSeason.title}
          </h2>
          <p className="text-creator-muted">
            {selectedSeries.title} . Mùa {selectedSeason.seasonNumber}
          </p>
        </div>
      </div>

      <ApiStateNote isLoading={isLoading} />

      {/* Season Card matching Mockup */}

      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-white/10 bg-black/25 p-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-bold px-2.5 py-1 bg-creator-gold/10 text-creator-gold rounded border border-creator-gold/20">
                SEASON{" "}
                {selectedSeason.seasonNumber < 10
                  ? `0${selectedSeason.seasonNumber}`
                  : selectedSeason.seasonNumber}
              </span>
              <h3 className="text-xl font-bold text-white">
                {selectedSeason.title}
              </h3>
            </div>
            <p className="text-sm text-creator-muted mt-2 max-w-2xl">
              {selectedSeason.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateEpisode}
            disabled={isCreatingEpisode}
            className="creator-shine-card inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-creator-gold px-5 text-sm font-black text-black shadow-[0_16px_40px_rgba(212,175,55,0.16)] transition-all hover:-translate-y-0.5 hover:bg-creator-gold-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {isCreatingEpisode ? "Đang Tạo..." : "Thêm Tập Mới"}
          </button>
        </div>

        <div className="p-0">
          {!isLoading && episodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-creator-gold/25 bg-creator-gold/10 shadow-[0_16px_40px_rgba(212,175,55,0.10)]">
                <PlayCircle size={32} className="text-creator-muted" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Chưa có tập nào
              </h3>
              <p className="text-sm text-creator-muted">
                Nhấn "Thêm Tập" để bắt đầu xây dựng mùa này.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-white/10">
              {episodes.map((episode) => (
                <li
                  key={episode.id}
                  className="creator-shine-card group flex flex-col gap-4 p-5 transition-all duration-300 hover:bg-white/[0.055] sm:flex-row sm:items-center"
                >
                  <div
                    className="flex flex-1 cursor-pointer items-center gap-4"
                    onClick={() => onOpenUpload(episode)}
                  >
                    <GripVertical
                      size={18}
                      className="text-creator-border group-hover:text-creator-muted cursor-grab hidden sm:block"
                    />
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-sm font-bold text-creator-gold shadow-inner">
                      {episode.episodeNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-white truncate">
                        {episode.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-creator-muted font-medium">
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-creator-bg border border-creator-border">
                          {episode.contentType === "COMIC" ? (
                            <BookOpen size={12} />
                          ) : (
                            <Clapperboard size={12} />
                          )}
                          {episode.contentType === "COMIC"
                            ? `${episode.totalPage ?? episode.mediaCount} pages`
                            : `${episode.mediaCount} video`}
                        </span>
                        <span>•</span>
                        <span
                          className={cx(
                            "px-2 py-0.5 rounded border text-[10px] uppercase font-bold",
                            getStatusBadgeStyle(episode.status),
                          )}
                          title={episode.status === "FORCE_HIDDEN" ? FORCE_HIDDEN_REASON_TOOLTIP : undefined}
                        >
                          {formatStatusLabel(episode.status)}
                        </span>
                        <span className="truncate max-w-[200px]">
                          {episode.description}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Container */}
                  <div className="flex items-center gap-2 pl-14 transition-opacity sm:pl-0 sm:opacity-0 sm:group-hover:opacity-100">
                    {/* Nút Thống kê tập */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAnalyticsEpisode(episode);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/35 px-3 py-1.5 text-xs font-bold text-zinc-400 transition-colors hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"
                      title="Xem thống kê tập"
                    >
                      <BarChart3 size={14} /> Thống kê
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateEpisode(episode);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/35 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:border-white/20 hover:bg-white/10"
                      title="Settings (Unlock, Schedule)"
                    >
                      <Edit3 size={14} /> Settings
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenUpload(episode);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-creator-gold px-3 py-1.5 text-xs font-bold text-black transition-colors hover:bg-creator-gold-hover"
                      title="Upload Media"
                    >
                      {episode.contentType === "COMIC" ? (
                        <ImagePlus size={14} />
                      ) : (
                        <Video size={14} />
                      )}{" "}
                      Media
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEpisode(episode);
                      }}
                      className="p-1.5 text-creator-muted hover:text-red-400 rounded hover:bg-red-400/10 transition-colors ml-1"
                      title="Delete Episode"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Episode Analytics Modal */}
      <EpisodeAnalyticsModal
        episode={
          analyticsEpisode
            ? {
              episodeId: analyticsEpisode.id,
              seasonId: analyticsEpisode.seasonId,
              creatorId: "",
              episodeNumber: analyticsEpisode.episodeNumber,
              title: analyticsEpisode.title,
              description: analyticsEpisode.description,
              thumbnail: analyticsEpisode.thumbnail,
              contentType: analyticsEpisode.contentType,
              status: analyticsEpisode.status,
              scheduledPublishAt: analyticsEpisode.scheduledPublishAt || null,
              publishedAt: "",
              unlockType: analyticsEpisode.unlockType,
              priceVnd: analyticsEpisode.priceVnd,
              likes: 0,
              views: Number(analyticsEpisode.views) || 0,
              totalPage: analyticsEpisode.totalPage || null,
              createdAt: "",
              updatedAt: analyticsEpisode.updatedAt,
              deletedAt: null,
              createdBy: "",
              updatedBy: "",
              deletedBy: null,
              isDeleted: false,
            }
            : null
        }
        seriesTitle={selectedSeries.title}
        isOpen={Boolean(analyticsEpisode)}
        onClose={() => setAnalyticsEpisode(null)}
      />
    </div>
  );
}


export function EpisodeTableRow({
  episode,
  onOpenUpload,
  onUpdate,
  onDelete,
}: {
  episode: EpisodeRow;
  onOpenUpload: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}) {
  const isComic = episode.contentType === "COMIC";
  const statusStyle = getStatusBadgeStyle(episode.status);

  return (
    <div className="grid min-h-[104px] grid-cols-1 gap-4 px-5 py-5 lg:grid-cols-[1.4fr_0.7fr_0.8fr_0.8fr_1fr] lg:items-center lg:px-8">
      <div>
        <p className="text-lg font-black text-white">
          Ep {episode.episodeNumber}: {episode.title}
        </p>
        <p className="mt-1 text-sm font-semibold text-creator-muted">
          {episode.description}
        </p>
        <p className="mt-1 text-xs font-bold text-creator-muted">
          {episode.id}
        </p>
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
            "rounded-full border px-3 py-1.5 text-xs font-black",
            statusStyle,
          )}
          title={episode.status === "FORCE_HIDDEN" ? FORCE_HIDDEN_REASON_TOOLTIP : undefined}
        >
          {formatStatusLabel(episode.status)}
        </span>
      </div>
      <div className="text-sm font-bold text-creator-muted">
        {isComic
          ? `${episode.totalPage ?? episode.mediaCount} pages`
          : `${episode.mediaCount} video`}
      </div>
      <div className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
        <button
          type="button"
          onClick={onUpdate}
          className="rounded-full p-2 text-creator-muted transition hover:bg-[#F3E8EE] hover:text-[#B83268]"
          title="Update episode"
        >
          <Edit3 className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-full p-2 text-creator-muted transition hover:bg-[#FFE8E8] hover:text-red-400"
          title="Delete episode"
        >
          <Trash2 className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onOpenUpload}
          className="rounded-full bg-creator-bg border border-creator-border text-creator-muted px-5 py-3 text-sm font-black text-white transition hover:text-white transition-colors"
        >
          {isComic ? "Open Comic Upload" : "Open Video Upload"}
        </button>
      </div>
    </div>
  );
}