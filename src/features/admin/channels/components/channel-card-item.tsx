"use client";

import Image from "next/image";
import { useState } from "react";
import type { ChannelSeriesCard } from "../types/channels.types";
import {
  Clock,
  Eye,
  Film,
  Globe,
  BookOpen,
  Star,
  Users,
  BarChart2,
} from "lucide-react";

interface ChannelCardItemProps {
  card: ChannelSeriesCard;
  score?: string | number;
  rank?: number;
  onSelect?: (card: ChannelSeriesCard) => void;
}

export function ChannelCardItem({ card, score, rank, onSelect }: ChannelCardItemProps) {
  const [imageError, setImageError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const formatScore = (rawScore: string | number) => {
    if (typeof rawScore === "string" && rawScore.toLowerCase() === "another_channel") {
      return "Kênh Khác";
    }
    const num = typeof rawScore === "number" ? rawScore : parseFloat(rawScore || "0");
    if (isNaN(num)) return rawScore ? String(rawScore) : "0.0000";
    return num.toFixed(4);
  };

  const isVideo = card.contentType?.toUpperCase() === "VIDEO";
  const formattedScore = score != null ? formatScore(score) : "";
  const isAnotherChannel = formattedScore === "Kênh Khác";

  return (
    <div
      onClick={() => onSelect?.(card)}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-violet-300 cursor-pointer backoffice-dark:border-white/10 backoffice-dark:bg-slate-900/90 backoffice-dark:hover:border-violet-500/50"
    >
      {/* Cover / Banner Image Container */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 backoffice-dark:bg-white/5">
        {card.bannerUrl || card.coverUrl ? (
          <Image
            src={imageError ? "/images/placeholder.png" : (card.bannerUrl || card.coverUrl)}
            alt={card.title || "Series cover"}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-100 to-indigo-50 text-slate-400 backoffice-dark:from-violet-950/40 backoffice-dark:to-indigo-950/40 backoffice-dark:text-white/40">
            {isVideo ? <Film className="h-10 w-10 stroke-[1.5]" /> : <BookOpen className="h-10 w-10 stroke-[1.5]" />}
          </div>
        )}

        {/* Top-Left Corner: AI Score Badge (if score is present) or Rank Badge */}
        {score != null ? (
          <div
            className={`absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-md backdrop-blur-md border border-white/20 ${isAnotherChannel
                ? "bg-gradient-to-r from-emerald-600 to-teal-600"
                : "bg-gradient-to-r from-violet-600 to-indigo-600"
              }`}
          >
            {rank != null && (
              <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[10px] font-black text-slate-950">
                #{rank}
              </span>
            )}
            <BarChart2 className="h-3.5 w-3.5 text-amber-300" />
            <span>{isAnotherChannel ? "Kênh Khác" : `Score: ${formattedScore}`}</span>
          </div>
        ) : (
          rank != null && (
            <div className="absolute top-2.5 left-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white shadow-md border-2 border-white">
              #{rank}
            </div>
          )
        )}

        {/* Top-Right Corner: Rating Badge */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-xs font-bold text-white shadow-sm backdrop-blur-md">
          <Star className="h-3 w-3 fill-current text-white" />
          <span>{card.averageRating != null ? Number(card.averageRating).toFixed(1) : "0.0"}</span>
        </div>

        {/* Bottom-Left Corner: Age Rating & Language overlay */}
        <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5">
          {card.ageRating && (
            <span className="rounded bg-slate-900/75 px-1.5 py-0.5 text-[10px] font-medium text-slate-200 border border-white/20">
              {card.ageRating}
            </span>
          )}
          {card.language && (
            <span className="flex items-center gap-1 rounded bg-slate-900/75 px-1.5 py-0.5 text-[10px] font-medium text-slate-200 border border-white/20">
              <Globe className="h-2.5 w-2.5" />
              {card.language}
            </span>
          )}
        </div>

        {/* Bottom-Right Corner: Content Type Badge (Video / Truyện) */}
        <div className="absolute bottom-2 right-2.5 flex items-center gap-1 rounded-full bg-slate-900/85 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md border border-white/10">
          {isVideo ? (
            <>
              <Film className="h-3 w-3 text-sky-400" />
              <span>Video</span>
            </>
          ) : (
            <>
              <BookOpen className="h-3 w-3 text-amber-400" />
              <span>Truyện</span>
            </>
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title */}
        <h4 className="line-clamp-1 font-bold text-slate-900 transition-colors group-hover:text-violet-600 backoffice-dark:text-white backoffice-dark:group-hover:text-violet-300">
          {card.title || "Chưa có tiêu đề"}
        </h4>

        {/* Description */}
        <p className="mt-1 line-clamp-2 text-xs text-slate-500 min-h-[32px] backoffice-dark:text-white/60">
          {card.description || "Không có mô tả cho series này."}
        </p>

        {/* Creator Info */}
        <div className="mt-3 flex items-center gap-2.5 border-t border-slate-100 pt-3 backoffice-dark:border-white/10">
          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-slate-200 border border-slate-200 backoffice-dark:border-white/10 backoffice-dark:bg-white/10">
            {card.creatorAvatar && !avatarError ? (
              <Image
                src={card.creatorAvatar}
                alt={card.creatorName || "Creator"}
                fill
                className="object-cover"
                onError={() => setAvatarError(true)}
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-violet-100 text-violet-700 text-xs font-bold backoffice-dark:bg-violet-950/50 backoffice-dark:text-violet-300">
                {(card.creatorName || "C").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-xs font-semibold text-slate-800 backoffice-dark:text-white/90">
              {card.creatorName || "Người sáng tạo"}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400 backoffice-dark:text-white/50">
              <Users className="h-3 w-3" />
              {card.totalCreatorFollowers ?? 0} người theo dõi
            </span>
          </div>
        </div>

        {/* Stats & Timestamps Footer */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500 backoffice-dark:border-white/10">
          <div className="flex items-center gap-1 text-slate-600 font-medium backoffice-dark:text-white/70">
            <Eye className="h-3.5 w-3.5 text-slate-400 backoffice-dark:text-white/50" />
            <span>{(card.totalViews ?? 0).toLocaleString()} lượt xem</span>
          </div>

          {/* <div className="flex items-center gap-1 text-slate-400 backoffice-dark:text-white/50" title={`Mới cập nhật: ${formatDate(card.releasedUpdateTime || card.updatedAt)}`}>
            <Clock className="h-3.5 w-3.5" />
            <span className="truncate max-w-[100px]">
              {formatDate(card.releasedUpdateTime || card.updatedAt).split(",")[0]}
            </span>
          </div> */}
        </div>
      </div>
    </div>
  );
}
