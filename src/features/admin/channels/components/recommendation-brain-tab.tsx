"use client";

import { useState } from "react";
import {
  useAdminAccountsList,
  useTrainInit,
  useTrainInitReal,
  useRankCandidates,
  useDownloadTrainData,
} from "../hooks/use-admin-channels";
import type { RankCandidatesResponse } from "../types/channels.types";
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

  // Mutations
  const trainInitMutation = useTrainInit();
  const trainInitRealMutation = useTrainInitReal();
  const rankCandidatesMutation = useRankCandidates();
  const downloadTrainDataMutation = useDownloadTrainData();

  // Handler: Trigger Train Init (Mock Data)
  const handleTrainInit = async () => {
    setActiveLog({
      title: "POST /api/v1/recommendations/train-init",
      status: "loading",
      timestamp: new Date().toLocaleTimeString("vi-VN"),
    });

    try {
      const res = await trainInitMutation.mutateAsync(token);
      setActiveLog({
        title: "POST /api/v1/recommendations/train-init",
        status: "success",
        timestamp: new Date().toLocaleTimeString("vi-VN"),
        data: res,
      });
    } catch (err) {
      setActiveLog({
        title: "POST /api/v1/recommendations/train-init",
        status: "error",
        timestamp: new Date().toLocaleTimeString("vi-VN"),
        error: err instanceof Error ? err.message : "Thao tác khởi tạo thất bại",
      });
    }
  };

  // Handler: Trigger Train Init Real (Supabase DB + MongoDB Atlas)
  const handleTrainInitReal = async () => {
    setActiveLog({
      title: "POST /api/v1/recommendations/train-init-real",
      status: "loading",
      timestamp: new Date().toLocaleTimeString("vi-VN"),
    });

    try {
      const res = await trainInitRealMutation.mutateAsync({ token, maxSamples });
      setActiveLog({
        title: "POST /api/v1/recommendations/train-init-real",
        status: "success",
        timestamp: new Date().toLocaleTimeString("vi-VN"),
        data: res,
      });
    } catch (err) {
      setActiveLog({
        title: "POST /api/v1/recommendations/train-init-real",
        status: "error",
        timestamp: new Date().toLocaleTimeString("vi-VN"),
        error: err instanceof Error ? err.message : "Huấn luyện từ dữ liệu thực thất bại",
      });
    }
  };

  // Handler: Download Train Data Excel
  const handleDownloadTrainData = async () => {
    setActiveLog({
      title: "GET /api/v1/recommendations/train-data/download",
      status: "loading",
      timestamp: new Date().toLocaleTimeString("vi-VN"),
    });

    try {
      await downloadTrainDataMutation.mutateAsync();
      setActiveLog({
        title: "GET /api/v1/recommendations/train-data/download",
        status: "success",
        timestamp: new Date().toLocaleTimeString("vi-VN"),
        data: { message: "Đã tải xuống thành công tập dữ liệu train_data.xlsx" },
      });
    } catch (err) {
      setActiveLog({
        title: "GET /api/v1/recommendations/train-data/download",
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
      <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
        <div className="absolute right-0 top-0 opacity-10 blur-xl pointer-events-none">
          <Brain className="h-96 w-96 text-violet-400" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-600/30 text-violet-300 backdrop-blur-md border border-violet-400/30 shadow-inner">
              <Brain className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white">
                  LightGBM AI Engine
                </h2>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Cpu className="h-3.5 w-3.5 text-violet-400" />
                Thuật toán
              </div>
              <p className="text-sm font-bold text-violet-200 mt-1">LightGBM Ranking</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Layers className="h-3.5 w-3.5 text-amber-400" />
                Vector Features
              </div>
              <p className="text-sm font-bold text-amber-200 mt-1">26 Dimensions</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-md col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Server className="h-3.5 w-3.5 text-emerald-400" />
                File Model Storage
              </div>
              <p className="text-xs font-bold text-emerald-200 mt-1 truncate">
                data/lgb_ranking_model.txt
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Control Cards Grid: Train Init, Train Init Real, Download Dataset */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: Train Init (Mock Data) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 font-bold border border-violet-200">
                <RotateCcw className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 border border-violet-200">
                Mock Pipeline
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Khởi Tạo Dữ Liệu Mẫu
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Khởi tạo 12,000 mẫu dữ liệu sinh tự động bởi AI bao gồm các giả định về thói quen và lựa chọn của người dùng. Được sử dụng khi hệ thống chưa có đủ dữ liệu.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Mẫu khởi tạo:</span>
                <span className="font-bold text-slate-800">12,000 samples</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Mô hình:</span>
                <span className="font-semibold text-violet-600">LightGBM Model</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleTrainInit}
              disabled={trainInitMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-200 transition-all hover:bg-violet-700 active:scale-95 disabled:opacity-50"
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
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50/50 to-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200">
                <Database className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-bold text-indigo-700 border border-indigo-200">
                Real DB Pipeline
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Đồng Bộ Dữ Liệu Thực
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Lấy dữ liệu thực từ Database. Trích xuất thói quen người dùng, đặc điểm mô tả của các series, huấn luyện và xuất tập dữ liệu Excel/CSV.
              </p>
            </div>

            {/* Parameter: max_samples */}
            <div className="space-y-2 rounded-xl bg-white p-3 border border-indigo-100 shadow-inner">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="max-samples-slider" className="font-semibold text-slate-700 flex items-center gap-1">
                  <Sliders className="h-3.5 w-3.5 text-indigo-600" />
                  Max Samples:
                </label>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
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
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-indigo-100">
            <button
              type="button"
              onClick={handleTrainInitReal}
              disabled={trainInitRealMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
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
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold shadow-md shadow-emerald-200">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                Excel File (.xlsx)
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tải Tập Dữ Liệu Huấn Luyện
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tải xuống file tập dữ liệu huấn luyện dạng Excel từ server (`train_data.xlsx`) để phục vụ phân tích hoặc kiểm định offline.
              </p>
            </div>

            <div className="rounded-xl bg-white p-3 border border-emerald-100 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Định dạng file:</span>
                <span className="font-bold text-emerald-700">Microsoft Excel (.xlsx)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Endpoint:</span>
                <span className="text-[11px] text-slate-600">/recommendations/train-data/download</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-emerald-100">
            <button
              type="button"
              onClick={handleDownloadTrainData}
              disabled={downloadTrainDataMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
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

      {/* 3. Candidate Ranking Lab Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-bold border border-amber-200">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Phòng Thử Nghiệm Candidate Ranking Lab
              </h3>
              <p className="text-xs text-slate-500">
                Gửi trực tiếp danh sách ứng viên tới endpoint `POST /api/v1/recommendations/rank` để xem điểm AI Score và xếp hạng
              </p>
            </div>
          </div>

          <span className="self-start sm:self-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            AI Inference Lab
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Form */}
          <div className="space-y-4 lg:col-span-1">
            {/* Account Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-violet-600" />
                Chọn Tài Khoản Người Dùng:
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-violet-500 focus:bg-white transition-all"
              >
                <option value="">-- Chọn User (Default account) --</option>
                {accounts?.map((acc) => (
                  <option key={acc.accountId} value={acc.accountId}>
                    {acc.fullName} ({acc.email || acc.accountId})
                  </option>
                ))}
              </select>
            </div>

            {/* Candidate Series IDs Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-violet-600" />
                Candidate Series IDs (Phân cách bằng dấu phẩy):
              </label>
              <textarea
                rows={4}
                value={candidateIdsInput}
                onChange={(e) => setCandidateIdsInput(e.target.value)}
                placeholder="SERIES_001, SERIES_002, SERIES_003..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none focus:border-violet-500 focus:bg-white transition-all"
              />
            </div>

            <button
              type="button"
              onClick={handleRankCandidates}
              disabled={rankCandidatesMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-200 transition-all hover:bg-amber-700 active:scale-95 disabled:opacity-50"
            >
              {rankCandidatesMutation.isPending ? (
                <RotateCcw className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              <span>Chạy Xếp Hạng candidates</span>
            </button>
          </div>

          {/* Results Output View */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Kết Quả Xếp Hạng Candidate Model:
              </h4>
              {rankingResult && (
                <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  HTTP 200 OK
                </span>
              )}
            </div>

            {rankingResult ? (
              <div className="space-y-3">
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-semibold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-16">Hạng</th>
                        <th className="p-3">Candidate Series ID</th>
                        <th className="p-3 w-36">AI Ranking Score</th>
                        <th className="p-3 w-40">Trực Quan Hóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {(
                        rankingResult.rankedCandidates ||
                        rankingResult.ranked_candidates ||
                        rankingResult.items ||
                        []
                      ).map((item, idx) => {
                        const scoreVal = typeof item.score === "number" ? item.score : 0.5;
                        const scorePct = Math.min(Math.max(Math.round(scoreVal * 100), 0), 100);
                        return (
                          <tr key={item.seriesId || idx} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-center">
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs">
                                #{idx + 1}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-900">
                              {item.seriesId || item.title || `Series #${idx + 1}`}
                            </td>
                            <td className="p-3 font-bold text-violet-600">
                              {typeof item.score === "number"
                                ? item.score.toFixed(4)
                                : String(item.score || "N/A")}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full"
                                    style={{ width: `${scorePct}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-slate-500">{scorePct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                <Terminal className="h-8 w-8 text-slate-300" />
                <p className="text-xs">Chưa có kết quả chạy candidate ranking.</p>
                <p className="text-[11px] text-slate-400">
                  Nhập thông số ở bên trái và bấm &quot;Chạy Xếp Hạng candidates&quot;.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Execution & Response Log Console */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Terminal className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-200">
              API Execution Log Console
            </h4>
          </div>

          {activeLog && (
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${activeLog.status === "success"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : activeLog.status === "error"
                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
            >
              {activeLog.status.toUpperCase()} [{activeLog.timestamp}]
            </span>
          )}
        </div>

        {activeLog ? (
          <div className="space-y-2 text-xs">
            <div className="text-slate-400 flex items-center gap-2">
              <span className="text-violet-400 font-bold">$</span>
              <span>Executing Endpoint:</span>
              <span className="text-amber-300 font-bold">{activeLog.title}</span>
            </div>

            {activeLog.error && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-red-300">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" /> Lỗi thực thi:
                </p>
                <p className="mt-1 text-xs">{activeLog.error}</p>
              </div>
            )}

            {Boolean(activeLog.data) && (
              <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-4 text-[11px] text-emerald-300 leading-relaxed max-h-72">
                {JSON.stringify(activeLog.data, null, 2)}
              </pre>
            )}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-500">
            Sẵn sàng nhận lệnh API. Bấm nút thao tác bất kỳ để xem log thời gian thực.
          </div>
        )}
      </div>
    </div>
  );
}
