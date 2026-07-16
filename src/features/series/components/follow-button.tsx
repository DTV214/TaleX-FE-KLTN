"use client";

import { Loader2, Plus, Check } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { useState } from "react";

interface FollowButtonProps {
  isFollowing: boolean;
  onFollowToggle: () => void;
  isLoading?: boolean;
  isMutating?: boolean;
  className?: string;
}

export function FollowButton({
  isFollowing,
  onFollowToggle,
  isLoading,
  isMutating,
  className,
}: FollowButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onFollowToggle();
      }}
      disabled={isLoading || isMutating}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-black tracking-wide transition-all duration-300 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        isFollowing
          ? isHovered
            ? "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
            : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
          : "bg-[#D4AF37] text-black hover:bg-[#E5C158] hover:shadow-[0_4px_16px_rgba(212,175,55,0.25)] hover:scale-[1.03]",
        className
      )}
    >
      {isMutating ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
      ) : isFollowing ? (
        <Check className="w-3.5 h-3.5 mr-1" />
      ) : (
        <Plus className="w-3.5 h-3.5 mr-1 stroke-[3]" />
      )}

      {isFollowing
        ? isHovered
          ? "Bỏ theo dõi"
          : "Đang theo dõi"
        : "Theo dõi"}
    </button>
  );
}
