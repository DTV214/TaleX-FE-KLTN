"use client";

import { useState, useRef } from "react";
import { UploadCloud, CheckCircle, AlertTriangle, ScanLine, Info, Search, Loader2 } from "lucide-react";
import { httpClient } from "@/shared/api/http-client";
import { toast } from "sonner";
import { useBanAccount } from "@/features/admin/hooks/use-account";
import Tesseract from "tesseract.js";

export default function CopyrightCheckPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<{ creatorId?: string; viewerId?: string; message?: string; creatorAccount?: any; viewerAccount?: any; } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanningStatus, setScanningStatus] = useState<string>("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrDebug, setOcrDebug] = useState<string>("");

  const banMutation = useBanAccount();
  const handleBanUser = () => {
    if (result?.viewerId) {
      banMutation.mutate(result.viewerId, {
        onSuccess: () => {
          toast.success("Đã khóa tài khoản thủ phạm!");
          setResult(prev => prev ? {
            ...prev,
            viewerAccount: prev.viewerAccount ? { ...prev.viewerAccount, status: "BANNED" } : prev.viewerAccount
          } : null);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Khóa tài khoản thất bại");
        }
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setResult(null);
      setError(null);
      
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (selectedFile.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const fetchUserAccount = async (id: string) => {
    try {
      const res = await httpClient.get(`/api/v1/admin/accounts/${id}`);
      return res.data?.data || res.data;
    } catch {
      return undefined;
    }
  };

  const handleScan = async () => {
    if (!file) return;

    setIsScanning(true);
    setResult(null);
    setError(null);
    setScanningStatus("Đang phân tích Watermark qua AI...");
    setOcrDebug("");
    
    let finalCreatorId: string | undefined = undefined;
    let finalViewerId: string | undefined = undefined;
    let finalMessage: string | undefined = undefined;
    let finalCreatorAccount: any = undefined;
    let finalViewerAccount: any = undefined;

    // 1. Lấy Creator ID và Viewer ID từ Java BE
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("media_type", mediaType);

      const response = await httpClient.post(`/api/internal/watermark/extract`, formData, {
        timeout: 300000 // 5 minutes timeout just in case AI takes time
      });
      const data = response.data?.data || response.data;
      if (data) {
        finalCreatorId = data.creatorId;
        finalMessage = data.message;
        finalCreatorAccount = data.creatorAccount;
        // Với VIDEO: viewer_id đã được Java dịch ngược từ binary → UUID thật
        if (mediaType === "VIDEO" && data.viewerId && data.viewerId !== "null") {
          finalViewerId = data.viewerId;
          finalViewerAccount = data.viewerAccount;
        }
      }
    } catch (err: any) {
      console.error("Lỗi khi quét Creator ID:", err);
      setError(err.response?.data?.message || "Lỗi khi quét Creator ID từ Backend.");
    }

    // 2. L\u1ea5y Viewer ID t\u1eeb Frontend (LSB / OCR) \u0111\u1ed1i v\u1edbi file \u1ea2nh
    if (mediaType === "IMAGE" && previewUrl) {
      setScanningStatus("Đang giải mã ma trận điểm ảnh (Viewer ID)...");
      try {
        const img = new Image();
        img.src = previewUrl;
        await new Promise((res) => { img.onload = res; });

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Thử Giải mã LSB trước
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
            finalViewerAccount = await fetchUserAccount(lsbMatch[1]);
            isLsbSuccess = true;
          }

          // Nếu LSB thất bại (ảnh bị resize/compress/screenshot), dùng OCR dự phòng
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
              finalViewerAccount = await fetchUserAccount(ocrMatch[1]);
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
      message: finalMessage,
      creatorAccount: finalCreatorAccount,
      viewerAccount: finalViewerAccount,
    });
    
    setIsScanning(false);
    setScanningStatus("");
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
          <ScanLine className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kiểm tra Bản quyền (Watermark)</h1>
          <p className="text-sm text-slate-500">
            Công cụ hỗ trợ Admin trích xuất ID Tác giả từ các file Ảnh/Video bị rò rỉ trên mạng.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Upload Form */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">1. Tải lên Media cần quét</h2>
          
          <div className="mb-6 flex gap-4">
            <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 p-3 font-medium transition-all ${mediaType === "IMAGE" ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
              <input type="radio" name="mediaType" value="IMAGE" className="hidden" checked={mediaType === "IMAGE"} onChange={() => setMediaType("IMAGE")} />
              Ảnh (IMAGE)
            </label>
            <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 p-3 font-medium transition-all ${mediaType === "VIDEO" ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
              <input type="radio" name="mediaType" value="VIDEO" className="hidden" checked={mediaType === "VIDEO"} onChange={() => setMediaType("VIDEO")} />
              Video (VIDEO)
            </label>
          </div>

          <div className="mb-6 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-all hover:border-violet-400 hover:bg-violet-50">
            <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} accept={mediaType === "IMAGE" ? "image/*" : "video/*"} />
            <label htmlFor="file-upload" className="cursor-pointer">
              <UploadCloud className="mx-auto mb-3 h-10 w-10 text-slate-400" />
              <p className="font-medium text-slate-700">
                {file ? file.name : "Nhấn để chọn file"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {mediaType === "IMAGE" ? "Hỗ trợ PNG, JPG" : "Hỗ trợ MP4"}
              </p>
            </label>
          </div>

            <button
              onClick={handleScan}
              disabled={!file || isScanning}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-3 font-semibold text-white shadow-md transition-all hover:bg-violet-700 disabled:opacity-50"
            >
              {isScanning ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Trích xuất dữ liệu...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ScanLine className="h-5 w-5" /> Phân tích File rò rỉ
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Result */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">2. Kết quả Quét AI</h2>
          
          {!result && !error && !isScanning && (
            <div className="flex h-[250px] flex-col items-center justify-center rounded-xl bg-slate-50 p-6 text-center text-slate-500">
              <Info className="mb-2 h-8 w-8 text-slate-300" />
              <p>Chưa có dữ liệu.</p>
              <p className="text-sm">Vui lòng tải file và nhấn nút Quét.</p>
            </div>
          )}

          {isScanning && (
            <div className="flex h-[250px] flex-col items-center justify-center rounded-xl bg-slate-50 p-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-200">
                <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
              </div>
              <p className="font-medium text-violet-600">{scanningStatus}</p>
              {ocrProgress > 0 && <p className="mt-2 text-sm text-violet-500">Tiến trình AI: {ocrProgress}%</p>}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <div className="mb-2 flex items-center gap-2 font-bold">
                <AlertTriangle className="h-5 w-5" /> Lỗi trích xuất
              </div>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {result && result.creatorId && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
              <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
              <h3 className="mb-1 text-sm font-semibold text-green-800">Tác giả gốc (Creator ID)</h3>
              <p className="text-2xl font-black text-green-600 mb-2">{result.creatorId}</p>
              {result.creatorAccount && (
                <div className="mx-auto max-w-sm rounded-lg bg-white p-3 border border-green-100 text-left shadow-sm">
                  <p className="text-sm text-green-900"><span className="font-semibold">Tên:</span> {result.creatorAccount.fullName} ({result.creatorAccount.username})</p>
                  <p className="text-sm text-green-900"><span className="font-semibold">Email:</span> {result.creatorAccount.email}</p>
                </div>
              )}
              <div className="mt-4 text-xs text-green-700">
                Đã trích xuất thành công từ lớp mã hóa DWT-DCT-SVD của bức ảnh hoặc sóng OOK của video.
              </div>
            </div>
          )}

          {result && result.viewerId && result.viewerId !== "null" && (
            <div className="mb-4 rounded-xl border-2 border-rose-400 bg-rose-50 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-800 uppercase tracking-wide">Thủ phạm rò rỉ</h3>
                  <p className="text-xs text-rose-500">
                    {mediaType === "VIDEO" 
                      ? "Trích xuất từ mặt nạ A/B HLS Watermark" 
                      : "Trích xuất từ dữ liệu rò rỉ"}
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-white border border-rose-200 px-4 py-3 font-mono text-sm break-all text-rose-700 select-all">
                {result.viewerId}
              </div>
              {result.viewerAccount && (
                <div className="mt-3 rounded-lg bg-white border border-rose-200 p-3 shadow-sm">
                  <p className="text-sm text-rose-900"><span className="font-semibold">Tên:</span> {result.viewerAccount.fullName} ({result.viewerAccount.username})</p>
                  <p className="text-sm text-rose-900"><span className="font-semibold">Email:</span> {result.viewerAccount.email}</p>
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(result.viewerId!)}
                  className="flex-1 rounded-lg border border-rose-300 bg-white py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
                >
                  Sao chép UUID
                </button>
                <a
                  href={`/admin/users?search=${result.viewerId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-lg bg-rose-500 py-2 text-center text-xs font-semibold text-white hover:bg-rose-600 transition-colors"
                >
                  Tra cứu tài khoản
                </a>
                <button
                  onClick={handleBanUser}
                  disabled={banMutation.isPending || result.viewerAccount?.status === "BANNED"}
                  className="flex-1 rounded-lg bg-orange-600 py-2 text-center text-xs font-semibold text-white hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {banMutation.isPending ? "Đang xử lý..." : result.viewerAccount?.status === "BANNED" ? "Đã khóa" : "Khóa tài khoản"}
                </button>
              </div>
            </div>
          )}

          {result && result.message && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
              <div className="mb-3 flex items-center gap-2 font-bold text-amber-700">
                <AlertTriangle className="h-5 w-5" /> Hướng dẫn thủ công (Dành cho Video)
              </div>
              <p className="text-sm text-amber-800 leading-relaxed">{result.message}</p>
            </div>
          )}
            {result && !result.creatorId && !result.viewerId && !error && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                Không tìm thấy bất kỳ ID nào trong file này. File có thể không phải là dữ liệu rò rỉ từ hệ thống.
              </div>
            )}

          {/* Debug OCR output */}
          {ocrDebug && (
            <details className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
              <summary className="cursor-pointer font-semibold text-slate-600">🔍 OCR raw output (debug)</summary>
              <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-all">{ocrDebug}</pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
