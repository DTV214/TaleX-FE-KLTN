import { Field } from "./form-fields";
import { CoreIdentityStep } from "@/features/creator-dashboard/components/steps/core-identity-step";
import React, { useState, useRef, useEffect, useMemo, useCallback, FormEvent, DragEvent, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlayCircle, ImagePlus, Video, ShieldAlert, AlertTriangle, Fingerprint, BarChart3, ArrowDown, ArrowUp, BookOpen, Calendar, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Clapperboard, CloudUpload, Edit3, Eye, FileVideo, GripVertical, Image as ImageIcon, Info, Library, Loader2, Lock, Plus, RefreshCw, Search, Settings2, Tag, Trash2, UploadCloud, Wallet, X, Zap, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ResumableVideoUploader } from '@/features/creator-dashboard/components/resumable-video-uploader';
import { SignedHlsPlayer } from '@/features/playback/components/signed-hls-player';
import { type DashboardView, type SeriesRow, type SeasonRow, type EpisodeRow, type ComicPage, type ContentType, type ActiveScheduleModal, type EpisodeUnlockSettingsUpdate, type EditModalState, type EditSubmitState, type DeleteModalState, type Visibility, type ScheduleModalState } from '@/features/creator-dashboard/types/dashboard.types';
import { formatNumber, formatBytes, formatApprovalStatusLabel, getApprovalChipClass, formatMediaStatusLabel, isBackendMediaTarget, readFormString, openNativePicker, splitIdList, readFormNumber, cx, formatDateTime, splitDateTimeLocalValue, isPastDateTimeLocalValue, combineDateAndTimeLocalValue, getStatusBadgeStyle, formatStatusLabel, FORCE_HIDDEN_REASON_TOOLTIP } from './utils';
import { type MediaStatus, type MediaResponse, type EpisodeUnlockType } from '@/features/creator-dashboard/api/creator-content-api';



export function ModalShell({
  title,
  subtitle,
  children,
  onClose,
  compact,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  onClose: () => void;
  compact?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          "max-h-[90vh] w-full overflow-y-auto rounded-[24px] border border-creator-border bg-creator-sidebar p-6 shadow-[0_30px_90px_rgba(15,23,42,0.25)]",
          compact ? "max-w-lg" : "max-w-3xl",
        )}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">{title}</h2>
            <p className="mt-1 text-sm font-semibold text-creator-muted">
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-creator-bg border border-creator-border text-creator-muted text-creator-muted transition hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}


