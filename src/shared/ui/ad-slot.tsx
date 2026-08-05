"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adsApi } from "@/features/ads/api/ads-api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useActiveSubscription } from "@/features/payment/api/payment.api";
import { cn } from "@/shared/utils/utils";

type AdFormat = "auto" | "horizontal" | "rectangle";

type AdSlotProps = {
  slotId?: string; // Used as slotCode for backend. Optional if adData is provided.
  adData?: any; // Pre-fetched ad data (AdServeResponse)
  format?: AdFormat;
  className?: string;
  objectFit?: "cover" | "contain";
};

const minHeightByFormat: Record<AdFormat, string> = {
  auto: "min-h-[100px]",
  horizontal: "min-h-[100px]",
  rectangle: "min-h-[280px]",
};

function AdBadge() {
  return (
    <span className="pointer-events-none absolute right-2 top-2 z-20 flex items-center gap-1 rounded-md border border-white/10 bg-black/60 px-2 py-1 text-[9px] font-medium uppercase tracking-wider text-white/70 backdrop-blur-md">
      <Info className="h-2.5 w-2.5" />
      Tài trợ
    </span>
  );
}

export function AdSlot({ slotId, adData, format = "auto", className, objectFit = "cover" }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [impressionTracked, setImpressionTracked] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const activeSubscriptionQuery = useActiveSubscription(isAuthenticated);
  const isAdBlocked = Boolean(activeSubscriptionQuery.data?.isAdBlocked);

  // Fetch ad for this slot if adData is not provided
  const { data: fetchedAd, isLoading, isError } = useQuery({
    queryKey: ["serve-ad", slotId],
    queryFn: () => adsApi.serveAd(slotId!),
    staleTime: 0, // Always fetch fresh ad
    refetchOnWindowFocus: false,
    retry: false,
    enabled: !isAdBlocked && !adData && !!slotId,
  });

  const ad = adData || fetchedAd;

  // Impression tracking logic
  useEffect(() => {
    if (!ad || impressionTracked) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          // If visible, start 1s timer to count as view
          timerRef.current = setTimeout(() => {
            adsApi.trackImpression(ad.campaignId).catch(console.error);
            setImpressionTracked(true);
            observer.disconnect(); // Stop observing after tracked
          }, 1000);
        } else {
          // If hidden before 1s, clear timer
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        }
      },
      { threshold: 0.5 } // 50% of the ad must be visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [ad, impressionTracked]);

  const handleAdClick = () => {
    if (!ad) return;
    adsApi.trackClick(ad.campaignId).catch(console.error);
    window.open(ad.targetUrl, "_blank");
  };

  if (isAdBlocked) return null;

  // Fallback / Loading UI
  if (isLoading || isError || !ad) {
    return (
      <div
        className={cn(
          "relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-gradient-to-r from-muted/30 via-muted/10 to-muted/30 px-4 py-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
          minHeightByFormat[format],
          className
        )}
      >
        <img
          src="https://images.unsplash.com/photo-1541535650810-10d26f5c2ab3?q=80&w=2076&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30 transition-opacity duration-300 hover:opacity-50"
        />
        <AdBadge />
        <div className="relative z-10">
          <span className="text-xs font-semibold text-muted-foreground">
            Đặt Quảng Cáo Tại Đây
          </span>
        </div>
      </div>
    );
  }

  // Render Real Ad
  return (
    <div
      ref={containerRef}
      onClick={handleAdClick}
      className={cn(
        "relative w-full overflow-hidden rounded-xl border border-white/5 bg-black/20 cursor-pointer group",
        minHeightByFormat[format],
        className
      )}
    >
      <AdBadge />
      {ad.mediaType === "VIDEO" ? (
        <video 
          src={ad.mediaUrl} 
          autoPlay 
          muted 
          loop 
          playsInline
          className={cn("absolute inset-0 h-full w-full group-hover:scale-105 transition-transform duration-500", objectFit === "contain" ? "object-contain" : "object-cover")} 
        />
      ) : (
        <img 
          src={ad.mediaUrl} 
          alt="Advertisement" 
          className={cn("absolute inset-0 h-full w-full group-hover:scale-105 transition-transform duration-500", objectFit === "contain" ? "object-contain" : "object-cover")} 
        />
      )}
    </div>
  );
}
