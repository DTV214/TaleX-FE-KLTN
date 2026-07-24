"use client";

import { Lock, ShoppingCart, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGetPublicCombos } from "@/features/public/hooks/use-public-combos";

type ContentPaywallGateProps = {
  episodeId: string;
  contentKind: "VIDEO" | "COMIC";
  compact?: boolean;
  inline?: boolean;
};

export function ContentPaywallGate({
  episodeId,
  contentKind,
  compact = false,
  inline = false,
}: ContentPaywallGateProps) {
  const router = useRouter();
  const actionLabel = contentKind === "COMIC" ? "đọc" : "xem";

  // Fetch public combos to recommend upsell package
  const combosQuery = useGetPublicCombos();
  const combos = combosQuery.data ?? [];

  // Find a public combo containing this episode
  const matchingCombo = combos.find((combo) => {
    if (!combo.episodes) return false;
    return combo.episodes.some((ep) => ep.episodeId === episodeId);
  });

  return (
    <div
      className={
        inline
          ? "flex w-full flex-col items-center justify-center gap-4 px-4 text-center text-white"
          : compact
            ? "flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl bg-[#121214] px-4 text-center text-white"
            : "flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-2xl bg-[#121214] px-6 text-center text-white shadow-[0_24px_80px_rgba(0,0,0,0.25)]"
      }
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#D4AF37] shrink-0">
        <Lock className="h-6 w-6" />
      </span>

      <div>
        <p className="text-base font-bold text-white">Nội dung trả phí</p>
        <p className="mt-1 max-w-sm text-sm text-white/60">
          Bạn cần mua tập này để {actionLabel} tiếp.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 mt-1">
        <button
          type="button"
          onClick={() => {
            const returnTo = contentKind === "COMIC" ? `/read/${episodeId}` : `/watch/${episodeId}`;
            const params = new URLSearchParams({
              itemId: episodeId,
              itemType: "EPISODE",
              returnTo,
            });
            // replace, không push — nếu không trang paywall này (cùng URL /read hoặc
            // /watch) sẽ chồng thêm 1 entry lịch sử, khiến nút "Quay lại" ở trang đọc/xem
            // phải bấm 2 lần mới thật sự lùi về trang Series.
            router.replace(`/checkout-content?${params.toString()}`);
          }}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#D4AF37] px-5 text-sm font-bold text-black transition hover:bg-[#E5C158] cursor-pointer"
        >
          <ShoppingCart className="h-4 w-4" />
          Mở khóa nội dung
        </button>

        {matchingCombo && (
          <button
            type="button"
            onClick={() => {
              const seriesId = matchingCombo.episodes?.[0]?.seriesId;
              const params = new URLSearchParams({
                itemId: matchingCombo.comboId,
                itemType: "COMBO",
                title: matchingCombo.title,
                ...(seriesId ? { returnTo: `/series/${seriesId}` } : {}),
              });
              router.replace(`/checkout-content?${params.toString()}`);
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/15 px-4 text-xs font-bold text-[#D4AF37] transition cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
            Mua trọn bộ Combo ({matchingCombo.priceVnd.toLocaleString("vi-VN")} đ)
          </button>
        )}
      </div>
    </div>
  );
}
