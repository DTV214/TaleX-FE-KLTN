"use client";

import React from "react";
import { Star, Trash2, Film, Loader2 } from "lucide-react";
import { useGetMyRatings, useDeleteSeriesRating } from "../hooks/use-series-ratings";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function MyRatingsView() {
  const router = useRouter();
  const { data: myRatingsData, isLoading, isError } = useGetMyRatings({ page: 0, size: 50 });
  const deleteMutation = useDeleteSeriesRating();

  const ratingsList = myRatingsData?.content || [];

  return (
    <div className="w-full space-y-8 text-white">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.15)]">
            <Star className="h-6 w-6 fill-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              Danh Sách Tác Phẩm Đã Đánh Giá
            </h1>
          </div>
        </div>

        {ratingsList.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#18181c]/90 px-4 py-2 text-xs font-bold text-gray-300 backdrop-blur-md self-start md:self-auto">
            Tổng cộng: <strong className="text-[#D4AF37] font-extrabold">{ratingsList.length}</strong> tác phẩm
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#D4AF37]" />
          <p className="text-sm font-semibold text-gray-400 animate-pulse">
            Đang tải danh sách đánh giá...
          </p>
        </div>
      ) : isError ? (
        <div className="mx-auto max-w-lg rounded-3xl border border-red-500/20 bg-[#18181c]/80 p-8 text-center backdrop-blur-md">
          <p className="mb-3 text-sm font-bold text-red-400">Không thể tải danh sách đánh giá.</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-white/10 px-5 py-2 text-xs font-bold text-white transition hover:bg-white/20"
          >
            Tải lại trang
          </button>
        </div>
      ) : ratingsList.length === 0 ? (
        <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-[#18181c]/60 p-12 text-center backdrop-blur-md shadow-2xl space-y-3">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-gray-500 border border-white/5">
            <Star className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Bạn chưa đánh giá tác phẩm nào</h3>
          <p className="mx-auto mt-1.5 max-w-xs text-xs text-gray-400 leading-relaxed">
            Hãy khám phá các tác phẩm trên TaleX và chia sẻ cảm nhận bằng cách chấm điểm 5 sao nhé!
          </p>
          <Link
            href="/series"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#D4AF37] hover:bg-[#E5C158] px-6 py-2.5 text-xs font-extrabold text-black transition-all shadow-[0_4px_20px_rgba(212,175,55,0.25)] hover:scale-105"
          >
            Khám phá nội dung
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {ratingsList.map((item) => (
            <div
              key={item.ratingId || item.seriesId}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#18181c]/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-[#D4AF37]/50 hover:shadow-[0_8px_30px_rgba(212,175,55,0.12)] hover:-translate-y-1"
            >
              {/* Cover Image */}
              <div
                onClick={() => router.push(`/series/${item.seriesId}`)}
                className="relative aspect-[3/4] w-full cursor-pointer overflow-hidden bg-black/60"
              >
                {item.seriesCoverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.seriesCoverUrl}
                    alt={item.seriesTitle || "Series"}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-600">
                    <Film size={36} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                {/* Rating Badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/75 px-3 py-1 text-xs font-black text-[#D4AF37] border border-[#D4AF37]/35 backdrop-blur-md shadow-md">
                  <Star size={12} className="fill-[#D4AF37] text-[#D4AF37]" /> {(item.rate || 0).toFixed(1)}
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                <div>
                  <h4
                    onClick={() => router.push(`/series/${item.seriesId}`)}
                    className="font-bold text-white text-sm line-clamp-1 group-hover:text-[#D4AF37] cursor-pointer transition-colors"
                  >
                    {item.seriesTitle || `Series ID: ${item.seriesId.substring(0, 8)}...`}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-1 font-medium">
                    Đã đánh giá: {new Date(item.updatedAt || item.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#D4AF37]">
                    {item.rate} / 5.0 ⭐
                  </span>
                  <button
                    onClick={() => deleteMutation.mutate(item.seriesId)}
                    disabled={deleteMutation.isPending}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer hover:underline disabled:opacity-50"
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
