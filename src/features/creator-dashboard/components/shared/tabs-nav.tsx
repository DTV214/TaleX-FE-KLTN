import React, { useState, useRef, useEffect, useMemo, useCallback, FormEvent, DragEvent, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlayCircle, ImagePlus, Video, ShieldAlert, AlertTriangle, Fingerprint, BarChart3, ArrowDown, ArrowUp, BookOpen, Calendar, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Clapperboard, CloudUpload, Edit3, Eye, FileVideo, GripVertical, Image as ImageIcon, Info, Library, Loader2, Lock, Plus, RefreshCw, Search, Settings2, Tag, Trash2, UploadCloud, Wallet, X, Zap, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ResumableVideoUploader } from '@/features/creator-dashboard/components/resumable-video-uploader';
import { SignedHlsPlayer } from '@/features/playback/components/signed-hls-player';
import { type DashboardView, type SeriesRow, type SeasonRow, type EpisodeRow, type ComicPage, type ContentType, type ActiveScheduleModal, type EpisodeUnlockSettingsUpdate } from '@/features/creator-dashboard/types/dashboard.types';
import { formatNumber, formatBytes, formatApprovalStatusLabel, getApprovalChipClass, formatMediaStatusLabel, cx, formatDateTime, splitDateTimeLocalValue, isPastDateTimeLocalValue, combineDateAndTimeLocalValue, getStatusBadgeStyle, formatStatusLabel, FORCE_HIDDEN_REASON_TOOLTIP } from './utils';
import { type MediaStatus, type MediaResponse, type EpisodeUnlockType } from '@/features/creator-dashboard/api/creator-content-api';



export function DashboardNavButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm font-black transition",
        active
          ? "bg-[#151A23] text-white shadow-lg shadow-slate-900/15"
          : "text-slate-500 hover:bg-creator-sidebar hover:text-white",
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}


export function MobileTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "h-9 rounded-full px-4 text-xs font-black transition",
        active
          ? "bg-[#151A23] text-white"
          : "bg-creator-sidebar text-creator-muted",
      )}
    >
      {label}
    </button>
  );
}


export function FilterTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-lg px-5 transition",
        active ? "bg-creator-bg text-white shadow-sm" : "text-creator-muted",
      )}
    >
      {label}
    </button>
  );
}


export function ModelStep({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-creator-bg border border-creator-border px-3 py-2 text-white">
      <span>{label}</span>
      <ChevronRight className="h-4 w-4 text-slate-300" />
    </div>
  );
}