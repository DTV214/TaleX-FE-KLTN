import { CheckCircle2, CircleAlert, Loader2, ShieldQuestion, XCircle } from "lucide-react";
import type { ContentApprovalStatus, MediaStatus } from "@/features/creator-dashboard/api/creator-content-api";

export interface ComicPageSummary {
  id: string;
  status?: MediaStatus;
  approvalStatus?: ContentApprovalStatus;
  errorMessage?: string;
}

interface CountRowProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  total: number;
  colorClass: string;
}

function CountRow({ icon, label, count, total, colorClass }: CountRowProps) {
  if (count === 0) return null;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className={`flex items-center gap-2 text-sm font-medium ${colorClass}`}>
        {icon}
        {label}
      </div>
      <span className={`text-sm font-bold ${colorClass}`}>
        {count}/{total}
      </span>
    </div>
  );
}

/**
 * Tổng hợp tiến trình pipeline cho episode nhiều trang (comic) — thay cho step
 * tracker bám 1 trang duy nhất, vốn gây hiểu nhầm "đứng yên" khi các trang khác
 * đã xử lý xong trong lúc trang đại diện vẫn còn xếp hàng chờ (xử lý song song,
 * giới hạn concurrency phía AI service).
 */
export function ComicPipelineAggregateSummary({ pages }: { pages: ComicPageSummary[] }) {
  const total = pages.length;
  const processingCount = pages.filter(
    (p) => p.status === "PENDING" || p.status === "PROCESSING" || p.status === "HLS_PROCESSING",
  ).length;
  // "Sẵn sàng" — đã qua pipeline, KHÔNG phải "đã xuất bản" (đó là hành động Creator
  // chủ động bấm ở bước cuối XUẤT BẢN, độc lập với trạng thái từng trang ở đây).
  const readyCount = pages.filter((p) => p.status === "ACTIVE" || p.status === "HLS_READY").length;
  const pendingReviewCount = pages.filter(
    (p) => p.status === "INACTIVE" && p.approvalStatus === "PENDING_REVIEW",
  ).length;
  const rejectedCount = pages.filter(
    (p) => p.status === "INACTIVE" && p.approvalStatus === "REJECTED",
  ).length;
  const failedCount = pages.filter((p) => p.status === "FAILED").length;

  const doneCount = readyCount + pendingReviewCount + rejectedCount + failedCount;
  // "Đã xử lý" = số trang đã CÓ KẾT QUẢ (dù đạt hay không) — 100% nghĩa là hệ thống đã
  // xử lý xong hết, KHÔNG có nghĩa "toàn bộ đạt". Đổi màu thanh tiến trình khi có trang
  // bị từ chối/lỗi để không gây hiểu nhầm "mọi thứ đều ổn" lúc nhìn thanh màu vàng/xanh.
  const progress = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  const hasIssue = rejectedCount > 0 || failedCount > 0;

  return (
    <div className="shrink-0 space-y-6 lg:w-96">
      <div className="rounded-xl border border-creator-border bg-creator-sidebar p-6 shadow-xl">
        <h3 className="mb-1 text-xs font-black uppercase tracking-[0.16em] text-creator-gold">
          Quy trình xử lý nội dung
        </h3>
        <p className="mb-6 text-xs text-creator-muted">{total} trang</p>

        <div className="space-y-3">
          <CountRow
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Đã qua kiểm duyệt"
            count={readyCount}
            total={total}
            colorClass="text-green-400"
          />
          <CountRow
            icon={<Loader2 className="h-4 w-4 animate-spin" />}
            label="Đang xử lý"
            count={processingCount}
            total={total}
            colorClass="text-creator-gold"
          />
          <CountRow
            icon={<ShieldQuestion className="h-4 w-4" />}
            label="Chờ đội kiểm duyệt"
            count={pendingReviewCount}
            total={total}
            colorClass="text-amber-400"
          />
          <CountRow
            icon={<XCircle className="h-4 w-4" />}
            label="Bị từ chối"
            count={rejectedCount}
            total={total}
            colorClass="text-red-400"
          />
          <CountRow
            icon={<CircleAlert className="h-4 w-4" />}
            label="Lỗi hệ thống"
            count={failedCount}
            total={total}
            colorClass="text-red-400"
          />
        </div>

        <div className="mt-5 border-t border-creator-border pt-5">
          <div className="mb-2 flex justify-between text-xs font-bold">
            <span className="text-creator-muted">Đã xử lý (đạt lẫn không đạt)</span>
            <span className={hasIssue ? "text-red-400" : "text-creator-gold"}>{progress}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-creator-bg">
            <div
              className={`h-full transition-all duration-500 ${hasIssue ? "bg-red-500" : "bg-creator-gold"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {hasIssue && (
          <p className="mt-4 text-[11px] leading-relaxed text-creator-muted">
            {rejectedCount > 0 && failedCount > 0
              ? "Có trang bị từ chối và trang lỗi hệ thống — "
              : rejectedCount > 0
                ? "Có trang bị từ chối — "
                : "Có trang lỗi hệ thống — "}
            di chuột vào từng trang tương ứng trong lưới ảnh bên trái để xem chi tiết{failedCount > 0 ? " và thử lại" : ""}.
          </p>
        )}

        {pendingReviewCount > 0 && (
          <p className="mt-2 text-[11px] leading-relaxed text-amber-400/90">
            {pendingReviewCount} trang có nội dung tương đồng với creator khác hoặc chứa yếu tố nhạy cảm — đang chờ đội kiểm duyệt xác nhận thủ công trước khi xuất bản.
          </p>
        )}
      </div>
    </div>
  );
}
