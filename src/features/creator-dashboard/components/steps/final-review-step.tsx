import React, { useState, useEffect } from "react";
import { Check, Edit3, MessageSquare, AlertCircle, Eye, Rocket, X, Calendar, EyeOff, ShieldAlert, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMediaViolations } from "@/features/creator-dashboard/api/creator-content-api";
import { AIPolicyAndCopyright } from "@/features/creator-dashboard/components/ai-policy-and-copyright";

interface FinalReviewStepProps {
  mediaId?: string;
  mediaUrl?: string;
  isPublishing?: boolean;
  onPublish: () => void;
  onSchedulePublish: () => void;
  onSaveDraft: () => void;
  onBack: () => void;
  // New props for updating/hiding
  selectedEpisode: any; // We'll type this as any to avoid importing EpisodeRow if not needed, or we can import it.
  onSaveEpisode: (episode: any) => void;
  isSavingEpisode: boolean;
  onHideEpisode: (episode: any) => void;
  isHidingEpisode: boolean;
}

export function FinalReviewStep({ 
  mediaId,
  mediaUrl, 
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
}: FinalReviewStepProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [reviewerNotes, setReviewerNotes] = useState("");
  
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
    }
  }, [selectedEpisode]);

  const isPublished = selectedEpisode?.status === "PUBLISHED";

  const violationsQuery = useQuery({
    queryKey: ["creator-dashboard", "media-violations", mediaId],
    queryFn: () => getMediaViolations(mediaId!),
    enabled: !!mediaId,
  });

  const violations = violationsQuery.data;
  const hasCopyrightViolations = violations?.copyrightViolations && violations.copyrightViolations.length > 0;
  const hasCensorshipViolations = violations?.censorshipResults && violations.censorshipResults.length > 0;
  const hasAnyViolations = hasCopyrightViolations || hasCensorshipViolations;

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto p-6 text-creator-text">
      {/* Left - Video Preview & Episode Details */}
      <div className="flex-1 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">{isPublished ? "Published Episode" : "Final Review & Publishing Decision"}</h2>
          <p className="text-sm text-creator-muted">
            {isPublished ? "This episode is currently live on TaleX." : "Review your content before making it public on TaleX."}
          </p>
        </div>

        <div className="bg-creator-sidebar border border-creator-border rounded-xl p-5 mt-8">
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
                  <span>Phát hiện vi phạm chính sách</span>
                </div>
                <div className="text-xs text-gray-300 space-y-2">
                  {hasCopyrightViolations && (
                    <div>
                      <span className="font-semibold text-white">Bản quyền: </span>
                      Đã phát hiện {violations.copyrightViolations.length} vi phạm bản quyền. Vui lòng kiểm tra lại nội dung.
                    </div>
                  )}
                  {hasCensorshipViolations && (
                    <div>
                      <span className="font-semibold text-white">Nội dung không phù hợp: </span>
                      {violations.censorshipResults.map(c => c.primaryViolationLabel).join(", ")}
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
        <div className="bg-creator-sidebar border border-creator-border rounded-xl p-6 shadow-xl mb-6">
          <h3 className="text-lg font-bold text-white mb-6">Chi tiết Tập</h3>
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

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => onSaveEpisode({ ...selectedEpisode, ...editForm })}
                disabled={isSavingEpisode}
                className="px-6 py-2.5 bg-creator-bg border border-creator-border text-white text-sm font-bold rounded hover:bg-white/10 shrink-0 disabled:opacity-50"
              >
                {isSavingEpisode ? "Saving..." : "Save Details"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right - Pipeline & Actions */}
      <div className="w-full lg:w-96 space-y-6">
        <AIPolicyAndCopyright mediaId={mediaId} />

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
              <button 
                onClick={onPublish}
                disabled={!agreedToTerms || isPublishing}
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
                disabled={!agreedToTerms || isPublishing}
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
