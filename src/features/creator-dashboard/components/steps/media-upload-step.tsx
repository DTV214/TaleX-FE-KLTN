import React, { useState } from "react";
import { Upload, CheckCircle2, Shield, AlertTriangle, FileVideo, Plus, Check } from "lucide-react";
import { ResumableVideoUploader } from "@/features/creator-dashboard/components/resumable-video-uploader";

interface MediaUploadStepProps {
  contentType: "COMIC" | "VIDEO";
  episodeId: string;
  onContinue: () => void;
  onBack: () => void;
  // AI Moderation status
  aiStatus: "PENDING" | "PROCESSING" | "APPROVED" | "REJECTED";
  progress?: number;
}

export function MediaUploadStep({ 
  contentType, 
  episodeId, 
  onContinue, 
  onBack,
  aiStatus,
  progress = 0
}: MediaUploadStepProps) {
  const [uploaded, setUploaded] = useState(false);

  const isApproved = aiStatus === "APPROVED";
  const isRejected = aiStatus === "REJECTED";
  const isProcessing = aiStatus === "PROCESSING" || aiStatus === "PENDING";

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto p-6 text-creator-text">
      {/* Left Column - Upload Workspace */}
      <div className="flex-1 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Media Upload & AI Moderation</h2>
          <p className="text-sm text-creator-muted">Upload your content and wait for our AI to verify policy compliance.</p>
        </div>

        <div className="bg-creator-sidebar border border-creator-border rounded-xl p-6 mt-8">
          <h3 className="font-semibold text-white mb-4">Upload Workspace</h3>
          
          {!uploaded ? (
            contentType === "VIDEO" ? (
              <div className="border-2 border-dashed border-creator-border hover:border-creator-gold/50 rounded-xl p-8 transition-colors">
                 <ResumableVideoUploader 
                    episodeId={episodeId} 
                    onCompleted={() => setUploaded(true)} 
                 />
              </div>
            ) : (
              <div className="border-2 border-dashed border-creator-border hover:border-creator-gold/50 rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                <div className="w-16 h-16 bg-creator-bg rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload size={28} className="text-creator-gold" />
                </div>
                <h4 className="text-lg font-medium text-white mb-2">Drag & Drop Comic Pages</h4>
                <p className="text-sm text-creator-muted max-w-sm">
                  Support JPG, PNG, WEBP. Maximum 20MB per page. You can upload multiple pages at once.
                </p>
                <button 
                  className="mt-6 px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-md text-sm font-medium transition-colors border border-creator-border"
                  onClick={() => setUploaded(true)} // Mocking upload for preview
                >
                  Browse Files
                </button>
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-creator-bg border border-creator-border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-creator-gold/10 text-creator-gold rounded flex items-center justify-center">
                    <FileVideo size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">episode_master_final.mp4</h4>
                    <p className="text-xs text-creator-muted">1.2 GB • 1080p HD</p>
                  </div>
                </div>
                {isProcessing ? (
                  <div className="text-right">
                    <div className="text-sm font-medium text-creator-gold mb-1">{progress}% Uploaded</div>
                    <div className="w-32 h-1.5 bg-creator-sidebar rounded-full overflow-hidden">
                      <div className="h-full bg-creator-gold" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                    <CheckCircle2 size={16} /> Upload Complete
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setUploaded(false)}
                className="text-sm text-creator-muted hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Plus size={14} /> Upload new file
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - AI Moderation */}
      <div className="w-full lg:w-96 space-y-6">
        <div className="bg-creator-sidebar border border-creator-border rounded-xl overflow-hidden">
          <div className="p-5 border-b border-creator-border">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Shield size={18} className="text-creator-gold" /> AI Verification Status
            </h3>
          </div>
          
          <div className="p-5 space-y-6">
            {/* Radar Graphic Mockup */}
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-creator-border opacity-20"></div>
              <div className="absolute inset-4 rounded-full border border-creator-border opacity-40"></div>
              <div className="absolute inset-8 rounded-full border border-creator-border opacity-60"></div>
              <div className="absolute inset-12 rounded-full border border-creator-gold border-dashed animate-[spin_10s_linear_infinite]"></div>
              <Shield size={32} className={isApproved ? "text-green-500" : isRejected ? "text-red-500" : "text-creator-gold"} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-creator-bg border border-creator-border">
                <span className="text-sm font-medium text-white">Policy Scan</span>
                {isProcessing ? (
                  <span className="text-xs font-bold text-creator-gold animate-pulse">SCANNING...</span>
                ) : isApproved ? (
                  <CheckCircle2 size={16} className="text-green-500" />
                ) : (
                  <AlertTriangle size={16} className="text-red-500" />
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-creator-bg border border-creator-border">
                <span className="text-sm font-medium text-white">Copyright Guard</span>
                {isProcessing ? (
                  <span className="text-xs font-bold text-creator-gold animate-pulse">VERIFYING...</span>
                ) : isApproved ? (
                  <CheckCircle2 size={16} className="text-green-500" />
                ) : (
                  <AlertTriangle size={16} className="text-red-500" />
                )}
              </div>
            </div>

            {isApproved && (
              <div className="p-3 rounded bg-green-500/10 border border-green-500/20 text-green-500 text-xs text-center">
                All checks passed. Ready for review.
              </div>
            )}
            
            {isRejected && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center">
                Violations detected. Please review and re-upload.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={onContinue}
            disabled={!isApproved}
            className="w-full py-2.5 rounded-md text-sm font-medium bg-creator-gold text-black hover:bg-creator-gold-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Analysis
            <Check size={16} />
          </button>
          
          <button 
            onClick={onBack}
            className="w-full py-2.5 rounded-md text-sm font-medium text-creator-muted hover:text-white transition-colors"
          >
            Back to Structure
          </button>
        </div>
      </div>
    </div>
  );
}
