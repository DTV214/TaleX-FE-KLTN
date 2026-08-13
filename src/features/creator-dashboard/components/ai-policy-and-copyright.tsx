import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Circle,
  Fingerprint,
  Loader2,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMediaViolations,
  retryMediaPipeline,
  type ContentApprovalStatus,
  type MediaStatus,
  type MediaType,
} from "@/features/creator-dashboard/api/creator-content-api";
import {
  getBlockingCopyrightViolations,
  getHighestSimilarityScore,
  getPermittedCopyrightMatches,
  getRejectedCensorshipResults,
  isMediaPipelinePending,
  translateViolationLabel,
} from "@/features/creator-dashboard/utils/media-violations";
import {
  ComicPipelineAggregateSummary,
  type ComicPageSummary,
} from "@/features/creator-dashboard/components/comic-pipeline-aggregate-summary";

interface AIPolicyAndCopyrightProps {
  mediaId?: string;
  mediaType?: MediaType;
  mediaStatus?: MediaStatus;
  approvalStatus?: ContentApprovalStatus;
  errorMessage?: string;
  /** BE chỉ set field này SAU KHI Content ID xử lý xong thật — tín hiệu đáng tin để biết
   * bước "Kiểm tra bản quyền" đã hoàn tất, không dùng việc violations query trả về hay
   * chưa (API vẫn trả mảng rỗng hợp lệ ngay cả khi chưa xử lý gì, dễ hiểu nhầm là đã xong). */
  contentId?: string;
  /** Kết quả THẬT của bước nhúng watermark chống đạo nhái (có thể fail âm thầm, không
   * chặn cả pipeline) — xem Media.hasWatermark ở BE. */
  hasWatermark?: boolean;
  /** Truyền khi episode có nhiều trang (comic) — hiển thị tổng hợp thay vì bám 1 trang. */
  pages?: ComicPageSummary[];
}

// "review" = bước đã chạy xong nhưng KHÔNG phải kết luận đạt rõ ràng — đang chờ Staff
// xác nhận thủ công (khác "done" thật sự đạt, khác "failed" bị từ chối/lỗi hệ thống).
type StepState = "done" | "active" | "pending" | "review" | "failed";

interface Step {
  key: string;
  label: string;
  state: StepState;
}

const stepDotClass: Record<StepState, string> = {
  done: "border-green-500 bg-green-500/20 text-green-400",
  active: "border-creator-gold bg-creator-gold/20 text-creator-gold",
  pending: "border-creator-border bg-creator-bg text-creator-muted",
  review: "border-amber-500 bg-amber-500/20 text-amber-400",
  failed: "border-red-500 bg-red-500/20 text-red-400",
};

const stepLabelClass: Record<StepState, string> = {
  done: "text-white",
  active: "text-creator-gold",
  pending: "text-creator-muted",
  review: "text-amber-400",
  failed: "text-red-400",
};

function StepDot({ state }: { state: StepState }) {
  if (state === "done") return <CheckCircle2 className="h-4 w-4" />;
  if (state === "active") return <Loader2 className="h-4 w-4 animate-spin" />;
  if (state === "review") return <AlertTriangle className="h-4 w-4" />;
  if (state === "failed") return <CircleAlert className="h-4 w-4" />;
  return <Circle className="h-3 w-3" />;
}

