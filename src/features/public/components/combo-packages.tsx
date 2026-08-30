"use client";

import { Check, ChevronRight, HelpCircle, Loader2, Sparkles, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  type PublicCombo,
  type PublicComboEpisode,
} from "@/features/public/api/public-content.api";
import { useGetPublicCombos } from "@/features/public/hooks/use-public-combos";
import { ComboDetailModal } from "@/features/public/components/combo-detail-modal";

function getHighlightComboId(combos: PublicCombo[]) {
  if (combos.length === 0) return "";
  return combos.reduce((current, combo) =>
    combo.priceVnd > current.priceVnd ? combo : current,
  ).comboId;
}

export function ComboCard({
  combo,
  isPopular,
  returnTo,
}: {
  combo: PublicCombo;
  isPopular?: boolean;
  returnTo?: string;
}) {
  const router = useRouter();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const originalPrice = combo.originalPriceVnd ?? combo.priceVnd;
  const discountPercentage =
    originalPrice > combo.priceVnd
      ? Math.round(((originalPrice - combo.priceVnd) / originalPrice) * 100)
      : 0;
  const isPurchasable = combo.priceVnd > 0;
  const episodeCount = combo.episodes?.length ?? 0;

  function handlePurchase() {
    if (isNavigating) return;
    setIsNavigating(true);
    const seriesId = combo.episodes?.[0]?.seriesId;
    const resolvedReturnTo = returnTo || (seriesId ? `/series/${seriesId}` : undefined);
    const params = new URLSearchParams({
      itemId: combo.comboId,
      itemType: "COMBO",
      title: combo.title,
      ...(resolvedReturnTo ? { returnTo: resolvedReturnTo } : {}),
    });
    router.push(`/checkout-content?${params.toString()}`);
  }

  return (
    <>
      <div
        key={combo.comboId}
        className="relative flex flex-col justify-between rounded-2xl border border-white/10 bg-[#161619] p-5 sm:p-6 shadow-xl transition-all duration-300 hover:border-[#D4AF37]/50 hover:shadow-[0_0_24px_rgba(212,175,55,0.08)] group hover:-translate-y-1"
      >
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.08),transparent_40%)] rounded-2xl" />

        <div className="relative z-10 space-y-4">
          {/* Title & Short Description */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3
                title={combo.title}
                className="font-bold text-base sm:text-lg text-white group-hover:text-[#D4AF37] transition-colors duration-200 truncate"
              >
                {combo.title}
              </h3>
              <div className="flex items-center gap-1.5">
                {discountPercentage > 0 && (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-black text-red-400 whitespace-nowrap">
                    Tiết kiệm {discountPercentage}%
                  </span>
                )}
              </div>
            </div>
            <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed min-h-[2rem]">
              {combo.description || "Mở khóa combo nội dung với mức giá ưu đãi trên TaleX."}
            </p>
          </div>

          {/* Quick info & Episode list preview */}
          {combo.episodes && combo.episodes.length > 0 ? (
            <div className="space-y-2 pt-1 border-t border-white/5">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#D4AF37]">
                <span>Bao gồm {episodeCount} tập:</span>
              </div>
              <div className="space-y-1.5">
                {combo.episodes.slice(0, 3).map((ep, idx) => (
                  <div
                    key={ep.episodeId || idx}
                    className="flex items-center gap-2 text-xs text-gray-300 font-medium truncate"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" />
                    <span className="truncate">
                      {ep.episodeNumber != null ? `Tập ${ep.episodeNumber}: ` : ""}
                      {ep.title}
                    </span>
                  </div>
                ))}
                {combo.episodes.length > 3 && (
                  <p className="text-[10px] text-gray-500 italic pl-3.5">
                    + {combo.episodes.length - 3} tập khác...
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/5 px-2.5 py-1 text-[11px] font-bold text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                {episodeCount} tập trong gói
              </span>
            </div>
          )}

          {/* Price */}
          <div className="pt-2 border-t border-white/5 flex items-baseline justify-between">
            <div>
              {originalPrice > combo.priceVnd && (
                <p className="text-[11px] font-bold text-slate-500 line-through">
                  {originalPrice.toLocaleString("vi-VN")} đ
                </p>
              )}
              <p className="text-xl sm:text-2xl font-black text-[#D4AF37]">
                {(combo.priceVnd || 0).toLocaleString("vi-VN")} đ
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsDetailOpen(true)}
              className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-white/5"
            >
              <span>Chi tiết</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="relative z-10 grid grid-cols-2 gap-2.5 mt-5">
          <button
            type="button"
            onClick={() => setIsDetailOpen(true)}
            className="w-full rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/10 py-2.5 text-xs font-bold text-gray-200 transition-all cursor-pointer hover:text-white"
          >
            Xem gói
          </button>
          <button
            type="button"
            onClick={handlePurchase}
            disabled={!isPurchasable || isNavigating}
            className="w-full rounded-xl bg-[#D4AF37] hover:bg-[#F3CE5E] py-2.5 text-xs font-black text-black transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-md shadow-[#D4AF37]/10"
          >
            {isPurchasable ? "Mua Ngay" : "Liên hệ"}
          </button>
        </div>
      </div>

      {/* Modal Chi Tiết Combo */}
      <ComboDetailModal
        isOpen={isDetailOpen}
        combo={combo}
        onClose={() => setIsDetailOpen(false)}
        onPurchase={handlePurchase}
      />
    </>
  );
}

function ComboSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="min-h-[430px] animate-pulse rounded-2xl border border-white/5 bg-[#121212] p-6"
        >
          <div className="h-11 w-11 rounded-xl bg-[#D4AF37]/15" />
          <div className="mt-6 h-6 w-44 rounded-full bg-white/10" />
          <div className="mt-4 h-4 w-full rounded-full bg-white/10" />
          <div className="mt-3 h-4 w-4/5 rounded-full bg-white/10" />
          <div className="mt-8 h-9 w-40 rounded-full bg-white/10" />
          <div className="my-7 border-t border-white/10" />
          <div className="space-y-4">
            <div className="h-4 w-full rounded-full bg-white/10" />
            <div className="h-4 w-5/6 rounded-full bg-white/10" />
            <div className="h-4 w-3/4 rounded-full bg-white/10" />
          </div>
          <div className="mt-10 h-11 rounded-lg bg-[#D4AF37]/20" />
        </div>
      ))}
    </div>
  );
}

export function ComboPackages() {
  const combosQuery = useGetPublicCombos();
  const combos = combosQuery.data ?? [];
  const highlightComboId = getHighlightComboId(combos);

  return (
    <section className="bg-[#0A0A0A] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#D4AF37]">
              Combo độc quyền
            </p>
            <h2 className="mt-3 font-heading text-3xl font-black tracking-tight text-white sm:text-4xl">
              Mua trọn bộ, xem liền mạch
            </h2>
          </div>
          <p className="max-w-xl text-sm font-medium leading-6 text-slate-400">
            Các gói combo được gom từ nhiều tập nổi bật, giúp bạn mở khóa nội dung yêu thích với mức giá tốt hơn.
          </p>
        </div>

        {combosQuery.isLoading && <ComboSkeleton />}

        {combosQuery.isError && (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/[0.06] px-6 text-center">
            <Loader2 className="mb-4 h-7 w-7 text-red-200" />
            <h3 className="text-xl font-bold text-white">
              Không thể tải danh sách Combo
            </h3>
            <p className="mt-2 max-w-md text-sm font-medium leading-6 text-red-100/70">
              Vui lòng kiểm tra API /api/v1/public/combos hoặc thử lại sau.
            </p>
          </div>
        )}

        {!combosQuery.isLoading && !combosQuery.isError && combos.length === 0 && (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#121212] px-6 text-center">
            <HelpCircle className="mb-4 h-8 w-8 text-[#D4AF37]" />
            <h3 className="text-xl font-bold text-white">
              Chưa có gói Combo public
            </h3>
            <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-400">
              Khi Creator xuất bản combo, các thẻ mua gói sẽ tự động xuất hiện tại đây.
            </p>
          </div>
        )}

        {!combosQuery.isLoading && !combosQuery.isError && combos.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {combos.map((combo) => (
              <ComboCard
                key={combo.comboId}
                combo={combo}
                isPopular={combo.comboId === highlightComboId}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
