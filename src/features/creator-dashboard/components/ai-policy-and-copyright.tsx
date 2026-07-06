import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, AlertTriangle, CheckCircle2, Fingerprint, CircleAlert, Loader2 } from "lucide-react";
import { getMediaViolations } from "@/features/creator-dashboard/api/creator-content-api";

interface AIPolicyAndCopyrightProps {
  mediaId?: string;
}

export function AIPolicyAndCopyright({ mediaId }: AIPolicyAndCopyrightProps) {
  const violationsQuery = useQuery({
    queryKey: ["creator-dashboard", "media-violations", mediaId],
    queryFn: () => getMediaViolations(mediaId!),
    enabled: !!mediaId,
  });

  const violations = violationsQuery.data;
  const censorshipResults = violations?.censorshipResults || [];
  const copyrightViolations = violations?.copyrightViolations || [];
  
  const hasData = !!violations;
  
  const progress = !mediaId ? 0 : (violationsQuery.isLoading ? 50 : 100);
  
  const renderCensorshipLabel = (label: string, isSafe: boolean, confidence: number = 0) => {
    if (!mediaId) {
      return <span className="text-[10px] font-bold px-2 py-1 bg-gray-500/10 text-gray-400 rounded-full border border-gray-500/20">Chưa quét</span>;
    }
    if (violationsQuery.isLoading) {
      return <span className="text-[10px] font-bold px-2 py-1 bg-creator-gold/10 text-creator-gold rounded-full border border-creator-gold/20">Đang chờ...</span>;
    }
    if (isSafe) {
      return <span className="text-[10px] font-bold px-2 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">An toàn</span>;
    }
    return <span className="text-[10px] font-bold px-2 py-1 bg-red-500/10 text-red-400 rounded-full border border-red-500/20">Vi phạm ({Math.round(confidence * 100)}%)</span>;
  };

  const violenceViolation = censorshipResults.find(c => c.primaryViolationLabel?.toLowerCase().includes("violence"));
  const sensitiveViolation = censorshipResults.find(c => c.primaryViolationLabel?.toLowerCase().includes("sensitive") || c.primaryViolationLabel?.toLowerCase().includes("nudity"));
  const policyAlignment = hasData && censorshipResults.length === 0;

  const similarityScore = copyrightViolations.length > 0 ? (copyrightViolations[0].similarityScore! * 100).toFixed(1) : "0.0";
  const hasCopyrightIssue = copyrightViolations.length > 0;

  return (
    <div className="space-y-6 lg:w-96 shrink-0">
      <div className="bg-creator-sidebar border border-creator-border rounded-xl p-6 shadow-xl">
        <h3 className="text-xs font-black uppercase tracking-[0.16em] text-creator-gold mb-6">AI QUÉT CHÍNH SÁCH</h3>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm font-medium text-white">
              <ShieldAlert className="h-4 w-4 text-creator-muted" /> Violence
            </div>
            {renderCensorshipLabel("Violence", !violenceViolation, violenceViolation?.confidenceScore)}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm font-medium text-white">
              <AlertTriangle className="h-4 w-4 text-creator-muted" /> Sensitive Content
            </div>
            {renderCensorshipLabel("Sensitive Content", !sensitiveViolation, sensitiveViolation?.confidenceScore)}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm font-medium text-white">
              <CheckCircle2 className="h-4 w-4 text-creator-muted" /> Policy Alignment
            </div>
            {!mediaId ? (
               <span className="text-[10px] font-bold px-2 py-1 bg-gray-500/10 text-gray-400 rounded-full border border-gray-500/20">Chưa kiểm tra</span>
            ) : violationsQuery.isLoading ? (
               <span className="text-[10px] font-bold px-2 py-1 bg-creator-gold/10 text-creator-gold rounded-full border border-creator-gold/20">Đang quét...</span>
            ) : policyAlignment ? (
               <span className="text-[10px] font-bold px-2 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">Phù hợp</span>
            ) : (
               <span className="text-[10px] font-bold px-2 py-1 bg-red-500/10 text-red-400 rounded-full border border-red-500/20">Vi phạm</span>
            )}
          </div>

          <div className="pt-5 mt-5 border-t border-creator-border">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-creator-muted">Tiến trình quét tổng thể</span>
              <span className="text-creator-gold">{progress}%</span>
            </div>
            <div className="h-1 bg-creator-bg rounded-full overflow-hidden">
              <div className="h-full bg-creator-gold transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-creator-sidebar border border-creator-border rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <ShieldAlert size={100} />
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black uppercase tracking-[0.16em] text-creator-gold">BẢO VỆ BẢN QUYỀN</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-creator-bg border border-creator-border rounded text-creator-muted">Hệ thống MILVUS V2</span>
          </div>

          <div className="aspect-video bg-[#090807] rounded-lg border border-creator-border flex items-center justify-center mb-6">
            <div className="w-12 h-12 rounded-full bg-creator-gold/10 flex items-center justify-center border border-creator-gold/20">
              <Fingerprint className="h-6 w-6 text-creator-gold" />
            </div>
          </div>

          <div className="flex justify-between items-end mb-4">
            <span className="text-sm font-medium text-creator-muted">Chỉ số tương đồng</span>
            <span className="text-2xl font-bold text-white">{!mediaId ? "0%" : `${similarityScore}%`}</span>
          </div>

          {!mediaId ? (
            <div className="p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg flex items-center gap-3 mb-4">
              <CircleAlert className="h-5 w-5 text-gray-400 shrink-0" />
              <span className="text-xs font-bold text-gray-400">Chưa kiểm tra tài nguyên</span>
            </div>
          ) : violationsQuery.isLoading ? (
            <div className="p-3 bg-creator-gold/10 border border-creator-gold/20 rounded-lg flex items-center gap-3 mb-4">
              <Loader2 className="h-5 w-5 text-creator-gold shrink-0 animate-spin" />
              <span className="text-xs font-bold text-creator-gold">Đang kiểm tra bản quyền...</span>
            </div>
          ) : hasCopyrightIssue ? (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 mb-4">
              <CircleAlert className="h-5 w-5 text-red-400 shrink-0" />
              <span className="text-xs font-bold text-red-400">Phát hiện trùng lặp bản quyền</span>
            </div>
          ) : (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 mb-4">
              <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
              <span className="text-xs font-bold text-green-400">Đã xác nhận tài nguyên nguyên bản</span>
            </div>
          )}

          <p className="text-[10px] text-center text-creator-muted max-w-[200px] mx-auto leading-relaxed">
            Vector search engine compared 4M+ existing frames across global databases.
          </p>
        </div>
      </div>
    </div>
  );
}
