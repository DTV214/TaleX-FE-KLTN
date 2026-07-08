import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  CircleAlert,
  Fingerprint,
  Loader2,
  ScanSearch,
} from "lucide-react";
import {
  getMediaViolations,
  type ContentApprovalStatus,
  type MediaStatus,
} from "@/features/creator-dashboard/api/creator-content-api";
import {
  getApprovedCensorshipResults,
  getBlockingCopyrightViolations,
  getHighestSimilarityScore,
  getPermittedCopyrightMatches,
  getRejectedCensorshipResults,
  isMediaPipelinePending,
} from "@/features/creator-dashboard/utils/media-violations";

interface AIPolicyAndCopyrightProps {
  mediaId?: string;
  mediaStatus?: MediaStatus;
  approvalStatus?: ContentApprovalStatus;
}

const badgeClass = {
  idle: "border-gray-500/20 bg-gray-500/10 text-gray-400",
  pending: "border-creator-gold/20 bg-creator-gold/10 text-creator-gold",
  passed: "border-green-500/20 bg-green-500/10 text-green-400",
  failed: "border-red-500/20 bg-red-500/10 text-red-400",
};

function StatusBadge({
  state,
  children,
}: {
  state: keyof typeof badgeClass;
  children: React.ReactNode;
}) {
  return (
    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${badgeClass[state]}`}>
      {children}
    </span>
  );
}

export function AIPolicyAndCopyright({
  mediaId,
  mediaStatus,
  approvalStatus,
}: AIPolicyAndCopyrightProps) {
  const mediaState = { status: mediaStatus, approvalStatus };
  const pipelinePending = isMediaPipelinePending(mediaState);
  const violationsQuery = useQuery({
    queryKey: ["creator-dashboard", "media-violations", mediaId],
    queryFn: () => getMediaViolations(mediaId!),
    enabled: Boolean(mediaId),
    refetchInterval: pipelinePending ? 5000 : false,
  });

  const violations = violationsQuery.data;
  const blockingCopyright = getBlockingCopyrightViolations(violations);
  const permittedCopyright = getPermittedCopyrightMatches(violations);
  const rejectedCensorship = getRejectedCensorshipResults(violations);
  const approvedCensorship = getApprovedCensorshipResults(violations);
  const hasBlockingCopyright = blockingCopyright.length > 0;
  const hasRejectedCensorship = rejectedCensorship.length > 0;
  const hasApprovedCensorship = approvedCensorship.length > 0;
  const isFailed = mediaStatus === "FAILED";
  const isRejected = approvalStatus === "REJECTED";
  const isInitialLoading = violationsQuery.isLoading && !violations;
  const isComplete =
    approvalStatus === "APPROVED" || isRejected || isFailed || Boolean(violations && !pipelinePending);
  const progress = !mediaId ? 0 : isComplete ? 100 : 50;
  const similarityScore = (getHighestSimilarityScore(violations) * 100).toFixed(1);
  const rejectionLabels = rejectedCensorship
    .map((item) => item.primaryViolationLabel)
    .filter(Boolean)
    .join(", ");

  const moderationBadge = !mediaId ? (
    <StatusBadge state="idle">Chưa kiểm tra</StatusBadge>
  ) : isInitialLoading || pipelinePending ? (
    <StatusBadge state="pending">Đang quét...</StatusBadge>
  ) : violationsQuery.isError ? (
    <StatusBadge state="failed">Không tải được</StatusBadge>
  ) : hasRejectedCensorship ? (
    <StatusBadge state="failed">Không đạt</StatusBadge>
  ) : hasApprovedCensorship || approvalStatus === "APPROVED" ? (
    <StatusBadge state="passed">Đạt</StatusBadge>
  ) : isRejected && hasBlockingCopyright ? (
    <StatusBadge state="idle">Không thực hiện</StatusBadge>
  ) : isFailed ? (
    <StatusBadge state="failed">Quét thất bại</StatusBadge>
  ) : (
    <StatusBadge state="pending">Đang chờ...</StatusBadge>
  );

  return (
    <div className="shrink-0 space-y-6 lg:w-96">
      <div className="rounded-xl border border-creator-border bg-creator-sidebar p-6 shadow-xl">
        <h3 className="mb-6 text-xs font-black uppercase tracking-[0.16em] text-creator-gold">
          AI kiểm duyệt nội dung
        </h3>
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm font-medium text-white">
              <ScanSearch className="h-4 w-4 text-creator-muted" />
              Kết quả kiểm duyệt
            </div>
            {moderationBadge}
          </div>

          {hasRejectedCensorship && rejectionLabels && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs font-bold text-red-400">
              Phát hiện: {rejectionLabels}
            </div>
          )}

          <div className="mt-5 border-t border-creator-border pt-5">
            <div className="mb-2 flex justify-between text-xs font-bold">
              <span className="text-creator-muted">Tiến trình kiểm tra</span>
              <span className="text-creator-gold">{progress}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-creator-bg">
              <div
                className="h-full bg-creator-gold transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-creator-border bg-creator-sidebar p-6 shadow-xl">
        <div className="absolute right-0 top-0 p-6 opacity-10">
          <Fingerprint size={100} />
        </div>
        <div className="relative z-10">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.16em] text-creator-gold">
              Bảo vệ bản quyền
            </h3>
            <span className="rounded border border-creator-border bg-creator-bg px-2 py-0.5 text-[10px] font-bold text-creator-muted">
              Hệ thống MILVUS V2
            </span>
          </div>

          <div className="mb-6 flex aspect-video items-center justify-center rounded-lg border border-creator-border bg-[#090807]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-creator-gold/20 bg-creator-gold/10">
              <Fingerprint className="h-6 w-6 text-creator-gold" />
            </div>
          </div>

          <div className="mb-4 flex items-end justify-between">
            <span className="text-sm font-medium text-creator-muted">Chỉ số tương đồng cao nhất</span>
            <span className="text-2xl font-bold text-white">
              {!mediaId ? "0%" : `${similarityScore}%`}
            </span>
          </div>

          {!mediaId ? (
            <CopyrightNotice state="idle" icon={<CircleAlert className="h-5 w-5" />}>
              Chưa kiểm tra tài nguyên
            </CopyrightNotice>
          ) : isInitialLoading || pipelinePending ? (
            <CopyrightNotice state="pending" icon={<Loader2 className="h-5 w-5 animate-spin" />}>
              Đang đối chiếu bản quyền...
            </CopyrightNotice>
          ) : violationsQuery.isError ? (
            <CopyrightNotice state="failed" icon={<CircleAlert className="h-5 w-5" />}>
              Không tải được kết quả bản quyền
            </CopyrightNotice>
          ) : hasBlockingCopyright ? (
            <CopyrightNotice state="failed" icon={<CircleAlert className="h-5 w-5" />}>
              Phát hiện {blockingCopyright.length} đoạn trùng không được phép
            </CopyrightNotice>
          ) : permittedCopyright.length > 0 ? (
            <CopyrightNotice state="passed" icon={<CheckCircle2 className="h-5 w-5" />}>
              Các đoạn trùng đều thuộc nguồn được phép sử dụng
            </CopyrightNotice>
          ) : (
            <CopyrightNotice state="passed" icon={<CheckCircle2 className="h-5 w-5" />}>
              Không phát hiện vi phạm bản quyền
            </CopyrightNotice>
          )}

          <p className="mx-auto max-w-[240px] text-center text-[10px] leading-relaxed text-creator-muted">
            Kết quả được hiển thị trực tiếp theo quy trình đối chiếu và kiểm duyệt của hệ thống.
          </p>
        </div>
      </div>
    </div>
  );
}

function CopyrightNotice({
  state,
  icon,
  children,
}: {
  state: keyof typeof badgeClass;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`mb-4 flex items-center gap-3 rounded-lg border p-3 ${badgeClass[state]}`}>
      <span className="shrink-0">{icon}</span>
      <span className="text-xs font-bold">{children}</span>
    </div>
  );
}
