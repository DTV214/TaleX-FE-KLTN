"use client";

import { useState } from "react";
import { UploadCloud, CheckCircle, AlertTriangle, ScanLine, Info } from "lucide-react";
import axios from "axios";

import { API_BASE_URL } from "@/core/config/api";

export default function CopyrightCheckPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<{ creatorId?: string; message?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleScan = async () => {
    if (!file) return;

    setIsScanning(true);
    setResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("media_type", mediaType);

      // Call Backend Admin API (TaleX-Server)
      // The Backend will forward this to TaleX-AI-Python
      const response = await axios.post(`${API_BASE_URL}/api/v1/admin/watermark/extract`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          // The admin must be logged in, so axios interceptors will attach the Bearer token automatically if setup globally,
          // Or we use withCredentials if using cookies. Assuming standard Axios setup.
        },
        withCredentials: true,
      });

      if (response.data?.data) {
        setResult(response.data.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Lỗi khi kết nối đến máy chủ AI để quét bản quyền.");
    } finally {
      setIsScanning(false);
    }
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
                <ScanLine className="h-5 w-5 animate-spin" /> Đang quét AI...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ScanLine className="h-5 w-5" /> Trích xuất ID Tác Giả
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
              <div className="mb-4 h-12 w-12 animate-pulse rounded-full bg-violet-200"></div>
              <p className="animate-pulse font-medium text-violet-600">Đang dịch ngược ma trận Watermark...</p>
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
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
              <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
              <h3 className="mb-1 text-sm font-semibold text-green-800">Tác giả rò rỉ (Creator ID)</h3>
              <p className="text-3xl font-black text-green-600">{result.creatorId}</p>
              <div className="mt-4 text-sm text-green-700">
                Đã trích xuất thành công từ lớp mã hóa DWT-DCT-SVD của bức ảnh.
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
        </div>
      </div>
    </div>
  );
}
