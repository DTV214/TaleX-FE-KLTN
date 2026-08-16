"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  PlayCircle,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adsApi } from "@/features/ads/api/ads-api";
import {
  useCompleteAdSessionMutation,
  useStartAdSessionMutation,
} from "../hooks/useMissionMutations";

type AdRewardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  missionCode: string;
};

type AdModalStatus =
  | "idle"
  | "starting"
  | "watching"
  | "completing"
  | "success"
  | "error";

const WATCH_SECONDS = 15;

function formatCountdown(value: number) {
  return value.toString().padStart(2, "0");
}

export function AdRewardModal({
  isOpen,
  onClose,
  missionCode,
}: AdRewardModalProps) {
  const [status, setStatus] = useState<AdModalStatus>("idle");
  const [countdown, setCountdown] = useState(WATCH_SECONDS);
  const [sessionId, setSessionId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const startedMissionRef = useRef<string | null>(null);
  const startAdMutation = useStartAdSessionMutation();
  const completeAdMutation = useCompleteAdSessionMutation();

  // Lấy danh sách quảng cáo thật từ Pool để phát cho người dùng
  const { data: ads } = useQuery({
    queryKey: ["serve-ads-mission-reward"],
    queryFn: async () => {
      try {
        const videoAds = await adsApi.serveAllAds("IN_VIDEO");
        if (videoAds && videoAds.length > 0) return videoAds;
      } catch (e) {
        console.warn("No IN_VIDEO ads for mission", e);
      }
      try {
        const popupAds = await adsApi.serveAllAds("POPUP_OVERLAY");
        if (popupAds && popupAds.length > 0) return popupAds;
      } catch (e) {
        console.warn("No POPUP ads for mission", e);
      }
      return [];
    },
    enabled: isOpen,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const [currentAd, setCurrentAd] = useState<any>(null);

  useEffect(() => {
    if (ads && ads.length > 0) {
      const randomIndex = Math.floor(Math.random() * ads.length);
      setCurrentAd(ads[randomIndex]);
    } else {
      setCurrentAd(null);
    }
  }, [ads, isOpen]);

  const isLocked =
    status === "starting" ||
    status === "watching" ||
    status === "completing";
  const progressWidth = useMemo(
    () =>
      `${Math.max(
        0,
        Math.min(100, ((WATCH_SECONDS - countdown) / WATCH_SECONDS) * 100),
      )}%`,
    [countdown],
  );

  useEffect(() => {
    if (!isOpen) {
      setStatus("idle");
      setCountdown(WATCH_SECONDS);
      setSessionId("");
      setErrorMessage("");
      startedMissionRef.current = null;
      return;
    }

    if (!missionCode || startedMissionRef.current === missionCode) {
      return;
    }

    startedMissionRef.current = missionCode;
    setStatus("starting");
    setCountdown(WATCH_SECONDS);
    setErrorMessage("");

    startAdMutation.mutate(missionCode, {
      onSuccess: (session) => {
        setSessionId(session.sessionId);
        setStatus("watching");
      },
      onError: (error) => {
        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể bắt đầu phiên quảng cáo.",
        );
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, missionCode]);

  useEffect(() => {
    if (status !== "watching") {
      return;
    }

    if (countdown <= 0) {
      if (!sessionId) {
        setStatus("error");
        setErrorMessage("Phiên quảng cáo không hợp lệ.");
        return;
      }

      setStatus("completing");
      completeAdMutation.mutate(sessionId, {
        onSuccess: () => {
          // Tính phí & ghi nhận lượt xem thật cho nhà quảng cáo qua nguồn MISSION (bypass Redis cooldown)
          if (currentAd?.campaignId) {
            adsApi.trackImpression(currentAd.campaignId, "MISSION").catch(console.error);
          }
          setStatus("success");
        },
        onError: (error) => {
          setStatus("error");
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Không thể hoàn tất nhận thưởng.",
          );
        },
      });
      return;
    }

    const timerId = window.setTimeout(() => {
      setCountdown((currentValue) => Math.max(0, currentValue - 1));
    }, 1000);

    return () => window.clearTimeout(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, sessionId, status, currentAd]);

  if (!isOpen) {
    return null;
  }

  const handleAdClick = () => {
    if (!currentAd) return;
    if (currentAd.campaignId) {
      adsApi.trackClick(currentAd.campaignId).catch(console.error);
    }
    if (currentAd.targetUrl) {
      window.open(currentAd.targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 px-4 py-6 text-white backdrop-blur-md"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(212,175,55,0.16),transparent_34%),radial-gradient(circle_at_18%_80%,rgba(143,25,29,0.26),transparent_30%)]" />

      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-[#d4af37]/35 bg-[#101116]/90 shadow-[0_0_80px_rgba(212,175,55,0.16)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37]">
              <PlayCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.26em] text-[#d4af37]">
                Ads Reward
              </p>
              <h2 className="font-heading text-lg font-black text-white">
                Xem Quảng Cáo Nhận Coin
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLocked && (
              <div className="rounded-lg border border-[#d4af37]/30 bg-black/40 px-3 py-2 font-mono text-sm font-black text-[#d4af37] shadow-[0_0_22px_rgba(212,175,55,0.12)]">
                00:{formatCountdown(countdown)}
              </div>
            )}

            {!isLocked && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/65 transition hover:border-[#d4af37]/40 hover:text-[#d4af37]"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/55 bg-black shadow-[inset_0_0_60px_rgba(212,175,55,0.08),0_0_40px_rgba(212,175,55,0.12)]">
            <div className="aspect-video min-h-[280px] w-full bg-black relative flex items-center justify-center overflow-hidden">
              {status === "success" ? (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-5 text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 rounded-full bg-[#d4af37]/35 blur-2xl" />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[#d4af37]/50 bg-[#d4af37]/15 text-[#d4af37]">
                      <CheckCircle2 className="h-14 w-14" />
                    </div>
                  </div>
                  <p className="font-heading text-2xl font-black text-white">
                    Nhận thưởng thành công!
                  </p>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/70">
                    Bạn đã nhận được <span className="font-bold text-[#F5D46E]">+1.000 Coin</span> vào ví.
                  </p>
                </div>
              ) : status === "error" ? (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-5 text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#8f191d]/60 bg-[#8f191d]/20 text-red-200">
                    <AlertTriangle className="h-10 w-10" />
                  </div>
                  <p className="font-heading text-2xl font-black text-white">
                    Quảng cáo bị gián đoạn
                  </p>
                  <p className="mt-3 max-w-md text-sm leading-6 text-red-100/70">
                    {errorMessage || "Vui lòng thử lại sau."}
                  </p>
                </div>
              ) : currentAd ? (
                /* PHÁT QUẢNG CÁO THẬT CỦA ADVERTISER */
                <div className="relative h-full w-full group">
                  {currentAd.mediaType === "VIDEO" ? (
                    <video
                      src={currentAd.mediaUrl}
                      autoPlay
                      playsInline
                      muted={isMuted}
                      loop
                      className="h-full w-full object-contain cursor-pointer"
                      onClick={handleAdClick}
                    />
                  ) : (
                    <img
                      src={currentAd.mediaUrl}
                      alt={currentAd.title || "Quảng cáo tài trợ"}
                      className="h-full w-full object-contain cursor-pointer"
                      onClick={handleAdClick}
                    />
                  )}

                  {/* Nút Âm thanh cho video */}
                  {currentAd.mediaType === "VIDEO" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                      }}
                      className="absolute bottom-4 left-4 z-20 rounded-full bg-black/60 p-2 text-white/90 backdrop-blur-md transition hover:bg-black/80"
                      title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                  )}

                  {/* Nhãn nhà tài trợ & link trang đích */}
                  <div
                    onClick={handleAdClick}
                    className="absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/70 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md cursor-pointer transition hover:bg-black/90 hover:border-[#d4af37]/60"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#d4af37]" />
                    <span>{currentAd.title || "Nhà tài trợ TaleX"}</span>
                    {currentAd.targetUrl && <ExternalLink className="h-3 w-3 text-white/60 ml-0.5" />}
                  </div>
                </div>
              ) : (
                /* FALLBACK KHI CHƯA CÓ QUẢNG CÁO NÀO ĐANG CHẠY */
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-5 text-center">
                  <div className="mb-7 flex h-24 w-24 items-center justify-center rounded-full border border-[#d4af37]/35 bg-[#d4af37]/10 text-[#d4af37] shadow-[0_0_38px_rgba(212,175,55,0.18)]">
                    {status === "starting" || status === "completing" ? (
                      <Loader2 className="h-12 w-12 animate-spin" />
                    ) : (
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d4af37]/20 border-t-[#d4af37]" />
                    )}
                  </div>
                  <p className="font-heading text-2xl font-black text-white">
                    {status === "completing"
                      ? "Đang xác nhận phần thưởng..."
                      : "Đang phát video tài trợ TaleX..."}
                  </p>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/55">
                    Vui lòng không đóng màn hình trong khi hệ thống xác thực phiên xem.
                  </p>
                </div>
              )}
            </div>

            <div className="h-1.5 w-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#8f191d] via-[#d4af37] to-[#f2ca50] shadow-[0_0_20px_rgba(212,175,55,0.65)] transition-[width] duration-500"
                style={{
                  width: status === "success" ? "100%" : progressWidth,
                }}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40">
              <Sparkles className="h-4 w-4 text-[#d4af37]" />
              Redis secured reward session
            </div>

            {(status === "success" || status === "error") && (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#d4af37] px-6 text-sm font-black uppercase tracking-widest text-black shadow-[0_0_24px_rgba(212,175,55,0.22)] transition hover:bg-[#f2ca50] active:scale-[0.98]"
              >
                Đóng
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
