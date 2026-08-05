"use client";

import { Flame, Lock, Unlock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/auth.store";
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
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const actionLabel = contentKind === "COMIC" ? "đọc" : "xem";
  const backgroundImageUrl =
    "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop";

  // Fetch public combos to recommend upsell package
  const combosQuery = useGetPublicCombos();
  const combos = combosQuery.data ?? [];

  // Find a public combo containing this episode
  const matchingCombo = combos.find((combo) => {
    if (!combo.episodes) return false;
    return combo.episodes.some((ep) => ep.episodeId === episodeId);
  });

  const goToCheckout = (checkoutUrl: string) => {
    if (!isAuthenticated) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(checkoutUrl)}`);
      return;
    }

    router.replace(checkoutUrl);
  };

  return (
    <div
      className={
        inline
          ? "relative flex w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border border-[#D4AF37]/30 px-4 py-8 text-center text-white shadow-[0_0_40px_rgba(212,175,55,0.1)]"
          : compact
            ? "relative flex aspect-video w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border border-[#D4AF37]/30 bg-[#121214] px-4 text-center text-white shadow-[0_0_40px_rgba(212,175,55,0.1)]"
            : "relative flex aspect-video w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border border-[#D4AF37]/30 bg-[#121214] px-6 text-center text-white shadow-[0_0_40px_rgba(212,175,55,0.1)]"
      }
    >
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url(${backgroundImageUrl})` }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/20 via-black/80 to-[#0B0B0C]" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_20%,rgba(212,175,55,0.18),transparent_35%)]" />

      <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_24px_rgba(212,175,55,0.18)]">
        <Lock className="h-7 w-7" />
      </span>

      <div className="relative z-10">
        <p className="text-2xl font-bold text-[#D4AF37]">Nội Dung Đặc Quyền</p>
        <p className="mt-1 max-w-sm text-sm text-white/60">
          Bạn cần mua tập này để {actionLabel} tiếp.
        </p>
      </div>

      <div className="relative z-10 mt-1 flex flex-col items-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            const returnTo =
              contentKind === "COMIC" ? `/read/${episodeId}` : `/watch/${episodeId}`;
            const params = new URLSearchParams({
              itemId: episodeId,
              itemType: "EPISODE",
              returnTo,
            });
            // replace, không push — nếu không trang paywall này (cùng URL /read hoặc
            // /watch) sẽ chồng thêm 1 entry lịch sử, khiến nút "Quay lại" ở trang đọc/xem
            // phải bấm 2 lần mới thật sự lùi về trang Series.
            goToCheckout(`/checkout-content?${params.toString()}`);
          }}
          className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-gradient-to-r from-[#F56565] to-[#D4AF37] px-6 py-3 text-sm font-black text-white shadow-[0_12px_30px_rgba(245,101,101,0.24)] transition-transform hover:scale-105 cursor-pointer"
        >
          <Unlock className="h-5 w-5" />
          <span className="flex flex-col items-start leading-tight">
            <span>MỞ KHÓA NGAY</span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-white/75">
              Tập trả phí
            </span>
          </span>
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
              goToCheckout(`/checkout-content?${params.toString()}`);
            }}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 text-xs font-bold text-[#D4AF37] transition hover:bg-[#D4AF37]/15 cursor-pointer"
          >
            <Flame className="h-3.5 w-3.5 text-[#D4AF37]" />
            Mua trọn bộ Combo ({(matchingCombo.priceVnd || 0).toLocaleString("vi-VN")} đ)
          </button>
        )}
      </div>
    </div>
  );
}
