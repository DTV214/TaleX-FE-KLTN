"use client";

import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Eye,
  FileQuestion,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  ShieldAlert,
  Tv,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { uploadImageToS3 } from "@/features/creator-dashboard/api/s3-upload-api";
import {
  parseProofUrls,
  stringifyProofUrls,
  type Appeal,
  type ModerationTargetDetail,
  type Penalty,
  type ReportTargetType,
} from "../api/moderation-reports.api";
import {
  useAppealByPenalty,
  useCreateAppeal,
  useModerationTargetDetail,
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
import { ModerationPagination } from "./moderation-pagination";

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const PAGE_SIZE = 10;
const RESOLVABLE_TARGET_TYPES: ReportTargetType[] = [
  "SERIES",
  "EPISODE",
  "COMMENT",
];

function validateFiles(files: File[]) {
  if (files.length > MAX_FILES) {
    return `Chỉ được gửi tối đa ${MAX_FILES} ảnh minh chứng.`;
  }
  if (files.some((file) => !file.type.startsWith("image/"))) {
    return "Vui lòng chỉ chọn file ảnh.";
  }
  if (files.some((file) => file.size > MAX_FILE_SIZE)) {
    return "Mỗi ảnh không được vượt quá 5MB.";
  }
  return null;
}

function shortId(value?: string | null) {
  if (!value) return "-";
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function isResolvableTargetType(
  value?: ReportTargetType | null,
): value is ReportTargetType {
  return Boolean(value && RESOLVABLE_TARGET_TYPES.includes(value));
}

function TargetIcon({ targetType }: { targetType?: ReportTargetType }) {
  if (targetType === "COMMENT") {
    return <MessageSquare className="h-5 w-5" />;
  }
  if (targetType === "SERIES" || targetType === "EPISODE") {
    return <Tv className="h-5 w-5" />;
  }
  return <ShieldAlert className="h-5 w-5" />;
}

function TargetMetadata({
  detail,
}: {
  detail?: ModerationTargetDetail | null;
}) {
  const metadata = detail?.metadata ?? [];

  if (metadata.length === 0) return null;

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {metadata.slice(0, 6).map((item) => (
        <div
          key={`${item.label}-${item.value}`}
          className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2"
        >
          <p className="text-[11px] font-bold uppercase tracking-wide text-creator-muted/75">
            {item.label}
          </p>
          <p className="mt-1 truncate text-xs font-bold text-zinc-200">
            {formatMetadataValue(item.label, item.value)}
          </p>
        </div>
      ))}
    </div>
  );
}

function formatMetadataValue(
  label: string,
  value: string | number | null | undefined,
) {
  if (typeof value !== "string") {
    return String(value ?? "-");
  }

  const normalizedLabel = label.toLowerCase();
  const isDateValue =
    normalizedLabel.includes("cập nhật") ||
    normalizedLabel.includes("ngày") ||
    normalizedLabel.includes("lúc");

  return isDateValue ? formatDateTime(value) : value;
}

function TargetDetailCard({
  onViewDetail,
  penalty,
}: {
  onViewDetail: () => void;
  penalty: Penalty;
}) {
  const canResolve = isResolvableTargetType(penalty.targetType);
  const detailQuery = useModerationTargetDetail(
    canResolve
      ? {
          targetType: penalty.targetType,
          targetId: penalty.targetId,
        }
      : null,
  );
  const detail = detailQuery.data;

  return (
    <div className="mt-4 rounded-2xl border border-white/10 border-l-2 border-l-creator-gold/50 bg-white/[0.035] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-creator-gold/20 bg-creator-gold/10 text-creator-gold">
          {detail?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={detail.imageUrl}
              alt={detail.title}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : detailQuery.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <TargetIcon targetType={penalty.targetType} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-creator-gold/25 bg-creator-gold/10 px-2.5 py-1 text-[11px] font-black text-creator-gold">
              {labelForTargetType(penalty.targetType)}
            </span>
            {penalty.targetId && (
              <span
                title={penalty.targetId}
                className="text-[11px] font-semibold text-creator-muted"
              >
                Mã: {shortId(penalty.targetId)}
              </span>
            )}
          </div>

          {canResolve ? (
            detailQuery.isError ? (
              <div className="mt-2 rounded-xl border border-red-400/20 bg-red-400/[0.08] px-3 py-2 text-xs font-semibold text-red-200">
                Không lấy được thông tin của nội dung hoặc đã bị xóa.
              </div>
            ) : (
              <>
                <h3 className="mt-2 line-clamp-2 text-base font-black text-white">
                  {detail?.title ??
                    (detailQuery.isLoading
                      ? "Đang tải thông tin đối tượng..."
                      : "Chưa có thông tin đối tượng")}
                </h3>
                {detail?.subtitle && (
                  <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-creator-muted">
                    {detail.subtitle}
                  </p>
                )}
              </>
            )
          ) : (
            <p className="mt-2 text-sm font-semibold text-zinc-300">
              Chưa hỗ trợ lấy chi tiết cho loại đối tượng này.
            </p>
          )}
        </div>
        </div>

        {canResolve && (
          <button
            type="button"
            onClick={onViewDetail}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-black text-creator-muted transition hover:border-creator-gold/40 hover:text-creator-gold"
          >
            <Eye className="h-4 w-4" />
            Xem chi tiết
          </button>
        )}
      </div>
    </div>
  );
}

function TargetDetailDialog({
  onClose,
  penalty,
}: {
  onClose: () => void;
  penalty: Penalty | null;
}) {
  const canResolve = isResolvableTargetType(penalty?.targetType);
  const detailQuery = useModerationTargetDetail(
    canResolve
      ? {
          targetType: penalty?.targetType,
          targetId: penalty?.targetId,
        }
      : null,
  );
  const detail = detailQuery.data;

  if (!penalty) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
      <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111113] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-black text-white">
              Chi tiết đối tượng vi phạm
            </h2>
            <p className="mt-1 text-xs font-semibold text-creator-muted">
              {labelForTargetType(penalty.targetType)} · Mã{" "}
              <span title={penalty.targetId}>{shortId(penalty.targetId)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/10 hover:text-white"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto p-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/25 text-creator-gold sm:w-40">
                {detail?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={detail.imageUrl}
                    alt={detail.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : detailQuery.isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <TargetIcon targetType={penalty.targetType} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="rounded-full border border-creator-gold/25 bg-creator-gold/10 px-2.5 py-1 text-[11px] font-black text-creator-gold">
                  {labelForTargetType(penalty.targetType)}
                </span>
                {detailQuery.isError ? (
                  <p className="mt-3 rounded-xl border border-red-400/20 bg-red-400/[0.08] px-3 py-2 text-xs font-semibold text-red-200">
                    Không lấy được thông tin chi tiết, vui lòng thử lại sau.
                  </p>
                ) : (
                  <>
                    <h3 className="mt-3 text-xl font-black text-white">
                      {detail?.title ??
                        (detailQuery.isLoading
                          ? "Đang tải thông tin..."
                          : "Chưa có thông tin")}
                    </h3>
                    {detail?.subtitle && (
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-creator-muted">
                        {detail.subtitle}
                      </p>
                    )}
                    {detail?.ownerName && (
                      <p className="mt-2 text-sm font-semibold text-zinc-300">
                        Chủ sở hữu: {detail.ownerName}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            <TargetMetadata detail={detail} />
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-creator-muted">
              Lý do xử lý từ admin
            </p>
            <p className="mt-2 whitespace-pre-line text-sm font-medium leading-relaxed text-zinc-300">
              {penalty.reason || "Không có lý do chi tiết."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppealProofLinks({ value }: { value?: string }) {
  const urls = parseProofUrls(value);

  if (urls.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {urls.map((url, index) => (
        <a
          key={`${url}-${index}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-bold text-creator-muted transition hover:border-creator-gold/40 hover:text-creator-gold"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          Minh chứng {index + 1}
        </a>
      ))}
    </div>
  );
}

function AppealSummary({ appeal }: { appeal?: Appeal }) {
  if (!appeal) return null;

  return (
    <div className="mt-4 rounded-2xl border border-creator-gold/20 bg-creator-gold/[0.06] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-white">
            <FileQuestion className="h-4 w-4 text-creator-gold" />
            Khiếu nại đã gửi
          </p>
          <p className="mt-1 text-xs font-semibold text-creator-muted">
            Gửi lúc {formatDateTime(appeal.createdAt)}
          </p>
        </div>
        <span
          className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-black ${statusTone(
            appeal.status,
          )}`}
        >
          {labelForAppealStatus(appeal.status)}
        </span>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-creator-muted">
            Lý do creator gửi
          </p>
          <p className="mt-2 whitespace-pre-line text-sm font-medium leading-relaxed text-zinc-300">
            {appeal.reason || "Không có nội dung."}
          </p>
          <AppealProofLinks value={appeal.proofDocuments} />
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-creator-muted">
            Phản hồi admin
          </p>
          <p className="mt-2 whitespace-pre-line text-sm font-medium leading-relaxed text-zinc-300">
            {appeal.adminNote || "Admin chưa phản hồi khiếu nại này."}
          </p>
          {appeal.reviewedAt && (
            <p className="mt-2 text-xs font-semibold text-creator-muted">
              Xử lý lúc {formatDateTime(appeal.reviewedAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
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
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-2xl border border-creator-gold/15 bg-black/25 p-4"
    >
      <h3 className="text-sm font-black text-white">Tạo khiếu nại</h3>
      <p className="mt-1 text-xs font-semibold leading-relaxed text-creator-muted">
        Hãy nêu rõ vì sao hình phạt này cần được xem lại. Khiếu nại sẽ được gắn
        trực tiếp với vi phạm đang chọn.
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
          className="h-10 rounded-xl border border-white/10 px-4 text-sm font-bold text-creator-muted transition hover:bg-white/10 disabled:opacity-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-creator-gold px-4 text-sm font-black text-black transition hover:bg-[#F3CE5E] disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Gửi khiếu nại
        </button>
      </div>
    </form>
  );
}

function PenaltyCard({
  appeal,
  isAppealOpen,
  onToggleAppeal,
  onViewTargetDetail,
  penalty,
}: {
  appeal?: Appeal;
  isAppealOpen: boolean;
  onToggleAppeal: () => void;
  onViewTargetDetail: () => void;
  penalty: Penalty;
}) {
  const appealDetailQuery = useAppealByPenalty(
    !appeal && penalty.appealStatus ? penalty.penaltyId : undefined,
  );
  const linkedAppeal = appeal ?? appealDetailQuery.data;
  const hasAppeal = Boolean(linkedAppeal || penalty.appealStatus);
  const appealStatus = linkedAppeal?.status ?? penalty.appealStatus;

  return (
    <article className="rounded-2xl border border-white/10 bg-black/25 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.18)] ring-1 ring-white/[0.025]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-white">
              {labelForPenaltyLevel(penalty.level)}
            </p>
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${statusTone(
                penalty.status,
              )}`}
            >
              {labelForPenaltyStatus(penalty.status)}
            </span>
            {appealStatus && (
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${statusTone(
                  appealStatus,
                )}`}
              >
                Khiếu nại: {labelForAppealStatus(appealStatus)}
              </span>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-creator-muted">
            <CalendarClock className="h-3.5 w-3.5" />
            {formatDateTime(penalty.createdAt)}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleAppeal}
          disabled={penalty.status !== "ACTIVE" || hasAppeal}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-creator-gold/25 px-4 text-xs font-black text-creator-gold transition hover:bg-creator-gold/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FileQuestion className="h-4 w-4" />
          {hasAppeal ? "Đã khiếu nại" : "Khiếu nại"}
        </button>
      </div>

      <TargetDetailCard penalty={penalty} onViewDetail={onViewTargetDetail} />

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-[11px] font-black uppercase tracking-wide text-creator-muted">
          Lý do xử lý từ admin
        </p>
        <p className="mt-2 whitespace-pre-line text-sm font-medium leading-relaxed text-zinc-300">
          {penalty.reason || "Không có lý do chi tiết."}
        </p>
        {penalty.revokedAt && (
          <p className="mt-3 text-xs font-semibold text-creator-muted">
            Đã gỡ lúc {formatDateTime(penalty.revokedAt)}
          </p>
        )}
        {penalty.revokeReason && (
          <p className="mt-2 whitespace-pre-line text-xs font-semibold leading-relaxed text-zinc-400">
            Lý do gỡ: {penalty.revokeReason}
          </p>
        )}
      </div>

      {appealDetailQuery.isLoading && !linkedAppeal && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-xs font-semibold text-creator-muted">
          Đang tải thông tin khiếu nại...
        </div>
      )}
      <AppealSummary appeal={linkedAppeal} />
      {isAppealOpen && (
        <AppealForm penalty={penalty} onClose={onToggleAppeal} />
      )}
    </article>
  );
}

export function CreatorViolationsView() {
  const [page, setPage] = useState(1);
  const [selectedTargetPenalty, setSelectedTargetPenalty] =
    useState<Penalty | null>(null);
  const penaltiesQuery = useMyPenalties({ page, pageSize: PAGE_SIZE });
  const appealsQuery = useMyAppeals({ page: 1, pageSize: 20 });
  const [appealPenaltyId, setAppealPenaltyId] = useState<string | null>(null);

  const penalties = useMemo(
    () => penaltiesQuery.data?.content ?? [],
    [penaltiesQuery.data?.content],
  );
  const appeals = useMemo(
    () => appealsQuery.data?.content ?? [],
    [appealsQuery.data?.content],
  );
  const appealsByPenaltyId = useMemo(() => {
    return new Map(appeals.map((appeal) => [appeal.penaltyId, appeal]));
  }, [appeals]);

  return (
    <div className="space-y-6">
      <TargetDetailDialog
        penalty={selectedTargetPenalty}
        onClose={() => setSelectedTargetPenalty(null)}
      />

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">
              Vi Phạm & Khiếu Nại
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-creator-muted">
              Mỗi vi phạm được gắn với nội dung liên quan và trạng thái khiếu
              nại tương ứng để bạn dễ theo dõi.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-[240px]">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-wide text-creator-muted">
                Vi phạm
              </p>
              <p className="mt-1 text-xl font-black text-white">
                {penalties.length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-wide text-creator-muted">
                Khiếu nại
              </p>
              <p className="mt-1 text-xl font-black text-white">
                {appeals.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-white">
          <AlertTriangle className="h-5 w-5 text-creator-gold" />
          Danh sách vi phạm
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
            {penalties.map((penalty) => (
              <PenaltyCard
                key={penalty.penaltyId}
                appeal={appealsByPenaltyId.get(penalty.penaltyId)}
                isAppealOpen={appealPenaltyId === penalty.penaltyId}
                onViewTargetDetail={() => setSelectedTargetPenalty(penalty)}
                onToggleAppeal={() =>
                  setAppealPenaltyId((current) =>
                    current === penalty.penaltyId ? null : penalty.penaltyId,
                  )
                }
                penalty={penalty}
              />
            ))}
          </div>
        )}

        <ModerationPagination
          data={penaltiesQuery.data}
          isFetching={penaltiesQuery.isFetching}
          itemLabel="vi phạm"
          onPageChange={setPage}
        />

        {appealsQuery.isError && (
          <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] px-4 py-3 text-xs font-semibold text-amber-100">
            Không thể tải danh sách khiếu nại đã gửi, trạng thái khiếu nại có
            thể chưa được hiển thị đầy đủ.
          </div>
        )}
      </section>
    </div>
  );
}
