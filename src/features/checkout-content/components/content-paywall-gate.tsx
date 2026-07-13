"use client";

import { Lock, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

type ContentPaywallGateProps = {
  episodeId: string;
  contentKind: "VIDEO" | "COMIC";
  compact?: boolean;
};

export function ContentPaywallGate({
  episodeId,
  contentKind,
  compact = false,
}: ContentPaywallGateProps) {
  const router = useRouter();
  const actionLabel = contentKind === "COMIC" ? "đọc" : "xem";

  return (
    <div
      className={
        compact
          ? "flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl bg-[#121214] px-4 text-center text-white"
          : "flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-2xl bg-[#121214] px-6 text-center text-white shadow-[0_24px_80px_rgba(0,0,0,0.25)]"
      }
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#D4AF37]">
        <Lock className="h-6 w-6" />
      </span>

      <div>
        <p className="text-base font-bold text-white">Nội dung trả phí</p>
        <p className="mt-1 max-w-sm text-sm text-white/60">
          Bạn cần mua tập này để {actionLabel} tiếp.
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          const returnTo = contentKind === "COMIC" ? `/read/${episodeId}` : `/watch/${episodeId}`;
          const params = new URLSearchParams({
            itemId: episodeId,
            itemType: "EPISODE",
            returnTo,
          });
          router.push(`/checkout-content?${params.toString()}`);
        }}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#D4AF37] px-5 text-sm font-bold text-black transition hover:bg-[#E5C158]"
      >
        <ShoppingCart className="h-4 w-4" />
        Mở khóa nội dung
      </button>
    </div>
  );
}
