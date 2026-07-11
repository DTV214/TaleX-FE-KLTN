import React, { useState, useEffect, useRef } from "react";
import { Check, Edit3, MessageSquare, AlertCircle, Eye, Rocket, X, Calendar, EyeOff, ShieldAlert, AlertTriangle, Image as ImageIcon, UploadCloud } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMediaViolations } from "@/features/creator-dashboard/api/creator-content-api";
import { AIPolicyAndCopyright } from "@/features/creator-dashboard/components/ai-policy-and-copyright";
import {
  getBlockingCopyrightViolations,
  getRejectedCensorshipResults,
  isMediaPipelinePending,
  isMediaReadyForPublish,
} from "@/features/creator-dashboard/utils/media-violations";

interface FinalReviewComicStepProps {
  pages: any[];
  isPublishing?: boolean;
  onPublish: () => void;
  onSchedulePublish: () => void;
  onSaveDraft: () => void;
  onBack: () => void;
  selectedEpisode: any;
  onSaveEpisode: (episode: any) => void;
  isSavingEpisode: boolean;
  onHideEpisode: (episode: any) => void;
  isHidingEpisode: boolean;
}

export function FinalReviewComicStep({
  pages,
  isPublishing,
  onPublish,
  onSchedulePublish,
  onSaveDraft,
  onBack,
  selectedEpisode,
  onSaveEpisode,
  isSavingEpisode,
  onHideEpisode,
  isHidingEpisode
}: FinalReviewComicStepProps) {
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
  const persistedPages = pages.filter((page) => !page.id.startsWith("LOCAL-"));
  const firstPersistedPage = persistedPages[0];
  const hasRejectedPage = persistedPages.some(
    (page) => page.approvalStatus === "REJECTED",
  );
  const isMediaReady =
    persistedPages.length > 0 &&
    persistedPages.every((page) =>
      isMediaReadyForPublish({
        status: page.status,
        approvalStatus: page.approvalStatus,
      }),
    );

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto p-6 text-creator-text">
      {/* Left - Comic Preview & Episode Details */}
      <div className="flex-1 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">{isPublished ? "Published Episode" : "Final Review & Publishing Decision"}</h2>
          <p className="text-sm text-creator-muted">
            {isPublished ? "This episode is currently live on TaleX." : "Review your content before making it public on TaleX."}
          </p>
        </div>

        <div className="bg-creator-sidebar border border-creator-border rounded-xl p-5 mt-8">
          <h3 className="font-semibold text-white mb-4">Bản xem trước trước khi phát hành</h3>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 mb-6 max-h-[500px] overflow-y-auto pr-2">
            {pages.length > 0 ? (
              pages.map((page) => (
                <ComicPagePreview key={page.id} page={page} />
              ))
            ) : (
              <div className="col-span-full py-10 flex items-center justify-center text-creator-muted text-sm border border-dashed border-creator-border rounded-xl">
                Không có trang truyện nào.
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
                  <span className="text-sm font-medium text-white block">Đã xác minh thứ tự trang</span>
                  <span className="text-xs text-creator-muted">Các trang truyện đã được sắp xếp đúng thứ tự hiển thị.</span>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Episode Details Edit Form */}
        <div className="bg-creator-sidebar border border-creator-border rounded-xl p-6 shadow-xl mb-6">
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
                    onChange={(e) => setEditForm({ ...editForm, episodeNumber: Number(e.target.value) })}
                    className="h-10 w-full rounded-md border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Tiêu đề Tập *</label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="h-10 w-full rounded-md border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Mô tả</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full resize-none rounded-md border border-creator-border bg-creator-bg p-3 text-sm text-white outline-none focus:border-creator-gold"
                />
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

          <div className="flex justify-end pt-2 border-t border-creator-border">
            <button
              type="button"
              onClick={() => onSaveEpisode({ ...selectedEpisode, ...editForm, thumbnailFile })}
              disabled={isSavingEpisode}
              className="px-6 py-2.5 bg-creator-bg border border-creator-border text-white text-sm font-bold rounded hover:bg-white/10 shrink-0 disabled:opacity-50"
            >
              {isSavingEpisode ? "Saving..." : "Save Details"}
            </button>
          </div>
        </div>
      </div>

      {/* Right - Pipeline & Actions */}
      <div className="w-full lg:w-96 space-y-6">
        <AIPolicyAndCopyright
          mediaId={firstPersistedPage?.id}
          mediaStatus={firstPersistedPage?.status}
          approvalStatus={firstPersistedPage?.approvalStatus}
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
          {!isPublished ? (
            <>
              {!isMediaReady && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-bold leading-relaxed text-amber-300">
                  {hasRejectedPage
                    ? "Có trang truyện không đạt kiểm duyệt nên tập chưa thể xuất bản."
                    : "Vui lòng chờ tất cả trang truyện được xử lý xong và có trạng thái APPROVED trước khi xuất bản."}
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

function ComicPagePreview({ page }: { page: any }) {
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
  const hasAnyViolations = hasCopyrightViolations || hasCensorshipViolations;

  return (
    <div className={`relative overflow-hidden rounded-xl border ${hasAnyViolations ? 'border-red-500' : 'border-creator-border'} bg-creator-sidebar shadow-sm group`}>
      <div className="relative aspect-[3/4]">
        {page.image ? (
          <img src={page.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-creator-bg border border-creator-border text-creator-muted text-xs font-black">
            No preview
          </div>
        )}
        <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-[#151A23] text-xs font-black text-white shadow-md">
          {page.displayOrder}
        </span>
        
        {hasAnyViolations && (
          <div className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg">
            <ShieldAlert size={16} />
          </div>
        )}
        
        {hasAnyViolations && (
          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-center items-center text-center overflow-y-auto backdrop-blur-sm z-10">
            <AlertTriangle className="text-red-500 mb-2" size={24} />
            <span className="text-red-400 font-bold text-sm mb-2">Nội dung không đạt kiểm duyệt</span>
            {hasCopyrightViolations && (
              <p className="text-xs text-gray-300 mb-1">
                <span className="font-semibold text-white">Bản quyền:</span> {copyrightViolations.length} vi phạm
              </p>
            )}
            {hasCensorshipViolations && (
              <p className="text-xs text-gray-300">
                <span className="font-semibold text-white">Nội dung:</span> {censorshipViolations.map((item) => item.primaryViolationLabel).filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className={`truncate text-sm font-black ${hasAnyViolations ? 'text-red-400' : 'text-white'}`}>{page.title}</p>
      </div>
    </div>
  );
}
