"use client";

import React from "react";
import { Star, Trash2, BookOpen, Film, Loader2 } from "lucide-react";
import { useGetMyRatings, useDeleteSeriesRating } from "../hooks/use-series-ratings";
import { useRouter } from "next/navigation";

export function MyRatingsView() {
  const router = useRouter();
  const { data: myRatingsData, isLoading } = useGetMyRatings({ page: 0, size: 50 });
  const deleteMutation = useDeleteSeriesRating();

  const ratingsList = myRatingsData?.content || [];

  return (
    <div className="w-full space-y-6 py-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Star className="fill-amber-400 text-amber-400" size={24} /> Tác phẩm tôi đã đánh giá
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Danh sách các bộ truyện tranh và phim ngắn bạn đã để lại điểm đánh giá.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center gap-2 text-zinc-400">
          <Loader2 className="animate-spin text-amber-400" size={20} /> Đang tải danh sách đánh giá...
        </div>
      ) : ratingsList.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center text-zinc-400 space-y-3">
          <Star size={40} className="mx-auto text-zinc-600" />
          <p className="font-semibold text-white">Bạn chưa đánh giá tác phẩm nào</p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Hãy khám phá các tác phẩm trên TaleX và chia sẻ cảm nhận bằng cách chấm điểm 5 sao nhé!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {ratingsList.map((item) => (
            <div
              key={item.ratingId || item.seriesId}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80 shadow-lg transition-all hover:border-amber-500/40 hover:-translate-y-1"
            >
              {/* Cover Image */}
              <div
                onClick={() => router.push(`/series/${item.seriesId}`)}
                className="relative aspect-[3/4] w-full cursor-pointer overflow-hidden bg-zinc-900"
              >
                {item.seriesCoverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.seriesCoverUrl}
                    alt={item.seriesTitle || "Series"}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-600">
                    <Film size={36} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Rating Badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-black text-amber-400 border border-amber-500/30 backdrop-blur-md">
                  <Star size={12} className="fill-amber-400 text-amber-400" /> {(item.rate || 0).toFixed(1)}
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                <div>
                  <h4
                    onClick={() => router.push(`/series/${item.seriesId}`)}
                    className="font-bold text-white line-clamp-1 hover:text-amber-400 cursor-pointer transition-colors"
                  >
                    {item.seriesTitle || `Series ID: ${item.seriesId.substring(0, 8)}...`}
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Đã đánh giá: {new Date(item.updatedAt || item.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">
                    {item.rate} / 5.0 ⭐
                  </span>
                  <button
                    onClick={() => deleteMutation.mutate(item.seriesId)}
                    disabled={deleteMutation.isPending}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={12} /> Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
