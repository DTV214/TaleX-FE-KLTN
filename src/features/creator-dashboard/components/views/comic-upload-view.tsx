import { getMediaViolations } from "@/features/creator-dashboard/api/creator-content-api";
import { isMediaReadyForPublish, isMediaPipelinePending, getBlockingCopyrightViolations, getRejectedCensorshipResults, translateViolationLabel } from "@/features/creator-dashboard/utils/media-violations";
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

import { CreatorBackButton } from "@/features/creator-dashboard/components/creator-back-button";
import { EpisodeAnalyticsModal } from "@/features/creator-dashboard/components/views/episode-analytics-modal";

// ============================================================================
// COMIC UPLOAD VIEW
// ============================================================================
export function ComicUploadView({
  selectedSeries,
  selectedSeason,
  selectedEpisode,
  pages,
  draggingPageId,
  onDragStart,
  onDragEnd,
  onDropPage,
  onMovePage,
  onFilesSelected,
  isUploading,
  onSaveOrder,
  isSavingOrder,
  onDeletePage,
  isLoadingMedia,
  uploadMessage,
  onSaveEpisode,
  isSavingEpisode,
  onSaveUnlockSettings,
  isSavingUnlockSettings,
  canManageUnlockSettings,
  canSchedulePublish,
  onSchedulePublish,
  onHideEpisode,
  onUnhideEpisode,
  isHidingEpisode,
  onCancelSchedule,
  isCancelingSchedule,
  onPublishNow,
  isPublishingNow,
  onGoToPublishing,
  onBack,
  maxImageSizeMb,
  maxComicImages,
}: {
  selectedSeries: SeriesRow | null;
  selectedSeason: SeasonRow | null;
  selectedEpisode: EpisodeRow;
  pages: ComicPage[];
  draggingPageId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: (id: string) => void;
  onDropPage: (draggedId: string, targetId: string) => void;
  onMovePage: (id: string, offset: number) => void;
  onFilesSelected: (files: FileList | File[] | null) => void;
  isUploading: boolean;
  onSaveOrder: () => void;
  isSavingOrder: boolean;
  onDeletePage: (page: ComicPage) => void;
  isLoadingMedia: boolean;
  uploadMessage: string | null;
  onSaveEpisode: (episode: EpisodeRow & { thumbnailFile?: File }) => void;
  isSavingEpisode: boolean;
  onSaveUnlockSettings: (episode: EpisodeRow) => void;
  isSavingUnlockSettings: boolean;
  canManageUnlockSettings: boolean;
  canSchedulePublish: boolean;
  onSchedulePublish: (episode: EpisodeRow) => void;
  onHideEpisode: (episode: EpisodeRow) => void;
  onUnhideEpisode: (episode: EpisodeRow) => void;
  isHidingEpisode: boolean;
  onCancelSchedule: (episode: EpisodeRow) => void;
  isCancelingSchedule: boolean;
  onPublishNow: (episode: EpisodeRow) => void;
  isPublishingNow: boolean;
  onGoToPublishing: () => void;
  onBack: () => void;
  maxImageSizeMb?: number;
  maxComicImages?: number;
}) {
  const user = useAuthStore((state) => state.user);
  const isCreator = user?.roleName === "CREATOR";

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    selectedEpisode.thumbnail || null,
  );
  const [thumbnailFile, setThumbnailFile] = useState<File | undefined>(
    undefined,
  );

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const objectUrl = URL.createObjectURL(file);
      setThumbnailPreview(objectUrl);
    }
  };

  const [editForm, setEditForm] = useState({
    episodeNumber: selectedEpisode.episodeNumber,
    title: selectedEpisode.title,
    description: selectedEpisode.description || "",
    unlockType: selectedEpisode.unlockType || "FREE",
    priceVnd: selectedEpisode.priceVnd || 0,
  });
  return (
    <div className="w-full py-6 text-creator-text space-y-8">
      {/* Header matching mockup */}
      <div>
        <CreatorBackButton onClick={onBack} className="mb-6" />
        <h2 className="text-4xl font-bold text-white mb-3">
          Đang kiểm duyệt nội dung cuối cùng
        </h2>
        <p className="text-creator-muted max-w-2xl text-sm leading-relaxed">
          Tải lên các tài nguyên điện ảnh chất lượng cao của bạn và để TaleX AI
          đảm bảo việc tuân thủ chính sách cũng như xác thực tính nguyên bản của
          nội dung.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left Column: Upload Workspace */}
        <div className="space-y-6">
          <div className="bg-creator-sidebar border border-creator-border rounded-xl p-8 shadow-xl mb-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Chi tiết Tập</h3>
            </div>
            <div className="grid gap-6 md:grid-cols-[1fr_240px]">
              <div className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">
                      Số thứ tự Tập
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={editForm.episodeNumber}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          episodeNumber: Number(e.target.value),
                        })
                      }
                      className="h-10 w-full rounded-md border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">
                      Tiêu đề Tập *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                      className="h-10 w-full rounded-md border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">
                    Mô tả
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    className="w-full resize-none rounded-md border border-creator-border bg-creator-bg p-3 text-sm text-white outline-none focus:border-creator-gold"
                  />
                </div>

                {isCreator && (
                  <div className="grid gap-5 md:grid-cols-2 mt-4 pt-4 border-t border-creator-border">
                    <div>
                      <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">
                        Kiểu mở khóa
                      </label>
                      <select
                        value={editForm.unlockType}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            unlockType: e.target.value as EpisodeUnlockType,
                          })
                        }
                        disabled={!canManageUnlockSettings}
                        className="h-10 w-full rounded-md border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold"
                      >
                        <option value="FREE">Miễn phí</option>
                        <option value="PAID">Trả phí</option>
                      </select>
                    </div>

                    {editForm.unlockType === "PAID" && (
                      <div>
                        <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">
                          Giá (VNĐ) *
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={99999}
                          value={editForm.priceVnd}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              priceVnd: Number(e.target.value),
                            })
                          }
                          disabled={!canManageUnlockSettings}
                          className="h-10 w-full rounded-md border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Thumbnail upload */}
              <div className="flex flex-col">
                <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">
                  Ảnh Thumbnail Tập *
                </label>
                <div
                  onClick={() => thumbnailInputRef.current?.click()}
                  className={`relative w-full aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden group ${thumbnailPreview
                    ? "border-creator-gold"
                    : "border-creator-border hover:border-creator-gold/50"
                    }`}
                >
                  {thumbnailPreview ? (
                    <>
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <UploadCloud size={20} className="text-white mb-1" />
                        <span className="text-xs font-medium text-white">
                          Đổi Thumbnail
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-creator-border rounded-full flex items-center justify-center mb-2">
                        <ImageIcon size={18} className="text-creator-muted" />
                      </div>
                      <span className="text-xs text-creator-muted px-4 text-center">
                        Tải Thumbnail
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    ref={thumbnailInputRef}
                    onChange={handleThumbnailUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={() =>
                  onSaveEpisode({
                    ...selectedEpisode,
                    ...editForm,
                    thumbnailFile,
                  })
                }
                disabled={isSavingEpisode}
                className="inline-flex h-10 items-center justify-center rounded bg-creator-bg px-5 text-sm font-bold text-white border border-creator-border hover:bg-white/10 disabled:opacity-50"
              >
                {isSavingEpisode ? "Đang lưu..." : "Lưu chi tiết"}
              </button>
              {isCreator && (
                <button
                  onClick={() =>
                    onSaveUnlockSettings({
                      ...selectedEpisode,
                      unlockType: editForm.unlockType,
                      priceVnd:
                        editForm.unlockType === "PAID" ? editForm.priceVnd : 0,
                    })
                  }
                  disabled={!canManageUnlockSettings || isSavingUnlockSettings}
                  className="inline-flex h-10 items-center justify-center rounded bg-creator-gold px-5 text-sm font-bold text-black hover:bg-creator-gold-hover disabled:opacity-50"
                >
                  {isSavingUnlockSettings ? "Đang lưu giá..." : "Lưu giá"}
                </button>
              )}
            </div>
          </div>
          <div className="bg-creator-sidebar border border-creator-border rounded-xl p-8 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">
                Upload Truyện và Chỉnh sửa vị trí
              </h3>
              <span className="text-xs font-bold px-3 py-1.5 bg-creator-bg border border-creator-border rounded text-creator-muted uppercase tracking-wider">
                Chấp nhận: JPG, PNG, WEBP, BMP, JFIF
              </span>
            </div>

            {/* Dropzone */}
            <label className="mb-8 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-creator-gold/30 bg-[#13110F] p-8 text-center transition hover:bg-creator-bg group">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => onFilesSelected(e.target.files)}
                disabled={isUploading}
              />
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-creator-gold/10 text-creator-gold group-hover:bg-creator-gold/20 transition-colors">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-white mb-2">
                Kéo & thả tài nguyên vào đây
              </p>
              <p className="text-xs font-medium text-creator-muted">
                Kích thước tối đa: <span className="text-creator-gold font-bold">{maxImageSizeMb ?? 10}MB</span> mỗi trang
              </p>
            </label>

            {uploadMessage && (
              <div className="mb-6 p-4 rounded-xl bg-creator-bg border border-creator-border text-sm text-creator-muted flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isUploading || isSavingOrder ? (
                    <div className="w-4 h-4 border-2 border-creator-gold border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Info className="w-4 h-4 text-creator-gold" />
                  )}
                  <span>{uploadMessage}</span>
                </div>
              </div>
            )}

            {/* Grid of uploaded pages */}
            {pages.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-creator-border">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">Trang đã tải lên {maxComicImages ? (<span className={cx("text-xs font-medium px-2 py-0.5 rounded", pages.length > maxComicImages ? "bg-red-500/20 text-red-400" : "bg-white/10 text-gray-300")}>{pages.length} / {maxComicImages} ảnh</span>) : (<span className="text-xs font-medium text-gray-400">({pages.length})</span>)}</h4>
                  <button
                    onClick={onSaveOrder}
                    disabled={isSavingOrder}
                    className="text-xs font-bold px-4 py-2 bg-creator-bg border border-creator-border text-white rounded hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    {isSavingOrder ? "Đang lưu..." : "Lưu"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {pages.map((page, index) => (
                    <ComicPageCard
                      key={page.id}
                      page={page}
                      dragging={draggingPageId === page.id}
                      onDragStart={() => onDragStart(page.id)}
                      onDragEnd={() => onDragEnd(page.id)}
                      onDrop={() => {
                        if (draggingPageId) {
                          onDropPage(draggingPageId, page.id);
                        }
                      }}
                      onMoveUp={() => onMovePage(page.id, -1)}
                      onMoveDown={() => onMovePage(page.id, 1)}
                      onDelete={() => onDeletePage(page)}
                      isOverCountLimit={maxComicImages != null && index >= maxComicImages}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Alert Box matching mockup */}
          <div className="bg-creator-sidebar border border-creator-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-5 h-5 rounded-full bg-creator-gold flex items-center justify-center shrink-0 mt-0.5">
                <Info className="h-3 w-3 text-black" />
              </div>
              <p className="text-sm font-medium text-creator-muted max-w-md leading-relaxed">
                Thời gian kiểm duyệt phụ thuộc vào số lượng trang. Bạn có thể
                rời trang này và quay lại sau, hệ thống sẽ tự động cập nhật tiến
                trình.
              </p>
            </div>
            {canSchedulePublish ? (
              <button
                onClick={onGoToPublishing}
                className="px-6 py-2.5 bg-creator-gold text-black text-sm font-bold rounded hover:bg-creator-gold-hover shrink-0"
              >
                Tiếp tục xuất bản
              </button>
            ) : (
              (() => {
                const persistedPages = pages.filter(
                  (p) => !p.id.startsWith("LOCAL-"),
                );
                if (persistedPages.length === 0) return null;
                const readyCount = persistedPages.filter(
                  (p) =>
                    p.approvalStatus === "APPROVED" &&
                    (p.status === "ACTIVE" || p.status === "HLS_READY"),
                ).length;
                return (
                  <p className="text-xs font-bold text-creator-muted shrink-0">
                    Đang xử lý {readyCount}/{persistedPages.length} trang — nút
                    xuất bản sẽ hiện khi tất cả trang hoàn tất.
                  </p>
                );
              })()
            )}
          </div>
        </div>

        {/* Right Column: AI Policy Scan */}
        <AIPolicyAndCopyright
          mediaId={pages.find((page) => !page.id.startsWith("LOCAL-"))?.id}
          mediaType="IMAGE"
          mediaStatus={
            pages.find((page) => !page.id.startsWith("LOCAL-"))?.status
          }
          approvalStatus={
            pages.find((page) => !page.id.startsWith("LOCAL-"))?.approvalStatus
          }
          errorMessage={
            pages.find((page) => !page.id.startsWith("LOCAL-"))?.errorMessage
          }
          contentId={
            pages.find((page) => !page.id.startsWith("LOCAL-"))?.contentId
          }
          hasWatermark={
            pages.find((page) => !page.id.startsWith("LOCAL-"))?.hasWatermark
          }
          pages={pages}
        />
      </div>
    </div>
  );
}