function buildSteps(params: {
  mediaId?: string;
  mediaType?: MediaType;
  mediaStatus?: MediaStatus;
  approvalStatus?: ContentApprovalStatus;
  hasContentId: boolean;
  hasCensorshipResult: boolean;
  hasWatermark?: boolean;
  isFailed: boolean;
  isForceHidden: boolean;
}): Step[] {
  const { mediaId, mediaType, mediaStatus, approvalStatus, hasContentId, hasCensorshipResult, hasWatermark, isFailed, isForceHidden } = params;
  const steps: Step[] = [];

  if (!mediaId) {
    steps.push({ key: "upload", label: "Tải lên nội dung", state: "pending" });
    steps.push({ key: "moderation", label: "Kiểm duyệt nội dung", state: "pending" });
    steps.push({ key: "copyright", label: "Kiểm tra bản quyền", state: "pending" });
    steps.push({ key: "watermark", label: "Nhúng watermark chống đạo nhái", state: "pending" });
    steps.push({ key: "done", label: "Sẵn sàng xuất bản", state: "pending" });
    return steps;
  }

  // "review"/"failed" chỉ có ý nghĩa SAU KHI bước đó đã thật sự chạy xong — chỗ này
  // trước đây chỉ check "có kết quả hay chưa" (hasContentId/hasCensorshipResult) mà
  // không phân biệt kết quả là ĐẠT hay KHÔNG ĐẠT, khiến nội dung bị từ chối vẫn hiện
  // tick xanh "hoàn tất".
  const isRejected = approvalStatus === "REJECTED";
  // PENDING_REVIEW là giá trị mặc định của Media trước khi pipeline từng chạy — chỉ coi
  // là "đang chờ Staff" thật sự khi mediaStatus đã chuyển INACTIVE (BE chỉ set cặp này
  // khi thật sự flag nội dung, xem ContentPipelineServiceImpl).
  const isPendingReview = approvalStatus === "PENDING_REVIEW" && mediaStatus === "INACTIVE";
  // Copyright bị flag chờ Staff thì pipeline dừng lại luôn, KHÔNG dispatch kiểm duyệt —
  // nên "moderation chưa từng chạy" (hasCensorshipResult=false) là dấu hiệu để biết chính
  // xác bước nào đang bị treo chờ Staff, thay vì gán nhầm cho cả 2 bước.
  const copyrightPendingReview = isPendingReview && !hasCensorshipResult;
  const moderationPendingReview = isPendingReview && hasCensorshipResult;

  if (mediaType === "VIDEO") {
    // Video mới upload có status=PENDING (BE cố ý chưa submit job HLS ngay — xem comment
    // ở S3MediaProviderService — để AI Watermark/Copyright/Moderation chạy trước), MediaConvert
    // chỉ thật sự submit job VÀ chuyển status sang HLS_PROCESSING SAU KHI Copyright/Fingerprint
    // trả kết quả (bước cuối cùng, có thể mất vài phút). Trước đây check "!== HLS_PROCESSING"
    // coi PENDING cũng là "đã xong" — báo ✓ xanh ngay từ lúc mới upload dù chưa hề bắt đầu
    // convert. Phải liệt kê rõ đúng trạng thái NÀO là thật sự xong (HLS_READY/ACTIVE).
    const transcodeDone = mediaStatus === "HLS_READY" || mediaStatus === "ACTIVE";
    const transcodeStarted = mediaStatus === "HLS_PROCESSING" || transcodeDone;
    steps.push({
      key: "transcode",
      label: "Xử lý video",
      state: isFailed && !transcodeDone
        ? "failed"
        : transcodeDone
          ? "done"
          : transcodeStarted
            ? "active"
            : "pending",
    });
  }

  // Hiển thị "Kiểm duyệt nội dung" TRƯỚC "Kiểm tra bản quyền" — dù AI tính Fingerprint
  // trước Moderation nội bộ, nhưng kết quả Moderation LUÔN được gửi về BE trước (AI gửi
  // ngay khi xong), còn Copyright phải đợi thêm bước nhúng watermark + tạo preview mới
  // gửi (video A/B HLS có thể mất vài phút). Hiển thị đúng thứ tự HOÀN TẤT thật để tránh
  // cảm giác "bước 2 xong trước bước 1" — trước đây thứ tự hiển thị bị ngược với thứ tự
  // hoàn tất thật, gây hiểu lầm hệ thống chạy lộn xộn (đặc biệt rõ với video, độ trễ tới
  // vài phút giữa 2 bước).
  const transcodeBlocking = mediaType === "VIDEO" && mediaStatus === "HLS_PROCESSING";
  steps.push({
    key: "moderation",
    label: "Kiểm duyệt nội dung",
    state: !hasCensorshipResult
      ? (isFailed ? "failed" : "active")
      : isRejected
        ? "failed"
        : moderationPendingReview
          ? "review"
          : "done",
  });

  steps.push({
    key: "copyright",
    label: "Kiểm tra bản quyền",
    state: !hasContentId
      ? (isFailed ? "failed" : transcodeBlocking ? "pending" : "active")
      : copyrightPendingReview
        ? "review"
        : "done",
  });

  // "Sẵn sàng xuất bản" chỉ cần 3 bước trên xong — watermark nhúng THÀNH CÔNG HAY KHÔNG
  // không chặn xuất bản (AI bắt exception, tự bỏ qua watermark nếu lỗi chứ không làm
  // hỏng cả pipeline — xem kafka_consumer_service.py), nên tính allPriorDone TRƯỚC khi
  // thêm bước watermark vào mảng, tránh 1 lần nhúng watermark lỗi chặn nhầm publish.
  const allPriorDone = steps.every((s) => s.state === "done");

  // Nhúng watermark hoàn tất CÙNG LÚC với Kiểm tra bản quyền (2 kết quả gửi chung 1
  // message từ AI — xem CopyrightResultMessage.watermarkedS3Key), nên dùng chung tín hiệu
  // hasContentId để biết ĐÃ CÓ kết quả hay chưa; hasWatermark mới là kết quả THẬT (đạt hay
  // fail). Media cũ tạo trước khi có field này sẽ mặc định hasWatermark=false — không phân
  // biệt được với "thật sự fail", chấp nhận rủi ro nhỏ này thay vì thêm phức tạp không cần thiết.
  steps.push({
    key: "watermark",
    label: "Nhúng watermark chống đạo nhái",
    state: !hasContentId
      ? (isFailed ? "failed" : transcodeBlocking ? "pending" : "active")
      : hasWatermark
        ? "done"
        : "failed",
  });

  // isForceHidden: nội dung ĐÃ qua hết pipeline và từng được duyệt (2 bước trên vẫn đúng
  // là "done") nhưng sau đó bị quản trị viên tạm ẩn khỏi công khai — khác hẳn "chưa xong"
  // hay "bị từ chối", nên tách riêng label/state thay vì lẫn vào "Sẵn sàng xuất bản".
  steps.push({
    key: "done",
    label: isForceHidden ? "Tạm ẩn bởi quản trị viên" : "Sẵn sàng xuất bản",
    state: isForceHidden
      ? "review"
      : isFailed || isRejected
        ? "failed"
        : isPendingReview
          ? "review"
          : allPriorDone
            ? "done"
            : "pending",
  });

  return steps;
}

