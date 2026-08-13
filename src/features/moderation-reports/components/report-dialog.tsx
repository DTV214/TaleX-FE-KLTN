"use client";

import { type ChangeEvent, type ReactNode, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FileImage, Flag, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { uploadImageToS3 } from "@/features/creator-dashboard/api/s3-upload-api";
import {
  type ReportReason,
  type ReportTargetType,
} from "../api/moderation-reports.api";
import { useCreateReport } from "../hooks/use-moderation-reports";
import {
  labelForTargetType,
  reportReasonOptions,
} from "../utils/moderation-labels";

const MAX_FILES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 20 * 1024 * 1024;

type ReportDialogProps = {
  targetType: ReportTargetType;
  targetId: string;
  targetLabel?: string;
  children?: ReactNode;
};

function validateFiles(files: File[]) {
  if (files.length > MAX_FILES) {
    return `Chỉ được gửi tối đa ${MAX_FILES} file bằng chứng.`;
  }

  for (const file of files) {
    if (file.type.startsWith("image/")) {
      if (file.size > MAX_IMAGE_SIZE) return `Ảnh "${file.name}" vượt quá 5MB.`;
    } else if (file.type.startsWith("video/")) {
      if (file.size > MAX_VIDEO_SIZE) return `Video "${file.name}" vượt quá 20MB.`;
    } else {
      return "Vui lòng chỉ chọn file ảnh hoặc video.";
    }
  }

  return null;
}

export function ReportDialog({
  targetType,
  targetId,
  targetLabel,
  children,
}: ReportDialogProps) {
  const { isAuthenticated, user } = useAuthStore();
  const createReportMutation = useCreateReport();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("COPYRIGHT");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const selectedReason = useMemo(
    () => reportReasonOptions.find((option) => option.value === reason),
    [reason],
  );

  const isSubmitting = createReportMutation.isPending || isUploading;
  const modal =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
            <div className="max-h-full w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111113] p-5 shadow-2xl shadow-black/70">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#D4AF37]">
                    <Flag className="h-3.5 w-3.5" />
                    Báo cáo vi phạm
                  </div>
                  <h2 className="text-xl font-black text-white">
                    {labelForTargetType(targetType)}
                  </h2>
                  {targetLabel && (
                    <p className="mt-1 break-words text-sm font-semibold text-zinc-400">
                      {targetLabel}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-zinc-200">
                    Lý do
                  </span>
                  <select
                    value={reason}
                    onChange={(event) => setReason(event.target.value as ReportReason)}
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-bold text-white outline-none transition focus:border-[#D4AF37]/70"
                  >
                    {reportReasonOptions.map((option) => (
                      <option key={option.value} value={option.value} className="bg-zinc-950">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {selectedReason && (
                    <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                      {selectedReason.description}
                    </p>
                  )}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-zinc-200">
                    Mô tả chi tiết
                  </span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={5}
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm font-medium text-white outline-none transition placeholder:text-zinc-600 focus:border-[#D4AF37]/70"
                    placeholder="Nêu rõ vị trí vi phạm, nội dung nghi ngờ và bối cảnh để admin kiểm tra nhanh hơn."
                  />
                </label>

                <label className="block rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-4 transition hover:border-[#D4AF37]/40">
                  <span className="flex items-center gap-3 text-sm font-bold text-zinc-200">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
                      <Upload className="h-5 w-5" />
                    </span>
                    Ảnh/Video bằng chứng
                  </span>
                  <input
                    type="file"
                    accept="image/*, video/*"
                    multiple
                    onChange={handleFileChange}
                    className="mt-3 block w-full text-xs font-semibold text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-[#D4AF37] file:px-3 file:py-2 file:text-xs file:font-black file:text-black"
                  />
                  <p className="mt-2 text-xs text-zinc-500">
                    Tối đa {MAX_FILES} file (Ảnh &lt; 5MB, Video &lt; 20MB). FE sẽ upload lên media trước,
                    rồi gửi url trong `proofImages` / `proofVideos`.
                  </p>
                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((file) => (
                        <div
                          key={`${file.name}-${file.size}`}
                          className="flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2 text-xs font-semibold text-zinc-300"
                        >
                          <FileImage className="h-4 w-4 text-[#D4AF37]" />
                          <span className="min-w-0 flex-1 truncate">{file.name}</span>
                          <span className="text-zinc-500">
                            {(file.size / 1024 / 1024).toFixed(2)}MB
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file)}
                            className="ml-auto rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </label>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                  className="h-11 rounded-xl border border-white/10 px-5 text-sm font-bold text-zinc-300 transition hover:bg-white/10 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 text-sm font-black text-black transition hover:bg-[#F3CE5E] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Gửi báo cáo
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  function handleOpen() {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để gửi báo cáo.");
      return;
    }
    setOpen(true);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files ?? []);
    if (nextFiles.length === 0) return;

    const combinedFiles = [...files, ...nextFiles].reduce((acc, curr) => {
        if (!acc.some(f => f.name === curr.name && f.size === curr.size)) {
            acc.push(curr);
        }
        return acc;
    }, [] as File[]);

    const error = validateFiles(combinedFiles);
    if (error) {
      toast.error(error);
      event.target.value = "";
      return;
    }
    setFiles(combinedFiles);
    event.target.value = "";
  }

  function handleRemoveFile(fileToRemove: File) {
    setFiles(files.filter((f) => f !== fileToRemove));
  }

  async function handleSubmit() {
    if (!targetId) {
      toast.error("Thiếu mã đối tượng cần báo cáo.");
      return;
    }

    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      toast.error("Vui lòng mô tả rõ vấn đề cần báo cáo.");
      return;
    }

    try {
      setIsUploading(true);
      const uploadedImages: string[] = [];
      const uploadedVideos: string[] = [];
      
      for (const file of files) {
        const uploaded = await uploadImageToS3(
          file,
          "report-proof",
          targetId,
          user?.accountId,
        );
        if (file.type.startsWith("video/")) {
          uploadedVideos.push(uploaded.publicUrl);
        } else {
          uploadedImages.push(uploaded.publicUrl);
        }
      }

      await createReportMutation.mutateAsync({
        targetType,
        targetId,
        reason,
        description: trimmedDescription,
        proofImages: uploadedImages.length ? uploadedImages : undefined,
        proofVideos: uploadedVideos.length ? uploadedVideos : undefined,
      });

      setOpen(false);
      setReason("COPYRIGHT");
      setDescription("");
      setFiles([]);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={handleOpen} className="contents">
        {children ?? (
          <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-zinc-300 transition hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]">
            <Flag className="h-4 w-4" />
            Báo cáo
          </span>
        )}
      </button>

      {modal}
    </>
  );
}
