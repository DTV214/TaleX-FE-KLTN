"use client";

import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/utils/utils";

interface LikeButtonProps {
  isLiked: boolean;
  likeCount: number;
  onLikeToggle: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function LikeButton({
  isLiked,
  likeCount,
  onLikeToggle,
  isLoading = false,
  className,
}: LikeButtonProps) {
  const handlePress = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;
    await onLikeToggle();
  };

  return (
    <button
      onClick={handlePress}
      disabled={isLoading}
      className={cn(
        "flex items-center gap-2.5 px-5 py-2.5 rounded-full border text-sm font-bold transition-all duration-300 cursor-pointer relative overflow-hidden select-none active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed",
        isLiked
          ? "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20"
          : "bg-white/[0.04] border-white/10 text-white hover:bg-white/[0.08] hover:border-white/20",
        className,
      )}
    >
      <div className="relative flex items-center justify-center">
        <Heart
          className={cn(
            "w-4 h-4 transition-all duration-300",
            isLiked ? "fill-red-500 scale-110 text-red-500" : "text-gray-300",
          )}
        />

        {/* Hiệu ứng Heart pop bung nổ nhẹ */}
        <AnimatePresence>
          {isLiked && (
            <motion.span
              initial={{ scale: 0.6, opacity: 0.8 }}
              animate={{ scale: 2.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute w-4 h-4 bg-red-500 rounded-full pointer-events-none z-10"
            />
          )}
        </AnimatePresence>
      </div>

      <span className="font-bold text-xs tracking-wider">
        {isLiked ? "ĐÃ THÍCH" : "YÊU THÍCH"}
      </span>

      <span
        className={cn(
          "px-2 py-0.5 rounded-md text-[10px] font-black border transition-all duration-300",
          isLiked
            ? "bg-red-500/20 border-red-500/30 text-red-500"
            : "bg-white/10 border-white/5 text-gray-300",
        )}
      >
        {likeCount.toLocaleString("vi-VN")}
      </span>
    </button>
  );
}
