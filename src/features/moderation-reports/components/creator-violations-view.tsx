"use client";

import { type ChangeEvent, type FormEvent, useState } from "react";
import { AlertTriangle, FileQuestion, Image as ImageIcon, Loader2, ShieldAlert, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { uploadImageToS3 } from "@/features/creator-dashboard/api/s3-upload-api";
import {
  parseProofUrls,
  stringifyProofUrls,
  type Penalty,
} from "../api/moderation-reports.api";
import {
  useCreateAppeal,
  useMyAppeals,
  useMyPenalties,
} from "../hooks/use-moderation-reports";
import {
  formatDateTime,
  labelForAppealStatus,
  labelForPenaltyLevel,
  labelForPenaltyStatus,
  labelForTargetType,
  statusTone,
} from "../utils/moderation-labels";

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function validateFiles(files: File[]) {
  if (files.length > MAX_FILES) return `Chỉ được gửi tối đa ${MAX_FILES} ảnh minh chứng.`;
  if (files.some((file) => !file.type.startsWith("image/"))) return "Vui lòng chỉ chọn file ảnh.";
  if (files.some((file) => file.size > MAX_FILE_SIZE)) return "Mỗi ảnh không được vượt quá 5MB.";
  return null;
}

function AppealForm({
  penalty,
  onClose,
}: {
  penalty: Penalty;
  onClose: () => void;
}) {
  const user = useAuthStore((state) => state.user);
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const createAppealMutation = useCreateAppeal(penalty.penaltyId);
  const isSubmitting = isUploading || createAppealMutation.isPending;

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files ?? []);
    const error = validateFiles(nextFiles);
    if (error) {
      toast.error(error);
      event.target.value = "";
      return;
    }
    setFiles(nextFiles);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error("Vui lòng nhập lý do khiếu nại.");
      return;
    }

    try {
      setIsUploading(true);
      const urls = [];
      for (const file of files) {
        const uploaded = await uploadImageToS3(
          file,
          "appeal-proof",
          penalty.penaltyId,
          user?.accountId,
        );
        urls.push(uploaded.publicUrl);
      }
      await createAppealMutation.mutateAsync({
        reason: trimmed,
        proofDocuments: urls.length ? stringifyProofUrls(urls) : undefined,
      });
      onClose();
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-2xl border border-creator-gold/15 bg-black/25 p-4">
      <h3 className="text-sm font-black text-white">Tạo khiếu nại</h3>
      <p className="mt-1 text-xs font-semibold leading-relaxed text-creator-muted">
        Mỗi penalty chỉ nên gửi một đơn khiếu nại. Hãy nêu rõ vì sao hình phạt cần được xem lại.
      </p>
      <textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        rows={5}
        className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm font-medium text-white outline-none focus:border-creator-gold/70"
        placeholder="Giải thích bối cảnh, bằng chứng bổ sung hoặc lý do bạn cho rằng hình phạt chưa phù hợp."
      />
      <label className="mt-4 block rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-4">
        <span className="flex items-center gap-2 text-sm font-bold text-zinc-200">
          <Upload className="h-4 w-4 text-creator-gold" />
          Ảnh minh chứng
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="mt-3 block w-full text-xs font-semibold text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-creator-gold file:px-3 file:py-2 file:text-xs file:font-black file:text-black"
        />
        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            {files.map((file) => (
              <div
                key={`${file.name}-${file.size}`}
                className="flex items-center gap-2 rounded-lg bg-black/40 px-3 py-2 text-xs font-semibold text-zinc-300"
              >
                <ImageIcon className="h-4 w-4 text-creator-gold" />
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
              </div>
            ))}
          </div>
        )}
      </label>
      <div className="mt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="h-10 rounded-xl border border-white/10 px-4 text-sm font-bold text-creator-muted hover:bg-white/10 disabled:opacity-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-creator-gold px-4 text-sm font-black text-black hover:bg-[#F3CE5E] disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Gửi khiếu nại
        </button>
      </div>
    </form>
  );
}

