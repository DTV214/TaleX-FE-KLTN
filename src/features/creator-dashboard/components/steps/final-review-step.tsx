import React, { useState, useEffect, useRef } from "react";
import { Check, Edit3, MessageSquare, AlertCircle, Eye, Rocket, X, Calendar, EyeOff, ShieldAlert, AlertTriangle, Image as ImageIcon, UploadCloud } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  getMediaViolations,
  type ContentApprovalStatus,
  type MediaStatus,
} from "@/features/creator-dashboard/api/creator-content-api";
import { AIPolicyAndCopyright } from "@/features/creator-dashboard/components/ai-policy-and-copyright";
import {
  getBlockingCopyrightViolations,
  getRejectedCensorshipResults,
  isMediaPipelinePending,
  isMediaReadyForPublish,
} from "@/features/creator-dashboard/utils/media-violations";

function formatScheduledPublishAt(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

interface FinalReviewStepProps {
  mediaId?: string;
  mediaUrl?: string;
  mediaStatus?: MediaStatus;
  approvalStatus?: ContentApprovalStatus;
  isPublishing?: boolean;
  onPublish: () => void;
  onSchedulePublish: () => void;
  onSaveDraft: () => void;
  onBack: () => void;
  // New props for updating/hiding
  selectedEpisode: any; // We'll type this as any to avoid importing EpisodeRow if not needed, or we can import it.
  onSaveEpisode: (episode: any) => void;
  isSavingEpisode: boolean;
  onSaveUnlockSettings: (episode: any) => void;
  isSavingUnlockSettings: boolean;
  canManageUnlockSettings: boolean;
  onHideEpisode: (episode: any) => void;
  isHidingEpisode: boolean;
  onCancelSchedule: (episode: any) => void;
  isCancelingSchedule: boolean;
}

export function FinalReviewStep({ 
  mediaId,
  mediaUrl,
  mediaStatus,
  approvalStatus,
  isPublishing, 
  onPublish, 
  onSchedulePublish, 
  onSaveDraft, 
  onBack,
  selectedEpisode,
  onSaveEpisode,
  isSavingEpisode,
  onSaveUnlockSettings,
  isSavingUnlockSettings,
  canManageUnlockSettings,
  onHideEpisode,
  isHidingEpisode,
  onCancelSchedule,
  isCancelingSchedule
}: FinalReviewStepProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [reviewerNotes, setReviewerNotes] = useState("");
  
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(selectedEpisode?.thumbnail || null);
  const [thumbnailFile, setThumbnailFile] = useState<File | undefined>(undefined);

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const objectUrl = URL.createObjectURL(file);
      setThumbnailPreview(objectUrl);
    }
  };

  // Episode Details Form State
  const [editForm, setEditForm] = useState({ 
    episodeNumber: selectedEpisode?.episodeNumber || 1, 
    title: selectedEpisode?.title || "", 
    description: selectedEpisode?.description || "", 
    unlockType: selectedEpisode?.unlockType || "FREE", 
    priceVnd: selectedEpisode?.priceVnd || 0 
  });

  useEffect(() => {
    if (selectedEpisode) {
      setEditForm({
        episodeNumber: selectedEpisode.episodeNumber,
        title: selectedEpisode.title,
        description: selectedEpisode.description || "",
        unlockType: selectedEpisode.unlockType || "FREE",
        priceVnd: selectedEpisode.priceVnd || 0
      });
      setThumbnailPreview(selectedEpisode.thumbnail || null);
      setThumbnailFile(undefined);
    }
  }, [selectedEpisode]);

  const isPublished = selectedEpisode?.status === "PUBLISHED";
  const isScheduled = selectedEpisode?.status === "SCHEDULED";

  const violationsQuery = useQuery({
    queryKey: ["creator-dashboard", "media-violations", mediaId],
    queryFn: () => getMediaViolations(mediaId!),
    enabled: !!mediaId,
    refetchInterval: isMediaPipelinePending({
      status: mediaStatus,
      approvalStatus,
    })
      ? 5000
      : false,
  });

  const violations = violationsQuery.data;
  const copyrightViolations = getBlockingCopyrightViolations(violations);
  const censorshipViolations = getRejectedCensorshipResults(violations);
  const hasCopyrightViolations = copyrightViolations.length > 0;
  const hasCensorshipViolations = censorshipViolations.length > 0;
  const hasAnyViolations = hasCopyrightViolations || hasCensorshipViolations;
  const isMediaReady = isMediaReadyForPublish({
    status: mediaStatus,
    approvalStatus,
  });

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto p-6 text-creator-text">
      {/* Left - Video Preview & Episode Details */}
      <div className="flex flex-1 flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">{isPublished ? "Published Episode" : "Final Review & Publishing Decision"}</h2>
          <p className="text-sm text-creator-muted">
            {isPublished ? "This episode is currently live on TaleX." : "Review your content before making it public on TaleX."}
          </p>
        </div>

        <div className="order-2 bg-creator-sidebar border border-creator-border rounded-xl p-5">
          <h3 className="font-semibold text-white mb-4">Bản xem trước trước khi phát hành</h3>
          
          <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-creator-border mb-6 relative">
            {mediaUrl ? (
              <video src={mediaUrl} controls className="w-full h-full object-contain" poster={mediaUrl}></video>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-creator-muted">
                Preview not available
              </div>
            )}
            {hasAnyViolations && (
              <div className="absolute top-4 right-4 max-w-sm bg-black/80 backdrop-blur-sm border border-red-500/50 text-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
                  <ShieldAlert size={18} />
                  <span>Phát hiện nội dung không đạt kiểm duyệt</span>
                </div>
                <div className="text-xs text-gray-300 space-y-2">
                  {hasCopyrightViolations && (
                    <div>
                      <span className="font-semibold text-white">Bản quyền: </span>
                      Đã phát hiện {copyrightViolations.length} vi phạm bản quyền. Vui lòng kiểm tra lại nội dung.
                    </div>
                  )}
                  {hasCensorshipViolations && (
                    <div>
                      <span className="font-semibold text-white">Nội dung không phù hợp: </span>
                      {censorshipViolations.map((item) => item.primaryViolationLabel).filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {!isPublished && (
            <div className="space-y-4">
              <h4 className="font-medium text-white text-sm">Danh sách kiểm tra thủ công</h4>
              
              <label className="flex items-start gap-3 p-3 border border-creator-border rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 rounded border-creator-border text-creator-gold focus:ring-creator-gold bg-creator-bg"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <div>
                  <span className="text-sm font-medium text-white block">Tôi xác nhận nội dung này thuộc quyền sở hữu của tôi</span>
                  <span className="text-xs text-creator-muted">Tôi nắm giữ toàn bộ quyền hạn và sự cho phép để xuất bản nội dung này trên TaleX.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-creator-border rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 rounded border-creator-border text-creator-gold focus:ring-creator-gold bg-creator-bg"
                  defaultChecked
                />
                <div>
                  <span className="text-sm font-medium text-white block">Đã xác minh đồng bộ Âm thanh/Hình ảnh</span>
                  <span className="text-xs text-creator-muted">File gốc phát chính xác không gặp lỗi đồng bộ.</span>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Episode Details Edit Form */}
        <div className="order-1 bg-creator-sidebar border border-creator-border rounded-xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6">Chi tiết Tập</h3>
          <div className="grid gap-6 md:grid-cols-[1fr_240px] mb-4">
            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Số thứ tự Tập</label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.episodeNumber}
                    onChange={(e) => setEditForm({...editForm, episodeNumber: Number(e.target.value)})}
                    className="h-10 w-full rounded-md border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Tiêu đề Tập *</label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    className="h-10 w-full rounded-md border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Mô tả</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full resize-none rounded-md border border-creator-border bg-creator-bg p-3 text-sm text-white outline-none focus:border-creator-gold"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2 mt-4 pt-4 border-t border-creator-border">
                <div>
                  <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Kiểu mở khóa</label>
                  <select
                    value={editForm.unlockType}
                    onChange={(e) => setEditForm({ ...editForm, unlockType: e.target.value })}
                    disabled={!canManageUnlockSettings}
                    className="h-10 w-full rounded-md border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold"
                  >
                    <option value="FREE">Miễn phí</option>
                    <option value="PAID">Trả phí</option>
                  </select>
                </div>

                {editForm.unlockType === "PAID" && (
                  <div>
                    <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Giá (VNĐ) *</label>
                    <input
                      type="number"
                      min={1}
                      max={99999}
                      value={editForm.priceVnd}
                      onChange={(e) => setEditForm({ ...editForm, priceVnd: Number(e.target.value) })}
                      disabled={!canManageUnlockSettings}
                      className="h-10 w-full rounded-md border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right: Thumbnail upload */}
            <div className="flex flex-col">
              <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Ảnh Thumbnail Tập *</label>
              <div 
                onClick={() => thumbnailInputRef.current?.click()}
                className={`relative w-full aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden group ${
                  thumbnailPreview ? "border-creator-gold" : "border-creator-border hover:border-creator-gold/50"
                }`}
              >
                {thumbnailPreview ? (
                  <>
                    <img src={thumbnailPreview} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <UploadCloud size={20} className="text-white mb-1" />
                      <span className="text-xs font-medium text-white">Đổi Thumbnail</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-creator-border rounded-full flex items-center justify-center mb-2">
                      <ImageIcon size={18} className="text-creator-muted" />
                    </div>
                    <span className="text-xs text-creator-muted px-4 text-center">Tải Thumbnail</span>
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

          <div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-creator-border">
            <button
              type="button"
              onClick={() => onSaveEpisode({ ...selectedEpisode, ...editForm, thumbnailFile })}
              disabled={isSavingEpisode}
              className="px-6 py-2.5 bg-creator-bg border border-creator-border text-white text-sm font-bold rounded hover:bg-white/10 shrink-0 disabled:opacity-50"
            >
              {isSavingEpisode ? "Saving..." : "Save Details"}
            </button>
            <button
              type="button"
              onClick={() => onSaveUnlockSettings({ ...selectedEpisode, unlockType: editForm.unlockType, priceVnd: editForm.unlockType === "PAID" ? editForm.priceVnd : 0 })}
              disabled={!canManageUnlockSettings || isSavingUnlockSettings}
              className="px-6 py-2.5 bg-creator-gold text-black text-sm font-bold rounded hover:bg-creator-gold-hover shrink-0 disabled:opacity-50"
            >
              {isSavingUnlockSettings ? "Saving Price..." : "Save Price"}
            </button>
          </div>
        </div>
      </div>

      {/* Right - Pipeline & Actions */}
      <div className="w-full lg:w-96 space-y-6">
        <AIPolicyAndCopyright
          mediaId={mediaId}
          mediaStatus={mediaStatus}
          approvalStatus={approvalStatus}
        />

        {!isPublished && (
          <div className="bg-creator-sidebar border border-creator-border rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3 text-sm flex items-center gap-2">
              <MessageSquare size={16} /> Reviewer Notes (Optional)
            </h3>
            <textarea
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              className="w-full bg-creator-bg border border-creator-border rounded-md p-3 text-sm text-white placeholder-creator-muted focus:outline-none focus:border-creator-gold min-h-[100px]"
              placeholder="Thêm ghi chú cho đội kiểm duyệt nếu cần..."
            ></textarea>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2">
          {isScheduled ? (
            <>
              <div className="rounded-xl border border-creator-gold/40 bg-creator-gold/10 p-4 text-sm">
                <div className="flex items-center gap-2 font-bold text-creator-gold">
                  <Calendar size={18} />
                  Scheduled Publish
                </div>
                <p className="mt-2 text-xs font-semibold text-creator-muted">
                  This episode is scheduled to go live at:
                </p>
                <p className="mt-1 text-base font-black text-white">
                  {formatScheduledPublishAt(selectedEpisode?.scheduledPublishAt)}
                </p>
              </div>

              <button
                onClick={() => onCancelSchedule(selectedEpisode)}
                disabled={isCancelingSchedule}
                className="w-full py-3 rounded-md text-sm font-bold bg-[#13110F] border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCancelingSchedule ? "Canceling..." : <><X size={18} /> Cancel Schedule</>}
              </button>

              <button
                onClick={onBack}
                className="w-full py-3 rounded-md text-sm font-bold bg-white/5 hover:bg-white/10 border border-creator-border transition-colors flex items-center justify-center gap-2"
              >
                Back to Episodes
              </button>
            </>
          ) : !isPublished ? (
            <>
              {!isMediaReady && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-bold leading-relaxed text-amber-300">
                  {approvalStatus === "REJECTED"
                    ? "Nội dung không đạt kiểm duyệt nên chưa thể xuất bản."
                    : "Vui lòng chờ media được xử lý xong và có trạng thái APPROVED trước khi xuất bản."}
                </div>
              )}
              <button 
                onClick={onPublish}
                disabled={!agreedToTerms || isPublishing || !isMediaReady}
                className="w-full py-3 rounded-md text-sm font-bold bg-creator-gold text-black hover:bg-creator-gold-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPublishing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    Publishing...
                  </span>
                ) : (
                  <>
                    <Rocket size={18} /> Publish to TaleX
                  </>
                )}
              </button>
              
              <button 
                onClick={onSchedulePublish}
                disabled={!agreedToTerms || isPublishing || !isMediaReady}
                className="w-full py-3 rounded-md text-sm font-bold bg-[#13110F] border border-creator-gold text-creator-gold hover:bg-creator-gold/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calendar size={18} /> Schedule Publish
              </button>
              
              <div className="grid grid-cols-2 gap-3 mt-1">
                <button 
                  onClick={onSaveDraft}
                  className="py-2.5 rounded-md text-sm font-medium bg-white/5 hover:bg-white/10 border border-creator-border transition-colors flex items-center justify-center gap-2"
                >
                  <Edit3 size={16} /> Save Draft
                </button>
                <button 
                  onClick={onBack}
                  className="py-2.5 rounded-md text-sm font-medium bg-white/5 hover:bg-white/10 border border-creator-border transition-colors flex items-center justify-center gap-2"
                >
                  Back
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl p-4 text-center font-bold text-sm mb-2">
                This episode is currently published and live.
              </div>
              <button 
                onClick={() => onHideEpisode(selectedEpisode)}
                disabled={isHidingEpisode}
                className="w-full py-3 rounded-md text-sm font-bold bg-[#13110F] border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isHidingEpisode ? "Hiding..." : <><EyeOff size={18} /> Hide Episode</>}
              </button>
              <button 
                onClick={onBack}
                className="w-full py-3 rounded-md text-sm font-bold bg-white/5 hover:bg-white/10 border border-creator-border transition-colors flex items-center justify-center gap-2"
              >
                Back to Episodes
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