export function AIPolicyAndCopyright(props: AIPolicyAndCopyrightProps) {
  const persistedPages = props.pages?.filter((p) => !p.id.startsWith("LOCAL-"));
  if (persistedPages && persistedPages.length > 1) {
    return <ComicPipelineAggregateSummary pages={persistedPages} />;
  }
  return <SingleMediaPipelinePanel {...props} />;
}

function SingleMediaPipelinePanel({
  mediaId,
  mediaType,
  mediaStatus,
  approvalStatus,
  errorMessage,
  contentId,
  hasWatermark,
}: AIPolicyAndCopyrightProps) {
  const queryClient = useQueryClient();
  const mediaState = { status: mediaStatus, approvalStatus };
  const isFailed = mediaStatus === "FAILED";
  // isMediaPipelinePending() coi MỌI approvalStatus="PENDING_REVIEW" là "đang chạy" (vì
  // đây cũng là giá trị mặc định trước khi pipeline từng chạy) — nên không dùng
  // "!pipelinePending" để suy ra "đã bị flag thật sự". Chỉ khi mediaStatus đã chuyển
  // INACTIVE mới chắc chắn là BE đã chủ động flag (xem ContentPipelineServiceImpl).
  const isPendingReview = approvalStatus === "PENDING_REVIEW" && mediaStatus === "INACTIVE";
  const isRejected = approvalStatus === "REJECTED";
  // Nội dung đã được duyệt (approvalStatus vẫn APPROVED) nhưng quản trị viên tạm ẩn khỏi
  // công khai sau đó (xem MediaServiceImpl.forceHide) — khác isRejected (chưa đạt, cần
  // sửa) và isPendingReview (đang chờ duyệt lần đầu), nên phải phân biệt riêng.
  const isForceHidden = mediaStatus === "FORCE_HIDDEN";
  // Loại trừ 3 trạng thái TERMINAL (đã có kết luận cuối, dù là gì) khỏi "đang pending" —
  // nếu không, card "Chi tiết bản quyền" sẽ kẹt mãi ở "Đang đối chiếu bản quyền..." dù
  // copyright/kiểm duyệt đã xong thật, chỉ là kết quả cuối là PENDING_REVIEW/REJECTED.
  const pipelinePending = isMediaPipelinePending(mediaState) && !isFailed && !isPendingReview && !isRejected;

  const violationsQuery = useQuery({
    queryKey: ["creator-dashboard", "media-violations", mediaId],
    queryFn: () => getMediaViolations(mediaId!),
    enabled: Boolean(mediaId),
    refetchInterval: pipelinePending ? 5000 : false,
  });

  const violations = violationsQuery.data;
  const blockingCopyright = getBlockingCopyrightViolations(violations);
  const permittedCopyright = getPermittedCopyrightMatches(violations);
  const hasBlockingCopyright = blockingCopyright.length > 0;
  const similarityScore = (getHighestSimilarityScore(violations) * 100).toFixed(1);
  const rejectionLabels = getRejectedCensorshipResults(violations)
    .map((item) => translateViolationLabel(item.primaryViolationLabel))
    .filter(Boolean)
    .join(", ");

  const retryMutation = useMutation({
    mutationFn: () => retryMediaPipeline(mediaId!),
    onSuccess: () => {
      toast.success("Đã gửi yêu cầu thử lại", {
        description: "Hệ thống đang xử lý lại nội dung, vui lòng chờ trong giây lát.",
      });
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "media"] });
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "media-violations", mediaId] });
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "episodes"] });
      queryClient.invalidateQueries({ queryKey: ["media"] });
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
    },
    onError: () => {
      toast.error("Thử lại thất bại", {
        description: "Không thể gửi yêu cầu thử lại, vui lòng thử lại sau.",
      });
    },
  });

  // Dùng contentId (BE chỉ set SAU KHI Content ID xử lý xong thật) làm tín hiệu duy nhất —
  // KHÔNG dùng Boolean(violations), vì violations query vẫn trả về mảng rỗng hợp lệ ngay
  // cả khi copyright chưa hề chạy (chưa có record nào), dễ hiểu nhầm "đã xong, không vi
  // phạm gì" ngay lúc vừa upload xong.
  const copyrightResolved = Boolean(contentId);

  const steps = buildSteps({
    mediaId,
    mediaType,
    mediaStatus,
    approvalStatus,
    hasContentId: copyrightResolved,
    hasWatermark,
    // Ưu tiên mediaStatus==="ACTIVE" — BE CHỈ set ACTIVE sau khi kiểm duyệt pass thật
    // (xem ContentPipelineServiceImpl.handleModerationResult), tín hiệu này cập nhật
    // nhanh cùng lúc với toast SSE. Không dựa DUY NHẤT vào violations query — nó là 1
    // query riêng biệt, có thể fetch xong TRƯỚC KHI censorship record kịp lưu vào DB,
    // khiến panel kẹt ở "active" dù toast đã báo hoàn tất (race giữa 2 nguồn dữ liệu).
    hasCensorshipResult: (violations?.censorshipResults.length ?? 0) > 0 || mediaStatus === "ACTIVE",
    isFailed,
    isForceHidden,
  });

  const doneCount = steps.filter((s) => s.state === "done").length;
  const progress = !mediaId ? 0 : Math.round((doneCount / steps.length) * 100);

  return (
    <div className="shrink-0 space-y-6 lg:w-96">
      <div className="rounded-xl border border-creator-border bg-creator-sidebar p-6 shadow-xl">
        <h3 className="mb-6 text-xs font-black uppercase tracking-[0.16em] text-creator-gold">
          Quy trình xử lý nội dung
        </h3>

        <ol className="space-y-4">
          {steps.map((step) => (
            <li key={step.key} className="flex items-center gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${stepDotClass[step.state]}`}
              >
                <StepDot state={step.state} />
              </span>
              <span className={`text-sm font-medium ${stepLabelClass[step.state]}`}>{step.label}</span>
            </li>
          ))}
        </ol>

        <div className="mt-5 border-t border-creator-border pt-5">
          <div className="mb-2 flex justify-between text-xs font-bold">
            <span className="text-creator-muted">Tiến trình</span>
            <span className="text-creator-gold">{progress}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-creator-bg">
            <div
              className="h-full bg-creator-gold transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {isFailed && (
          <div className="mt-5 space-y-3 border-t border-creator-border pt-5">
            <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs font-bold text-red-400">
              <CircleAlert className="h-4 w-4 shrink-0" />
              <span>{errorMessage || "Xử lý nội dung thất bại. Vui lòng thử lại."}</span>
            </div>
            <button
              type="button"
              onClick={() => retryMutation.mutate()}
              disabled={retryMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-creator-gold/40 bg-creator-gold/10 px-4 py-2 text-xs font-bold text-creator-gold transition-colors hover:bg-creator-gold/20 disabled:opacity-50"
            >
              {retryMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCw className="h-4 w-4" />
              )}
              Thử lại
            </button>
          </div>
        )}

        {isForceHidden && (
          <div className="mt-5 flex items-start gap-2 border-t border-creator-border pt-5 text-xs text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Nội dung tạm ngừng hiển thị công khai</p>
              <p className="leading-relaxed text-amber-400/90">
                Nội dung này đã được duyệt trước đó nhưng hiện đang tạm ngừng hiển thị công khai theo quyết định của đội ngũ quản trị. Vui lòng liên hệ bộ phận hỗ trợ để được giải thích chi tiết.
              </p>
            </div>
          </div>
        )}

        {isPendingReview && (
          <div className="mt-5 flex items-start gap-2 border-t border-creator-border pt-5 text-xs text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Nội dung cần kiểm duyệt thủ công</p>
              <p className="leading-relaxed text-amber-400/90">
                {hasBlockingCopyright
                  ? `Phát hiện ${blockingCopyright.length} đoạn nội dung tương đồng ${similarityScore}% với nội dung đã có trên hệ thống của creator khác — vui lòng chờ xác nhận đây có thật sự vi phạm bản quyền hay không trước khi xuất bản.`
                  : rejectionLabels
                    ? `Nội dung có yếu tố nhạy cảm (${rejectionLabels}) — vui lòng chờ xác nhận thủ công trước khi xuất bản.`
                    : "Vui lòng chờ xác nhận thủ công trước khi xuất bản."}
              </p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="mt-5 flex items-start gap-2 border-t border-creator-border pt-5 text-xs text-red-400">
            <CircleAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Nội dung chưa đạt yêu cầu kiểm duyệt</p>
              <p className="leading-relaxed text-red-400/90">
                {rejectionLabels
                  ? `Lý do: phát hiện ${rejectionLabels}. Vui lòng chỉnh sửa hoặc thay thế nội dung trước khi tải lên lại.`
                  : "Vui lòng chỉnh sửa hoặc thay thế nội dung trước khi tải lên lại."}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-xl border border-creator-border bg-creator-sidebar p-6 shadow-xl">
        <div className="absolute right-0 top-0 p-6 opacity-10">
          <Fingerprint size={100} />
        </div>
        <div className="relative z-10">
          <h3 className="mb-6 text-xs font-black uppercase tracking-[0.16em] text-creator-gold">
            Chi tiết bản quyền
          </h3>

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
          ) : violationsQuery.isError ? (
            // Phân biệt rõ "lỗi tải dữ liệu" với "sạch, không vi phạm" — trước đây lỗi
            // fetch khiến violations=undefined, các hàm lọc mặc định trả mảng rỗng, hiển
            // thị y hệt trường hợp thật sự không có vi phạm, dễ khiến Creator lầm tưởng
            // đã kiểm tra xong trong khi dữ liệu chưa tải được.
            <CopyrightNotice state="error" icon={<CircleAlert className="h-5 w-5" />}>
              Không thể tải dữ liệu bản quyền — vui lòng tải lại trang
            </CopyrightNotice>
          ) : !copyrightResolved ? (
            <CopyrightNotice state="pending" icon={<Loader2 className="h-5 w-5 animate-spin" />}>
              Đang đối chiếu bản quyền...
            </CopyrightNotice>
          ) : hasBlockingCopyright ? (
            <CopyrightNotice state="failed" icon={<CircleAlert className="h-5 w-5" />}>
              Phát hiện {blockingCopyright.length} đoạn trùng, vui lòng chờ kiểm duyệt thủ công
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
        </div>
      </div>
    </div>
  );
}

const noticeClass: Record<"idle" | "pending" | "passed" | "failed" | "error", string> = {
  idle: "border-gray-500/20 bg-gray-500/10 text-gray-400",
  pending: "border-creator-gold/20 bg-creator-gold/10 text-creator-gold",
  passed: "border-green-500/20 bg-green-500/10 text-green-400",
  failed: "border-red-500/20 bg-red-500/10 text-red-400",
  error: "border-amber-500/20 bg-amber-500/10 text-amber-400",
};

function CopyrightNotice({
  state,
  icon,
  children,
}: {
  state: keyof typeof noticeClass;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`mb-2 flex items-center gap-3 rounded-lg border p-3 ${noticeClass[state]}`}>
      <span className="shrink-0">{icon}</span>
      <span className="text-xs font-bold">{children}</span>
    </div>
  );
}
