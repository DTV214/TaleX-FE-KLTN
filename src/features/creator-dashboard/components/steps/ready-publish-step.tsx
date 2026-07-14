import React from "react";
import { CheckCircle2, Play, Check, BarChart3, ShieldCheck, Activity } from "lucide-react";

interface ReadyPublishStepProps {
  mediaUrl?: string;
  title: string;
  description: string;
  onContinue: () => void;
  onBack: () => void;
}

export function ReadyPublishStep({ mediaUrl, title, description, onContinue, onBack }: ReadyPublishStepProps) {
  return (
    <div className="flex flex-col w-full p-6 text-creator-text">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-500 mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Phân tích thành công</h2>
        <p className="text-creator-muted">Nội dung của bạn đã vượt qua tất cả kiểm tra AI và sẵn sàng chờ xét duyệt cuối cùng.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left - Media Preview Card */}
        <div className="w-full lg:w-1/3">
          <div className="bg-creator-sidebar border border-creator-border rounded-xl overflow-hidden relative group">
            {/* Aspect Ratio container for preview */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
              {mediaUrl ? (
                <img src={mediaUrl} alt="Media Preview" className="w-full h-full object-cover opacity-60" />
              ) : (
                <div className="text-creator-muted text-sm">Xem trước phương tiện</div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-creator-gold/90 text-black flex items-center justify-center pl-1 group-hover:scale-110 transition-transform cursor-pointer">
                  <Play size={20} className="fill-current" />
                </div>
              </div>
            </div>
            
            <div className="p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="font-bold text-white line-clamp-2">{title || "Untitled Episode"}</h3>
                <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider bg-green-500/10 text-green-500 border border-green-500/20 uppercase">
                  <ShieldCheck size={12} /> Verified
                </span>
              </div>
              <p className="text-sm text-creator-muted line-clamp-2">{description || "No description provided."}</p>
            </div>
          </div>
        </div>

        {/* Right - Analysis Results */}
        <div className="flex-1 space-y-6">
          <h3 className="text-xl font-bold text-white">Kết quả phân tích AI</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Policy Check */}
            <div className="bg-creator-sidebar border border-creator-border rounded-xl p-5">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                <CheckCircle2 size={20} />
              </div>
              <h4 className="font-semibold text-white mb-1">Chính sách nội dung</h4>
              <p className="text-sm text-creator-muted mb-4">Không phát hiện vi phạm nguyên tắc cộng đồng.</p>
              <div className="w-full bg-creator-bg rounded-full h-1.5 mb-1">
                <div className="bg-blue-500 h-1.5 rounded-full w-full"></div>
              </div>
              <div className="text-xs text-right text-creator-muted mt-2">Đạt 100%</div>
            </div>

            {/* Copyright */}
            <div className="bg-creator-sidebar border border-creator-border rounded-xl p-5">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
                <ShieldCheck size={20} />
              </div>
              <h4 className="font-semibold text-white mb-1">Bảo vệ bản quyền</h4>
              <p className="text-sm text-creator-muted mb-4">Xác minh nội dung gốc. Không có sự trùng lặp.</p>
              <div className="w-full bg-creator-bg rounded-full h-1.5 mb-1">
                <div className="bg-purple-500 h-1.5 rounded-full w-full"></div>
              </div>
              <div className="text-xs text-right text-creator-muted mt-2">Trùng khớp 0%</div>
            </div>

            {/* Quality Analysis */}
            <div className="bg-creator-sidebar border border-creator-border rounded-xl p-5">
              <div className="w-10 h-10 rounded-full bg-creator-gold/10 text-creator-gold flex items-center justify-center mb-4">
                <Activity size={20} />
              </div>
              <h4 className="font-semibold text-white mb-1">Điểm chất lượng</h4>
              <p className="text-sm text-creator-muted mb-4">Độ phân giải cao và bitrate tối ưu.</p>
              <div className="w-full bg-creator-bg rounded-full h-1.5 mb-1">
                <div className="bg-creator-gold h-1.5 rounded-full w-[95%]"></div>
              </div>
              <div className="text-xs text-right text-creator-muted mt-2">Tuyệt vời</div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-8">
            <button 
              onClick={onBack}
              className="px-6 py-2.5 rounded-md text-sm font-medium text-creator-muted hover:text-white transition-colors"
            >
              Back
            </button>
            <button 
              onClick={onContinue}
              className="px-6 py-2.5 rounded-md text-sm font-medium bg-creator-gold text-black hover:bg-creator-gold-hover transition-colors flex items-center gap-2"
            >
              Final Review
              <Check size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
