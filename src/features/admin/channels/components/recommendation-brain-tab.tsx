"use client";

import { useState } from "react";
import {
  useAdminAccountsList,
  useTrainInit,
  useTrainInitReal,
  useRankCandidates,
  useDownloadTrainData,
} from "../hooks/use-admin-channels";
import type { RankCandidatesResponse, TrainInitResponse } from "../types/channels.types";
import {
  Brain,
  Zap,
  Download,
  Database,
  Play,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Cpu,
  Layers,
  FileSpreadsheet,
  Terminal,
  Server,
  User,
  Sliders,
  TrendingUp,
  Key,
  ShieldCheck,
} from "lucide-react";

export function RecommendationBrainTab() {
  // Token state (default: talex_secret_demo_2026)
  const [token, setToken] = useState<string>("talex_secret_demo_2026");

  // Max samples state for Train Init Real (default: 10000)
  const [maxSamples, setMaxSamples] = useState<number>(10000);

  // Latest API Execution Log State
  const [activeLog, setActiveLog] = useState<{
    title: string;
    status: "idle" | "loading" | "success" | "error";
    timestamp: string;
    data?: unknown;
    error?: string;
  } | null>(null);

  // Accounts list query for Ranking Lab dropdown
  const { data: accounts } = useAdminAccountsList();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [candidateIdsInput, setCandidateIdsInput] = useState<string>(
    "SERIES_DEMO_001, SERIES_DEMO_002, SERIES_DEMO_003, SERIES_DEMO_004, SERIES_DEMO_005"
  );
  const [rankingResult, setRankingResult] = useState<RankCandidatesResponse | null>(null);
  const [trainInitResult, setTrainInitResult] = useState<TrainInitResponse | null>(null);
  const [trainInitRealResult, setTrainInitRealResult] = useState<TrainInitResponse | null>(null);

  // Mutations
  const trainInitMutation = useTrainInit();
  const trainInitRealMutation = useTrainInitReal();
  const rankCandidatesMutation = useRankCandidates();
  const downloadTrainDataMutation = useDownloadTrainData();

  // Handler: Trigger Train Init (Mock Data)
  const handleTrainInit = async () => {
    setActiveLog({
      title: "POST /api/v1/recommendations/model/train-init",
      status: "loading",
      timestamp: new Date().toLocaleTimeString("vi-VN"),
    });

    try {
      const res = await trainInitMutation.mutateAsync();
      setTrainInitResult(res);
      setActiveLog({
        title: "POST /api/v1/recommendations/model/train-init",
        status: "success",
        timestamp: new Date().toLocaleTimeString("vi-VN"),
        data: res,
      });
    } catch (err) {
      setActiveLog({
        title: "POST /api/v1/recommendations/model/train-init",
        status: "error",
        timestamp: new Date().toLocaleTimeString("vi-VN"),
        error: err instanceof Error ? err.message : "Thao tác khởi tạo thất bại",
      });
    }
  };

  // Handler: Trigger Train Init Real (PostgreSQL + MongoDB Atlas)
  const handleTrainInitReal = async () => {
    setActiveLog({
      title: `POST /api/v1/recommendations/model/train-init-real?maxSamples=${maxSamples}`,
      status: "loading",
      timestamp: new Date().toLocaleTimeString("vi-VN"),
    });

    try {
      const res = await trainInitRealMutation.mutateAsync(maxSamples);
      setTrainInitRealResult(res);
      setActiveLog({
        title: `POST /api/v1/recommendations/model/train-init-real?maxSamples=${maxSamples}`,
        status: "success",
        timestamp: new Date().toLocaleTimeString("vi-VN"),
        data: res,
      });
    } catch (err) {
      setActiveLog({
        title: `POST /api/v1/recommendations/model/train-init-real?maxSamples=${maxSamples}`,
        status: "error",
        timestamp: new Date().toLocaleTimeString("vi-VN"),
        error: err instanceof Error ? err.message : "Huấn luyện từ dữ liệu thực thất bại",
      });
    }
  };

  // Handler: Download Train Data Excel
  const handleDownloadTrainData = async () => {
    setActiveLog({
      title: "GET /api/v1/recommendations/model/train-data/download",
      status: "loading",
      timestamp: new Date().toLocaleTimeString("vi-VN"),
    });

    try {
      const blob = await downloadTrainDataMutation.mutateAsync();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "train_data.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      setActiveLog({
        title: "GET /api/v1/recommendations/model/train-data/download",
        status: "success",
        timestamp: new Date().toLocaleTimeString("vi-VN"),
        data: { message: "Đã tải xuống thành công tập dữ liệu train_data.xlsx" },
      });
    } catch (err) {
      setActiveLog({
        title: "GET /api/v1/recommendations/model/train-data/download",
        status: "error",
        timestamp: new Date().toLocaleTimeString("vi-VN"),
        error: err instanceof Error ? err.message : "Tải tập dữ liệu thất bại",
      });
    }
  };

  // Handler: Rank Candidates Lab
  const handleRankCandidates = async () => {
    const ids = candidateIdsInput
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      alert("Vui lòng nhập danh sách candidate series IDs");
      return;
    }

    const payload = {
      accountId: selectedAccountId || accounts?.[0]?.accountId || "DEMO_USER_01",
      candidateSeriesIds: ids,
      candidate_ids: ids,
    };

    setActiveLog({
      title: "POST /api/v1/recommendations/rank",
      status: "loading",
      timestamp: new Date().toLocaleTimeString("vi-VN"),
      data: payload,
    });

    try {
      const res = await rankCandidatesMutation.mutateAsync(payload);
      setRankingResult(res);
      setActiveLog({
        title: "POST /api/v1/recommendations/rank",
        status: "success",
        timestamp: new Date().toLocaleTimeString("vi-VN"),
        data: res,
      });
    } catch (err) {
      setActiveLog({
        title: "POST /api/v1/recommendations/rank",
        status: "error",
        timestamp: new Date().toLocaleTimeString("vi-VN"),
        error: err instanceof Error ? err.message : "Thực thi xếp hạng candidate thất bại",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Overview Stats Card */}


      {/* 2. Control Cards Grid: Train Init, Train Init Real, Download Dataset */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: Train Init (Mock Data) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.03]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 font-bold border border-violet-200 backoffice-dark:border-violet-800/40 backoffice-dark:bg-violet-950/40 backoffice-dark:text-violet-300">
                <RotateCcw className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 border border-violet-200 backoffice-dark:bg-violet-950/50 backoffice-dark:text-violet-300 backoffice-dark:border-violet-800">
                Mock Pipeline
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 backoffice-dark:text-white">
                Khởi Tạo Dữ Liệu Mẫu
              </h3>
              <p className="text-xs text-slate-500 backoffice-dark:text-white/60 mt-1 leading-relaxed">
                Khởi tạo 12,000 mẫu dữ liệu sinh tự động bởi AI bao gồm các giả định về thói quen và lựa chọn của người dùng. Được sử dụng khi hệ thống chưa có đủ dữ liệu.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-1.5 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 backoffice-dark:text-white/50">Mẫu khởi tạo:</span>
                <span className="font-bold text-slate-800 backoffice-dark:text-white">
                  {trainInitResult?.total_samples_generated != null
                    ? `${trainInitResult.total_samples_generated.toLocaleString()} samples`
                    : "12,000 samples"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 backoffice-dark:text-white/50">Mô hình:</span>
                <span className="font-semibold text-violet-600 backoffice-dark:text-violet-300">LightGBM Model</span>
              </div>
              {trainInitResult?.model_saved_at && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 backoffice-dark:text-white/50">File model:</span>
                  <span className="font-mono text-[11px] text-emerald-600 backoffice-dark:text-emerald-400 truncate max-w-[150px]">
                    {trainInitResult.model_saved_at}
                  </span>
                </div>
              )}
              {trainInitResult?.status && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 backoffice-dark:text-white/50">Trạng thái:</span>
                  <span className="font-bold text-emerald-600 backoffice-dark:text-emerald-400">
                    {trainInitResult.status}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 backoffice-dark:border-white/10">
            <button
              type="button"
              onClick={handleTrainInit}
              disabled={trainInitMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-200 transition-all hover:bg-violet-700 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {trainInitMutation.isPending ? (
                <RotateCcw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>Khởi Tạo Ngay</span>
            </button>
          </div>
        </div>

        {/* CARD 2: Train Init Real (Dữ Liệu Thực Tế) */}
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50/50 to-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.03] backoffice-dark:from-transparent backoffice-dark:to-transparent">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200">
                <Database className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-bold text-indigo-700 border border-indigo-200 backoffice-dark:bg-indigo-950/50 backoffice-dark:text-indigo-300 backoffice-dark:border-indigo-800">
                Real DB Pipeline
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 backoffice-dark:text-white">
                Đồng Bộ Dữ Liệu Thực
              </h3>
              <p className="text-xs text-slate-500 backoffice-dark:text-white/60 mt-1 leading-relaxed">
                Lấy dữ liệu thực từ Database. Trích xuất thói quen người dùng, đặc điểm mô tả của các series, huấn luyện và xuất tập dữ liệu Excel/CSV.
              </p>
            </div>

            {/* Parameter: max_samples */}
            <div className="space-y-2 rounded-xl bg-white p-3 border border-indigo-100 shadow-inner backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="max-samples-slider" className="font-semibold text-slate-700 backoffice-dark:text-white flex items-center gap-1">
                  <Sliders className="h-3.5 w-3.5 text-indigo-600 backoffice-dark:text-indigo-400" />
                  Max Samples:
                </label>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md backoffice-dark:bg-indigo-950/50 backoffice-dark:text-indigo-300">
                  {maxSamples.toLocaleString("vi-VN")}
                </span>
              </div>
              <input
                id="max-samples-slider"
                type="range"
                min={1000}
                max={50000}
                step={1000}
                value={maxSamples}
                onChange={(e) => setMaxSamples(Number(e.target.value))}
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 backoffice-dark:bg-white/10 rounded-lg cursor-pointer"
              />
            </div>

            {trainInitRealResult && (
              <div className="rounded-xl bg-indigo-50/70 p-3 border border-indigo-100 space-y-1.5 text-xs animate-in fade-in backoffice-dark:border-white/10 backoffice-dark:bg-indigo-950/20">
                {trainInitRealResult.total_samples_generated != null && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 backoffice-dark:text-white/50">Mẫu thực tế:</span>
                    <span className="font-bold text-indigo-900 backoffice-dark:text-indigo-200">
                      {trainInitRealResult.total_samples_generated.toLocaleString()} dòng dữ liệu
                    </span>
                  </div>
                )}
                {trainInitRealResult.model_saved_at && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 backoffice-dark:text-white/50">File model:</span>
                    <span className="font-mono text-[11px] text-indigo-700 backoffice-dark:text-indigo-300 truncate max-w-[150px]">
                      {trainInitRealResult.model_saved_at}
                    </span>
                  </div>
                )}
                {trainInitRealResult.status && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 backoffice-dark:text-white/50">Trạng thái:</span>
                    <span className="font-bold text-emerald-600 backoffice-dark:text-emerald-400">
                      {trainInitRealResult.status}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-indigo-100 backoffice-dark:border-white/10">
            <button
              type="button"
              onClick={handleTrainInitReal}
              disabled={trainInitRealMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {trainInitRealMutation.isPending ? (
                <RotateCcw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>Kích Hoạt Đồng Bộ</span>
            </button>
          </div>
        </div>

        {/* CARD 3: Download Train Data (Excel Export) */}
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.03] backoffice-dark:from-transparent backoffice-dark:to-transparent">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold shadow-md shadow-emerald-200">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200 backoffice-dark:bg-emerald-950/50 backoffice-dark:text-emerald-300 backoffice-dark:border-emerald-800">
                Excel File (.xlsx)
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 backoffice-dark:text-white">
                Tải Tập Dữ Liệu Huấn Luyện
              </h3>
              <p className="text-xs text-slate-500 backoffice-dark:text-white/60 mt-1 leading-relaxed">
                Tải xuống file tập dữ liệu huấn luyện dạng Excel từ server (`train_data.xlsx`) để phục vụ phân tích hoặc kiểm định offline.
              </p>
            </div>

            <div className="rounded-xl bg-white p-3 border border-emerald-100 space-y-1.5 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 backoffice-dark:text-white/50">Định dạng file:</span>
                <span className="font-bold text-emerald-700 backoffice-dark:text-emerald-300">Microsoft Excel (.xlsx)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 backoffice-dark:text-white/50">Endpoint:</span>
                <span className="text-[11px] text-slate-600 backoffice-dark:text-white/70 truncate max-w-[200px]">
                  /api/v1/recommendations/model/train-data/download
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-emerald-100 backoffice-dark:border-white/10">
            <button
              type="button"
              onClick={handleDownloadTrainData}
              disabled={downloadTrainDataMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {downloadTrainDataMutation.isPending ? (
                <RotateCcw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Tải Xuống Train Data (Excel)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
