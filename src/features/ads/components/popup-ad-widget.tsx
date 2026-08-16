"use client";

import { useEffect, useRef, useState } from "react";
import { Info, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { adsApi } from "@/features/ads/api/ads-api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useActiveSubscription } from "@/features/payment/api/payment.api";

const SLOT_CODE = "POPUP_OVERLAY";
const STORAGE_KEY = "talexPopupAdDismissedUntil";
/** User bắt buộc xem bao nhiêu giây trước khi nút X xuất hiện */
const SKIP_AFTER_SEC = 5;

function isAllowedRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => {
    const r = route.trim();
    if (r === "/") return pathname === "/";
    return pathname === r || pathname.startsWith(`${r}/`);
  });
}

/** Fallback dùng khi API config chưa load xong hoặc bị lỗi */
const FALLBACK_ROUTES = [
  "/", "/series", "/comics", "/watch", "/read", "/intro", "/missions",
  "/profile", "/bookmarks", "/liked", "/coin-history", "/premium",
  "/premium-history", "/purchase-history", "/subscriptions",
  "/creator-channel", "/public-channel"
];

export function PopupAdWidget() {
  const pathname = usePathname();

  const [isVisible, setIsVisible] = useState(false);
  const [skipCountdown, setSkipCountdown] = useState(SKIP_AFTER_SEC);
  const [canSkip, setCanSkip] = useState(false);
  const [impressionTracked, setImpressionTracked] = useState(false);
  const [view6sTracked, setView6sTracked] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const activeSubscriptionQuery = useActiveSubscription(isAuthenticated);
  const isPremiumMember = Boolean(activeSubscriptionQuery.data);
  const isAdBlocked = isPremiumMember || Boolean(activeSubscriptionQuery.data?.isAdBlocked);

  // Fetch danh sách cấu hình Popup từ Backend (Admin config)
  const { data: popupConfig, isError: configError } = useQuery({
    queryKey: ["ad-popup-config"],
    queryFn: () => adsApi.getPopupConfig(),
    staleTime: 5 * 60 * 1000, // cache 5 phút
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const effectiveRoutes = (configError || !popupConfig)
    ? FALLBACK_ROUTES
    : popupConfig.allowedRoutes;
    
  const effectiveDelayMs = (configError || !popupConfig)
    ? 3000
    : popupConfig.showDelayMs;

  const effectiveCooldownMinutes = (configError || !popupConfig)
    ? 15
    : popupConfig.cooldownMinutes;

  const isOnAllowedRoute = isAllowedRoute(pathname, effectiveRoutes);

  // Check LocalStorage xem đã hết thời gian cooldown chưa
  const isDismissed = typeof window !== "undefined"
    ? (() => {
        const dismissedUntil = localStorage.getItem(STORAGE_KEY);
        if (!dismissedUntil) return false;
        
        // Nếu thời gian hiện tại vẫn nhỏ hơn thời gian hết hạn -> vẫn đang bị chặn
        if (Date.now() < parseInt(dismissedUntil, 10)) {
          return true;
        }
        
        // Nếu đã qua thời gian cooldown -> xoá key và cho phép hiện lại
        localStorage.removeItem(STORAGE_KEY);
        return false;
      })()
    : false;

  const { data: ads } = useQuery({
    queryKey: ["serve-ads-popup", SLOT_CODE],
    queryFn: () => adsApi.serveAllAds(SLOT_CODE),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    enabled: isOnAllowedRoute && !isAdBlocked && !isDismissed && !activeSubscriptionQuery.isLoading,
  });

  const [ad, setAd] = useState<any>(null);

  useEffect(() => {
    if (isAdBlocked) {
      setAd(null);
      setIsVisible(false);
      return;
    }

    if (ads && ads.length > 0) {
      const lastIndexStr = localStorage.getItem(`last_ad_index_${SLOT_CODE}`);
      let nextIndex = lastIndexStr ? parseInt(lastIndexStr, 10) + 1 : 0;
      if (nextIndex >= ads.length) nextIndex = 0;
      localStorage.setItem(`last_ad_index_${SLOT_CODE}`, nextIndex.toString());
      
      setAd(ads[nextIndex]);
    } else if (ads && ads.length === 0) {
      setAd(null);
    }
  }, [ads, pathname, isAdBlocked]);

  // Tự động hiển thị popup sau effectiveDelayMs
  useEffect(() => {
    if (!ad || !isOnAllowedRoute || isDismissed || isAdBlocked || activeSubscriptionQuery.isLoading) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, effectiveDelayMs);

    return () => clearTimeout(timer);
  }, [ad, isOnAllowedRoute, isDismissed, isAdBlocked, activeSubscriptionQuery.isLoading, effectiveDelayMs]);

  // Đếm ngược countdown để hiện nút X
  useEffect(() => {
    if (!isVisible) return;

    setSkipCountdown(SKIP_AFTER_SEC);
    setCanSkip(false);

    countdownRef.current = setInterval(() => {
      setSkipCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isVisible]);

  // Track impression sau 1 giây hiển thị
  useEffect(() => {
    if (!isVisible || !ad || impressionTracked) return;

    timerRef.current = setTimeout(() => {
      adsApi.trackImpression(ad.campaignId).catch(console.error);
      setImpressionTracked(true);
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isVisible, ad, impressionTracked]);

  // Track 6s view cho ảnh tĩnh (IMAGE)
  useEffect(() => {
    if (!isVisible || !ad || ad.mediaType === "VIDEO" || view6sTracked) return;

    const timer = setTimeout(() => {
      adsApi.track6sView(ad.campaignId).catch(console.error);
      setView6sTracked(true);
    }, 6000);

    return () => clearTimeout(timer);
  }, [isVisible, ad, view6sTracked]);

  // Dừng video khi chuyển tab
  useEffect(() => {
    if (!isVisible || !videoRef.current) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        videoRef.current?.pause();
      } else {
        videoRef.current?.play().catch(console.error);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    // Tính timestamp hết hạn = hiện tại + số phút cooldown * 60 * 1000
    const expiresAt = Date.now() + effectiveCooldownMinutes * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, expiresAt.toString());
  };

  const handleClickAd = () => {
    if (!ad) return;
    adsApi.trackClick(ad.campaignId).catch(console.error);
    window.open(ad.targetUrl, "_blank", "noopener,noreferrer");
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && ad && ad.mediaType === "VIDEO" && !view6sTracked) {
      if (videoRef.current.currentTime >= 6) {
        adsApi.track6sView(ad.campaignId).catch(console.error);
        setView6sTracked(true);
      }
    }
  };

  if (!ad || !isVisible || isAdBlocked) return null;

  return (
    // Backdrop overlay
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={() => {
        if (canSkip) handleClose();
      }}
    >
      {/* Popup card — bấm vào trong không đóng */}
      <div
        ref={containerRef}
        className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Badge "Tài trợ" */}
        <span className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-1 rounded-md border border-white/10 bg-black/60 px-2 py-1 text-[9px] font-medium uppercase tracking-wider text-white/70 backdrop-blur-md">
          <Info className="h-2.5 w-2.5" />
          Tài trợ
        </span>

        {/* Nút X / Đếm ngược */}
        <div className="absolute right-3 top-3 z-20">
          {canSkip ? (
            <button
              onClick={handleClose}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-black/70 border border-white/20 text-white hover:bg-black/90 backdrop-blur-md transition-all hover:scale-110 active:scale-95"
              title="Đóng quảng cáo"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/70 border border-white/20 text-white/80 backdrop-blur-md text-sm font-bold tabular-nums">
              {skipCountdown}
            </div>
          )}
        </div>

        {/* Media content */}
        <div
          className="relative w-full cursor-pointer group bg-black"
          onClick={handleClickAd}
        >
          {ad.mediaType === "VIDEO" ? (
            <video
              ref={videoRef}
              src={ad.mediaUrl}
              autoPlay
              muted
              loop
              playsInline
              onTimeUpdate={handleTimeUpdate}
              className="w-full aspect-video object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ad.mediaUrl}
              alt="Advertisement"
              className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}

          {/* Hover overlay & CTA */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
          <div className="absolute bottom-4 left-4 z-20">
            <button 
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95 group-hover:px-6 pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                handleClickAd();
              }}
            >
              Tìm hiểu thêm ↗
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#0d0d1a] px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-xs text-white/40 leading-tight">
            Nhấp vào quảng cáo để xem chi tiết. Quảng cáo sẽ không xuất hiện lại trong phiên này sau khi đóng.
          </p>
          {canSkip && (
            <button
              onClick={handleClose}
              className="shrink-0 text-xs text-white/50 hover:text-white underline underline-offset-2 transition-colors whitespace-nowrap"
            >
              Bỏ qua
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
