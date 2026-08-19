"use client";

import { useEffect, useState } from "react";
import { HelpCircle, Info, Save, ShieldAlert, SlidersHorizontal } from "lucide-react";
import {
  aiPipelineConfigApi,
  type AiPipelineConfig,
} from "@/features/admin/api/ai-pipeline-config.api";
import { toast } from "sonner";

export function AiPipelineConfigManagement() {
  const [config, setConfig] = useState<AiPipelineConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    aiPipelineConfigApi
      .getConfig()
      .then(setConfig)
      .catch(() => toast.error("Không tải được cấu hình AI pipeline"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    try {
      await aiPipelineConfigApi.updateConfig({
        fingerprintSimilarityThreshold: Number(config.fingerprintSimilarityThreshold),
        fingerprintClusterThreshold: Number(config.fingerprintClusterThreshold),
        rekognitionConfidenceThreshold: Number(config.rekognitionConfidenceThreshold),
        rekognitionViolenceConfidenceThreshold: Number(
          config.rekognitionViolenceConfidenceThreshold
        ),
        fingerprintImageTopK: Number(config.fingerprintImageTopK),
        fingerprintVideoTopK: Number(config.fingerprintVideoTopK),
        fingerprintMinMatchSeconds: Number(config.fingerprintMinMatchSeconds),
        fingerprintMaxGapSeconds: Number(config.fingerprintMaxGapSeconds),
        fingerprintFps: Number(config.fingerprintFps),
        fingerprintMaxFrames: Number(config.fingerprintMaxFrames),
        fingerprintMaxFileSizeMb: Number(config.fingerprintMaxFileSizeMb),
        rekognitionMaxFrames: Number(config.rekognitionMaxFrames),
        moderationFrameInterval: Number(config.moderationFrameInterval),
      });
      toast.success("Đã cập nhật cấu hình AI pipeline");
    } catch {
      toast.error("Cập nhật cấu hình thất bại");
    } finally {
      setSaving(false);
    }
  };

  const setField = (key: keyof AiPipelineConfig, value: number) =>
    setConfig((prev) => (prev ? { ...prev, [key]: value } : null));

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
  }

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cấu hình AI Pipeline</h1>
        <p className="mt-1 text-sm text-gray-500">
          Điều chỉnh các ngưỡng kiểm duyệt và chống đạo nhái. Thay đổi có hiệu lực cho
          các job xử lý SAU khi lưu (job đang chạy vẫn dùng giá trị cũ).
        </p>
      </div>

      <form onSubmit={handleSave}>
        {/* Nhóm chống đạo nhái */}
        <div className="mb-10">
          <div className="mb-6 flex items-center gap-2 text-[#007A8A]">
            <Info className="h-5 w-5" />
            <h3 className="text-lg font-bold">Chống đạo nhái (Content ID)</h3>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <Field
              label="Ngưỡng similarity tạo vi phạm"
              hint="Milvus similarity 0..1. Cao hơn = ít báo vi phạm hơn. (Mặc định: 0.90)"
              step={0.01}
              min={0}
              max={1}
              value={config?.fingerprintSimilarityThreshold ?? 0.9}
              onChange={(v) => setField("fingerprintSimilarityThreshold", v)}
            />
            <Field
              label="Ngưỡng gán chủ sở hữu cụm"
              hint="Milvus similarity 0..1. Chặt hơn ngưỡng vi phạm để tránh gán nhầm chủ sở hữu. (Mặc định: 0.95)"
              step={0.01}
              min={0}
              max={1}
              value={config?.fingerprintClusterThreshold ?? 0.95}
              onChange={(v) => setField("fingerprintClusterThreshold", v)}
            />
          </div>
        </div>

        {/* Nhóm kiểm duyệt nội dung */}
        <div className="mb-10">
          <div className="mb-6 flex items-center gap-2 text-[#007A8A]">
            <ShieldAlert className="h-5 w-5" />
            <h3 className="text-lg font-bold">Kiểm duyệt nội dung (Rekognition)</h3>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <Field
              label="Ngưỡng confidence chung"
              hint="Rekognition confidence 0..100. Thấp hơn = kiểm duyệt gắt hơn. (Mặc định: 80.0)"
              step={0.1}
              min={0}
              max={100}
              value={config?.rekognitionConfidenceThreshold ?? 80}
              onChange={(v) => setField("rekognitionConfidenceThreshold", v)}
            />
            <Field
              label="Ngưỡng confidence nhóm bạo lực"
              hint="Rekognition confidence 0..100 cho Violence/Visually Disturbing. Thường thấp hơn ngưỡng chung. (Mặc định: 60.0)"
              step={0.1}
              min={0}
              max={100}
              value={config?.rekognitionViolenceConfidenceThreshold ?? 60}
              onChange={(v) => setField("rekognitionViolenceConfidenceThreshold", v)}
            />
          </div>
        </div>

        {/* Nhóm tham số kỹ thuật/hiệu năng */}
        <div className="mb-10">
          <div className="mb-6 flex items-center gap-2 text-[#007A8A]">
            <SlidersHorizontal className="h-5 w-5" />
            <h3 className="text-lg font-bold">Giới hạn xử lý (Kỹ thuật)</h3>
          </div>
          <p className="mb-6 text-xs text-amber-600">
            Cảnh báo: đây là tham số hiệu năng, chỉnh sai (đặc biệt top_k video) từng gây
            lỗi hệ thống. Chỉ đổi khi hiểu rõ ảnh hưởng.
          </p>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <Field
              label="Top-K so khớp ẢNH"
              hint="Số ứng viên Milvus lấy khi so khớp ảnh. Cao hơn = bắt trùng tốt hơn nhưng chậm hơn. (Mặc định: 20)"
              step={1}
              min={1}
              value={config?.fingerprintImageTopK ?? 20}
              onChange={(v) => setField("fingerprintImageTopK", v)}
            />
            <Field
              label="Top-K so khớp VIDEO"
              hint="Số ứng viên Milvus lấy khi so khớp video. Set quá thấp từng đẩy nguồn thật khỏi kết quả. (Mặc định: 15)"
              step={1}
              min={1}
              value={config?.fingerprintVideoTopK ?? 15}
              onChange={(v) => setField("fingerprintVideoTopK", v)}
            />
            <Field
              label="Độ dài trùng tối thiểu (giây)"
              hint="Đoạn trùng phải dài ít nhất bấy nhiêu giây mới tính vi phạm video. (Mặc định: 5)"
              step={1}
              min={1}
              value={config?.fingerprintMinMatchSeconds ?? 5}
              onChange={(v) => setField("fingerprintMinMatchSeconds", v)}
            />
            <Field
              label="Khoảng hở tối đa (giây)"
              hint="Khoảng cách tối đa giữa 2 điểm vẫn nối chung 1 đoạn trùng. (Mặc định: 2)"
              step={1}
              min={1}
              value={config?.fingerprintMaxGapSeconds ?? 2}
              onChange={(v) => setField("fingerprintMaxGapSeconds", v)}
            />
            <Field
              label="FPS trích xuất fingerprint"
              hint="Số frame lấy mỗi giây khi tạo fingerprint video. Cao hơn = chính xác hơn nhưng nặng hơn. (Mặc định: 1)"
              step={1}
              min={1}
              value={config?.fingerprintFps ?? 1}
              onChange={(v) => setField("fingerprintFps", v)}
            />
            <Field
              label="Số frame fingerprint tối đa"
              hint="Trần tổng số frame trích xuất cho fingerprint (chống video dài phình dữ liệu). (Mặc định: 300)"
              step={1}
              min={1}
              value={config?.fingerprintMaxFrames ?? 300}
              onChange={(v) => setField("fingerprintMaxFrames", v)}
            />
            <Field
              label="Dung lượng file tối đa (MB)"
              hint="File lớn hơn mức này bị loại khỏi fingerprint. Không thể vượt 100MB — đây là trần cứng khi tải file từ S3 (chống tràn RAM), không đọc được cấu hình động. (Mặc định: 100)"
              step={1}
              min={1}
              max={100}
              value={config?.fingerprintMaxFileSizeMb ?? 100}
              onChange={(v) => setField("fingerprintMaxFileSizeMb", v)}
            />
            <Field
              label="Số frame kiểm duyệt tối đa"
              hint="Trần số frame lấy mẫu cho kiểm duyệt Rekognition mỗi video. (Mặc định: 30)"
              step={1}
              min={1}
              value={config?.rekognitionMaxFrames ?? 30}
              onChange={(v) => setField("rekognitionMaxFrames", v)}
            />
            <Field
              label="Khoảng cách frame kiểm duyệt (giây)"
              hint="Khoảng thời gian giữa các frame lấy mẫu kiểm duyệt. Cho phép < 1 giây. (Mặc định: 2.0)"
              step={0.1}
              min={0.1}
              value={config?.moderationFrameInterval ?? 2.0}
              onChange={(v) => setField("moderationFrameInterval", v)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 border-t border-gray-100 pt-8">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-[#7B42FF] px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#6528F7] hover:shadow-lg active:scale-95 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}

type FieldProps = {
  label: string;
  hint: string;
  step: number;
  min: number;
  max?: number;
  value: number;
  onChange: (value: number) => void;
};

function Field({ label, hint, step, min, max, value, onChange }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-bold tracking-wide text-gray-700">{label}</label>
        {/* Hover "?" thay vì hint luôn hiện — group-hover CSS thuần, không cần thêm
            dependency Tooltip (dự án chưa có sẵn shadcn Tooltip component nào). */}
        <div className="group relative flex items-center">
          <HelpCircle className="h-3.5 w-3.5 shrink-0 cursor-help text-gray-400" />
          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-64 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {hint}
            <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      </div>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full border-b border-gray-200 bg-transparent pb-2 text-sm text-gray-900 transition-colors focus:border-[#00D1FF] focus:outline-none"
        required
      />
    </div>
  );
}
