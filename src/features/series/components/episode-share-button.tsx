"use client";

import { Share2, Loader2 } from "lucide-react";
import { useEpisodeShares } from "../hooks/use-episode-shares";
import { cn } from "@/shared/utils/utils";

interface EpisodeShareButtonProps {
  episodeId: string;
  contentType?: "VIDEO" | "COMIC" | string;
  variant?: "icon" | "pill";
  className?: string;
}

export function EpisodeShareButton({
  episodeId,
  contentType,
  variant = "icon",
  className,
}: EpisodeShareButtonProps) {
  const { share, isSharing } = useEpisodeShares(episodeId, contentType);

  const mediaLabel = contentType === "COMIC" ? "tập truyện" : "tập phim";

  if (variant === "pill") {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          share();
        }}
        disabled={isSharing}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-bold transition-all duration-300 cursor-pointer relative overflow-hidden select-none active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed bg-white/[0.04] border-white/10 text-white hover:bg-white/[0.08] hover:border-white/20 shrink-0",
          className
        )}
      >
        {isSharing ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
        ) : (
          <Share2 className="w-4 h-4 text-gray-300" />
        )}
        <span className="font-bold text-xs tracking-wider">CHIA SẺ</span>
      </button>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        share();
      }}
      disabled={isSharing}
      title={`Chia sẻ ${mediaLabel}`}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all duration-300 active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shrink-0",
        className
      )}
    >
      {isSharing ? (
        <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
      ) : (
        <Share2 className="w-4 h-4 text-gray-400 group-hover:text-white" />
      )}
    </button>
  );
}
