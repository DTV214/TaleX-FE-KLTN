"use client";

import { useState, useRef } from "react";
import { UploadCloud, CheckCircle, AlertTriangle, ScanLine, Info, Search, Loader2 } from "lucide-react";
import { httpClient } from "@/shared/api/http-client";
import Tesseract from "tesseract.js";

export default function CopyrightCheckPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<{ creatorId?: string; viewerId?: string; message?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanningStatus, setScanningStatus] = useState<string>("");
  const [ocrProgress, setOcrProgress] = useState(0);

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

  const handleScan = async () => {
    if (!file) return;

    setIsScanning(true);
    setResult(null);
    setError(null);
    setScanningStatus("Đang phân tích Watermark qua AI...");
    
    let finalCreatorId: string | undefined = undefined;
    let finalViewerId: string | undefined = undefined;
    let finalMessage: string | undefined = undefined;

    // 1. Lấy Creator ID từ Java BE
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
      }
    } catch (err: any) {
      console.error("Lỗi khi quét Creator ID:", err);
      setError(err.response?.data?.message || "Lỗi khi quét Creator ID từ Backend.");
    }

    // 2. Lấy Viewer ID từ Frontend (LSB / OCR) đối với file Ảnh
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
          // Regex để bắt trúng định dạng UUID chuẩn (không cần tiền tố VID:)
          const uuidRegex = /([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})/;
          const lsbMatch = decodedText.match(uuidRegex);
          
          if (lsbMatch && lsbMatch[1]) {
            console.log("LSB Extracted Successfully!", lsbMatch[1]);
            finalViewerId = lsbMatch[1];
            isLsbSuccess = true;
          }
          
          // Nếu LSB thất bại (ảnh bị resize/compress/screenshot), dùng OCR dự phòng
          if (!isLsbSuccess) {
            console.warn("LSB Decoding failed, falling back to OCR");
            setScanningStatus("Đang dùng Tesseract OCR để đọc chữ mờ...");
            setOcrProgress(0);
            
            // Ép tương phản cực đại để tách chữ chìm thành trắng đen (Contrast 2000%, Brightness 40%)
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
            
            const ocrMatch = text.match(uuidRegex);
            if (ocrMatch && ocrMatch[1]) {
              finalViewerId = ocrMatch[1];
            }
          }
        }
      } catch (err) {
        console.error("Lỗi khi quét Viewer ID:", err);
      }
    }

    setResult({
      creatorId: finalCreatorId,
      viewerId: finalViewerId,
      message: finalMessage
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
              <p className="text-2xl font-black text-green-600">{result.creatorId}</p>
              <div className="mt-4 text-xs text-green-700">
                Đã trích xuất thành công từ lớp mã hóa DWT-DCT-SVD của bức ảnh hoặc sóng OOK của video.
              </div>
            </div>
          )}

          {result && result.viewerId && result.viewerId !== "null" && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
              <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-rose-500" />
              <h3 className="mb-1 text-sm font-semibold text-rose-800">Thủ phạm rò rỉ (Viewer ID)</h3>
              <p className="text-2xl font-black text-rose-600">{result.viewerId}</p>
              <div className="mt-4 text-xs text-rose-700">
                {mediaType === "VIDEO" 
                  ? "Đã trích xuất thành công và dịch ngược từ mẫu A/B Watermarking của Video."
                  : "Đã trích xuất từ dữ liệu rò rỉ."}
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
          </div>
        </div>
      </div>
    </div>
  );
}
