import React, { useState, useRef, useEffect, useMemo, useCallback, FormEvent, DragEvent, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlayCircle, ImagePlus, Video, ShieldAlert, AlertTriangle, Fingerprint, BarChart3, ArrowDown, ArrowUp, BookOpen, Calendar, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Clapperboard, CloudUpload, Edit3, Eye, FileVideo, GripVertical, Image as ImageIcon, Info, Library, Loader2, Lock, Plus, RefreshCw, Search, Settings2, Tag, Trash2, UploadCloud, Wallet, X, Zap, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ResumableVideoUploader } from '@/features/creator-dashboard/components/resumable-video-uploader';
import { SignedHlsPlayer } from '@/features/playback/components/signed-hls-player';
import { type DashboardView, type SeriesRow, type SeasonRow, type EpisodeRow, type ComicPage, type ContentType, type ActiveScheduleModal, type EpisodeUnlockSettingsUpdate } from '@/features/creator-dashboard/types/dashboard.types';
import { formatNumber, formatBytes, formatApprovalStatusLabel, getApprovalChipClass, formatMediaStatusLabel, cx, formatDateTime, splitDateTimeLocalValue, isPastDateTimeLocalValue, combineDateAndTimeLocalValue, getStatusBadgeStyle, formatStatusLabel, FORCE_HIDDEN_REASON_TOOLTIP } from './utils';
import { type MediaStatus, type MediaResponse, type EpisodeUnlockType } from '@/features/creator-dashboard/api/creator-content-api';



export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-creator-muted">
        {label} {required && <span className="text-[#B83268]">*</span>}
      </span>
      {children}
    </label>
  );
}


export function MultiSelectField({
  name,
  options,
  initialValues,
}: {
  name: string;
  options: { id: string; name: string }[];
  initialValues: string[];
}) {
  const [selected, setSelected] = useState<string[]>(initialValues);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div>
      <input type="hidden" name={name} value={selected.join(",")} />
      <div className="flex flex-wrap gap-2 mt-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors border ${selected.includes(opt.id)
              ? "bg-creator-gold text-black border-creator-gold font-medium"
              : "bg-creator-sidebar border-creator-border text-creator-muted hover:border-white/30"
              }`}
          >
            {opt.name}
          </button>
        ))}
      </div>
    </div>
  );
}


export function EpisodeUnlockFields({
  defaultUnlockType,
  defaultPriceVnd,
  controlClass,
}: {
  defaultUnlockType: EpisodeUnlockType;
  defaultPriceVnd: number;
  controlClass: string;
}) {
  const [unlockType, setUnlockType] = useState<EpisodeUnlockType>(
    defaultUnlockType ?? "FREE",
  );

  return (
    <div
      className={cx(
        "grid gap-4",
        unlockType === "PAID" ? "md:grid-cols-2" : "md:grid-cols-1",
      )}
    >
      <Field label="Kiểu mở khóa">
        <select
          name="unlockType"
          value={unlockType}
          onChange={(event) =>
            setUnlockType(event.target.value as EpisodeUnlockType)
          }
          className={controlClass}
        >
          <option value="FREE">Miễn phí</option>
          <option value="PAID">Trả phí</option>
        </select>
      </Field>

      {unlockType === "PAID" && (
        <Field label="Giá VNĐ" required>
          <input
            type="number"
            min={1}
            max={99999}
            name="priceVnd"
            required
            defaultValue={defaultPriceVnd > 0 ? defaultPriceVnd : 1000}
            className={controlClass}
          />
        </Field>
      )}
    </div>
  );
}