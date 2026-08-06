import React, { useState, useRef, useEffect, useMemo, useCallback, FormEvent, DragEvent, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlayCircle, ImagePlus, Video, ShieldAlert, AlertTriangle, Fingerprint, BarChart3, ArrowDown, ArrowUp, BookOpen, Calendar, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Clapperboard, CloudUpload, Edit3, Eye, FileVideo, GripVertical, Image as ImageIcon, Info, Library, Loader2, Lock, Plus, RefreshCw, Search, Settings2, Tag, Trash2, UploadCloud, Wallet, X, Zap, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ResumableVideoUploader } from '@/features/creator-dashboard/components/resumable-video-uploader';
import { SignedHlsPlayer } from '@/features/playback/components/signed-hls-player';
import { type DashboardView, type SeriesRow, type SeasonRow, type EpisodeRow, type ComicPage, type ContentType, type ActiveScheduleModal, type EpisodeUnlockSettingsUpdate } from '@/features/creator-dashboard/types/dashboard.types';
import { formatNumber, formatBytes, formatApprovalStatusLabel, getApprovalChipClass, formatMediaStatusLabel, cx, formatDateTime, splitDateTimeLocalValue, isPastDateTimeLocalValue, combineDateAndTimeLocalValue, getStatusBadgeStyle, formatStatusLabel, FORCE_HIDDEN_REASON_TOOLTIP } from './utils';
import { type MediaStatus, type MediaResponse, type EpisodeUnlockType } from '@/features/creator-dashboard/api/creator-content-api';



export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-[20px] border border-[#E5EAF3] bg-creator-sidebar p-6 shadow-[0_20px_60px_rgba(30,42,68,0.06)]",
        className,
      )}
    >
      {children}
    </section>
  );
}


export function PanelHeader({
  icon: Icon,
  title,
  subtitle,
  compact,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <div className={cx("flex items-start gap-3", !compact && "mb-5")}>
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FCE8F0] text-[#B83268]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h2 className="text-lg font-black text-white">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm font-semibold leading-relaxed text-creator-muted">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}


export function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-creator-bg p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-creator-muted">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}


export function ApiStateNote({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) {
    return null;
  }

  return (
    <div className="mt-4 rounded-2xl bg-creator-bg px-4 py-3 text-xs font-bold text-slate-500">
      Loading content...
    </div>
  );
}


export function SelectionStatePanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Panel>
      <div className="py-10 text-center">
        <p className="text-lg font-black text-white">{title}</p>
        <p className="mt-2 text-sm font-bold text-slate-500">{description}</p>
      </div>
    </Panel>
  );
}


export function SeriesCoverImage({
  src,
  className,
}: {
  src?: string;
  className: string;
}) {
  if (!src) {
    return (
      <div
        className={cx(
          className,
          "flex items-center justify-center bg-creator-bg border border-creator-border text-creator-muted text-slate-400",
        )}
      >
        <ImageIcon className="h-7 w-7" />
      </div>
    );
  }

  return <img src={src} alt="" className={className} />;
}