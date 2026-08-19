import React, { useState, useRef, useEffect, useCallback, FormEvent, DragEvent, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlayCircle, ImagePlus, Video, ShieldAlert, AlertTriangle, Fingerprint, BarChart3, ArrowDown, ArrowUp, BookOpen, Calendar, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Clapperboard, CloudUpload, Edit3, Eye, FileVideo, GripVertical, Image as ImageIcon, Info, Library, Loader2, Lock, Plus, RefreshCw, Search, Settings2, Tag, Trash2, UploadCloud, Wallet, X, Zap, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ResumableVideoUploader } from '@/features/creator-dashboard/components/resumable-video-uploader';
import { SignedHlsPlayer } from '@/features/playback/components/signed-hls-player';
import { type DashboardView, type SeriesRow, type SeasonRow, type EpisodeRow, type ComicPage, type ContentType, type ActiveScheduleModal, type EpisodeUnlockSettingsUpdate } from '@/features/creator-dashboard/types/dashboard.types';
import { formatNumber, formatBytes, formatApprovalStatusLabel, getApprovalChipClass, formatMediaStatusLabel, isPlayableVideoStatus, cx, formatDateTime, splitDateTimeLocalValue, isPastDateTimeLocalValue, combineDateAndTimeLocalValue, getStatusBadgeStyle, formatStatusLabel, FORCE_HIDDEN_REASON_TOOLTIP } from '../shared/utils';
import { type MediaStatus, type MediaResponse, type EpisodeUnlockType } from '@/features/creator-dashboard/api/creator-content-api';
import { Panel, PanelHeader, MetricBox, ApiStateNote, SelectionStatePanel, SeriesCoverImage } from "@/features/creator-dashboard/components/shared/panels";
import { DashboardNavButton, MobileTab, FilterTab, ModelStep } from "@/features/creator-dashboard/components/shared/tabs-nav";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { AIPolicyAndCopyright } from "@/features/creator-dashboard/components/ai-policy-and-copyright";
import { isMediaReadyForPublish } from "@/features/creator-dashboard/utils/media-violations";
import { CreatorBackButton } from "@/features/creator-dashboard/components/creator-back-button";
import { EpisodeAnalyticsModal } from "@/features/creator-dashboard/components/views/episode-analytics-modal";

