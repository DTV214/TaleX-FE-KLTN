"use client";

import React, { useState } from "react";
import { Star, Trash2, Loader2, Sparkles } from "lucide-react";
import { useRateSeries, useDeleteSeriesRating, useGetMyRatings } from "../hooks/use-series-ratings";

interface InteractiveStarRatingProps {
  seriesId: string;
  averageRating?: number;
  totalRatingsCount?: number;
  className?: string;
  variant?: "card" | "inline";
}

export function InteractiveStarRating({
  seriesId,
  averageRating = 0,
  totalRatingsCount = 0,
  className = "",
  variant = "inline",
}: InteractiveStarRatingProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  // Fetch my ratings to find if I already rated this series
  const { data: myRatingsData } = useGetMyRatings({ page: 0, size: 100 });
  const myRatingItem = myRatingsData?.content?.find((item) => item.seriesId === seriesId);
  const myRating = myRatingItem?.rate ?? null;

  const rateMutation = useRateSeries();
  const deleteMutation = useDeleteSeriesRating();

  const handleRate = (starValue: number) => {
    rateMutation.mutate({ seriesId, rate: starValue });
  };

  const handleDelete = () => {
    deleteMutation.mutate(seriesId);
  };

  const isPending = rateMutation.isPending || deleteMutation.isPending;

  const getHoverLabel = (star: number) => {
    switch (star) {
      case 1:
        return "1.0 - Rất dở";
      case 2:
        return "2.0 - Tạm được";
      case 3:
        return "3.0 - Khá hay";
      case 4:
        return "4.0 - Rất hay";
      case 5:
        return "5.0 - Tuyệt phẩm!";
      default:
        return "";
    }
  };

  if (variant === "inline") {
    return (
      <div
        className={`h-12 inline-flex items-center gap-3 px-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md hover:border-[#D4AF37]/40 transition-all ${className}`}
      >
        {/* Rating score badge */}
        <div className="flex items-center gap-1.5">
          <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37] drop-shadow-[0_0_6px_rgba(212,175,55,0.5)]" />
          <span className="text-sm font-black text-[#D4AF37]">
            {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
          </span>
          <span className="text-[11px] text-zinc-500 font-semibold">/ 5.0</span>
          {totalRatingsCount > 0 && (
            <span className="text-[11px] text-zinc-400 font-medium">
              ({totalRatingsCount.toLocaleString("vi-VN")})
            </span>
          )}
        </div>

        {/* 5-Star Interactive Buttons */}
        <div className="flex items-center gap-0.5 border-l border-white/10 pl-3">
          {[1, 2, 3, 4, 5].map((star) => {
            const activeStar = hoveredStar ?? myRating ?? 0;
            const isFilled = activeStar >= star;

            return (
              <button
                key={star}
                type="button"
                disabled={isPending}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(null)}
                onClick={() => handleRate(star)}
                className="group p-0.5 transition-transform hover:scale-125 focus:outline-none disabled:opacity-50"
                title={`Đánh giá ${star} sao`}
              >
                <Star
                  size={18}
                  className={`transition-all duration-200 ${
                    isFilled
                      ? "fill-[#D4AF37] text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.7)]"
                      : "text-zinc-600 hover:text-amber-400/60"
                  }`}
                />
              </button>
            );
          })}

          {isPending && <Loader2 size={14} className="animate-spin text-amber-400 ml-1.5" />}
        </div>

        {/* Status text or Delete button */}
        {hoveredStar ? (
          <span className="text-[11px] text-amber-300 font-bold ml-1 animate-pulse">
            {getHoverLabel(hoveredStar)}
          </span>
        ) : myRating !== null ? (
          <div className="flex items-center gap-2 border-l border-white/10 pl-2">
            <span className="text-[11px] text-emerald-400 font-bold">
              ✓ Đã chấm {myRating.toFixed(1)} ⭐
            </span>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-zinc-500 hover:text-rose-400 transition-colors"
              title="Xóa đánh giá"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-white/10 bg-zinc-950/80 p-4 backdrop-blur-md space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <Sparkles size={13} className="text-amber-400" /> Đánh giá từ khán giả
        </span>
        {myRating !== null && (
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex items-center gap-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 hover:underline disabled:opacity-50 transition-colors"
            title="Xóa đánh giá của bạn"
          >
            <Trash2 size={12} /> Xóa đánh giá
          </button>
        )}
      </div>

      {/* Main Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Score Display */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-black text-[#D4AF37] leading-none">
            {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
          </span>
          <span className="text-xs font-bold text-zinc-500">/ 5.0</span>
          {totalRatingsCount > 0 && (
            <span className="text-xs text-zinc-400 font-medium ml-1">
              ({totalRatingsCount.toLocaleString("vi-VN")} lượt)
            </span>
          )}
        </div>

        {/* 5-Star Interactive Bar */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const activeStar = hoveredStar ?? myRating ?? 0;
            const isFilled = activeStar >= star;

            return (
              <button
                key={star}
                type="button"
                disabled={isPending}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(null)}
                onClick={() => handleRate(star)}
                className="group p-1 transition-transform hover:scale-125 focus:outline-none disabled:opacity-50"
                title={`Đánh giá ${star} sao`}
              >
                <Star
                  size={22}
                  className={`transition-all duration-200 ${
                    isFilled
                      ? "fill-[#D4AF37] text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.7)]"
                      : "text-zinc-600 hover:text-amber-400/60"
                  }`}
                />
              </button>
            );
          })}

          {isPending && <Loader2 size={16} className="animate-spin text-amber-400 ml-2" />}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-[11px] font-medium text-zinc-400 pt-1 border-t border-white/5">
        {hoveredStar ? (
          <span className="text-amber-300 font-bold animate-pulse">
            ★ {getHoverLabel(hoveredStar)}
          </span>
        ) : myRating !== null ? (
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            ✓ Bạn đã đánh giá: <strong className="text-amber-400 font-black">{myRating.toFixed(1)} ⭐</strong>
          </span>
        ) : (
          <span className="text-zinc-400">Rê chuột và chọn sao để gửi đánh giá của bạn</span>
        )}
      </div>
    </div>
  );
}
