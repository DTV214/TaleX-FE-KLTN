"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info, Volume2, VolumeX, Play, Pause, Loader2, Maximize, Minimize } from "lucide-react";
import { adsApi } from "@/features/ads/api/ads-api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useActiveSubscription } from "@/features/payment/api/payment.api";
import { cn } from "@/shared/utils/utils";

const SLOT_CODE = "IN_VIDEO";

interface VideoPrerollAdWidgetProps {
  onAdFinished: () => void;
}

export function VideoPrerollAdWidget({ onAdFinished }: VideoPrerollAdWidgetProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const activeSubscriptionQuery = useActiveSubscription(isAuthenticated);
  const isAdBlocked = Boolean(activeSubscriptionQuery.data?.isAdBlocked);

  // Fetch In-Video config from Backend (Admin config)
  const { data: inVideoConfig } = useQuery({
    queryKey: ["ad-in-video-config"],
    queryFn: () => adsApi.getInVideoConfig(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const effectiveSkipSec = inVideoConfig?.skipAfterSec ?? 5;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [canSkip, setCanSkip] = useState(false);
  const [skipCountdown, setSkipCountdown] = useState(effectiveSkipSec);
  const [impressionTracked, setImpressionTracked] = useState(false);
  const [view6sTracked, setView6sTracked] = useState(false);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { data: ads, isLoading, isError } = useQuery({
    queryKey: ["serve-ads-preroll", SLOT_CODE],
    queryFn: () => adsApi.serveAllAds(SLOT_CODE),
    staleTime: 60 * 1000, // Refresh pool cache faster
    refetchOnWindowFocus: false,
    retry: false,
    enabled: !isAdBlocked && !activeSubscriptionQuery.isLoading,
  });

  const [ad, setAd] = useState<any>(null);

  useEffect(() => {
    if (ads && ads.length > 0) {
      const lastIndexStr = localStorage.getItem(`last_ad_index_${SLOT_CODE}`);
      let nextIndex = lastIndexStr ? parseInt(lastIndexStr, 10) + 1 : 0;
      if (nextIndex >= ads.length) nextIndex = 0;
      localStorage.setItem(`last_ad_index_${SLOT_CODE}`, nextIndex.toString());
      
      setAd(ads[nextIndex]);
    } else if (ads && ads.length === 0) {
      setAd(null);
    }
  }, [ads]);

  // Nếu user có Premium, hoặc API lỗi, hoặc không có ad -> Bỏ qua ad ngay lập tức
  useEffect(() => {
    if (activeSubscriptionQuery.isLoading) return;

    if (isAdBlocked) {
      onAdFinished();
      return;
    }

    if (!isLoading && (isError || (ads && ads.length === 0))) {
      onAdFinished();
    }
  }, [isAdBlocked, isError, ads, isLoading, activeSubscriptionQuery.isLoading, onAdFinished]);

  // Đếm ngược số giây để hiện nút Skip
  useEffect(() => {
    if (!ad) return;

    setSkipCountdown(effectiveSkipSec);
    setCanSkip(false);

    const interval = setInterval(() => {
      setSkipCountdown((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [ad, effectiveSkipSec]);

  // Image countdown if it's an image
  useEffect(() => {
    if (!ad || ad.mediaType === "VIDEO") return;
    
    // Nếu là ảnh thì auto skip sau effectiveSkipSec giây luôn
    const timer = setTimeout(() => {
      if (canSkip) {
        onAdFinished();
      }
    }, effectiveSkipSec * 1000);

    return () => clearTimeout(timer);
  }, [ad, canSkip, effectiveSkipSec, onAdFinished]);

  // Track impression sau 1s
  useEffect(() => {
    if (!ad || impressionTracked) return;

    const timer = setTimeout(() => {
      adsApi.trackImpression(ad.campaignId).catch(console.error);
      setImpressionTracked(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [ad, impressionTracked]);

  // Track 6s view cho ảnh tĩnh (IMAGE)
  useEffect(() => {
    if (!ad || ad.mediaType === "VIDEO" || view6sTracked) return;

    const timer = setTimeout(() => {
      adsApi.track6sView(ad.campaignId).catch(console.error);
      setView6sTracked(true);
    }, 6000);

    return () => clearTimeout(timer);
  }, [ad, view6sTracked]);

  // Handle Autoplay reliably
  useEffect(() => {
    if (ad && ad.mediaType === "VIDEO" && videoRef.current) {
      setIsPlaying(true);
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Trình duyệt chặn tự động phát có tiếng.
          // Ta bắt lỗi này trong im lặng để Console không bị rác.
          setIsPlaying(false);
        });
      }
    }
  }, [ad]);

  const handleSkip = () => {
    onAdFinished();
  };

  const handleClickAd = () => {
    if (!ad) return;
    adsApi.trackClick(ad.campaignId).catch(console.error);
    window.open(ad.targetUrl, "_blank", "noopener,noreferrer");
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error", err);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && ad && ad.mediaType === "VIDEO" && !view6sTracked) {
      if (videoRef.current.currentTime >= 6) {
        adsApi.track6sView(ad.campaignId).catch(console.error);
        setView6sTracked(true);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="w-full aspect-video bg-black flex flex-col items-center justify-center text-white/50">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="text-sm">Đang tải quảng cáo...</p>
      </div>
    );
  }

  if (!ad) return null;

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black group overflow-hidden cursor-pointer"
      onClick={handleClickAd}
    >
      {ad.mediaType === "VIDEO" ? (
        <video
          ref={videoRef}
          src={ad.mediaUrl}
          autoPlay
          muted={isMuted}
          playsInline
          onEnded={onAdFinished}
          onTimeUpdate={handleTimeUpdate}
          className="w-full h-full object-contain"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ad.mediaUrl}
          alt="Ad"
          className="w-full h-full object-contain"
        />
      )}

      {/* Badge Góc trái trên */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <span className="flex items-center gap-1.5 bg-yellow-400 text-black px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">
          <Info className="w-3 h-3" />
          Quảng cáo
        </span>
      </div>

      {/* Control overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Nút Tìm hiểu thêm */}
      <div className="absolute bottom-6 left-6 z-20">
        <button 
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded shadow-lg transition-colors pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            handleClickAd();
          }}
        >
          Tìm hiểu thêm ↗
        </button>
      </div>

      {/* Các nút điều khiển player (chỉ hiện cho video) */}
      {ad.mediaType === "VIDEO" && (
        <div className="absolute bottom-6 left-48 z-20 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
          <button onClick={togglePlay} className="text-white hover:text-indigo-400 drop-shadow-md">
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          <button onClick={toggleMute} className="text-white hover:text-indigo-400 drop-shadow-md">
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
          <button onClick={toggleFullscreen} className="text-white hover:text-indigo-400 drop-shadow-md">
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      )}

      {/* Skip Button (Góc phải dưới) */}
      <div className="absolute bottom-6 right-6 z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (canSkip) handleSkip();
          }}
          disabled={!canSkip}
          className={cn(
            "pointer-events-auto flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all backdrop-blur-md border",
            canSkip 
              ? "bg-white/20 hover:bg-white/30 text-white border-white/40 cursor-pointer rounded shadow-lg"
              : "bg-black/50 text-white/70 border-white/10 cursor-not-allowed rounded"
          )}
        >
          {canSkip ? (
            "Bỏ qua quảng cáo ⏭"
          ) : (
            <>
              Bỏ qua sau <b>{skipCountdown}</b>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
