"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PlayCircle,
  ImagePlus,
  Video,
  ShieldAlert,
  AlertTriangle,
  Fingerprint,
  BarChart3,
} from "lucide-react";
import { CreatorSeasonsList } from "@/features/creator-dashboard/components/creator-seasons-list";
import { CreatorEpisodesList } from "@/features/creator-dashboard/components/creator-episodes-list";
import { CreatorBackButton } from "@/features/creator-dashboard/components/creator-back-button";
import { CreatorSeriesList } from "@/features/creator-dashboard/components/creator-series-list";
import { EpisodeAnalyticsModal } from "@/features/creator-dashboard/components/views/episode-analytics-modal";
import { CreatorLayout } from "@/features/creator-dashboard/components/creator-layout";
import {
  CreatorStepper,
  StepState,
} from "@/features/creator-dashboard/components/creator-stepper";
import { CoreIdentityStep } from "@/features/creator-dashboard/components/steps/core-identity-step";
import { SeasonStructureStep } from "@/features/creator-dashboard/components/steps/season-structure-step";
import { MediaUploadStep } from "@/features/creator-dashboard/components/steps/media-upload-step";
import { ReadyPublishStep } from "@/features/creator-dashboard/components/steps/ready-publish-step";
import { FinalReviewStep } from "@/features/creator-dashboard/components/steps/final-review-step";
import { FinalReviewComicStep } from "@/features/creator-dashboard/components/steps/final-review-comic-step";
import { DashboardOverviewView } from "@/features/creator-dashboard/components/views/dashboard-overview-view";
import { CreatorAnalyticsLogsView } from "@/features/creator-dashboard/components/views/creator-analytics-logs-view";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clapperboard,
  CloudUpload,
  Edit3,
  Eye,
  FileVideo,
  GripVertical,
  Image as ImageIcon,
  Info,
  Library,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Tag,
  Trash2,
  UploadCloud,
  Wallet,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
  createEpisode,
  createComicPageMedia,
  createSeries,
  createSeason,
  deleteEpisode,
  deleteMedia,
  deleteSeason,
  deleteSeries,
  hideSeries,
  unhideSeries,
  hideSeason,
  unhideSeason,
  hideEpisode,
  unhideEpisode,
  listEpisodesBySeason,
  listMediaByEpisode,
  listSeasonsBySeries,
  listSeriesByCreator,
  reorderEpisodeMedia,
  scheduleEpisodePublish,
  cancelEpisodeSchedulePublish,
  publishEpisode,
  updateEpisode,
  updateEpisodeUnlockSettings,
  updateSeason,
  updateSeries,
  type ContentApprovalStatus as ApiContentApprovalStatus,
  type EpisodeUnlockType,
  type EpisodeResponse,
  type MediaStatus,
  type MediaResponse,
  type SeasonResponse,
  type SeriesResponse,
  getCategories,
  getTags,
  getMediaViolations,
} from "@/features/creator-dashboard/api/creator-content-api";
import { uploadImageToS3 } from "@/features/creator-dashboard/api/s3-upload-api";
import { toast } from "sonner";
import { ResumableVideoUploader } from "@/features/creator-dashboard/components/resumable-video-uploader";
import { ViolationDetailDialog } from "@/features/creator-dashboard/components/violation-detail-dialog";
import {
  usePipelineSSE,
  pipelineToastId,
} from "@/features/creator-dashboard/hooks/use-pipeline-sse";
import { SignedHlsPlayer } from "@/features/playback/components/signed-hls-player";
import { ComboManagementView } from "@/features/creator-dashboard/components/combo-management";
import { CreatorMonetizationView } from "@/features/creator-dashboard/components/views/creator-monetization-view";
import {
  creatorMonetizationKeys,
  getCreatorVerificationStatus,
} from "@/features/creator-dashboard/api/creator-monetization-api";
import { CreatorPaymentProfilesView } from "@/features/creator-dashboard/components/views/creator-payment-profiles-view";
import { CreatorProfileView } from "@/features/creator-dashboard/components/views/creator-profile-view";
import { CreatorCampaignPurchaseView } from "@/features/creator-dashboard/components/views/creator-campaign-purchase-view";
import { CreatorCampaignsView } from "@/features/creator-dashboard/components/views/creator-campaigns-view";
import { CreatorViolationsView } from "@/features/moderation-reports/components/creator-violations-view";
import { CreatorSettlementsView } from "@/features/creator-settlements/components/creator-settlements-view";
import { CreatorRevenueTransactionsView } from "@/features/creator-revenue-transactions/components/creator-revenue-transactions-view";
import { AIPolicyAndCopyright } from "@/features/creator-dashboard/components/ai-policy-and-copyright";
import { mediaSystemConfigApi } from "@/features/admin/api/media-system-config.api";
import {
  getBlockingCopyrightViolations,
  getRejectedCensorshipResults,
  isMediaPipelinePending,
  isMediaReadyForPublish,
} from "@/features/creator-dashboard/utils/media-violations";
import { DashboardView, DashboardRouteState, ContentType, ApiLifecycleStatus, SeriesStatus, SeasonStatus, EpisodeStatus, ContentApprovalStatus, Visibility, EditModalState, EditSubmitState, CreateSeriesInput, DeleteModalState, ScheduleModalState, ActiveScheduleModal, SeriesRow, SeasonRow, EpisodeRow, EpisodeUnlockSettingsUpdate, ComicPage } from "@/features/creator-dashboard/types/dashboard.types";
import { cx, formatNumber, formatBytes, formatApprovalStatusLabel, getApprovalChipClass, formatMediaStatusLabel, formatDateTime, splitDateTimeLocalValue, isPastDateTimeLocalValue, combineDateAndTimeLocalValue, getStatusBadgeStyle, formatStatusLabel, reorderPages, isLocalPageId, isRenderableAssetUrl, normalizeAssetUrl, readFormString, readFormNumber, splitIdList, openNativePicker, isPlayableVideoStatus, isProcessingVideoStatus, isBackendMediaTarget, getMediaTargetId, FORCE_HIDDEN_REASON_TOOLTIP } from "@/features/creator-dashboard/components/shared/utils";
import { Panel, PanelHeader, MetricBox, ApiStateNote, SelectionStatePanel, SeriesCoverImage } from "@/features/creator-dashboard/components/shared/panels";
import { ModalShell, ModalActions, DeleteEntityModal, SchedulePublishModal, EditEntityModal } from "@/features/creator-dashboard/components/shared/modals";
import { Field, MultiSelectField, EpisodeUnlockFields } from "@/features/creator-dashboard/components/shared/form-fields";
import { DashboardNavButton, MobileTab, FilterTab, ModelStep } from "@/features/creator-dashboard/components/shared/tabs-nav";
import { SeriesManagementView, SeriesTableRow } from "@/features/creator-dashboard/components/views/series-management-view";
import { SeasonManagementView, SeasonCard } from "@/features/creator-dashboard/components/views/season-management-view";
import { EpisodeManagementView, EpisodeTableRow } from "@/features/creator-dashboard/components/views/episode-management-view";
import { ComicUploadView, ComicPageCard } from "@/features/creator-dashboard/components/views/comic-upload-view";
import { VideoUploadView, VideoProcessingState } from "@/features/creator-dashboard/components/views/video-upload-view";
const dashboardViews: DashboardView[] = [
  "dashboard",
  "series",
  "seasons",
  "episodes",
  "create",
  "comic",
  "video",
  "combos",
  "profile",
  "monetization",
  "payment-profiles",
  "violations",
  "campaign",
  "campaigns",
  "publish",
  "analytics",
  "revenue",
  "settlements",
];

const monetizationRequiredViews: DashboardView[] = ["revenue", "settlements", "combos"];

const defaultDashboardRouteState: DashboardRouteState = {
  view: "dashboard",
  seriesId: "",
  seasonId: "",
  episodeId: "",
};

function isDashboardView(value: string | null): value is DashboardView {
  return dashboardViews.includes(value as DashboardView);
}

function readDashboardRouteState(): DashboardRouteState {
  if (typeof window === "undefined") {
    return defaultDashboardRouteState;
  }

  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get("view");

  return {
    view: isDashboardView(viewParam) ? viewParam : "dashboard",
    seriesId: params.get("seriesId") ?? "",
    seasonId: params.get("seasonId") ?? "",
    episodeId: params.get("episodeId") ?? "",
  };
}

function writeDashboardRouteState(nextState: DashboardRouteState) {
  if (typeof window === "undefined") {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  params.set("view", nextState.view);

  const nextIds = {
    seriesId: nextState.seriesId,
    seasonId: nextState.seasonId,
    episodeId: nextState.episodeId,
  };

  Object.entries(nextIds).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
      return;
    }

    params.delete(key);
  });

  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  window.history.replaceState(null, "", nextUrl);
}

function isVerifiedPaymentStatus(status: unknown) {
  return String(status ?? "").trim().toUpperCase() === "VERIFIED";
}

