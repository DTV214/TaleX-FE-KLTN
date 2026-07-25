"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { Info } from "lucide-react";
import { useActiveSubscription } from "@/features/payment/api/payment.api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { cn } from "@/shared/utils/utils";

type AdFormat = "auto" | "horizontal" | "rectangle";

type AdSlotProps = {
  slotId: string;
  format?: AdFormat;
  className?: string;
};

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

const minHeightByFormat: Record<AdFormat, string> = {
  auto: "min-h-[100px]",
  horizontal: "min-h-[100px]",
  rectangle: "min-h-[280px]",
};

const enabledAds = process.env.NEXT_PUBLIC_ENABLE_ADS === "true";
const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "";

function AdBadge() {
  return (
    <span className="pointer-events-none absolute right-2 top-2 z-20 flex items-center gap-1 rounded-md border border-white/10 bg-black/60 px-2 py-1 text-[9px] font-medium uppercase tracking-wider text-white/70 backdrop-blur-md">
      <Info className="h-2.5 w-2.5" />
      Quảng cáo
    </span>
  );
}

export function AdSlot({
  slotId,
  format = "auto",
  className,
}: AdSlotProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const hasPushedRef = useRef(false);
  const instanceId = useId();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const activeSubscriptionQuery = useActiveSubscription(isAuthenticated);
  const isAdBlocked = Boolean(activeSubscriptionQuery.data?.isAdBlocked);
  const canRenderRealAd = enabledAds && Boolean(adsenseClientId);

  const instanceKey = useMemo(
    () => `${instanceId}:${slotId}:${format}`,
    [instanceId, slotId, format],
  );

  useEffect(() => {
    if (!canRenderRealAd || isAdBlocked) {
      return;
    }

    const adElement = adRef.current;
    if (!adElement || hasPushedRef.current) {
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      hasPushedRef.current = true;
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("AdSense slot push failed:", error);
      }
    }
  }, [canRenderRealAd, instanceKey, isAdBlocked]);

  if (isAdBlocked) {
    return null;
  }

  if (!canRenderRealAd) {
    return (
      <div
        className={cn(
          "relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-gradient-to-r from-muted/30 via-muted/10 to-muted/30 px-4 py-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
          minHeightByFormat[format],
          className,
        )}
      >
        <img
          src="https://images.unsplash.com/photo-1541535650810-10d26f5c2ab3?q=80&w=2076&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30 transition-opacity duration-300 hover:opacity-50"
        />
        <AdBadge />
        <div className="relative z-10">
          <span className="text-xs font-semibold text-muted-foreground">
            AdSense Placeholder [{format}]
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl border border-white/5 bg-black/20",
        minHeightByFormat[format],
        className,
      )}
    >
      <AdBadge />
      <ins
        ref={adRef}
        className="adsbygoogle block"
        data-ad-client={adsenseClientId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
        style={{ display: "block", overflow: "hidden" }}
      />
    </div>
  );
}
