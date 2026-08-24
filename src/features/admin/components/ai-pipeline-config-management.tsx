"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Info,
  Loader2,
  Save,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
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
      .catch(() => toast.error("Không tải được cấu hình"))
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
      toast.success("Đã cập nhật cấu hình", { duration: 3000 });
    } catch {
      toast.error("Cập nhật cấu hình thất bại");
    } finally {
      setSaving(false);
    }
  };

  const setField = (key: keyof AiPipelineConfig, value: number) =>
    setConfig((prev) => (prev ? { ...prev, [key]: value } : null));

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-16 text-sm font-bold text-gray-500 backoffice-dark:text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Đang tải cấu hình...
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 backoffice-dark:text-white">
          Cấu hình Kiểm duyệt & Bản quyền
        </h1>
        <p className="mt-1 text-sm font-semibold text-gray-500 backoffice-dark:text-zinc-400">
          Điều chỉnh các ngưỡng kiểm duyệt và chống đạo nhái. Thay đổi có hiệu lực cho các
          job xử lý SAU khi lưu — job đang chạy vẫn dùng giá trị cũ.
        </p>
      </header>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <ConfigSection
          icon={Info}
          iconClass="border-cyan-200 bg-cyan-50 text-cyan-700 backoffice-dark:border-cyan-500/30 backoffice-dark:bg-cyan-500/10 backoffice-dark:text-cyan-400"
          title="Chống đạo nhái (Content ID)"
          description="Ngưỡng so khớp Milvus dùng để phát hiện video/ảnh trùng lặp."
        >
          <Field
            label="Ngưỡng similarity tạo vi phạm"
            hint="Milvus similarity 0..1. Cao hơn = ít báo vi phạm hơn."
            step={0.01}
            min={0}
            max={1}
            defaultValue={0.9}
            value={config?.fingerprintSimilarityThreshold ?? 0.9}
            onChange={(v) => setField("fingerprintSimilarityThreshold", v)}
          />
          <Field
            label="Ngưỡng gán chủ sở hữu cụm"
            hint="Milvus similarity 0..1. Chặt hơn ngưỡng vi phạm để tránh gán nhầm chủ sở hữu."
            step={0.01}
            min={0}
            max={1}
            defaultValue={0.95}
            value={config?.fingerprintClusterThreshold ?? 0.95}
            onChange={(v) => setField("fingerprintClusterThreshold", v)}
          />
        </ConfigSection>

        <ConfigSection
          icon={ShieldAlert}
          iconClass="border-violet-200 bg-violet-50 text-violet-700 backoffice-dark:border-[var(--backoffice-primary)]/30 backoffice-dark:bg-[var(--backoffice-primary)]/10 backoffice-dark:text-[var(--backoffice-primary)]"
          title="Kiểm duyệt nội dung (Rekognition)"
          description="Ngưỡng confidence AWS Rekognition dùng để gắn cờ nội dung vi phạm."
        >
          <Field
            label="Ngưỡng confidence chung"
            hint="Rekognition confidence 0..100. Thấp hơn = kiểm duyệt gắt hơn."
            step={0.1}
            min={0}
            max={100}
            defaultValue={80}
            value={config?.rekognitionConfidenceThreshold ?? 80}
            onChange={(v) => setField("rekognitionConfidenceThreshold", v)}
          />
          <Field
            label="Ngưỡng confidence nhóm bạo lực"
            hint="Rekognition confidence 0..100 cho Violence/Visually Disturbing — thường thấp hơn ngưỡng chung."
            step={0.1}
            min={0}
            max={100}
            defaultValue={60}
            value={config?.rekognitionViolenceConfidenceThreshold ?? 60}
            onChange={(v) => setField("rekognitionViolenceConfidenceThreshold", v)}
          />
        </ConfigSection>

        <ConfigSection
          icon={SlidersHorizontal}
          iconClass="border-amber-200 bg-amber-50 text-amber-700 backoffice-dark:border-amber-500/30 backoffice-dark:bg-amber-500/10 backoffice-dark:text-amber-400"
          title="Giới hạn xử lý (Kỹ thuật)"
          description="Tham số hiệu năng — mỗi field đã có trần an toàn để tránh làm tràn RAM/quá tải AI-Python. Chỉ đổi khi hiểu rõ ảnh hưởng."
          warning="Chỉnh sai (đặc biệt Top-K video và Số frame fingerprint tối đa) từng gây lỗi hệ thống thật."
          columns={2}
        >
          <Field
            label="Top-K so khớp ẢNH"
            hint="Số ứng viên Milvus lấy khi so khớp ảnh. Cao hơn = bắt trùng tốt hơn nhưng chậm hơn."
            step={1}
            min={1}
            max={100}
            defaultValue={20}
            value={config?.fingerprintImageTopK ?? 20}
            onChange={(v) => setField("fingerprintImageTopK", v)}
          />
          <Field
            label="Top-K so khớp VIDEO"
            hint="Nhân với số frame mỗi video. Set quá thấp từng đẩy nguồn thật khỏi kết quả."
            step={1}
            min={1}
            max={50}
            defaultValue={15}
            value={config?.fingerprintVideoTopK ?? 15}
            onChange={(v) => setField("fingerprintVideoTopK", v)}
          />
          <Field
            label="Độ dài trùng tối thiểu (giây)"
            hint="Đoạn trùng phải dài ít nhất bấy nhiêu giây mới tính vi phạm video."
            step={1}
            min={1}
            max={3600}
            defaultValue={5}
            value={config?.fingerprintMinMatchSeconds ?? 5}
            onChange={(v) => setField("fingerprintMinMatchSeconds", v)}
          />
          <Field
            label="Khoảng hở tối đa (giây)"
            hint="Khoảng cách tối đa giữa 2 điểm vẫn nối chung 1 đoạn trùng."
            step={1}
            min={1}
            max={3600}
            defaultValue={2}
            value={config?.fingerprintMaxGapSeconds ?? 2}
            onChange={(v) => setField("fingerprintMaxGapSeconds", v)}
          />
          <Field
            label="FPS trích xuất fingerprint"
            hint="Số frame lấy mỗi giây khi tạo fingerprint video. Cao hơn = chính xác hơn nhưng nặng hơn cho FFmpeg."
            step={1}
            min={1}
            max={10}
            defaultValue={1}
            value={config?.fingerprintFps ?? 1}
            onChange={(v) => setField("fingerprintFps", v)}
          />
          <Field
            label="Số frame fingerprint tối đa"
            hint="Mỗi frame giữ nguyên trong RAM khi xử lý (~1.5MB/frame). Trần giữ 4 video xử lý song song không làm tràn RAM container AI-Python (giới hạn 4.5GB)."
            step={1}
            min={1}
            max={500}
            defaultValue={300}
            value={config?.fingerprintMaxFrames ?? 300}
            onChange={(v) => setField("fingerprintMaxFrames", v)}
          />
          <Field
            label="Dung lượng file tối đa (MB)"
            hint="File lớn hơn mức này bị loại khỏi fingerprint. Không thể vượt 100MB — trần cứng khi tải file từ S3 (chống tràn RAM), không đọc được cấu hình động."
            step={1}
            min={1}
            max={100}
            defaultValue={100}
            value={config?.fingerprintMaxFileSizeMb ?? 100}
            onChange={(v) => setField("fingerprintMaxFileSizeMb", v)}
          />
          <Field
            label="Số frame kiểm duyệt tối đa"
            hint="Trần số frame lấy mẫu cho kiểm duyệt Rekognition mỗi video. Cao hơn = tốn thêm chi phí & thời gian gọi AWS Rekognition."
            step={1}
            min={1}
            max={100}
            defaultValue={30}
            value={config?.rekognitionMaxFrames ?? 30}
            onChange={(v) => setField("rekognitionMaxFrames", v)}
          />
          <Field
            label="Khoảng cách frame kiểm duyệt (giây)"
            hint="Khoảng thời gian giữa các frame lấy mẫu kiểm duyệt. Cho phép < 1 giây."
            step={0.1}
            min={0.1}
            max={60}
            defaultValue={2.0}
            value={config?.moderationFrameInterval ?? 2.0}
            onChange={(v) => setField("moderationFrameInterval", v)}
          />
        </ConfigSection>

        <div className="flex items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          <p className="mr-auto text-xs font-semibold text-gray-500 backoffice-dark:text-zinc-400">
            Job đang chạy vẫn dùng giá trị cũ — chỉ job MỚI sau khi lưu mới áp dụng.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-violet-700 hover:shadow-lg active:scale-95 disabled:opacity-50 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black backoffice-dark:hover:opacity-90"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}

