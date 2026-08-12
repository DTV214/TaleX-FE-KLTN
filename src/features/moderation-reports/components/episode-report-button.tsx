"use client";

import { Flag } from "lucide-react";
import { ReportDialog } from "./report-dialog";

export function EpisodeReportButton({ episodeId }: { episodeId: string }) {
  return (
    <div className="fixed bottom-5 right-5 z-50">
      <ReportDialog
        targetType="EPISODE"
        targetId={episodeId}
        targetLabel="Tập nội dung đang xem"
      >
        <span className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-zinc-950/85 px-4 text-xs font-black text-zinc-200 shadow-xl shadow-black/40 backdrop-blur transition hover:border-[#D4AF37]/50 hover:bg-[#D4AF37] hover:text-black">
          <Flag className="h-4 w-4" />
          Báo cáo
        </span>
      </ReportDialog>
    </div>
  );
}
