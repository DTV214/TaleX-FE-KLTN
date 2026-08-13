"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ShieldAlert, TriangleAlert } from "lucide-react";

const warningBackground =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='960' height='540' viewBox='0 0 960 540'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23f59e0b' stop-opacity='.28'/%3E%3Cstop offset='.45' stop-color='%23ef4444' stop-opacity='.16'/%3E%3Cstop offset='1' stop-color='%230f172a' stop-opacity='.2'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='960' height='540' fill='url(%23g)'/%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='.12'%3E%3Cpath d='M0 96h960M0 192h960M0 288h960M0 384h960M0 480h960M120 0v540M240 0v540M360 0v540M480 0v540M600 0v540M720 0v540M840 0v540'/%3E%3Cpath d='M-120 540 420 0M30 540 570 0M180 540 720 0M330 540 870 0M480 540 1020 0' stroke-opacity='.08'/%3E%3C/g%3E%3Cg fill='%23ffffff' fill-opacity='.08'%3E%3Cpath d='M704 118h96v78h-96zM736 93h31v18h-31zM725 116v-16c0-19 15-34 34-34s34 15 34 34v16h-20v-16c0-8-6-14-14-14s-14 6-14 14v16z'/%3E%3Cpath d='M170 348h112v12H170zm0 30h180v12H170zm0 30h146v12H170z'/%3E%3Ccircle cx='792' cy='390' r='62'/%3E%3C/g%3E%3C/svg%3E\")";

export function AntiPiracyWrapper({
  children,
  type = "video",
}: {
  children: React.ReactNode;
  type?: "video" | "comic";
}) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isObscured, setIsObscured] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const savedState = sessionStorage.getItem("antiPiracyDisabled");
      if (savedState === "true") setIsDisabled(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (isDisabled) return;

    const handleContextMenu = (event: MouseEvent) => event.preventDefault();

    const triggerBlock = () => {
      setIsBlocked(true);

      const mediaElements = document.querySelectorAll("video, img");
      mediaElements.forEach((el) => {
        if (el.tagName === "VIDEO") {
          (el as HTMLVideoElement).pause();
        }
        el.remove();
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "PrintScreen") {
        triggerBlock();
      }

      if (event.metaKey && event.shiftKey && ["3", "4", "5"].includes(event.key)) {
        triggerBlock();
      }

      if (
        event.key === "F12" ||
        (event.ctrlKey &&
          event.shiftKey &&
          ["I", "J", "C"].includes(event.key.toUpperCase())) ||
        (event.ctrlKey && event.key.toUpperCase() === "U") ||
        (event.metaKey &&
          event.altKey &&
          ["I", "J", "C"].includes(event.key.toUpperCase())) ||
        (event.metaKey && event.key.toUpperCase() === "U")
      ) {
        event.preventDefault();
        triggerBlock();
      }
    };

    const detectDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;

      if (widthDiff || heightDiff) {
        triggerBlock();
      }
    };

    const handleBlur = () => {
      setIsObscured(true);
      document.querySelectorAll("video").forEach((video) => video.pause());
    };

    const handleFocus = () => setIsObscured(false);

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", detectDevTools);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    const timer = setTimeout(detectDevTools, 500);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", detectDevTools);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      clearTimeout(timer);
    };
  }, [isDisabled]);

  if (isBlocked && !isDisabled) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#050507] p-6 text-center text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: warningBackground }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(239,68,68,0.24),transparent_34%),linear-gradient(180deg,rgba(5,5,7,0.55),rgba(5,5,7,0.96))]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/70 to-transparent" />

        <section className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-red-400/25 bg-black/55 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.75)] backdrop-blur-2xl sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-red-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />

          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-red-400/35 bg-red-500/10 text-red-300 shadow-[0_0_45px_rgba(239,68,68,0.28)]">
            <ShieldAlert className="h-10 w-10" />
            <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border border-amber-300/40 bg-amber-400 text-black shadow-lg">
              <TriangleAlert className="h-4 w-4" />
            </span>
          </div>

          <div className="relative">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-red-200/80">
              Cảnh báo bản quyền
            </p>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              {type === "video" ? "Video đã bị tạm dừng!" : "Truyện đã bị tạm ẩn!"}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base font-semibold leading-relaxed text-slate-300 sm:text-lg">
              Hệ thống phát hiện hành vi có nguy cơ sao chép nội dung hoặc mở công cụ lập trình.
              Nội dung đã được ẩn tạm thời để bảo vệ bản quyền.
            </p>
            <p className="mx-auto mt-3 max-w-lg text-sm font-medium leading-relaxed text-slate-500">
              Vui lòng tải lại trang để tiếp tục xem. Các hành vi trích xuất trái phép có thể được
              ghi nhận để phục vụ kiểm tra vi phạm.
            </p>
          </div>

          <div className="relative mt-8 flex justify-center">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-7 text-sm font-black text-white shadow-[0_18px_45px_rgba(220,38,38,0.32)] transition hover:bg-red-500 active:scale-[0.98]"
            >
              <RefreshCw className="h-4 w-4" />
              Tải lại trang để xem tiếp
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => {
          const newValue = !isDisabled;
          setIsDisabled(newValue);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("antiPiracyDisabled", newValue.toString());
            window.dispatchEvent(
              new CustomEvent("talex:anti-piracy-toggle", {
                detail: { isDisabled: newValue },
              })
            );
          }
        }}
        className={`fixed bottom-5 left-5 z-40 rounded-full border px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur-md transition-all ${
          isDisabled
            ? "border-red-400/40 bg-red-500/80 text-white"
            : "border-white/10 bg-black/55 text-white/55 hover:bg-black/75 hover:text-white"
        }`}
      >
        {isDisabled ? "Anti-Piracy: OFF" : "Anti-Piracy: ON"}
      </button>

      {isObscured && !isDisabled && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black text-white">
          <h2 className="px-6 text-center text-2xl font-bold">
            Nội dung bị ẩn để chống chụp màn hình.
          </h2>
        </div>
      )}

      <div
        style={{
          opacity: isObscured && !isDisabled ? 0 : 1,
          pointerEvents: isObscured && !isDisabled ? "none" : "auto",
        }}
      >
        {children}
      </div>
    </>
  );
}
