"use client";

import { useState, useEffect } from "react";
import { ShieldAlert } from "lucide-react";

export function AntiPiracyWrapper({ 
  children, 
  type = "video" 
}: { 
  children: React.ReactNode;
  type?: "video" | "comic";
}) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isObscured, setIsObscured] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false); // Nút tắt khẩn cấp để Demo

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedState = sessionStorage.getItem("antiPiracyDisabled");
      if (savedState === "true") {
        setIsDisabled(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isDisabled) return; // Nếu đã tắt thì không chạy logic chặn nữa

    // 1. Chặn chuột phải (Context Menu)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

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

    // 2. Chống phím tắt chụp màn hình & mở F12
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") triggerBlock();
      if (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) triggerBlock();

      // Vô hiệu hóa F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toUpperCase() === "U") ||
        (e.metaKey && e.altKey && ["I", "J", "C"].includes(e.key.toUpperCase())) ||
        (e.metaKey && e.key.toUpperCase() === "U")
      ) {
        e.preventDefault();
        triggerBlock();
      }
    };

    // 3. Phát hiện F12 mở
    const detectDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      if (widthDiff || heightDiff) triggerBlock();
    };

    // 4. Bắt sự kiện mất Focus
    const handleBlur = () => {
      setIsObscured(true);
      document.querySelectorAll("video").forEach((v) => v.pause());
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
  }, [isDisabled]); // Re-run effect khi bật/tắt

  if (isBlocked && !isDisabled) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-white p-6 text-center">
        <ShieldAlert className="mb-6 h-20 w-20 text-red-500 animate-pulse" />
        <h1 className="mb-2 text-3xl font-bold text-red-500">
          {type === "video" ? "Video đã bị tạm dừng!" : "Truyện đã bị tạm ẩn!"}
        </h1>
        <p className="max-w-md text-lg text-slate-300">
          Hệ thống phát hiện bạn đang cố gắng chụp màn hình, quay lén hoặc mở công cụ lập trình (F12). 
          Hành động này vi phạm bản quyền nội dung.
        </p>
        <div className="mt-8 flex gap-4">
          <button 
            onClick={() => window.location.reload()}
            className="rounded-lg bg-red-600 px-8 py-3 font-semibold text-white transition-all hover:bg-red-700 active:scale-95"
          >
            Tải lại trang (F5) để xem tiếp
          </button>
          
          {/* Nút Dev bypass cho giáo viên */}
          <button 
            onClick={() => {
              if (typeof window !== "undefined") {
                sessionStorage.setItem("antiPiracyDisabled", "true");
              }
              setIsDisabled(true);
              setIsBlocked(false);
              window.location.reload(); // Reload để khôi phục lại thẻ video/img đã bị xóa
            }}
            className="rounded-lg border border-slate-600 px-6 py-3 font-medium text-slate-300 transition-all hover:bg-slate-800"
          >
            [Dev] Tắt chặn & Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Nút toggle nhỏ ở góc dưới phải để chủ động tắt trước khi bị chặn */}
      <button 
        onClick={() => {
          const newValue = !isDisabled;
          setIsDisabled(newValue);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("antiPiracyDisabled", newValue.toString());
          }
        }}
        className={`fixed bottom-4 right-4 z-[9999] rounded-full px-3 py-1.5 text-xs font-medium shadow-lg transition-all ${
          isDisabled ? "bg-red-500 text-white" : "bg-black/50 text-white/50 hover:bg-black/80"
        }`}
      >
        {isDisabled ? "Anti-Piracy: OFF" : "Anti-Piracy: ON"}
      </button>

      {isObscured && !isDisabled && (
        <div className="fixed inset-0 z-[9999] bg-black text-white flex items-center justify-center">
          <h2 className="text-2xl font-bold">Nội dung bị ẩn để chống chụp màn hình.</h2>
        </div>
      )}
      
      <div style={{ opacity: isObscured && !isDisabled ? 0 : 1, pointerEvents: isObscured && !isDisabled ? "none" : "auto" }}>
        {children}
      </div>
    </>
  );
}
