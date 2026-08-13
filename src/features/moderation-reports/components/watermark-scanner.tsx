"use client";

import { useState } from "react";
import { AlertTriangle, ScanLine, Loader2 } from "lucide-react";
import { httpClient } from "@/shared/api/http-client";
import Tesseract from "tesseract.js";

type WatermarkScannerProps = {
  url: string;
  mediaType: "IMAGE" | "VIDEO";
};

export function WatermarkScanner({ url, mediaType }: WatermarkScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<{ creatorId?: string; viewerId?: string; message?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanningStatus, setScanningStatus] = useState<string>("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrDebug, setOcrDebug] = useState<string>("");

  const handleScan = async () => {
    setIsScanning(true);
    setResult(null);
    setError(null);
    setScanningStatus("Đang tải file từ server...");
    setOcrDebug("");

    try {
      // Proxy qua Next.js Backend để tránh lỗi CORS chặn đọc ảnh/video
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Không thể tải file (có thể do lỗi mạng hoặc cấu hình Proxy).");
      const blob = await response.blob();
      const fileName = url.substring(url.lastIndexOf('/') + 1) || "file";
      const file = new File([blob], fileName, { type: blob.type });

      setScanningStatus("Đang phân tích Watermark qua AI...");
      let finalCreatorId: string | undefined = undefined;
      let finalViewerId: string | undefined = undefined;
      let finalMessage: string | undefined = undefined;

      // 1. Gửi cho BE extract
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("media_type", mediaType);

        const beResponse = await httpClient.post(`/api/internal/watermark/extract`, formData, {
          timeout: 300000
        });
        const data = beResponse.data?.data || beResponse.data;
        if (data) {
          finalCreatorId = data.creatorId;
          finalMessage = data.message;
          if (mediaType === "VIDEO" && data.viewerId && data.viewerId !== "null") {
            finalViewerId = data.viewerId;
          }
        }
      } catch (err: any) {
        console.error("Lỗi khi quét Creator ID:", err);
        setError(err.response?.data?.message || "Lỗi khi quét Creator ID từ Backend.");
      }

      // 2. Decode LSB / OCR cho IMAGE
      if (mediaType === "IMAGE") {
        setScanningStatus("Đang giải mã ma trận điểm ảnh (Viewer ID)...");
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = URL.createObjectURL(blob);
          await new Promise((res, rej) => { 
            img.onload = res; 
            img.onerror = () => rej(new Error("Lỗi tải ảnh vào bộ nhớ"));
          });

          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");

          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            let isLsbSuccess = false;
            const bits = [];
            for (let i = 0; i < 40 * 8; i++) {
              bits.push(imageData.data[i * 4] & 1);
            }

            const bytes = new Uint8Array(40);
            for (let i = 0; i < bytes.length; i++) {
              for (let b = 0; b < 8; b++) {
                bytes[i] |= (bits[i * 8 + b] << b);
              }
            }

            const decodedText = new TextDecoder().decode(bytes);
            const uuidRegex = /([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})/;
            const lsbMatch = decodedText.match(uuidRegex);

            if (lsbMatch && lsbMatch[1]) {
              console.log("LSB Extracted Successfully!", lsbMatch[1]);
              finalViewerId = lsbMatch[1];
              isLsbSuccess = true;
            }

            if (!isLsbSuccess) {
              console.warn("LSB Decoding failed, falling back to OCR");
              setScanningStatus("Đang dùng Tesseract OCR để đọc chữ mờ...");
              setOcrProgress(0);

              ctx.filter = "contrast(2000%) brightness(40%) grayscale(100%)";
              ctx.drawImage(img, 0, 0);

              const worker = await Tesseract.createWorker("eng", 1, {
                logger: (m) => {
                  if (m.status === "recognizing text") {
                    setOcrProgress(Math.floor(m.progress * 100));
                  }
                }
              });

              const { data: { text } } = await worker.recognize(canvas);
              await worker.terminate();

              const rawText = text.trim();
              console.log("OCR raw text:", rawText);
              setOcrDebug(rawText || "(OCR không nhận ra ký tự nào)");

              const ocrMatch = rawText.match(uuidRegex);
              if (ocrMatch && ocrMatch[1]) {
                finalViewerId = ocrMatch[1];
              }
            }
          }
        } catch (err) {
          console.error("Lỗi khi quét Viewer ID:", err);
          setOcrDebug(`Lỗi: ${err}`);
        }
      }

      setResult({
        creatorId: finalCreatorId,
        viewerId: finalViewerId,
        message: finalMessage
      });
    } catch (err: any) {
      setError(err.message || "Lỗi không xác định khi tải hoặc quét file");
    } finally {
      setIsScanning(false);
      setScanningStatus("");
    }
  };

  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {!result && !isScanning && !error && (
        <button
          onClick={handleScan}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-50 py-2.5 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-100"
        >
          <ScanLine className="h-4 w-4" />
          Phân tích Watermark & Kẻ rò rỉ
        </button>
      )}

      {isScanning && (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Loader2 className="mb-2 h-5 w-5 animate-spin text-violet-600" />
          <p className="text-xs font-medium text-violet-600">{scanningStatus}</p>
          {ocrProgress > 0 && <p className="mt-1 text-[10px] text-violet-500">Tiến trình OCR: {ocrProgress}%</p>}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          <div className="mb-1 flex items-center gap-2 text-xs font-bold">
            <AlertTriangle className="h-4 w-4" /> Lỗi trích xuất
          </div>
          <p className="text-xs mb-2">{error}</p>
          <button onClick={handleScan} className="rounded bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200">
            Thử lại
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-sm font-bold text-slate-800">Kết quả phân tích</h4>
            <button onClick={() => setResult(null)} className="text-xs font-semibold text-violet-600 hover:underline">
              Quét lại
            </button>
          </div>
          
          {result.creatorId ? (
            <div>
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-0.5">Tác giả gốc (Creator ID)</p>
              <p className="font-mono text-xs font-bold text-emerald-600">{result.creatorId}</p>
            </div>
          ) : (
            <p className="text-xs italic text-slate-400">Không tìm thấy Tác giả gốc.</p>
          )}

          {result.viewerId ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5">
              <p className="text-[10px] font-bold tracking-wider text-rose-500 uppercase mb-1">Thủ phạm rò rỉ (Viewer ID)</p>
              <p className="font-mono text-xs font-bold text-rose-700 select-all mb-2">{result.viewerId}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(result.viewerId!)}
                  className="flex-1 rounded-md border border-rose-300 bg-white py-1.5 text-[11px] font-semibold text-rose-600 shadow-sm hover:bg-rose-50 transition-colors"
                >
                  ✂️ Copy ID
                </button>
                <a
                  href={`/admin/users?search=${result.viewerId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-md bg-rose-600 py-1.5 text-center text-[11px] font-semibold text-white shadow-sm hover:bg-rose-700 transition-colors block"
                >
                  🔍 Tra cứu
                </a>
              </div>
            </div>
          ) : (
            <p className="text-xs italic text-slate-400">Không tìm thấy Thủ phạm rò rỉ.</p>
          )}

          {result.message && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 font-medium leading-relaxed">
              {result.message}
            </div>
          )}

          {ocrDebug && (
            <details className="text-[10px] text-slate-500 mt-2">
              <summary className="cursor-pointer hover:text-slate-700">Xem log OCR Debug</summary>
              <pre className="mt-1 whitespace-pre-wrap break-all rounded bg-slate-100 p-2 text-[9px]">{ocrDebug}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