type ConfigSectionProps = {
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  title: string;
  description: string;
  warning?: string;
  columns?: 1 | 2;
  children: React.ReactNode;
};

function ConfigSection({
  icon: Icon,
  iconClass,
  title,
  description,
  warning,
  columns = 1,
  children,
}: ConfigSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
      <div className="mb-5 flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900 backoffice-dark:text-white">
            {title}
          </h3>
          <p className="mt-0.5 text-xs font-semibold text-gray-500 backoffice-dark:text-zinc-400">
            {description}
          </p>
        </div>
      </div>

      {warning && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-800 backoffice-dark:border-amber-500/20 backoffice-dark:bg-amber-500/10 backoffice-dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{warning}</span>
        </div>
      )}

      <div className={`grid grid-cols-1 gap-x-6 gap-y-5 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
        {children}
      </div>
    </section>
  );
}

type FieldProps = {
  label: string;
  hint: string;
  step: number;
  min: number;
  max: number;
  defaultValue: number;
  value: number;
  onChange: (value: number) => void;
};

function Field({ label, hint, step, min, max, defaultValue, value, onChange }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold tracking-wide text-gray-700 backoffice-dark:text-zinc-300">
        {label}
      </label>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none transition-colors focus:border-violet-500 focus:ring-4 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white backoffice-dark:focus:ring-[rgba(212,175,55,0.16)]"
        required
      />
      <p className="text-[11px] font-medium text-gray-400 backoffice-dark:text-zinc-500">
        {hint} Phạm vi cho phép: {min}–{max} · Mặc định: {defaultValue}.
      </p>
    </div>
  );
}