export function CreatorViolationsView() {
  const penaltiesQuery = useMyPenalties({ page: 1, pageSize: 20 });
  const appealsQuery = useMyAppeals({ page: 1, pageSize: 20 });
  const [appealPenaltyId, setAppealPenaltyId] = useState<string | null>(null);

  const penalties = penaltiesQuery.data?.content ?? [];
  const appeals = appealsQuery.data?.content ?? [];
  const appealPenaltyIds = new Set(appeals.map((appeal) => appeal.penaltyId));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Vi Phạm & Khiếu Nại</h1>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-white">
          <AlertTriangle className="h-5 w-5 text-creator-gold" />
          Vi Phạm
        </h2>
        {penaltiesQuery.isLoading ? (
          <div className="py-12 text-center text-sm font-semibold text-creator-muted">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
            Đang tải hình phạt...
          </div>
        ) : penaltiesQuery.isError ? (
          <div className="py-12 text-center text-sm font-bold text-red-300">
            Không thể tải lịch sử hình phạt.
          </div>
        ) : penalties.length === 0 ? (
          <div className="py-12 text-center text-sm font-semibold text-creator-muted">
            Bạn chưa có hình phạt nào.
          </div>
        ) : (
          <div className="space-y-4">
            {penalties.map((penalty) => {
              const isAppealOpen = appealPenaltyId === penalty.penaltyId;
              const hasAppeal = appealPenaltyIds.has(penalty.penaltyId);
              return (
                <article
                  key={penalty.penaltyId}
                  className="rounded-2xl border border-white/10 bg-black/25 p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-white">{labelForPenaltyLevel(penalty.level)}</p>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${statusTone(penalty.status)}`}>
                          {labelForPenaltyStatus(penalty.status)}
                        </span>
                      </div>
                      <p className="mt-1 break-all text-xs font-semibold text-creator-muted">
                        {penalty.penaltyId} · {formatDateTime(penalty.createdAt)}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-zinc-300">
                        {labelForTargetType(penalty.targetType)}: {penalty.targetId || "-"}
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-400">
                        {penalty.reason || "Không có lý do chi tiết."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAppealPenaltyId(isAppealOpen ? null : penalty.penaltyId)}
                      disabled={penalty.status !== "ACTIVE" || hasAppeal}
                      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-creator-gold/25 px-4 text-xs font-black text-creator-gold transition hover:bg-creator-gold/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FileQuestion className="h-4 w-4" />
                      {hasAppeal ? "Đã khiếu nại" : "Khiếu nại"}
                    </button>
                  </div>
                  {isAppealOpen && <AppealForm penalty={penalty} onClose={() => setAppealPenaltyId(null)} />}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-white">
          <FileQuestion className="h-5 w-5 text-creator-gold" />
          Khiếu Nại Đã Gửi
        </h2>
        {appealsQuery.isLoading ? (
          <div className="py-10 text-center text-sm font-semibold text-creator-muted">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
            Đang tải khiếu nại...
          </div>
        ) : appeals.length === 0 ? (
          <div className="py-10 text-center text-sm font-semibold text-creator-muted">
            Chưa có khiếu nại nào.
          </div>
        ) : (
          <div className="space-y-3">
            {appeals.map((appeal) => (
              <article
                key={appeal.appealId}
                className="rounded-2xl border border-white/10 bg-black/25 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-black text-white">Khiếu Nại: {appeal.appealId}</p>
                    <p className="mt-1 text-xs font-semibold text-creator-muted">
                      Vi Phạm: {appeal.penaltyId} · {formatDateTime(appeal.createdAt)}
                    </p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${statusTone(appeal.status)}`}>
                    {labelForAppealStatus(appeal.status)}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-400">
                  {appeal.reason || "Không có nội dung."}
                </p>
                {parseProofUrls(appeal.proofDocuments).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {parseProofUrls(appeal.proofDocuments).map((url, index) => (
                      <a
                        key={`${url}-${index}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-bold text-creator-muted hover:border-creator-gold/40 hover:text-creator-gold"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        Minh chứng {index + 1}
                      </a>
                    ))}
                  </div>
                )}
                {appeal.adminNote && (
                  <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-zinc-300">
                    Admin: {appeal.adminNote}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
