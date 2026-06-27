"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  PlayCircle,
  Sparkles,
  X,
} from "lucide-react";
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
  const startedMissionRef = useRef<string | null>(null);
  const startAdMutation = useStartAdSessionMutation();
  const completeAdMutation = useCompleteAdSessionMutation();

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

  /* eslint-disable react-hooks/set-state-in-effect */
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
  }, [countdown, sessionId, status]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 px-4 py-6 text-white backdrop-blur-md"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(212,175,55,0.16),transparent_34%),radial-gradient(circle_at_18%_80%,rgba(143,25,29,0.26),transparent_30%)]" />

      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-[#d4af37]/35 bg-[#101116]/85 shadow-[0_0_80px_rgba(212,175,55,0.16)] backdrop-blur-xl">
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
            <div className="aspect-video min-h-[260px] w-full bg-[linear-gradient(135deg,rgba(212,175,55,0.12),transparent_34%),radial-gradient(circle_at_center,rgba(143,25,29,0.32),transparent_44%)]">
              <div className="flex h-full min-h-[260px] flex-col items-center justify-center px-5 text-center">
                {status === "success" ? (
                  <>
                    <div className="relative mb-6">
                      <div className="absolute inset-0 rounded-full bg-[#d4af37]/35 blur-2xl" />
                      <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[#d4af37]/50 bg-[#d4af37]/15 text-[#d4af37]">
                        <CheckCircle2 className="h-14 w-14" />
                      </div>
                    </div>
                    <p className="font-heading text-2xl font-black text-white">
                      Nhận thưởng thành công!
                    </p>
                    <p className="mt-3 max-w-md text-sm leading-6 text-white/55">
                      Coin đã được cộng vào ví. Số dư sẽ cập nhật ngay trên
                      thanh header.
                    </p>
                  </>
                ) : status === "error" ? (
                  <>
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#8f191d]/60 bg-[#8f191d]/20 text-red-200">
                      <AlertTriangle className="h-10 w-10" />
                    </div>
                    <p className="font-heading text-2xl font-black text-white">
                      Quảng cáo bị gián đoạn
                    </p>
                    <p className="mt-3 max-w-md text-sm leading-6 text-red-100/70">
                      {errorMessage || "Vui lòng thử lại sau."}
                    </p>
                  </>
                ) : (
                  <>
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
                        : "Đang phát video quảng cáo..."}
                    </p>
                    <p className="mt-3 max-w-md text-sm leading-6 text-white/55">
                      Vui lòng không đóng hoặc rời màn hình trong khi hệ thống
                      xác thực phiên xem.
                    </p>
                  </>
                )}
              </div>
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