function MonetizationRequiredPanel({
  title,
  isChecking,
  onStart,
}: {
  title: string;
  isChecking: boolean;
  onStart: () => void;
}) {
  return (
    <section className="creator-shine-card relative overflow-hidden rounded-[2rem] border border-creator-gold/25 bg-black/45 p-8 text-white shadow-[0_24px_90px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-creator-gold/80 to-transparent" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-3xl items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-creator-gold/25 bg-creator-gold/10 text-creator-gold">
            {isChecking ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : (
              <Lock className="h-7 w-7" />
            )}
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-creator-gold">
              Cần bật kiếm tiền
            </p>
            <h2 className="mt-2 text-3xl font-black">{title} chưa khả dụng</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-creator-muted">
              Hoàn tất điều khoản, thông tin thuế và tài khoản thanh toán để mở
              khóa mục này. Các thao tác tạo tác phẩm và quản lý nội dung khác
              vẫn hoạt động bình thường.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-creator-gold px-6 text-sm font-black text-black shadow-[0_18px_44px_rgba(226,177,60,0.2)] transition hover:bg-creator-gold-hover"
        >
          Thực hiện bật kiếm tiền
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

const viewMeta: Record<
  DashboardView,
  { title: string; description: string; action?: string }
> = {
  series: {
    title: "Quản lý Series",
    description:
      "Tất cả các series của bạn được liệt kê ở đây. Mở một series để quản lý các mùa, sau đó đến các tập.",
    action: "Tạo Series Mới",
  },
  seasons: {
    title: "Quản lý Mùa",
    description:
      "Một series có thể có một hoặc nhiều mùa. Mở một mùa để quản lý các tập của mùa đó.",
    action: "Tạo Mùa",
  },
  episodes: {
    title: "Quản lý Tập",
    description:
      "Các tập là thành phần của mùa, áp dụng cho cả truyện tranh và video.",
    action: "Tạo Tập",
  },
  create: {
    title: "Tạo Series mới",
    description:
      "Thiết lập series truyện tranh hoặc video theo mô hình Series.",
  },
  comic: {
    title: "Tải lên truyện tranh",
    description: "Cập nhật tập truyện tranh và sắp xếp trang theo thứ tự.",
  },
  video: {
    title: "Tải lên video truyện",
    description: "Cập nhật tập video và gắn một video đang hoạt động.",
  },
  combos: {
    title: "Quản lý Combo",
    description: "Gom nhiều tập thành một combo với giá ưu đãi riêng.",
  },
  profile: {
    title: "Hồ sơ",
    description: "Quản lý thông tin định danh và hồ sơ thuế của Creator.",
  },
  monetization: {
    title: "Kiếm tiền",
    description:
      "Hoàn thành các bước điều khoản, thuế và thanh toán để bật doanh thu Creator.",
  },
  "payment-profiles": {
    title: "Tài khoản thanh toán",
    description:
      "Quản lý tài khoản ngân hàng nhận doanh thu và theo dõi trạng thái duyệt hồ sơ.",
  },
  violations: {
    title: "Vi phạm & Khiếu nại",
    description:
      "Theo dõi hình phạt vi phạm và gửi khiếu nại để admin xem lại quyết định xử lý.",
  },
  publish: {
    title: "Xuất bản",
    description: "Xuất bản nội dung của bạn",
  },
  campaign: {
    title: "Đẩy mạnh tương tác",
    description:
      "Tiếp cận hàng ngàn độc giả và khán giả mới bằng các gói đẩy xu hướng.",
  },
  campaigns: {
    title: "Chiến dịch",
    description: "Theo dõi các chiến dịch tăng tương tác đã tạo.",
  },
  dashboard: {
    title: "Tổng quan",
    description: "Xem số liệu phân tích và hiệu suất tổng thể của kênh.",
  },
  analytics: {
    title: "Thống kê",
    description: "Phân tích chi tiết số lượt xem và tương tác của độc giả.",
  },
  settlements: {
    title: "Quyết toán",
    description: "Theo dõi kỳ quyết toán, thuế PIT và trạng thái chi trả theo tháng.",
  },
  revenue: {
    title: "Doanh thu",
    description: "Theo dõi thống kê doanh thu, biểu đồ tăng trưởng và biến động lợi nhuận.",
  },
};

function subscribeToClientMount() {
  return () => { };
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}


async function uploadSeriesArtwork(
  file: File | undefined,
  label: string,
  imageContext: "cover" | "banner" = "cover",
) {
  if (!file) {
    return undefined;
  }

  try {
    const result = await uploadImageToS3(file, imageContext);
    return result.publicUrl;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Tải lên thất bại.";
    throw new Error(`${label} upload failed: ${message}`);
  }
}

function mapSeriesResponse(series: SeriesResponse): SeriesRow {
  return {
    id: series.seriesId,
    creatorId: series.creatorId,
    title: series.title,
    subtitle:
      series.categories?.[0]?.categoryName ||
      series.tags?.[0]?.tagName ||
      series.language ||
      "Creator series",
    description: series.description || "",
    coverUrl: normalizeAssetUrl(series.coverUrl),
    bannerUrl: normalizeAssetUrl(series.bannerUrl),
    contentType: series.contentType,
    status: series.status,
    visibility: series.visibility || "PUBLIC",
    ageRating: series.ageRating || "",
    contentWarnings: series.contentWarnings || [],
    language: series.language || "",
    categoryIds:
      series.categories?.map((category) => category.categoryId) ?? [],
    tagIds: series.tags?.map((tag) => tag.tagId) ?? [],
    views: formatNumber(series.totalViews),
    episodes: 0,
  };
}

function mapSeasonResponse(season: SeasonResponse): SeasonRow {
  return {
    id: season.seasonId,
    seriesId: season.seriesId,
    seasonNumber: season.seasonNumber ?? 1,
    title: season.title,
    description: season.description || "No description yet.",
    status: season.status,
    episodes: 0,
    publishedEpisodes: 0,
    updatedAt: season.updatedAt || season.createdAt || "-",
  };
}

function mapEpisodeResponse(episode: EpisodeResponse): EpisodeRow {
  return {
    id: episode.episodeId,
    seasonId: episode.seasonId,
    episodeNumber: episode.episodeNumber ?? 1,
    title: episode.title,
    description: episode.description || "No description yet.",
    contentType: episode.contentType,
    status: episode.status,
    scheduledPublishAt: episode.scheduledPublishAt,
    unlockType: episode.unlockType ?? "FREE",
    priceVnd: episode.priceVnd ?? 0,
    mediaCount: episode.totalPage ?? 0,
    totalPage: episode.totalPage,
    views: formatNumber(episode.views),
    thumbnail: episode.thumbnail
      ? normalizeAssetUrl(episode.thumbnail)
      : undefined,
    updatedAt: episode.updatedAt || episode.createdAt || "-",
  };
}

function mapMediaResponseToComicPage(media: MediaResponse): ComicPage {
  return {
    id: media.mediaId,
    image: normalizeAssetUrl(
      media.fileUrl || media.originalUrl || media.playbackUrl || "",
    ),
    title: `Trang ${media.displayOrder ?? 1}`,
    mimeType: media.mimeType,
    fileSize: formatBytes(media.fileSize),
    fileSizeBytes: media.fileSize,
    checksum: media.checksum || "generated",
    displayOrder: media.displayOrder ?? 1,
    status: media.status,
    approvalStatus: media.approvalStatus,
    errorMessage: media.errorMessage,
    contentId: media.contentId,
    hasWatermark: media.hasWatermark,
  };
}

export function CreatorDashboard() {
  const isMounted = useSyncExternalStore(
    subscribeToClientMount,
    getClientSnapshot,
    getServerSnapshot,
  );

  if (!isMounted) {
    return null;
  }

  return <CreatorDashboardContent />;
}

function CreatorDashboardContent() {
  const mediaSystemConfigQuery = useQuery({
    queryKey: ["media-system-config"],
    queryFn: () => mediaSystemConfigApi.getConfig(),
    staleTime: 5 * 60 * 1000,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await getCategories();
      return (
        res.content?.map((c: any) => ({
          id: c.categoryId,
          name: c.categoryName,
        })) || []
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await getTags();
      return (
        res.content?.map((t: any) => ({ id: t.tagId, name: t.tagName })) || []
      );
    },
    staleTime: 5 * 60 * 1000,
  });
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const accountId = authUser?.accountId ?? "";
  const canManageEpisodePricing = authUser?.roleName === "CREATOR";
  const verificationStatusQuery = useQuery({
    queryKey: creatorMonetizationKeys.verificationStatus(),
    queryFn: getCreatorVerificationStatus,
    enabled: Boolean(accountId),
    retry: false,
    staleTime: 60 * 1000,
  });
  const creatorMonetizationStatus = verificationStatusQuery.data;
  const isCreatorMonetizationEnabled = Boolean(
    creatorMonetizationStatus?.isCreatorVerified &&
    creatorMonetizationStatus?.isTermsAccepted &&
    creatorMonetizationStatus?.taxId?.trim() &&
    isVerifiedPaymentStatus(creatorMonetizationStatus?.paymentStatus),
  );
  const lockedCreatorViews = isCreatorMonetizationEnabled
    ? []
    : monetizationRequiredViews;
  const initialRouteState = useMemo(() => readDashboardRouteState(), []);
  const [activeView, setActiveView] = useState<DashboardView>(
    initialRouteState.view,
  );
  const isMonetizationRequiredView =
    monetizationRequiredViews.includes(activeView);
  // Danh sách media mới nhất, cập nhật bởi effect polling-fallback bên dưới (khai báo
  // trước vì usePipelineSSE cần callback này ngay, còn mediaQuery thì khai báo sau).
  const suppressionMediaListRef = useRef<MediaResponse[]>([]);
  const shouldSuppressToast = useCallback((mediaId: string) => {
    const list = suppressionMediaListRef.current;
    const target = list.find((m) => m.mediaId === mediaId);
    if (!target || target.mediaType !== "IMAGE") return false;
    return (
      list.filter((m) => m.mediaType === "IMAGE" && !m.isDeleted).length > 1
    );
  }, []);
  // dismissOnChangeOf: đóng toast pipeline khi Creator chuyển sang view khác (vd rời
  // màn hình MEDIA để qua SEASON/EPISODE khác), không để tồn tại xuyên suốt dashboard.
  usePipelineSSE({ enabled: true, dismissOnChangeOf: activeView, shouldSuppressToast });
  // Toast tổng kết đợt xử lý (bắn từ effect polling-fallback bên dưới, không đi qua
  // usePipelineSSE) cần tự dọn dẹp riêng theo cùng quy tắc "đổi view thì đóng toast".
  // Dùng ref thay vì đọc selectedEpisode trực tiếp trong cleanup — effect chỉ phụ thuộc
  // activeView nên closure cleanup có thể giữ giá trị selectedEpisode cũ nếu không dùng ref.
  const lastBatchToastIdRef = useRef<string | null>(null);
  useEffect(() => {
    return () => {
      if (lastBatchToastIdRef.current)
        toast.dismiss(lastBatchToastIdRef.current);
    };
  }, [activeView]);
  const [selectedSeriesId, setSelectedSeriesId] = useState(
    initialRouteState.seriesId,
  );
  const [selectedSeasonId, setSelectedSeasonId] = useState(
    initialRouteState.seasonId,
  );
  const [selectedEpisodeId, setSelectedEpisodeId] = useState(
    initialRouteState.episodeId,
  );
  const [contentType, setContentType] = useState<ContentType>("COMIC");
  const [comicPages, setComicPages] = useState<ComicPage[]>([]);
  const [draggingPageId, setDraggingPageId] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<EditModalState>(null);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>(null);
  const [scheduleModal, setScheduleModal] = useState<ScheduleModalState>(null);

  function setDashboardRouteState(nextState: DashboardRouteState) {
    setActiveView(nextState.view);
    setSelectedSeriesId(nextState.seriesId);
    setSelectedSeasonId(nextState.seasonId);
    setSelectedEpisodeId(nextState.episodeId);
    writeDashboardRouteState(nextState);
  }

  function openMonetizationView() {
    clearUploadDrafts();
    setDashboardRouteState({
      view: "monetization",
      seriesId: "",
      seasonId: "",
      episodeId: "",
    });
  }

  const seriesQuery = useQuery({
    queryKey: ["creator-dashboard", "series"],
    queryFn: () => listSeriesByCreator(),
    refetchOnMount: "always",
  });

  const realSeriesRows =
    seriesQuery.data?.content.map(mapSeriesResponse).filter(Boolean) ?? [];
  const displaySeriesRows = realSeriesRows;
  const selectedSeries =
    displaySeriesRows.find((series) => series.id === selectedSeriesId) ?? null;

  const seasonsQuery = useQuery({
    queryKey: ["creator-dashboard", "seasons", selectedSeries?.id ?? ""],
    queryFn: () => listSeasonsBySeries(selectedSeries!.id),
    enabled: Boolean(selectedSeries?.id),
  });

  const realSeasonRows = seasonsQuery.data?.map(mapSeasonResponse) ?? [];
  const displaySeasonRows = realSeasonRows;
  const selectedSeason =
    displaySeasonRows.find((season) => season.id === selectedSeasonId) ?? null;

  const episodesQuery = useQuery({
    queryKey: ["creator-dashboard", "episodes", selectedSeason?.id ?? ""],
    queryFn: () => listEpisodesBySeason(selectedSeason!.id),
    enabled: Boolean(selectedSeason?.id),
  });

  const realEpisodeRows = episodesQuery.data?.map(mapEpisodeResponse) ?? [];
  const displayEpisodeRows = realEpisodeRows;
  const selectedEpisode =
    displayEpisodeRows.find((episode) => episode.id === selectedEpisodeId) ??
    null;
  const isRestoringSeriesSelection =
    Boolean(selectedSeriesId) && seriesQuery.isLoading;
  const isRestoringSeasonSelection =
    Boolean(selectedSeasonId) &&
    (isRestoringSeriesSelection || seasonsQuery.isLoading);
  const isRestoringEpisodeSelection =
    Boolean(selectedEpisodeId) &&
    (isRestoringSeasonSelection ||
      episodesQuery.isLoading ||
      episodesQuery.isFetching);

  const mediaQuery = useQuery({
    queryKey: ["creator-dashboard", "media", selectedEpisode?.id],
    queryFn: () => listMediaByEpisode(selectedEpisode!.id),
    enabled:
      Boolean(selectedEpisode?.id) &&
      (activeView === "comic" ||
        activeView === "video" ||
        activeView === "publish"),
    refetchInterval: (query) => {
      const data = query.state.data as MediaResponse[] | undefined;
      const hasPending = data?.some(
        (m) =>
          m.status === "PENDING" ||
          m.status === "HLS_PROCESSING" ||
          m.status === "PROCESSING",
      );
      return hasPending ? 5000 : false;
    },
  });

  // Lớp dự phòng cho toast pipeline: SSE (use-pipeline-sse.ts) là nguồn chính, nhưng SSE
  // là kiểu "push" — nếu tab bị mất kết nối đúng lúc BE bắn sự kiện (refresh trang, mạng
  // chập chờn), sự kiện đó mất vĩnh viễn, SSE không phát lại được. Effect này dựa vào
  // polling `mediaQuery` để bắt lại các trường hợp SSE bỏ lỡ — dùng CHUNG id với SSE nên
  // Sonner tự gộp thành 1 toast, không bị nhân đôi.
  const prevMediaStatusRef = useRef<Record<string, string>>({});
  // Theo dõi "đợt xử lý còn trang nào đang chạy không" của lần render trước, để phát hiện
  // đúng thời điểm CẢ ĐỢT (vd 5 trang push cùng lúc) vừa xử lý xong — bắn 1 toast tổng kết
  // số lượng đạt/chờ duyệt/từ chối/lỗi thay vì im lặng nếu kết quả bị trộn lẫn.
  const wasBatchPendingRef = useRef(false);
  useEffect(() => {
    const mediaList = mediaQuery.data ?? [];
    suppressionMediaListRef.current = mediaList;
    // Tính trước để dùng cả trong vòng lặp per-item (ẩn toast xanh riêng lẻ khi đang ở
    // đợt nhiều trang) lẫn toast tổng kết cả đợt bên dưới.
    const imagePages = mediaList.filter(
      (m) => m.mediaType === "IMAGE" && !m.isDeleted,
    );
    const isMultiPageImageBatch = imagePages.length > 1;
    const prev = prevMediaStatusRef.current;
    for (const media of mediaList) {
      const oldStatus = prev[media.mediaId];
      // Trạng thái "đang xử lý" trước đó khác nhau theo loại media và theo thời điểm poll
      // bắt được: IMAGE bắt đầu ở PENDING; VIDEO có thể ở HLS_PROCESSING (transcode +
      // AI check còn chạy) hoặc đã kịp lên HLS_READY (transcode xong trước, AI check vẫn
      // đang chờ) TRƯỚC KHI bị flag INACTIVE — chỉ so khớp đúng "PENDING" trước đây khiến
      // toast dự phòng KHÔNG BAO GIỜ fire cho video, chỉ hoạt động đúng với ảnh.
      const wasPending =
        oldStatus === "PENDING" ||
        oldStatus === "PROCESSING" ||
        oldStatus === "HLS_PROCESSING" ||
        oldStatus === "HLS_READY";
      if (oldStatus && oldStatus !== media.status) {
        // Id theo mediaId (khớp use-pipeline-sse.ts) — id cố định trước đây khiến kết quả
        // của trang xử lý sau GHI ĐÈ toast của trang xử lý trước trong cùng đợt push nhiều
        // ảnh, làm mất thông báo thành công/thất bại của các trang khác.
        if (media.status === "ACTIVE" && wasPending) {
          // Đợt nhiều trang (>1 ảnh): không show toast xanh riêng lẻ "đã qua kiểm duyệt"
          // của từng trang — dễ hiểu nhầm "cả episode ổn" trong khi trang khác cùng đợt
          // còn đang chờ duyệt/bị từ chối. Toast tổng kết cả đợt bên dưới đã đủ thông tin.
          if (!(media.mediaType === "IMAGE" && isMultiPageImageBatch)) {
            toast.success("Nội dung đã qua kiểm duyệt", {
              id: pipelineToastId("moderation-ok", media.mediaId),
              description:
                "Trang đã kiểm duyệt thành công, sẵn sàng để xuất bản. Nhấn Xuất bản ở bước cuối để công khai.",
              duration: Infinity,
            });
          }
        } else if (media.status === "INACTIVE" && wasPending) {
          // Cùng lý do ẩn toast xanh riêng lẻ ở nhánh ACTIVE bên trên — đợt nhiều trang thì
          // toast tổng kết cả đợt + panel ComicPipelineAggregateSummary đã đủ thông tin.
          if (!(media.mediaType === "IMAGE" && isMultiPageImageBatch)) {
            if (media.approvalStatus === "PENDING_REVIEW") {
              toast.warning("Nội dung cần kiểm duyệt thủ công", {
                id: pipelineToastId("moderation-review", media.mediaId),
                description: "Vui lòng chờ xác nhận thủ công trước khi xuất bản.",
                duration: Infinity,
              });
            } else {
              toast.error("Nội dung chưa đạt yêu cầu kiểm duyệt", {
                id: pipelineToastId("moderation-rejected", media.mediaId),
                description: "Nội dung đã bị tạm ẩn — vui lòng xem chi tiết vi phạm và chỉnh sửa hoặc thay thế nội dung trước khi tải lên lại.",
                duration: Infinity,
              });
            }
          }
        } else if (media.status === "FAILED") {
          if (!(media.mediaType === "IMAGE" && isMultiPageImageBatch)) {
            toast.error("Xử lý nội dung thất bại", {
              id: pipelineToastId("failed", media.mediaId),
              description: media.errorMessage || "Đã xảy ra lỗi trong quá trình xử lý. Vui lòng thử đăng tải lại hoặc liên hệ hỗ trợ.",
              duration: Infinity,
            });
          }
        }
      }
    }
    const next: Record<string, string> = {};
    for (const media of mediaList) next[media.mediaId] = media.status;
    prevMediaStatusRef.current = next;

    // Toast tổng kết cho đợt xử lý nhiều trang comic (chỉ IMAGE — video chỉ có 1 file/tập
    // nên toast per-item ở trên đã đủ, không cần tổng kết thêm).
    const isBatchPending = imagePages.some(
      (m) =>
        m.status === "PENDING" ||
        m.status === "PROCESSING" ||
        m.status === "HLS_PROCESSING",
    );
    if (
      wasBatchPendingRef.current &&
      !isBatchPending &&
      isMultiPageImageBatch
    ) {
      // displayOrder = số trang hiển thị trên khung ảnh (badge "1", "2"...) — liệt kê rõ
      // trang nào cần chú ý thay vì chỉ nói số lượng chung chung, Creator đỡ phải dò từng
      // trang một trong lưới ảnh để tìm ra trang nào bị vấn đề.
      const formatPages = (list: typeof imagePages) => {
        const numbers = list
          .map((m) => m.displayOrder)
          .filter((n): n is number => typeof n === "number")
          .sort((a, b) => a - b);
        return numbers.length > 0 ? ` (trang ${numbers.join(", ")})` : "";
      };
      const readyPages = imagePages.filter(
        (m) => m.status === "ACTIVE" || m.status === "HLS_READY",
      );
      const pendingReviewPages = imagePages.filter(
        (m) => m.status === "INACTIVE" && m.approvalStatus === "PENDING_REVIEW",
      );
      const rejectedPages = imagePages.filter(
        (m) => m.status === "INACTIVE" && m.approvalStatus === "REJECTED",
      );
      const failedPages = imagePages.filter(
        (m) => m.status === "FAILED",
      );
      const readyCount = readyPages.length;
      const pendingReviewCount = pendingReviewPages.length;
      const rejectedCount = rejectedPages.length;
      const failedCount = failedPages.length;
      const total = imagePages.length;
      const parts: string[] = [];
      if (readyCount > 0) parts.push(`${readyCount} đạt`);
      if (pendingReviewCount > 0) parts.push(`${pendingReviewCount} chờ kiểm duyệt thủ công${formatPages(pendingReviewPages)}`);
      if (rejectedCount > 0) parts.push(`${rejectedCount} bị từ chối${formatPages(rejectedPages)}`);
      if (failedCount > 0) parts.push(`${failedCount} lỗi hệ thống${formatPages(failedPages)}`);
      const hasIssue =
        rejectedCount > 0 || failedCount > 0 || pendingReviewCount > 0;
      const batchToastId = pipelineToastId(
        "batch-summary",
        selectedEpisode?.id ?? "unknown",
      );
      lastBatchToastIdRef.current = batchToastId;
      (hasIssue ? toast.warning : toast.success)(
        `Đã xử lý xong ${total} trang`,
        {
          id: batchToastId,
          description: parts.join(", "),
          duration: Infinity,
        },
      );
    }
    wasBatchPendingRef.current = isBatchPending;
  }, [mediaQuery.data, selectedEpisode?.id]);

  const existingMediaPages = useMemo(
    () =>
      (mediaQuery.data ?? [])
        .filter((media) => media.mediaType === "IMAGE" && !media.isDeleted)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .map(mapMediaResponseToComicPage),
    [mediaQuery.data],
  );

  // comicPages là state cục bộ dùng lúc đang chỉnh sửa thứ tự/thêm trang mới — nhưng một
  // khi đã có dữ liệu, displayComicPages luôn ưu tiên nó hơn existingMediaPages (server
  // mới nhất) suốt phiên làm việc, kể cả khi đã qua bước XUẤT BẢN. Nếu không đồng bộ lại
  // các field trạng thái pipeline, panel sẽ hiện dữ liệu cũ dù server đã xử lý xong.
  useEffect(() => {
    const freshById = new Map(
      (mediaQuery.data ?? []).map((m) => [m.mediaId, m]),
    );
    setComicPages((prev) => {
      let changed = false;
      const next = prev.map((page) => {
        const fresh = freshById.get(page.id);
        if (!fresh) return page;
        if (
          page.status === fresh.status &&
          page.approvalStatus === fresh.approvalStatus &&
          page.errorMessage === fresh.errorMessage &&
          page.contentId === fresh.contentId
        ) {
          return page;
        }
        changed = true;
        return {
          ...page,
          status: fresh.status,
          approvalStatus: fresh.approvalStatus,
          errorMessage: fresh.errorMessage,
          contentId: fresh.contentId,
        };
      });
      return changed ? next : prev;
    });
  }, [mediaQuery.data]);

  const displayComicPages =
    comicPages.length > 0 ? comicPages : existingMediaPages;

  const hasApprovedComicMedia = useMemo(() => {
    const comicMedia = (mediaQuery.data ?? []).filter(
      (media) => media.mediaType === "IMAGE" && !media.isDeleted,
    );

    return comicMedia.length > 0 && comicMedia.every(isMediaReadyForPublish);
  }, [mediaQuery.data]);

  const existingVideoMedia = useMemo(
    () =>
      (mediaQuery.data ?? [])
        .filter((media) => media.mediaType === "VIDEO" && !media.isDeleted)
        .sort(
          (a, b) =>
            new Date(b.createdAt ?? "").getTime() -
            new Date(a.createdAt ?? "").getTime(),
        ),
    [mediaQuery.data],
  );

  const hasProcessingVideoMedia = existingVideoMedia.some((media) =>
    isProcessingVideoStatus(media.status),
  );

  useEffect(() => {
    if (
      activeView !== "video" ||
      !selectedEpisode?.id ||
      !hasProcessingVideoMedia
    ) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void mediaQuery.refetch();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [activeView, hasProcessingVideoMedia, mediaQuery, selectedEpisode?.id]);

  const createSeriesMutation = useMutation({
    mutationFn: async (input: CreateSeriesInput) => {
      const coverUrl = await uploadSeriesArtwork(
        input.coverFile,
        "Cover",
        "cover",
      );
      const bannerUrl = await uploadSeriesArtwork(
        input.bannerFile,
        "Banner",
        "banner",
      );

      return createSeries({
        title: input.title,
        description: input.description,
        coverUrl,
        bannerUrl,
        contentType: input.contentType,
        visibility: input.visibility,
        ageRating: input.ageRating,
        contentWarnings: input.contentWarnings,
        language: input.language,
        categoryIds: input.categoryIds,
        tagIds: input.tagIds,
      });
    },
    onSuccess: (series) => {
      setUploadMessage("Đã tạo Series.");
      setDashboardRouteState({
        view: "seasons",
        seriesId: series.seriesId,
        seasonId: "",
        episodeId: "",
      });
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "series"],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Không thể tạo series.",
      );
    },
  });

  const createEpisodeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSeries || !selectedSeason) {
        throw new Error("Chọn một mùa trước khi tạo tập.");
      }

      const created = await createEpisode(selectedSeason.id, {
        episodeNumber: displayEpisodeRows.length + 1,
        title:
          selectedSeries.contentType === "COMIC"
            ? "Tập truyện tranh mới"
            : "Tập video mới",
        description: "Tập nháp được tạo từ bảng điều khiển.",
        contentType: selectedSeries.contentType,
      });

      return mapEpisodeResponse(created);
    },
    onSuccess: (episode) => {
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "episodes", selectedSeason?.id],
      });
      openEpisodeUpload(episode);
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Không thể tạo tập.",
      );
    },
  });

  const createSeasonMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSeries) {
        throw new Error("Chọn một series trước khi tạo mùa.");
      }

      const nextSeasonNumber = displaySeasonRows.length + 1;

      return createSeason(selectedSeries.id, {
        seasonNumber: nextSeasonNumber,
        title: `Season ${nextSeasonNumber}`,
        description: "Mùa nháp được tạo từ bảng điều khiển.",
      });
    },
    onSuccess: (season) => {
      setUploadMessage("Đã tạo Mùa.");
      setDashboardRouteState({
        view: "seasons",
        seriesId: selectedSeries?.id ?? season.seriesId,
        seasonId: season.seasonId,
        episodeId: "",
      });
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "seasons", selectedSeries?.id],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Không thể tạo mùa.",
      );
    },
  });

  const updateSeriesMutation = useMutation({
    mutationFn: async ({
      series,
      coverFile,
      bannerFile,
    }: {
      series: SeriesRow;
      coverFile?: File;
      bannerFile?: File;
    }) => {
      const uploadedCoverUrl = await uploadSeriesArtwork(
        coverFile,
        "Cover",
        "cover",
      );
      const uploadedBannerUrl = await uploadSeriesArtwork(
        bannerFile,
        "Banner",
        "banner",
      );

      return updateSeries(series.id, {
        title: series.title,
        description: series.description,
        coverUrl: uploadedCoverUrl || series.coverUrl,
        bannerUrl: uploadedBannerUrl || series.bannerUrl,
        contentType: series.contentType,
        visibility: series.visibility,
        ageRating: series.ageRating,
        contentWarnings: series.contentWarnings,
        language: series.language,
        categoryIds: series.categoryIds,
        tagIds: series.tagIds,
      });
    },
    onSuccess: () => {
      setUploadMessage("Đã cập nhật Series.");
      setEditModal(null);
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "series"],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Không thể cập nhật series.",
      );
    },
  });

  const deleteSeriesMutation = useMutation({
    mutationFn: async (series: SeriesRow) => {
      await deleteSeries(series.id);
      return series;
    },
    onSuccess: () => {
      setUploadMessage("Đã xóa Series.");
      setDeleteModal(null);
      openSeriesManagement();
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "series"],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Không thể xóa series.",
      );
    },
  });

  const hideSeriesMutation = useMutation({
    mutationFn: (series: SeriesRow) => hideSeries(series.id),
    onSuccess: () => {
      setUploadMessage("Đã ẩn Series.");
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "series"],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Không thể ẩn series.",
      );
    },
  });

  const unhideSeriesMutation = useMutation({
    mutationFn: (series: SeriesRow) => unhideSeries(series.id),
    onSuccess: () => {
      setUploadMessage("Đã hiện Series.");
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "series"],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Không thể hiện series.",
      );
    },
  });

  const updateSeasonMutation = useMutation({
    mutationFn: async (season: SeasonRow) => {
      return updateSeason(season.id, {
        title: season.title,
        seasonNumber: season.seasonNumber,
        description: season.description,
      });
    },
    onSuccess: () => {
      setUploadMessage("Đã cập nhật Mùa.");
      setEditModal(null);
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "seasons", selectedSeries?.id],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Không thể cập nhật mùa.",
      );
    },
  });

  const deleteSeasonMutation = useMutation({
    mutationFn: async (season: SeasonRow) => {
      await deleteSeason(season.id);
      return season;
    },
    onSuccess: () => {
      setUploadMessage("Đã xóa Mùa.");
      setDeleteModal(null);
      setDashboardRouteState({
        view: "seasons",
        seriesId: selectedSeries?.id ?? "",
        seasonId: "",
        episodeId: "",
      });
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "seasons", selectedSeries?.id],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Không thể xóa mùa.",
      );
    },
  });

  const hideSeasonMutation = useMutation({
    mutationFn: (season: SeasonRow) => hideSeason(season.id),
    onSuccess: () => {
      setUploadMessage("Đã ẩn Mùa.");
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "seasons", selectedSeries?.id],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Không thể ẩn mùa.",
      );
    },
  });

  const unhideSeasonMutation = useMutation({
    mutationFn: (season: SeasonRow) => unhideSeason(season.id),
    onSuccess: () => {
      setUploadMessage("Đã hiện Mùa.");
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "seasons", selectedSeries?.id],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Không thể hiện mùa.",
      );
    },
  });

  const updateEpisodeMutation = useMutation({
    mutationFn: async (episode: EpisodeRow & { thumbnailFile?: File }) => {
      const uploadedThumbnailUrl = episode.thumbnailFile
        ? await uploadSeriesArtwork(episode.thumbnailFile, "Thumbnail", "cover")
        : undefined;

      return updateEpisode(episode.id, {
        title: episode.title,
        episodeNumber: episode.episodeNumber,
        description: episode.description,
        contentType: episode.contentType,
        totalPage: episode.totalPage,
        thumbnail: uploadedThumbnailUrl || episode.thumbnail,
      });
    },
    onSuccess: () => {
      setUploadMessage("Đã cập nhật Tập.");
      setEditModal(null);
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "episodes", selectedSeason?.id],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Không thể cập nhật tập.",
      );
    },
  });

  const updateEpisodeUnlockSettingsMutation = useMutation({
    mutationFn: async (settings: EpisodeUnlockSettingsUpdate) => {
      const normalizedPriceVnd =
        settings.unlockType === "PAID" ? settings.priceVnd : 0;

      if (
        settings.unlockType === "PAID" &&
        (!Number.isFinite(normalizedPriceVnd) || normalizedPriceVnd <= 0)
      ) {
        throw new Error("Paid episode price must be greater than 0.");
      }

      return updateEpisodeUnlockSettings(settings.id, {
        unlockType: settings.unlockType,
        priceVnd: normalizedPriceVnd,
      });
    },
    onSuccess: () => {
      setUploadMessage("Da cap nhat gia Tap.");
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "episodes", selectedSeason?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "media", selectedEpisode?.id],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Khong the cap nhat gia tap.",
      );
    },
  });

  const deleteEpisodeMutation = useMutation({
    mutationFn: async (episode: EpisodeRow) => {
      await deleteEpisode(episode.id);
      return episode;
    },
    onSuccess: () => {
      setUploadMessage("Đã xóa Tập.");
      setDeleteModal(null);
      setDashboardRouteState({
        view: "episodes",
        seriesId: selectedSeries?.id ?? "",
        seasonId: selectedSeason?.id ?? "",
        episodeId: "",
      });
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "episodes", selectedSeason?.id],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Không thể xóa tập.",
      );
    },
  });

  const hideEpisodeMutation = useMutation({
    mutationFn: (episode: EpisodeRow) => hideEpisode(episode.id),
    onSuccess: () => {
      setUploadMessage("Đã ẩn Tập.");
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "episodes", selectedSeason?.id],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Không thể ẩn tập.",
      );
    },
  });

  const unhideEpisodeMutation = useMutation({
    mutationFn: (episode: EpisodeRow) => unhideEpisode(episode.id),
    onSuccess: () => {
      setUploadMessage("Đã hiện Tập.");
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "episodes", selectedSeason?.id],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Không thể hiện tập.",
      );
    },
  });

  const schedulePublishMutation = useMutation({
    mutationFn: async ({
      target,
      scheduledPublishAt,
    }: {
      target: ActiveScheduleModal;
      scheduledPublishAt: string;
    }) => {
      return scheduleEpisodePublish(target.value.id, { scheduledPublishAt });
    },
    onSuccess: () => {
      setUploadMessage("Đã lưu lịch xuất bản.");
      setScheduleModal(null);
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "episodes", selectedSeason?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "media", selectedEpisode?.id],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Không thể lên lịch xuất bản.",
      );
    },
  });

  const cancelScheduleMutation = useMutation({
    mutationFn: (episodeId: string) => cancelEpisodeSchedulePublish(episodeId),
    onSuccess: () => {
      setUploadMessage("Đã hủy lịch.");
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "episodes", selectedSeason?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "series"],
      });
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "seasons", selectedSeries?.id],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Không thể hủy lịch.",
      );
    },
  });

  const publishEpisodeMutation = useMutation({
    mutationFn: (episodeId: string) => publishEpisode(episodeId),
    onSuccess: () => {
      setUploadMessage("Xuất bản tập thành công.");
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "episodes", selectedSeason?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "series"],
      });
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "seasons", selectedSeries?.id],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Không thể xuất bản tập.",
      );
    },
  });

  const saveComicPagesMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEpisode) {
        throw new Error("Chọn một tập trước khi lưu thứ tự hiển thị.");
      }

      const pagesToSave = displayComicPages.map((page, index) => ({
        ...page,
        displayOrder: index + 1,
      }));
      const savedPages = pagesToSave.filter((page) => !isLocalPageId(page.id));
      const localPages = pagesToSave.filter((page) => page.file);

      if (savedPages.length === 0 && localPages.length === 0) {
        throw new Error("Chọn tệp trang truyện trước khi lưu.");
      }

      if (savedPages.length > 0) {
        await reorderEpisodeMedia(selectedEpisode.id, {
          items: savedPages.map((page) => ({
            mediaId: page.id,
            displayOrder: page.displayOrder,
          })),
          actorId: accountId,
        });
      }

      if (localPages.length === 0) {
        return [];
      }

      const uploadedPages = await Promise.all(
        localPages.map(async (page) => {
          const result = await uploadImageToS3(
            page.file!,
            "comic-page",
            selectedEpisode.id,
          );

          // Extract image dimensions from file
          const dimensions = await new Promise<{
            width?: number;
            height?: number;
          }>((resolve) => {
            const img = new Image();
            img.onload = () => {
              resolve({ width: img.naturalWidth, height: img.naturalHeight });
              URL.revokeObjectURL(img.src);
            };
            img.onerror = () => {
              resolve({});
              URL.revokeObjectURL(img.src);
            };
            img.src = URL.createObjectURL(page.file!);
          });

          return {
            fileUrl: result.publicUrl,
            displayOrder: page.displayOrder,
            mimeType: page.file?.type || page.mimeType || "image/jpeg",
            fileSize: page.file?.size || page.fileSizeBytes || 0,
            externalPublicId: result.key,
            storageProvider: "AWS",
            width: dimensions.width,
            height: dimensions.height,
            resolution:
              dimensions.width && dimensions.height
                ? `${dimensions.width}x${dimensions.height}`
                : undefined,
          };
        }),
      );

      return createComicPageMedia(selectedEpisode.id, uploadedPages, accountId);
    },
    onSuccess: (createdPages) => {
      setUploadMessage(
        createdPages.length > 0
          ? `${createdPages.length} page(s) uploaded and display order saved.`
          : "Đã lưu thứ tự hiển thị.",
      );
      setComicPages([]);
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "episodes", selectedSeason?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "media", selectedEpisode?.id],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error
          ? error.message
          : "Không thể lưu thứ tự hiển thị.",
      );
    },
  });

  const deleteMediaMutation = useMutation({
    mutationFn: async (media: ComicPage | MediaResponse) => {
      if (!isBackendMediaTarget(media) && isLocalPageId(media.id)) {
        return { media, deletedFromBackend: false };
      }

      await deleteMedia(getMediaTargetId(media), accountId);
      return { media, deletedFromBackend: true };
    },
    onSuccess: ({ media, deletedFromBackend }) => {
      setDeleteModal(null);

      if (isBackendMediaTarget(media) && media.mediaType === "VIDEO") {
        setUploadMessage("Đã xóa Video.");
        queryClient.invalidateQueries({
          queryKey: ["creator-dashboard", "media", selectedEpisode?.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["creator-dashboard", "episodes", selectedSeason?.id],
        });
        return;
      }

      const page = media as ComicPage;
      setComicPages((pages) => {
        const sourcePages = pages.length > 0 ? pages : existingMediaPages;

        return sourcePages
          .filter((item) => item.id !== page.id)
          .map((item, index) => ({
            ...item,
            displayOrder: index + 1,
          }));
      });

      setUploadMessage(
        deletedFromBackend ? "Media page deleted." : "Local page removed.",
      );
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "media", selectedEpisode?.id],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Cannot delete media.",
      );
    },
  });

  function handleComicFilesSelected(files: FileList | File[] | null) {
    const selectedFiles = Array.from(files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (selectedFiles.length === 0) {
      return;
    }

    if (!selectedEpisode) {
      setUploadMessage("Select an episode before adding comic pages.");
      return;
    }

    const batchId = Date.now();
    const basePages = comicPages.length > 0 ? comicPages : existingMediaPages;
    const config = mediaSystemConfigQuery.data;

    if (config) {
      if (basePages.length + selectedFiles.length > config.maxComicImages) { setUploadMessage(`Bạn đã tải vượt quá ${config.maxComicImages} ảnh cho mỗi tập. Vui lòng xoá bớt ảnh dư.`); }
    }

    const lastDisplayOrder = basePages.reduce(
      (maxOrder, page) => Math.max(maxOrder, page.displayOrder),
      0,
    );
    const nextPages = selectedFiles.map((file, index) => {
      const isOversized = config && file.size > config.maxComicImageSizeMb * 1024 * 1024;
      return {
        id: `LOCAL-${batchId}-${file.name}-${file.lastModified}-${index}`,
        image: URL.createObjectURL(file),
        title: file.name,
        mimeType: file.type || "image/jpeg",
        fileSize: formatBytes(file.size),
        fileSizeBytes: file.size,
        checksum: "generated",
        displayOrder: lastDisplayOrder + index + 1,
        file,
        ...(isOversized ? {
          status: "FAILED" as const,
          errorMessage: `Dung lượng ảnh vượt quá giới hạn ${config.maxComicImageSizeMb}MB`,
        } : {})
      };
    });

    setUploadMessage(null);
    setComicPages([...basePages, ...nextPages]);
  }

  function movePage(fromId: string, toId: string) {
    setComicPages((pages) =>
      reorderPages(pages.length > 0 ? pages : existingMediaPages, fromId, toId),
    );
  }

  function movePageByOffset(pageId: string, offset: number) {
    setComicPages((pages) => {
      const basePages = pages.length > 0 ? pages : existingMediaPages;
      const currentIndex = basePages.findIndex((page) => page.id === pageId);
      const target = basePages[currentIndex + offset];

      if (!target) {
        return basePages;
      }

      return reorderPages(basePages, pageId, target.id);
    });
  }

  function clearUploadDrafts() {
    setComicPages([]);
  }

  function openSeriesManagement() {
    clearUploadDrafts();
    setDashboardRouteState({
      view: "series",
      seriesId: "",
      seasonId: "",
      episodeId: "",
    });
  }

  function openCreateSeries() {
    clearUploadDrafts();
    setDashboardRouteState({
      view: "create",
      seriesId: "",
      seasonId: "",
      episodeId: "",
    });
  }

  function openSeriesSeasons(seriesId: string) {
    clearUploadDrafts();
    setDashboardRouteState({
      view: "seasons",
      seriesId,
      seasonId: "",
      episodeId: "",
    });
  }

  function openSeasonEpisodes(seasonId: string) {
    const season = displaySeasonRows.find((item) => item.id === seasonId);
    clearUploadDrafts();
    setDashboardRouteState({
      view: "episodes",
      seriesId: season?.seriesId ?? selectedSeriesId,
      seasonId,
      episodeId: "",
    });
  }

  function openEpisodeUpload(episode: EpisodeRow) {
    setContentType(episode.contentType);
    setUploadMessage(null);
    if (episode.contentType === "COMIC") {
      setComicPages([]);
    }

    if (episode.status === "PUBLISHED") {
      setDashboardRouteState({
        view: "publish",
        seriesId: selectedSeries?.id ?? selectedSeriesId,
        seasonId: episode.seasonId,
        episodeId: episode.id,
      });
      return;
    }

    setDashboardRouteState({
      view: episode.contentType === "COMIC" ? "comic" : "video",
      seriesId: selectedSeries?.id ?? selectedSeriesId,
      seasonId: episode.seasonId,
      episodeId: episode.id,
    });
  }

  function handleUpdateSeries(series: SeriesRow) {
    setUploadMessage(null);
    setEditModal({ kind: "series", value: series });
  }

  function handleDeleteSeries(series: SeriesRow) {
    setUploadMessage(null);
    setDeleteModal({ kind: "series", value: series });
  }

  function handleCreateSeason() {
    setUploadMessage(null);
    createSeasonMutation.mutate();
  }

  function handleUpdateSeason(season: SeasonRow) {
    setUploadMessage(null);
    setEditModal({ kind: "season", value: season });
  }

  function handleDeleteSeason(season: SeasonRow) {
    setUploadMessage(null);
    setDeleteModal({ kind: "season", value: season });
  }

  function handleUpdateEpisode(episode: EpisodeRow) {
    setUploadMessage(null);
    if (episode.contentType === "VIDEO") {
      openEpisodeUpload(episode);
      return;
    }
    setEditModal({ kind: "episode", value: episode });
  }

  function handleDeleteEpisode(episode: EpisodeRow) {
    setUploadMessage(null);
    setDeleteModal({ kind: "episode", value: episode });
  }

  function handleSchedulePublish(target: ActiveScheduleModal) {
    setUploadMessage(null);
    setScheduleModal(target);
  }

  function handleSaveEpisodeUnlockSettings(episode: EpisodeRow) {
    updateEpisodeUnlockSettingsMutation.mutate({
      id: episode.id,
      unlockType: episode.unlockType,
      priceVnd: episode.priceVnd,
    });
  }

  function handleDeleteComicPage(page: ComicPage) {
    setUploadMessage(null);
    setDeleteModal({ kind: "media", value: page });
  }

  function handleDeleteVideo(video: MediaResponse) {
    setUploadMessage(null);
    setDeleteModal({ kind: "media", value: video });
  }

  function handleVideoUploadCompleted() {
    setUploadMessage("Video uploaded. Processing playback now.");
    queryClient.invalidateQueries({
      queryKey: ["creator-dashboard", "media", selectedEpisode?.id],
    });
    queryClient.invalidateQueries({
      queryKey: ["creator-dashboard", "episodes", selectedSeason?.id],
    });
  }

  function handleSubmitEdit(nextValue: EditSubmitState) {
    setUploadMessage(null);

    if (nextValue.kind === "series") {
      updateSeriesMutation.mutate({
        series: nextValue.value,
        coverFile: nextValue.coverFile,
        bannerFile: nextValue.bannerFile,
      });
      return;
    }

    if (nextValue.kind === "season") {
      updateSeasonMutation.mutate(nextValue.value);
      return;
    }

    updateEpisodeMutation.mutate(nextValue.value);
  }

  function handleConfirmDelete() {
    if (!deleteModal) {
      return;
    }

    setUploadMessage(null);

    if (deleteModal.kind === "series") {
      deleteSeriesMutation.mutate(deleteModal.value);
      return;
    }

    if (deleteModal.kind === "season") {
      deleteSeasonMutation.mutate(deleteModal.value);
      return;
    }

    if (deleteModal.kind === "episode") {
      deleteEpisodeMutation.mutate(deleteModal.value);
      return;
    }

    deleteMediaMutation.mutate(deleteModal.value);
  }

  // ===== NEW CREATOR DASHBOARD UI =====
  const stepperSteps = [
    {
      id: "core",
      label: "Series",
      state:
        activeView === "create" || activeView === "series"
          ? "current"
          : ((["seasons", "episodes", "comic", "video", "publish"].includes(
            activeView,
          )
            ? "completed"
            : "upcoming") as any),
    },
    {
      id: "structure",
      label: "Season",
      state:
        activeView === "seasons"
          ? "current"
          : ((["episodes", "comic", "video", "publish"].includes(activeView)
            ? "completed"
            : "upcoming") as any),
    },
    {
      id: "content",
      label: "Episode",
      state:
        activeView === "episodes"
          ? "current"
          : ((["comic", "video", "publish"].includes(activeView)
            ? "completed"
            : "upcoming") as any),
    },
    {
      id: "moderation",
      label: "Media",
      state:
        activeView === "comic" || activeView === "video"
          ? "current"
          : ((activeView === "publish" ? "completed" : "upcoming") as any),
    },
    {
      id: "publishing",
      label: "Xuất bản",
      state: activeView === "publish" ? "current" : ("upcoming" as any),
    },
  ];

  const isSeriesFlow = [
    "series",
    "create",
    "seasons",
    "episodes",
    "comic",
    "video",
    "publish",
  ].includes(activeView);

  return (
    <>
      <CreatorLayout
        activeView={activeView}
        lockedViews={lockedCreatorViews}
        onStartMonetization={openMonetizationView}
        onNavigate={(view) => {
          clearUploadDrafts();
          setDashboardRouteState({
            view: view as any,
            seriesId: "",
            seasonId: "",
            episodeId: "",
          });
        }}
      >
        <div className="w-full">
          {isSeriesFlow && <CreatorStepper steps={stepperSteps} />}

          <div className="mt-4 pb-20">
            {isMonetizationRequiredView && !isCreatorMonetizationEnabled ? (
              <MonetizationRequiredPanel
                title={viewMeta[activeView].title}
                isChecking={verificationStatusQuery.isLoading}
                onStart={openMonetizationView}
              />
            ) : activeView === "series" ? (
              <CreatorSeriesList
                seriesList={displaySeriesRows}
                onSelect={(seriesId) => {
                  setSelectedSeriesId(seriesId);
                  setDashboardRouteState({
                    view: "seasons",
                    seriesId,
                    seasonId: "",
                    episodeId: "",
                  });
                }}
                onCreate={() => openCreateSeries()}
                onEdit={(series) => {
                  setSelectedSeriesId(series.id);
                  handleUpdateSeries(series);
                }}
                onDelete={handleDeleteSeries}
              />
            ) : activeView === "create" ? (
              <CoreIdentityStep
                initialData={{
                  title: selectedSeries?.title,
                  description: selectedSeries?.description,
                  contentType: selectedSeries?.contentType || "COMIC",
                  visibility: selectedSeries?.visibility || "PUBLIC",
                  ageRating: selectedSeries?.ageRating || "EVERYONE",
                  contentWarnings: selectedSeries?.contentWarnings || [],
                  language: selectedSeries?.language || "vi",
                  categoryIds: selectedSeries?.categoryIds || [],
                  tagIds: selectedSeries?.tagIds || [],
                  coverUrl: selectedSeries?.coverUrl,
                  bannerUrl: selectedSeries?.bannerUrl,
                }}
                categories={categoriesQuery.data || []}
                tags={tagsQuery.data || []}
                onSave={(data) => {
                  if (
                    !selectedSeriesId ||
                    (activeView === "create" && !selectedSeries)
                  ) {
                    createSeriesMutation.mutate(data as any);
                  } else if (selectedSeries) {
                    handleSubmitEdit({
                      kind: "series",
                      value: { ...selectedSeries, ...data } as any,
                      coverFile: data.coverFile,
                      bannerFile: data.bannerFile,
                    });
                  }
                }}
                onCancel={() => openSeriesManagement()}
              />
            ) : activeView === "seasons" ? (
              <CreatorSeasonsList
                seasons={displaySeasonRows}
                onSelect={(seasonId) => {
                  setSelectedSeasonId(seasonId);
                  setDashboardRouteState({
                    view: "episodes",
                    seriesId: selectedSeriesId,
                    seasonId,
                    episodeId: "",
                  });
                }}
                onCreate={() => createSeasonMutation.mutate()}
                onEdit={(season) => handleUpdateSeason(season)}
                onDelete={handleDeleteSeason}
                onBack={() =>
                  setDashboardRouteState({
                    view: "series",
                    seriesId: "",
                    seasonId: "",
                    episodeId: "",
                  })
                }
              />
            ) : activeView === "episodes" ? (
              selectedSeries && selectedSeason ? (
                <EpisodeManagementView
                  selectedSeries={selectedSeries}
                  selectedSeason={selectedSeason}
                  episodes={displayEpisodeRows}
                  isLoading={episodesQuery.isLoading}
                  onBack={() =>
                    setDashboardRouteState({
                      view: "seasons",
                      seriesId: selectedSeries.id,
                      seasonId: "",
                      episodeId: "",
                    })
                  }
                  onCreateEpisode={() => createEpisodeMutation.mutate()}
                  isCreatingEpisode={createEpisodeMutation.isPending}
                  onOpenUpload={openEpisodeUpload}
                  onUpdateEpisode={handleUpdateEpisode}
                  onDeleteEpisode={handleDeleteEpisode}
                />
              ) : (
                <div className="p-8 text-white flex flex-col items-center justify-center min-h-[50vh]">
                  <h2 className="text-xl font-bold mb-4">
                    No season selected.
                  </h2>
                </div>
              )
            ) : activeView === "comic" ? (
              selectedSeries && selectedSeason && selectedEpisode ? (
                <ComicUploadView
                  selectedSeries={selectedSeries}
                  selectedSeason={selectedSeason}
                  selectedEpisode={selectedEpisode}
                  pages={displayComicPages}
                  draggingPageId={draggingPageId}
                  onDragStart={setDraggingPageId}
                  onDragEnd={() => setDraggingPageId(null)}
                  onDropPage={movePage}
                  onMovePage={movePageByOffset}
                  onFilesSelected={handleComicFilesSelected}
                  isUploading={saveComicPagesMutation.isPending}
                  onSaveOrder={() => saveComicPagesMutation.mutate()}
                  isSavingOrder={saveComicPagesMutation.isPending}
                  onDeletePage={handleDeleteComicPage}
                  isLoadingMedia={mediaQuery.isLoading}
                  uploadMessage={uploadMessage}
                  onSaveEpisode={(episode) =>
                    updateEpisodeMutation.mutate(episode)
                  }
                  isSavingEpisode={updateEpisodeMutation.isPending}
                  onSaveUnlockSettings={handleSaveEpisodeUnlockSettings}
                  isSavingUnlockSettings={
                    updateEpisodeUnlockSettingsMutation.isPending
                  }
                  canManageUnlockSettings={canManageEpisodePricing}
                  onGoToPublishing={() =>
                    setDashboardRouteState({
                      view: "publish",
                      seriesId: selectedSeries.id,
                      seasonId: selectedSeason.id,
                      episodeId: selectedEpisode.id,
                    })
                  }
                  canSchedulePublish={hasApprovedComicMedia}
                  onSchedulePublish={(episode) =>
                    handleSchedulePublish({ kind: "episode", value: episode })
                  }
                  onHideEpisode={(episode) =>
                    hideEpisodeMutation.mutate(episode)
                  }
                  onUnhideEpisode={(episode) =>
                    unhideEpisodeMutation.mutate(episode)
                  }
                  isHidingEpisode={
                    hideEpisodeMutation.isPending ||
                    unhideEpisodeMutation.isPending
                  }
                  onCancelSchedule={(episode) =>
                    cancelScheduleMutation.mutate(episode.id)
                  }
                  isCancelingSchedule={cancelScheduleMutation.isPending}
                  onPublishNow={(episode) =>
                    publishEpisodeMutation.mutate(episode.id)
                  }
                  isPublishingNow={publishEpisodeMutation.isPending}
                  onBack={() =>
                    setDashboardRouteState({
                      view: "episodes",
                      seriesId: selectedSeries.id,
                      seasonId: selectedSeason.id,
                      episodeId: "",
                    })
                  }
                  maxImageSizeMb={mediaSystemConfigQuery.data?.maxComicImageSizeMb}
                  maxComicImages={mediaSystemConfigQuery.data?.maxComicImages}
                />
              ) : (
                <div className="p-8 text-white flex flex-col items-center justify-center min-h-[50vh]">
                  <h2 className="text-xl font-bold mb-4">
                    Chưa chọn episode nào.
                  </h2>
                </div>
              )
            ) : activeView === "video" ? (
              selectedSeries && selectedSeason && selectedEpisode ? (
                <VideoUploadView
                  selectedSeries={selectedSeries}
                  selectedSeason={selectedSeason}
                  selectedEpisode={selectedEpisode}
                  videos={existingVideoMedia}
                  isLoadingMedia={mediaQuery.isLoading}
                  uploadMessage={uploadMessage}
                  onUploadCompleted={handleVideoUploadCompleted}
                  onDeleteVideo={handleDeleteVideo}
                  onSaveEpisode={(episode) =>
                    updateEpisodeMutation.mutate(episode)
                  }
                  isSavingEpisode={updateEpisodeMutation.isPending}
                  onSaveUnlockSettings={handleSaveEpisodeUnlockSettings}
                  isSavingUnlockSettings={
                    updateEpisodeUnlockSettingsMutation.isPending
                  }
                  canManageUnlockSettings={canManageEpisodePricing}
                  onGoToPublishing={() =>
                    setDashboardRouteState({
                      view: "publish",
                      seriesId: selectedSeries.id,
                      seasonId: selectedSeason.id,
                      episodeId: selectedEpisode.id,
                    })
                  }
                  accountId={accountId}
                  onSchedulePublish={(episode) =>
                    handleSchedulePublish({ kind: "episode", value: episode })
                  }
                  onHideEpisode={(episode) =>
                    hideEpisodeMutation.mutate(episode)
                  }
                  onUnhideEpisode={(episode) =>
                    unhideEpisodeMutation.mutate(episode)
                  }
                  isHidingEpisode={
                    hideEpisodeMutation.isPending ||
                    unhideEpisodeMutation.isPending
                  }
                  onCancelSchedule={(episode) =>
                    cancelScheduleMutation.mutate(episode.id)
                  }
                  isCancelingSchedule={cancelScheduleMutation.isPending}
                  onPublishNow={(episode) =>
                    publishEpisodeMutation.mutate(episode.id)
                  }
                  isPublishingNow={publishEpisodeMutation.isPending}
                  onBack={() =>
                    setDashboardRouteState({
                      view: "episodes",
                      seriesId: selectedSeries.id,
                      seasonId: selectedSeason.id,
                      episodeId: "",
                    })
                  }
                  maxVideoSizeMb={mediaSystemConfigQuery.data?.maxVideoSizeMb}
                />
              ) : (
                <div className="p-8 text-white flex flex-col items-center justify-center min-h-[50vh]">
                  <h2 className="text-xl font-bold mb-4">
                    Chưa chọn episode nào.
                  </h2>
                </div>
              )
            ) : activeView === ("publish" as any) ? (
              selectedEpisode?.contentType === "COMIC" ? (
                <FinalReviewComicStep
                  pages={displayComicPages}
                  isPublishing={publishEpisodeMutation.isPending}
                  onPublish={() =>
                    publishEpisodeMutation.mutate(selectedEpisodeId)
                  }
                  onSchedulePublish={() =>
                    handleSchedulePublish({
                      kind: "episode",
                      value: selectedEpisode!,
                    })
                  }
                  onSaveDraft={() => openSeriesManagement()}
                  onBack={() => {
                    if (selectedEpisode?.status === "PUBLISHED") {
                      setDashboardRouteState({
                        view: "episodes",
                        seriesId: selectedSeriesId,
                        seasonId: selectedSeasonId,
                        episodeId: "",
                      });
                    } else {
                      setDashboardRouteState({
                        view: "comic",
                        seriesId: selectedSeriesId,
                        seasonId: selectedSeasonId,
                        episodeId: selectedEpisodeId,
                      });
                    }
                  }}
                  selectedEpisode={selectedEpisode}
                  onSaveEpisode={(episode) =>
                    updateEpisodeMutation.mutate(episode)
                  }
                  isSavingEpisode={updateEpisodeMutation.isPending}
                  onSaveUnlockSettings={handleSaveEpisodeUnlockSettings}
                  isSavingUnlockSettings={
                    updateEpisodeUnlockSettingsMutation.isPending
                  }
                  canManageUnlockSettings={canManageEpisodePricing}
                  onHideEpisode={(episode) =>
                    hideEpisodeMutation.mutate(episode)
                  }
                  isHidingEpisode={hideEpisodeMutation.isPending}
                  onCancelSchedule={(episode) =>
                    cancelScheduleMutation.mutate(episode.id)
                  }
                  isCancelingSchedule={cancelScheduleMutation.isPending}
                />
              ) : (
                <FinalReviewStep
                  mediaId={existingVideoMedia[0]?.mediaId}
                  mediaUrl={
                    existingVideoMedia[0]?.fileUrl ||
                    existingVideoMedia[0]?.originalUrl ||
                    ""
                  }
                  mediaType={existingVideoMedia[0]?.mediaType}
                  mediaStatus={existingVideoMedia[0]?.status}
                  approvalStatus={existingVideoMedia[0]?.approvalStatus}
                  errorMessage={existingVideoMedia[0]?.errorMessage}
                  contentId={existingVideoMedia[0]?.contentId}
                  hasWatermark={existingVideoMedia[0]?.hasWatermark}
                  video={existingVideoMedia[0]}
                  isPublishing={publishEpisodeMutation.isPending}
                  onPublish={() =>
                    publishEpisodeMutation.mutate(selectedEpisodeId)
                  }
                  onSchedulePublish={() =>
                    handleSchedulePublish({
                      kind: "episode",
                      value: selectedEpisode!,
                    })
                  }
                  onSaveDraft={() => openSeriesManagement()}
                  onBack={() => {
                    if (selectedEpisode?.status === "PUBLISHED") {
                      setDashboardRouteState({
                        view: "episodes",
                        seriesId: selectedSeriesId,
                        seasonId: selectedSeasonId,
                        episodeId: "",
                      });
                    } else {
                      setDashboardRouteState({
                        view: "video",
                        seriesId: selectedSeriesId,
                        seasonId: selectedSeasonId,
                        episodeId: selectedEpisodeId,
                      });
                    }
                  }}
                  selectedEpisode={selectedEpisode}
                  onSaveEpisode={(episode) =>
                    updateEpisodeMutation.mutate(episode)
                  }
                  isSavingEpisode={updateEpisodeMutation.isPending}
                  onSaveUnlockSettings={handleSaveEpisodeUnlockSettings}
                  isSavingUnlockSettings={
                    updateEpisodeUnlockSettingsMutation.isPending
                  }
                  canManageUnlockSettings={canManageEpisodePricing}
                  onHideEpisode={(episode) =>
                    hideEpisodeMutation.mutate(episode)
                  }
                  isHidingEpisode={hideEpisodeMutation.isPending}
                  onCancelSchedule={(episode) =>
                    cancelScheduleMutation.mutate(episode.id)
                  }
                  isCancelingSchedule={cancelScheduleMutation.isPending}
                />
              )
            ) : activeView === "dashboard" ? (
              <DashboardOverviewView
                onNavigate={(view) =>
                  setDashboardRouteState({
                    view: view as any,
                    seriesId: "",
                    seasonId: "",
                    episodeId: "",
                  })
                }
              />
            ) : activeView === "revenue" ? (
              <CreatorRevenueTransactionsView />
            ) : activeView === "settlements" ? (
              <CreatorSettlementsView />
            ) : activeView === "analytics" ? (
              <CreatorAnalyticsLogsView />
            ) : activeView === "combos" ? (
              <ComboManagementView />
            ) : activeView === "profile" ? (
              <CreatorProfileView />
            ) : activeView === "monetization" ? (
              <CreatorMonetizationView
                onBack={() =>
                  setDashboardRouteState({
                    view: "dashboard",
                    seriesId: "",
                    seasonId: "",
                    episodeId: "",
                  })
                }
              />
            ) : activeView === "payment-profiles" ? (
              <CreatorPaymentProfilesView />
            ) : activeView === "violations" ? (
              <CreatorViolationsView />
            ) : activeView === "campaign" || activeView === "campaigns" ? (
              <CreatorCampaignsView />
            ) : (
              <div className="p-8 text-white flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-xl font-bold mb-4">
                  View not mapped yet ({activeView})
                </h2>
                <button
                  onClick={openSeriesManagement}
                  className="px-6 py-2 bg-creator-gold text-black rounded"
                >
                  Quay lại
                </button>
              </div>
            )}
          </div>
        </div>
      </CreatorLayout>

      {editModal && (
        <EditEntityModal
          modal={editModal}
          isSaving={
            updateSeriesMutation.isPending ||
            updateSeasonMutation.isPending ||
            updateEpisodeMutation.isPending
          }
          uploadMessage={uploadMessage}
          onClose={() => setEditModal(null)}
          onSubmit={handleSubmitEdit}
          categories={categoriesQuery.data || []}
          tags={tagsQuery.data || []}
        />
      )}

      {deleteModal && (
        <DeleteEntityModal
          modal={deleteModal}
          isDeleting={
            deleteSeriesMutation.isPending ||
            deleteSeasonMutation.isPending ||
            deleteEpisodeMutation.isPending ||
            deleteMediaMutation.isPending
          }
          onClose={() => setDeleteModal(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {scheduleModal && (
        <SchedulePublishModal
          modal={scheduleModal}
          isSaving={schedulePublishMutation.isPending}
          onClose={() => setScheduleModal(null)}
          onSubmit={(date: string) =>
            schedulePublishMutation.mutate({
              target: scheduleModal,
              scheduledPublishAt: date,
            })
          }
        />
      )}
    </>
  );
}

// ============================================================================
// EPISODE MANAGEMENT VIEW
// ============================================================================
// ============================================================================
// COMIC UPLOAD VIEW
// ============================================================================
// ============================================================================
// VIDEO UPLOAD VIEW
// ============================================================================