// ============================================================================
// VIDEO UPLOAD VIEW
// ============================================================================
export function VideoUploadView({
  selectedSeries,
  selectedSeason,
  selectedEpisode,
  videos,
  isLoadingMedia,
  uploadMessage,
  onUploadCompleted,
  onDeleteVideo,
  onSaveEpisode,
  isSavingEpisode,
  onSaveUnlockSettings,
  isSavingUnlockSettings,
  canManageUnlockSettings,
  accountId,
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
  maxVideoSizeMb,
}: {
  selectedSeries: SeriesRow | null;
  selectedSeason: SeasonRow | null;
  selectedEpisode: EpisodeRow;
  videos: MediaResponse[];
  isLoadingMedia: boolean;
  uploadMessage: string | null;
  onUploadCompleted: (media: MediaResponse) => void;
  onDeleteVideo: (media: MediaResponse) => void;
  onSaveEpisode: (episode: EpisodeRow & { thumbnailFile?: File }) => void;
  isSavingEpisode: boolean;
  onSaveUnlockSettings: (episode: EpisodeRow) => void;
  isSavingUnlockSettings: boolean;
  canManageUnlockSettings: boolean;
  accountId: string;
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
  maxVideoSizeMb?: number;
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

  const [violationMediaId, setViolationMediaId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    episodeNumber: selectedEpisode.episodeNumber,
    title: selectedEpisode.title,
    description: selectedEpisode.description || "",
    unlockType: selectedEpisode.unlockType || "FREE",
    priceVnd: selectedEpisode.priceVnd || 0,
  });
  const canSchedule = videos.length > 0 && videos.every(isMediaReadyForPublish);
  return (
    <div className="w-full py-6 text-creator-text space-y-8">
      {/* Header matching mockup */}
      <div>
        <CreatorBackButton onClick={onBack} className="mb-6" />
        <h2 className="text-4xl font-bold text-white mb-3">
          Đang kiểm duyệt nội dung cuối cùng
        </h2>
        <p className="text-creator-muted max-w-2xl text-sm leading-relaxed">
          Tải lên các tài nguyên điện ảnh chất lượng cao của bạn và để TaleX AI đảm bảo việc tuân thủ chính sách cũng như xác thực tính nguyên bản của nội dung.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left Column: Upload Workspace */}
        <div className="space-y-6">
          <div className="bg-creator-sidebar border border-creator-border rounded-xl p-8 shadow-xl mb-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Chi tiết tập</h3>
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
                  onSaveEpisode({ ...selectedEpisode, ...editForm })
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
              <h3 className="text-lg font-bold text-white">Tải lên Video</h3>
              <span className="text-xs font-bold px-3 py-1.5 bg-creator-bg border border-creator-border rounded text-creator-muted uppercase tracking-wider">
                Chấp nhận: MP4, MOV
              </span>
            </div>

            <div className="mb-6">
              <ResumableVideoUploader
                key={selectedEpisode.id}
                episodeId={selectedEpisode.id}
                creatorId={selectedSeries?.creatorId}
                actorId={accountId}
                disabledReason={
                  videos.length > 0
                    ? "Vui lòng xóa video hiện tại trước khi tải lên video thay thế."
                    : undefined
                }
                onCompleted={onUploadCompleted}
                maxVideoSizeMb={maxVideoSizeMb}
              />
            </div>

            {/* List of uploaded files */}
            {isLoadingMedia ? (
              <div className="p-6 rounded-xl bg-creator-bg border border-creator-border flex flex-col items-center justify-center text-creator-muted">
                <div className="w-6 h-6 border-2 border-creator-gold border-t-transparent rounded-full animate-spin mb-3"></div>
                <span className="text-sm font-bold">
                  Đang tải tài nguyên...
                </span>
              </div>
            ) : (
              videos.length > 0 && (
                <div className="space-y-4">
                  {videos.map((video) => (
                    <div
                      key={video.mediaId}
                      className="rounded-xl border border-creator-border bg-creator-bg overflow-hidden group"
                    >
                      <div className="p-4 border-b border-creator-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clapperboard className="h-5 w-5 text-creator-gold" />
                          <div>
                            <p
                              className="text-sm font-bold text-white max-w-[200px] truncate"
                              title={
                                (video as any).fileName ||
                                video.fileUrl?.split("/").pop() ||
                                video.fileUrl
                              }
                            >
                              {(video as any).fileName ||
                                video.fileUrl?.split("/").pop() ||
                                "Tệp video"}
                            </p>
                            <p className="text-xs font-medium text-creator-muted uppercase tracking-wider">
                              {video.mimeType} • {formatBytes(video.fileSize)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cx(
                              "px-2.5 py-1 text-[10px] font-bold rounded uppercase tracking-wider border",
                              getApprovalChipClass(
                                video.approvalStatus ?? "PENDING_REVIEW",
                              ),
                            )}
                          >
                            {formatApprovalStatusLabel(
                              video.approvalStatus ?? "PENDING_REVIEW",
                            )}
                          </span>
                          <button
                            onClick={() => onDeleteVideo(video)}
                            className="w-8 h-8 flex items-center justify-center rounded bg-creator-sidebar text-creator-muted hover:text-red-400 hover:bg-red-400/10 transition-colors border border-creator-border hover:border-red-400/30"
                            title="Xóa video"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="p-4 bg-black/20">
                        {isPlayableVideoStatus(video.status) ? (
                          <div className="rounded-lg overflow-hidden border border-creator-border">
                            <SignedHlsPlayer
                              episodeId={video.episodeId}
                              compact
                              creatorMode
                            />
                          </div>
                        ) : (
                          <VideoProcessingState
                            video={video}
                            onViewViolation={setViolationMediaId}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Alert Box matching mockup */}
          <div className="bg-creator-sidebar border border-creator-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-5 h-5 rounded-full bg-creator-gold flex items-center justify-center shrink-0 mt-0.5">
                <Info className="h-3 w-3 text-black" />
              </div>
              <p className="text-sm font-medium text-creator-muted max-w-sm">
                Thời gian kiểm duyệt phụ thuộc vào độ dài video. Bạn có thể
                rời trang này và quay lại sau, hệ thống sẽ tự động cập nhật tiến
                trình.
              </p>
            </div>
            {canSchedule && (
              <button
                onClick={onGoToPublishing}
                className="px-6 py-2.5 bg-creator-gold text-black text-sm font-bold rounded hover:bg-creator-gold-hover shrink-0"
              >
                Tiếp tục xuất bản
              </button>
            )}
          </div>
        </div>

        {/* Right Column: AI Policy Scan & Copyright Protection */}
        <AIPolicyAndCopyright
          mediaId={videos[0]?.mediaId}
          mediaType={videos[0]?.mediaType}
          mediaStatus={videos[0]?.status}
          approvalStatus={videos[0]?.approvalStatus}
          errorMessage={videos[0]?.errorMessage}
          contentId={videos[0]?.contentId}
          hasWatermark={videos[0]?.hasWatermark}
        />
      </div>
    </div>
  );
}


export function VideoProcessingState({
  video,
  onViewViolation,
}: {
  video: MediaResponse;
  onViewViolation?: (mediaId: string) => void;
}) {
  const failed = video.status === "FAILED";
  const pending = video.status === "PENDING";
  const inactive = video.status === "INACTIVE";

  const bgClass =
    failed || inactive
      ? "border-red-500/50 bg-red-500/10 text-red-400"
      : pending
        ? "border-amber-300/30 bg-amber-50 text-amber-800"
        : "border-[#D9E2F0] bg-creator-sidebar text-creator-muted";

  return (
    <div
      className={cx(
        "flex aspect-video w-full flex-col items-center justify-center rounded-xl border px-4 text-center",
        bgClass,
      )}
    >
      {failed || inactive ? (
        <CircleAlert className="mb-3 h-8 w-8" />
      ) : pending ? (
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-amber-600" />
      ) : (
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-creator-gold" />
      )}
      <p className="text-sm font-black text-white">
        {inactive
          ? "Nội dung vi phạm chính sách"
          : pending
            ? "Đang kiểm duyệt nội dung"
            : failed
              ? "Xử lý video thất bại"
              : "Video đang được xử lý"}
      </p>
      <p className="mt-2 max-w-md text-xs font-bold leading-relaxed">
        {inactive
          ? "Nội dung đã bị ẩn do vi phạm bản quyền hoặc kiểm duyệt."
          : pending
            ? "Đang kiểm tra bản quyền và nội dung..."
            : failed
              ? video.errorMessage || "Không thể xử lý video."
              : "Vui lòng chờ trong giây lát."}
      </p>
      <span
        className={cx(
          "mt-3 rounded-full px-3 py-1 text-[11px] font-black",
          inactive
            ? "bg-red-100 text-red-700"
            : pending
              ? "bg-amber-100 text-amber-700"
              : "bg-[#E8F8FF] text-[#075985]",
        )}
      >
        {formatMediaStatusLabel(video.status)}
      </span>
      {inactive && onViewViolation && (
        <button
          onClick={() => onViewViolation(video.mediaId)}
          className="mt-2 text-xs font-semibold text-red-600 underline hover:text-red-800"
        >
          Xem chi tiết vi phạm
        </button>
      )}
    </div>
  );
}