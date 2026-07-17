"use client";

import { Loader2, Bookmark } from "lucide-react";
import { useEpisodeBookmarks } from "../hooks/use-episode-bookmarks";
import { cn } from "@/shared/utils/utils";

interface EpisodeBookmarkButtonProps {
  episodeId: string;
  contentType?: "VIDEO" | "COMIC" | string;
  className?: string;
}

export function EpisodeBookmarkButton({
  episodeId,
  contentType,
  className,
}: EpisodeBookmarkButtonProps) {
  const { isBookmarked, toggleBookmark, isMutating } = useEpisodeBookmarks(episodeId, contentType);

  const mediaLabel = contentType === "COMIC" ? "tập truyện" : "tập phim";

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleBookmark();
      }}
      disabled={isMutating}
      title={isBookmarked ? "Xóa khỏi bookmark" : `Lưu ${mediaLabel}`}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all duration-300 active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shrink-0",
        isBookmarked && "border-[#D4AF37]/30 bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10",
        className
      )}
    >
      {isMutating ? (
        <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
      ) : (
        <Bookmark
          className={cn(
            "w-4 h-4 transition-all duration-300",
            isBookmarked
              ? "fill-[#D4AF37] text-[#D4AF37] scale-110"
              : "text-gray-400 group-hover:text-white"
          )}
        />
      )}
    </button>
  );
}
