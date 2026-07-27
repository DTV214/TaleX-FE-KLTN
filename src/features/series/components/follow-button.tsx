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
        "inline-flex h-10 items-center justify-center rounded-full px-5 py-2 text-sm font-bold transition-all duration-300 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
        isFollowing
          ? isHovered
            ? "border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
            : "border border-white/10 bg-white/10 text-white hover:bg-white/15"
          : "bg-[#D4AF37] text-black hover:scale-[1.03] hover:bg-[#E5C158] hover:shadow-[0_4px_16px_rgba(212,175,55,0.25)]",
        className
      )}
    >
      {isMutating ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <Check className="mr-1.5 h-4 w-4" />
      ) : (
        <Plus className="mr-1.5 h-4 w-4 stroke-[3]" />
      )}

      {isFollowing
        ? isHovered
          ? "Bỏ theo dõi"
          : "Đang theo dõi"
        : "Theo dõi"}
    </button>
  );
}
