"use client";

import { Check, HelpCircle, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type PublicCombo,
  type PublicComboEpisode,
} from "@/features/public/api/public-content.api";
import { useGetPublicCombos } from "@/features/public/hooks/use-public-combos";

function formatCurrency(value?: number) {
  if (!value || value <= 0) {
    return "Liên hệ";
  }

  return `${new Intl.NumberFormat("vi-VN").format(value)} VNĐ`;
}

function getEpisodeLabel(episodes?: PublicComboEpisode[]) {
  const count = episodes?.length ?? 0;

  if (count <= 0) {
    return "Danh sách tập chọn lọc trong vũ trụ TaleX";
  }

  return `${count} tập truyện/phim trong cùng một gói`;
}

function getComboFeatures(combo: PublicCombo) {
  const features = [
    getEpisodeLabel(combo.episodes),
    combo.description || "Mở khóa combo nội dung với mức giá ưu đãi.",
  ];

  const seriesNames = Array.from(
    new Set(
      combo.episodes
        ?.map((episode) => episode.seriesTitle)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (seriesNames.length > 0) {
    features.push(`Bao gồm: ${seriesNames.slice(0, 2).join(", ")}`);
  }

  return features;
}

function getHighlightComboId(combos: PublicCombo[]) {
  if (combos.length === 0) {
    return "";
  }

  return combos.reduce((current, combo) =>
    combo.priceVnd > current.priceVnd ? combo : current,
  ).comboId;
}

export function ComboCard({
  combo,
  isPopular,
}: {
  combo: PublicCombo;
  isPopular: boolean;
}) {
  const router = useRouter();
  const features = getComboFeatures(combo);
  const originalPrice = combo.originalPriceVnd ?? combo.priceVnd;
  const shouldShowOriginalPrice = originalPrice > combo.priceVnd;
  const isPurchasable = combo.priceVnd > 0;

  function handlePurchase() {
    const params = new URLSearchParams({
      itemId: combo.comboId,
      itemType: "COMBO",
      title: combo.title,
    });
    router.push(`/checkout-content?${params.toString()}`);
  }

  return (
    <article
      className={`relative flex h-full min-h-[430px] flex-col overflow-hidden rounded-2xl bg-[#121212] p-6 transition duration-300 hover:-translate-y-1 ${
        isPopular
          ? "border border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.15)]"
          : "border border-white/5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] hover:border-[#D4AF37]/40"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.12),transparent_34%)]" />

      {isPopular && (
        <div className="absolute right-4 top-4 z-10 rounded-full bg-[#D4AF37] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-black shadow-[0_0_18px_rgba(212,175,55,0.35)]">
          PHỔ BIẾN NHẤT
        </div>
      )}

      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
          <Sparkles className="h-5 w-5" />
        </div>

        <h3 className="mt-5 pr-16 text-xl font-bold text-white">
          {combo.title}
        </h3>
        <p className="mt-3 line-clamp-2 min-h-12 text-sm font-medium leading-6 text-slate-400">
          {combo.description ||
            "Combo nội dung điện ảnh được tuyển chọn cho trải nghiệm TaleX trọn vẹn."}
        </p>

        <div className="mt-7">
          {shouldShowOriginalPrice && (
            <p className="text-sm font-bold text-slate-500 line-through">
              {formatCurrency(originalPrice)}
            </p>
          )}
          <p className="mt-1 text-3xl font-bold text-white">
            {formatCurrency(combo.priceVnd)}
          </p>
        </div>

        <div className="my-6 border-t border-white/10" />

        <ul className="flex flex-1 flex-col gap-4">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex gap-3 text-sm font-semibold leading-6 text-slate-300"
            >
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#D4AF37]" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          disabled={!isPurchasable}
          onClick={handlePurchase}
          className="mt-8 w-full rounded-lg bg-[#D4AF37] py-3 text-sm font-bold text-black transition hover:bg-[#F3CE5E] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#D4AF37]"
        >
          {isPurchasable ? "Mua Gói Này" : "Liên hệ để mua"}
        </button>
      </div>
    </article>
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