export function ModalActions({
  isSaving,
  onClose,
}: {
  isSaving: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex justify-end gap-3 border-t border-[#E8EDF5] pt-5">
      <button
        type="button"
        onClick={onClose}
        className="rounded-full border border-creator-border bg-creator-bg text-white border border-creator-border px-5 py-3 hover:border-creator-gold transition-colors text-sm font-black text-creator-muted"
      >
        Hủy
      </button>
      <button
        type="submit"
        disabled={isSaving}
        className="rounded-full bg-creator-gold px-5 py-3 text-sm font-black text-black hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </div>
  );
}


export function DeleteEntityModal({
  modal,
  isDeleting,
  onClose,
  onConfirm,
}: {
  modal: DeleteModalState;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!modal) {
    return null;
  }

  const entityLabel =
    modal.kind === "series"
      ? modal.value.title
      : modal.kind === "season"
        ? modal.value.title
        : modal.kind === "episode"
          ? modal.value.title
          : isBackendMediaTarget(modal.value)
            ? `${modal.value.mediaType} media`
            : `Trang ${modal.value.displayOrder}`;

  return (
    <ModalShell
      title="Xác nhận xóa"
      subtitle="Kiểm tra lại nội dung trước khi xóa khỏi không gian làm việc của bạn."
      onClose={onClose}
      compact
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-4">
          <p className="text-sm font-bold text-creator-muted">Bạn đang xóa:</p>
          <p className="mt-1 text-lg font-black text-red-400">{entityLabel}</p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-creator-border bg-creator-bg text-white border border-creator-border px-5 py-3 hover:border-creator-gold transition-colors text-sm font-black text-creator-muted"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-full bg-red-500 hover:bg-red-600 transition-colors px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Đang xóa..." : "Xóa"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}


export function SchedulePublishModal({
  modal,
  isSaving,
  onClose,
  onSubmit,
}: {
  modal: ScheduleModalState;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (scheduledPublishAt: string) => void;
}) {
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  if (!modal) {
    return null;
  }

  const title = modal.value.title;
  const defaultSchedule = splitDateTimeLocalValue(
    modal.value.scheduledPublishAt,
  );
  const minimumSchedule = splitDateTimeLocalValue();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const publishDate = readFormString(form, "publishDate");
    const publishTime = readFormString(form, "publishTime");

    if (!publishDate || !publishTime) {
      setScheduleError("Vui long chon du ngay va gio phat hanh.");
      return;
    }

    const scheduledPublishAt = combineDateAndTimeLocalValue(
      publishDate,
      publishTime,
    );

    if (isPastDateTimeLocalValue(scheduledPublishAt)) {
      setScheduleError("Thoi gian phat hanh phai nam trong tuong lai.");
      return;
    }

    setScheduleError(null);
    onSubmit(scheduledPublishAt);
  }

  return (
    <ModalShell
      title="Schedule Publish"
      subtitle="Chỉ những tập có media đã được duyệt mới có thể được lên lịch."
      onClose={onClose}
      compact
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-[#D9E2F0] bg-creator-bg p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            {modal.kind}
          </p>
          <p className="mt-1 text-lg font-black text-white">{title}</p>
          <p className="mt-2 text-xs font-bold text-creator-muted">
            Current schedule: {formatDateTime(modal.value.scheduledPublishAt)}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Publish Date" required>
            <input
              name="publishDate"
              type="date"
              required
              min={minimumSchedule.date}
              defaultValue={defaultSchedule.date}
              onClick={(event) => openNativePicker(event.currentTarget)}
              className="h-12 w-full cursor-pointer rounded-xl border border-creator-border bg-creator-bg px-4 text-sm font-semibold outline-none focus:border-creator-gold focus:bg-creator-bg text-white"
            />
          </Field>
          <Field label="Publish Time" required>
            <input
              name="publishTime"
              type="time"
              required
              defaultValue={defaultSchedule.time}
              onClick={(event) => openNativePicker(event.currentTarget)}
              className="h-12 w-full cursor-pointer rounded-xl border border-creator-border bg-creator-bg px-4 text-sm font-semibold outline-none focus:border-creator-gold focus:bg-creator-bg text-white"
            />
          </Field>
        </div>

        {scheduleError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
            {scheduleError}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-creator-border bg-creator-bg text-white border border-creator-border px-5 py-3 hover:border-creator-gold transition-colors text-sm font-black text-creator-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-full bg-[#007A8A] px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Schedule"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}


export function EditEntityModal({
  modal,
  isSaving,
  uploadMessage,
  onClose,
  onSubmit,
  categories,
  tags,
}: {
  modal: EditModalState;
  isSaving: boolean;
  uploadMessage: string | null;
  onClose: () => void;
  onSubmit: (nextValue: EditSubmitState) => void;
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
}) {
  const [coverFile, setCoverFile] = useState<File | undefined>();
  const [bannerFile, setBannerFile] = useState<File | undefined>();

  if (!modal) {
    return null;
  }

  const controlClass =
    "h-11 w-full rounded-xl border border-creator-border bg-creator-bg px-3 text-sm font-semibold outline-none focus:border-creator-gold focus:bg-creator-bg text-white";
  const textareaClass =
    "min-h-24 w-full resize-none rounded-xl border border-creator-border bg-creator-bg p-3 text-sm font-semibold outline-none focus:border-creator-gold focus:bg-creator-bg text-white";

  function handleSeriesSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = readFormString(form, "title");

    if (!title) {
      return;
    }

    onSubmit({
      kind: "series",
      coverFile,
      bannerFile,
      value: {
        ...(modal!.value as SeriesRow),
        title,
        description: readFormString(form, "description"),
        coverUrl: readFormString(form, "coverUrl"),
        bannerUrl: readFormString(form, "bannerUrl"),
        contentType: readFormString(form, "contentType") as ContentType,
        visibility: readFormString(form, "visibility") as Visibility,
        ageRating: readFormString(form, "ageRating"),
        language: readFormString(form, "language"),
        categoryIds: splitIdList(readFormString(form, "categoryIds")),
        tagIds: splitIdList(readFormString(form, "tagIds")),
      },
    });
  }

  function handleSeasonSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = readFormString(form, "title");

    if (!title) {
      return;
    }

    const season = modal!.value as SeasonRow;

    onSubmit({
      kind: "season",
      value: {
        ...season,
        seasonNumber: readFormNumber(
          form,
          "seasonNumber",
          season.seasonNumber,
        )!,
        title,
        description: readFormString(form, "description"),
      },
    });
  }

  function handleEpisodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = readFormString(form, "title");

    if (!title) {
      return;
    }

    const episode = modal!.value as EpisodeRow;
    const totalPage = readFormNumber(form, "totalPage", episode.totalPage);

    onSubmit({
      kind: "episode",
      value: {
        ...episode,
        episodeNumber: readFormNumber(
          form,
          "episodeNumber",
          episode.episodeNumber,
        )!,
        title,
        description: readFormString(form, "description"),
        contentType: readFormString(form, "contentType") as ContentType,
        totalPage,
      },
    });
  }

  const title =
    modal.kind === "series"
      ? "Update Series"
      : modal.kind === "season"
        ? "Cập Nhập Mùa"
        : "Cập Nhập Tập";

  if (modal.kind === "series") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 overflow-y-auto">
        <div
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-7xl rounded-[24px] border border-creator-border bg-creator-bg shadow-[0_30px_90px_rgba(15,23,42,0.25)]"
        >
          <div className="sticky top-0 z-10 flex justify-between items-center bg-creator-bg p-6 pb-2 border-b border-creator-border rounded-t-[24px]">
            <h2 className="text-2xl font-bold text-white">Cập nhật Series</h2>
            <button
              onClick={onClose}
              type="button"
              className="rounded-full bg-creator-sidebar p-2 text-creator-muted transition-colors hover:bg-slate-700 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[80vh]">
            <CoreIdentityStep
              isUpdate={true}
              initialData={{
                title: modal.value.title,
                description: modal.value.description,
                contentType: modal.value.contentType,
                visibility: modal.value.visibility,
                ageRating: modal.value.ageRating,
                contentWarnings: modal.value.contentWarnings,
                language: modal.value.language,
                categoryIds: modal.value.categoryIds,
                tagIds: modal.value.tagIds,
                coverUrl: modal.value.coverUrl,
                bannerUrl: modal.value.bannerUrl,
              }}
              categories={categories}
              tags={tags}
              onCancel={onClose}
              onSave={(data) => {
                onSubmit({
                  kind: "series",
                  value: { ...modal.value, ...data } as any,
                  coverFile: data.coverFile,
                  bannerFile: data.bannerFile,
                });
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <ModalShell title={title} subtitle="" onClose={onClose}>
      {modal.kind === "season" && (
        <form onSubmit={handleSeasonSubmit} className="space-y-5">
          <Field label="Số Mùa">
            <input
              type="number"
              min={1}
              name="seasonNumber"
              defaultValue={modal.value.seasonNumber}
              className={controlClass}
            />
          </Field>
          <Field label="Tiêu Đề" required>
            <input
              name="title"
              required
              defaultValue={modal.value.title}
              className={controlClass}
            />
          </Field>
          <Field label="Mô Tả">
            <textarea
              name="description"
              defaultValue={modal.value.description}
              className={textareaClass}
            />
          </Field>
          {/* <Field label="Lifecycle">
            <input
              value={formatStatusLabel(modal.value.status)}
              readOnly
              hidden
              className={controlClass}
            />
          </Field> */}
          <ModalActions isSaving={isSaving} onClose={onClose} />
        </form>
      )}

      {modal.kind === "episode" && (
        <form onSubmit={handleEpisodeSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Số tập">
              <input
                type="number"
                min={1}
                name="episodeNumber"
                defaultValue={modal.value.episodeNumber}
                className={controlClass}
              />
            </Field>
            <Field label="Loại nội dung">
              <select
                name="contentType"
                defaultValue={modal.value.contentType}
                className={controlClass}
              >
                <option value="COMIC">Truyện tranh</option>
                <option value="VIDEO">Video</option>
              </select>
            </Field>
          </div>
          <Field label="Tiêu đề" required>
            <input
              name="title"
              required
              defaultValue={modal.value.title}
              className={controlClass}
            />
          </Field>
          <Field label="Mô tả">
            <textarea
              name="description"
              defaultValue={modal.value.description}
              className={textareaClass}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Vòng đời">
              <input
                value={formatStatusLabel(modal.value.status)}
                readOnly
                className={controlClass}
              />
            </Field>
            <Field label="Tổng số trang">
              <input
                type="number"
                min={0}
                name="totalPage"
                defaultValue={modal.value.totalPage ?? 0}
                className={controlClass}
              />
            </Field>
          </div>
          <ModalActions isSaving={isSaving} onClose={onClose} />
        </form>
      )}
    </ModalShell>
  );
}