export function ComicPageCard({
  page,
  dragging,
  onDragStart,
  onDragEnd,
  onDrop,
  onMoveUp,
  onMoveDown,
  onDelete,
  isOverCountLimit,
}: {
  page: ComicPage;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  isOverCountLimit?: boolean;
}) {
  const isLocal = page.id.startsWith("LOCAL-");
  const violationsQuery = useQuery({
    queryKey: ["creator-dashboard", "media-violations", page.id],
    queryFn: () => getMediaViolations(page.id),
    enabled: !isLocal,
    refetchInterval: isMediaPipelinePending({
      status: page.status,
      approvalStatus: page.approvalStatus,
    })
      ? 5000
      : false,
  });

  const violations = violationsQuery.data;
  const copyrightViolations = getBlockingCopyrightViolations(violations);
  const censorshipViolations = getRejectedCensorshipResults(violations);
  const hasCopyrightViolations = copyrightViolations.length > 0;
  const hasCensorshipViolations = censorshipViolations.length > 0;
  const hasSizeViolations = page.status === "FAILED" && !!page.errorMessage;
  const hasAnyViolations = hasCopyrightViolations || hasCensorshipViolations || hasSizeViolations || isOverCountLimit;

  // Use a yellow border for count limit if it's the only violation, else red
  const isOnlyCountLimit = isOverCountLimit && !hasCopyrightViolations && !hasCensorshipViolations && !hasSizeViolations;

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={() => onDragEnd()}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      className={cx(
        "group relative overflow-hidden rounded-xl border-2 shadow-sm transition",
        hasAnyViolations
          ? isOnlyCountLimit
            ? "bg-yellow-500/5 border-yellow-500"
            : "bg-red-500/5 border-red-500"
          : "bg-creator-sidebar border-transparent hover:border-[#007A8A]",
        dragging && "scale-95 border-[#B83268] opacity-60",
      )}
    >
      <div className="relative aspect-[3/4]">
        {page.image ? (
          <img src={page.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-creator-bg border border-creator-border text-creator-muted text-xs font-black text-creator-muted">
            No preview
          </div>
        )}
        <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-[#151A23] text-xs font-black text-white z-20">
          {page.displayOrder}
        </span>
        <span className="absolute right-2 top-2 rounded-lg bg-creator-sidebar/90 p-1.5 text-creator-text shadow z-20">
          <GripVertical className="h-4 w-4" />
        </span>

        {hasAnyViolations && (
          <div className={cx("absolute top-2 right-10 text-white p-1.5 rounded-lg shadow z-20", isOnlyCountLimit ? "bg-yellow-500" : "bg-red-500")}>
            <ShieldAlert size={16} />
          </div>
        )}

        {hasAnyViolations && (
          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-center items-center text-center overflow-y-auto backdrop-blur-sm z-10 cursor-help">
            <AlertTriangle className={isOnlyCountLimit ? "text-yellow-500 mb-2" : "text-red-500 mb-2"} size={24} />
            <span className={cx("font-bold text-sm mb-2", isOnlyCountLimit ? "text-yellow-400" : "text-red-400")}>
              {isOverCountLimit ? "Vượt quá số lượng ảnh" : hasSizeViolations ? "Lỗi tải ảnh" : "Nội dung không đạt kiểm duyệt"}
            </span>
            {isOverCountLimit && (
              <p className="text-xs text-gray-300 mb-1">
                Số lượng ảnh đã vượt quá mức cho phép. Vui lòng xoá bớt ảnh.
              </p>
            )}
            {hasSizeViolations && (
              <p className="text-xs text-gray-300 mb-1">
                {page.errorMessage}
              </p>
            )}
            {hasCopyrightViolations && (
              <p className="text-xs text-gray-300 mb-1">
                <span className="font-semibold text-white">Bản quyền:</span>{" "}
                {copyrightViolations.length} vi phạm
              </p>
            )}
            {hasCensorshipViolations && (
              <p className="text-xs text-gray-300">
                <span className="font-semibold text-white">Nội dung:</span>{" "}
                {censorshipViolations
                  .map((item: any) =>
                    translateViolationLabel(item.primaryViolationLabel),
                  )
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2 p-3 relative z-20">
        <p
          className={`truncate text-sm font-black ${hasAnyViolations ? "text-red-400" : "text-white"}`}
        >
          {page.title}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            aria-label={`Move ${page.title} up`}
            title="Move up"
            onClick={onMoveUp}
            className="flex h-9 min-w-0 items-center justify-center rounded-lg bg-creator-bg border border-creator-border text-creator-muted text-creator-muted transition hover:bg-[#E3EBF7]"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`Move ${page.title} down`}
            title="Move down"
            onClick={onMoveDown}
            className="flex h-9 min-w-0 items-center justify-center rounded-lg bg-creator-bg border border-creator-border text-creator-muted text-creator-muted transition hover:bg-[#E3EBF7]"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${page.title}`}
            title="Delete"
            onClick={onDelete}
            className="flex h-9 min-w-0 items-center justify-center rounded-lg bg-[#FFE8E8] text-red-400 transition hover:bg-[#FFDCDC]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}