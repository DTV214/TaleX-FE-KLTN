
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type DragEvent,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  CircleAlert,
  Clapperboard,
  CloudUpload,
  Edit3,
  Eye,
  FileVideo,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Lock,
  Plus,
  Search,
  Tag,
  Trash2,
  UploadCloud,
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
  updateSeason,
  updateSeries,
  type ContentApprovalStatus as ApiContentApprovalStatus,
  type EpisodeUnlockType,
  type EpisodeResponse,
  type MediaStatus,
  type MediaResponse,
  type SeasonResponse,
  type SeriesResponse,
} from "@/features/creator-dashboard/api/creator-content-api";
import { uploadImageToS3 } from "@/features/creator-dashboard/api/s3-upload-api";
import { toast } from "sonner";
import { ResumableVideoUploader } from "@/features/creator-dashboard/components/resumable-video-uploader";
import { ViolationDetailDialog } from "@/features/creator-dashboard/components/violation-detail-dialog";
import { usePipelineSSE } from "@/features/creator-dashboard/hooks/use-pipeline-sse";
import { SignedHlsPlayer } from "@/features/playback/components/signed-hls-player";
import { ComboManagementView } from "@/features/creator-dashboard/components/combo-management";
import {
  CreatorDashboardLayout,
  type CreatorDashboardLayoutView,
} from "@/features/creator-dashboard/components/creator-dashboard-layout";

type DashboardView = CreatorDashboardLayoutView;

type DashboardRouteState = {
  view: DashboardView;
  seriesId: string;
  seasonId: string;
  episodeId: string;
};

const dashboardViews: DashboardView[] = [
  "dashboard",
  "series",
  "seasons",
  "episodes",
  "create",
  "comic",
  "video",
  "combos",
  "analytics",
  "revenue",
  "production",
];

const defaultDashboardRouteState: DashboardRouteState = {
  view: "series",
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
    view: isDashboardView(viewParam) ? viewParam : "series",
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

type ContentType = "COMIC" | "VIDEO";
type ApiLifecycleStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "DELETED" | "SCHEDULED";
type SeriesStatus = ApiLifecycleStatus | "ACTION_REQUIRED";
type SeasonStatus = ApiLifecycleStatus;
type EpisodeStatus = ApiLifecycleStatus | "REVIEW";
type ContentApprovalStatus = ApiContentApprovalStatus;
type Visibility = "PUBLIC" | "PRIVATE";

type EditModalState =
  | { kind: "series"; value: SeriesRow }
  | { kind: "season"; value: SeasonRow }
  | { kind: "episode"; value: EpisodeRow }
  | null;

type EditSubmitState =
  | {
      kind: "series";
      value: SeriesRow;
      coverFile?: File;
      bannerFile?: File;
    }
  | { kind: "season"; value: SeasonRow }
  | { kind: "episode"; value: EpisodeRow };

type CreateSeriesInput = {
  title: string;
  description: string;
  contentType: ContentType;
  visibility: Visibility;
  ageRating: string;
  language: string;
  categoryIds: string[];
  tagIds: string[];
  coverFile?: File;
  bannerFile?: File;
};

type DeleteModalState =
  | { kind: "series"; value: SeriesRow }
  | { kind: "season"; value: SeasonRow }
  | { kind: "episode"; value: EpisodeRow }
  | { kind: "media"; value: ComicPage | MediaResponse }
  | null;

type ScheduleModalState =
  | { kind: "episode"; value: EpisodeRow }
  | null;

type ActiveScheduleModal = Exclude<ScheduleModalState, null>;

type SeriesRow = {
  id: string;
  creatorId?: string;
  title: string;
  subtitle: string;
  description: string;
  coverUrl: string;
  bannerUrl: string;
  contentType: ContentType;
  status: SeriesStatus;
  visibility: Visibility;
  ageRating: string;
  language: string;
  categoryIds: string[];
  tagIds: string[];
  views: string;
  revenue?: string;
  episodes: number;
};

type SeasonRow = {
  id: string;
  seriesId: string;
  seasonNumber: number;
  title: string;
  description: string;
  status: SeasonStatus;
  episodes: number;
  publishedEpisodes: number;
  updatedAt: string;
};

type EpisodeRow = {
  id: string;
  seasonId: string;
  episodeNumber: number;
  title: string;
  description: string;
  contentType: ContentType;
  status: EpisodeStatus;
  scheduledPublishAt?: string;
  unlockType: EpisodeUnlockType;
  priceVnd: number;
  mediaCount: number;
  totalPage?: number;
  views: string;
  updatedAt: string;
};

type ComicPage = {
  id: string;
  image: string;
  title: string;
  mimeType: string;
  fileSize: string;
  fileSizeBytes?: number;
  checksum: string;
  displayOrder: number;
  file?: File;
};

const viewMeta: Record<
  DashboardView,
  { title: string; description: string; action?: string }
> = {
  dashboard: {
    title: "Tổng quan",
    description:
      "Theo dõi nhanh tình trạng nội dung, xuất bản và các chỉ số quan trọng của kênh creator.",
  },
  series: {
    title: "Quản lý Series",
    description:
      "Tất cả series của creator nằm tại đây. Mở một series để quản lý mùa, tập và media.",
    action: "Tạo Series mới",
  },
  seasons: {
    title: "Quản lý Mùa",
    description:
      "Mỗi series có thể có một hoặc nhiều mùa. Mở mùa để quản lý danh sách tập.",
    action: "Tạo Mùa",
  },
  episodes: {
    title: "Quản lý Tập",
    description:
      "Tập là đơn vị nội dung của cả truyện tranh và video truyện.",
    action: "Tạo Tập",
  },
  create: {
    title: "Tạo Series mới",
    description: "Thiết lập series truyện tranh hoặc video theo mô hình Series.",
  },
  comic: {
    title: "Tải lên truyện tranh",
    description: "Cập nhật tập truyện tranh và sắp xếp trang theo displayOrder.",
  },
  video: {
    title: "Tải lên video truyện",
    description: "Cập nhật tập video và gắn một media video đang hoạt động.",
  },
  combos: {
    title: "Quản lý Combo",
    description: "Gom nhiều tập thành một combo với giá ưu đãi riêng.",
  },
  analytics: {
    title: "Analytics",
    description:
      "Theo dõi lượt xem, hành vi đọc/xem và hiệu suất nội dung của creator.",
  },
  revenue: {
    title: "Doanh thu",
    description:
      "Quản lý doanh thu, số dư và lịch sử thanh toán bằng đơn vị VNĐ.",
  },
  production: {
    title: "Production",
    description:
      "Theo dõi tiến độ sản xuất, pipeline kiểm duyệt và lịch xuất bản nội dung.",
  },
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const creationSteps = [
  { id: 1, label: "Cốt lõi", caption: "Series" },
  { id: 2, label: "Mùa", caption: "Season" },
  { id: 3, label: "Tập", caption: "Episode" },
  { id: 4, label: "Nội dung", caption: "Media" },
  { id: 5, label: "Xuất bản", caption: "Publish" },
];

function CreationStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-6 overflow-x-auto rounded-2xl border border-white/10 bg-[#121212] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <div className="grid min-w-[680px] grid-cols-5 gap-3">
        {creationSteps.map((step, index) => {
          const active = step.id === currentStep;
          const completed = step.id < currentStep;
          const highlighted = active || completed;

          return (
            <div key={step.id} className="flex min-w-0 items-center gap-3">
              <div
                className={cx(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black transition-colors duration-200",
                  highlighted
                    ? "bg-yellow-400 text-black shadow-[0_0_24px_rgba(250,204,21,0.18)]"
                    : "bg-[#1A1A1A] text-zinc-500",
                )}
              >
                {String(step.id).padStart(2, "0")}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cx(
                    "truncate text-xs font-black uppercase tracking-[0.14em]",
                    active
                      ? "text-yellow-300"
                      : completed
                        ? "text-zinc-100"
                        : "text-zinc-500",
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 truncate text-[11px] font-bold text-zinc-500">
                  {step.caption}
                </p>
                {index < creationSteps.length - 1 && (
                  <div
                    className={cx(
                      "mt-3 h-0.5 rounded-full",
                      completed ? "bg-yellow-400" : "bg-white/10",
                    )}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function reorderPages(pages: ComicPage[], fromId: string, toId: string) {
  const fromIndex = pages.findIndex((page) => page.id === fromId);
  const toIndex = pages.findIndex((page) => page.id === toId);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return pages;
  }

  const nextPages = [...pages];
  const [movedPage] = nextPages.splice(fromIndex, 1);
  nextPages.splice(toIndex, 0, movedPage);

  return nextPages.map((page, index) => ({
    ...page,
    displayOrder: index + 1,
  }));
}

function isLocalPageId(id: string) {
  return id.startsWith("LOCAL-");
}

function isRenderableAssetUrl(value?: string) {
  if (!value) {
    return false;
  }

  return /^(https?:\/\/|blob:|data:image\/)/.test(value);
}

function normalizeAssetUrl(value: string | undefined, fallback = "") {
  return isRenderableAssetUrl(value) ? value! : fallback;
}

function subscribeToClientMount() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

function readFormString(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function readFormNumber(form: FormData, key: string, fallback?: number) {
  const value = Number(readFormString(form, key));

  if (!Number.isFinite(value)) {
    return fallback;
  }

  return value;
}

function splitIdList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatStatusLabel(status: SeriesStatus | SeasonStatus | EpisodeStatus) {
  if (status === "ACTION_REQUIRED") {
    return "Action Required";
  }

  if (status === "REVIEW") {
    return "In Review";
  }

  return status;
}

function formatApprovalStatusLabel(status: ContentApprovalStatus) {
  switch (status) {
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    default:
      return "Pending Review";
  }
}

function getApprovalChipClass(status: ContentApprovalStatus) {
  switch (status) {
    case "APPROVED":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    case "REJECTED":
      return "border-red-500/30 bg-red-500/10 text-red-400";
    default:
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";
  }
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function toDateTimeLocalValue(value?: string) {
  const source = value ? new Date(value) : new Date(Date.now() + 60 * 60 * 1000);
  const date = Number.isNaN(source.getTime())
    ? new Date(Date.now() + 60 * 60 * 1000)
    : source;
  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatMediaStatusLabel(status: MediaStatus) {
  if (status === "PENDING") return "Đang kiểm duyệt";
  if (status === "INACTIVE") return "Vi phạm chính sách";
  if (status === "HLS_PROCESSING") return "Processing";
  if (status === "HLS_READY") return "Ready";
  return formatStatusLabel(status as EpisodeStatus);
}

function isPlayableVideoStatus(status: MediaStatus) {
  return status === "ACTIVE" || status === "HLS_READY";
}

function isProcessingVideoStatus(status: MediaStatus) {
  return status === "PROCESSING" || status === "HLS_PROCESSING";
}

function formatNumber(value?: number) {
  if (value == null) {
    return "-";
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}K`;
  }

  return String(value);
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${bytes} B`;
}

function isBackendMediaTarget(
  media: ComicPage | MediaResponse,
): media is MediaResponse {
  return "mediaId" in media;
}

function getMediaTargetId(media: ComicPage | MediaResponse) {
  return isBackendMediaTarget(media) ? media.mediaId : media.id;
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
    const message = error instanceof Error ? error.message : "Upload failed.";
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
    language: series.language || "",
    categoryIds: series.categories?.map((category) => category.categoryId) ?? [],
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
    updatedAt: episode.updatedAt || episode.createdAt || "-",
  };
}

function mapMediaResponseToComicPage(media: MediaResponse): ComicPage {
  return {
    id: media.mediaId,
    image: normalizeAssetUrl(
      media.fileUrl || media.originalUrl || media.playbackUrl || "",
    ),
    title: `Page ${media.displayOrder ?? 1}`,
    mimeType: media.mimeType,
    fileSize: formatBytes(media.fileSize),
    fileSizeBytes: media.fileSize,
    checksum: media.checksum || "generated",
    displayOrder: media.displayOrder ?? 1,
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
  usePipelineSSE({ enabled: true });

  const queryClient = useQueryClient();
  const accountId = useAuthStore((state) => state.user?.accountId ?? "");
  const initialRouteState = useMemo(() => readDashboardRouteState(), []);
  const [activeView, setActiveView] = useState<DashboardView>(
    initialRouteState.view,
  );
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

  const seriesQuery = useQuery({
    queryKey: ["creator-dashboard", "series"],
    queryFn: () => listSeriesByCreator(),
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
      (activeView === "comic" || activeView === "video"),
    refetchInterval: (query) => {
      const data = query.state.data as MediaResponse[] | undefined;
      const hasPending = data?.some((m) => m.status === "PENDING" || m.status === "HLS_PROCESSING" || m.status === "PROCESSING");
      return hasPending ? 5000 : false;
    },
  });

  // Track media status changes → show toast notification
  const prevMediaStatusRef = useRef<Record<string, string>>({});
  useEffect(() => {
    const mediaList = mediaQuery.data ?? [];
    const prev = prevMediaStatusRef.current;
    for (const media of mediaList) {
      const oldStatus = prev[media.mediaId];
      if (oldStatus && oldStatus !== media.status) {
        if (media.status === "ACTIVE" && (oldStatus === "PENDING" || oldStatus === "HLS_READY")) {
          const type = media.mediaType === "IMAGE" ? "Ảnh" : "Video";
          toast.success(`${type} đã được xuất bản`, {
            description: `Nội dung đã qua kiểm duyệt thành công và hiện đang hiển thị trên nền tảng TaleX.`,
            duration: 10000,
          });
        } else if (media.status === "INACTIVE" && oldStatus === "PENDING") {
          toast.error("Nội dung không đạt kiểm duyệt", {
            description: "Nội dung vi phạm chính sách nền tảng và đã bị tạm ẩn. Vui lòng xem chi tiết vi phạm để chỉnh sửa.",
            duration: 15000,
          });
        } else if (media.status === "FAILED") {
          toast.error("Xử lý nội dung thất bại", {
            description: media.errorMessage || "Đã xảy ra lỗi trong quá trình xử lý. Vui lòng thử đăng tải lại hoặc liên hệ hỗ trợ.",
            duration: 10000,
          });
        } else if (media.status === "PENDING" && oldStatus === "HLS_PROCESSING") {
          toast.info("Đang kiểm duyệt nội dung", {
            description: "Hệ thống đang kiểm tra bản quyền và nội dung. Quá trình này có thể mất vài phút.",
            duration: 5000,
          });
        }
      }
    }
    const next: Record<string, string> = {};
    for (const media of mediaList) next[media.mediaId] = media.status;
    prevMediaStatusRef.current = next;
  }, [mediaQuery.data]);

  const existingMediaPages = useMemo(
    () =>
      (mediaQuery.data ?? [])
      .filter((media) => media.mediaType === "IMAGE" && !media.isDeleted)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .map(mapMediaResponseToComicPage),
    [mediaQuery.data],
  );

  const displayComicPages =
    comicPages.length > 0 ? comicPages : existingMediaPages;

  const hasApprovedComicMedia = useMemo(
    () =>
      (mediaQuery.data ?? []).some(
        (media) =>
          media.mediaType === "IMAGE" &&
          !media.isDeleted &&
          media.status === "ACTIVE" &&
          media.approvalStatus === "APPROVED",
      ),
    [mediaQuery.data],
  );

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
    if (activeView !== "video" || !selectedEpisode?.id || !hasProcessingVideoMedia) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void mediaQuery.refetch();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [
    activeView,
    hasProcessingVideoMedia,
    mediaQuery,
    selectedEpisode?.id,
  ]);

  const createSeriesMutation = useMutation({
    mutationFn: async (input: CreateSeriesInput) => {
      const coverUrl = await uploadSeriesArtwork(input.coverFile, "Cover", "cover");
      const bannerUrl = await uploadSeriesArtwork(input.bannerFile, "Banner", "banner");

      return createSeries({
        title: input.title,
        description: input.description,
        coverUrl,
        bannerUrl,
        contentType: input.contentType,
        visibility: input.visibility,
        ageRating: input.ageRating,
        language: input.language,
        categoryIds: input.categoryIds,
        tagIds: input.tagIds,
      });
    },
    onSuccess: (series) => {
      setUploadMessage("Series created.");
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
        error instanceof Error ? error.message : "Cannot create series.",
      );
    },
  });

  const createEpisodeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSeries || !selectedSeason) {
        throw new Error("Select a season before creating an episode.");
      }

      const created = await createEpisode(selectedSeason.id, {
        episodeNumber: displayEpisodeRows.length + 1,
        title:
          selectedSeries.contentType === "COMIC"
            ? "New Comic Episode"
            : "New Video Episode",
        description: "Draft episode created from creator dashboard.",
        contentType: selectedSeries.contentType,
        unlockType: "FREE",
        priceVnd: 0,
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
        error instanceof Error ? error.message : "Cannot create episode.",
      );
    },
  });

  const createSeasonMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSeries) {
        throw new Error("Select a series before creating a season.");
      }

      const nextSeasonNumber = displaySeasonRows.length + 1;

      return createSeason(selectedSeries.id, {
        seasonNumber: nextSeasonNumber,
        title: `Mùa ${nextSeasonNumber}`,
        description: "Mùa nháp được tạo từ Creator Dashboard.",
      });
    },
    onSuccess: (season) => {
      setUploadMessage("Đã tạo mùa.");
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
        error instanceof Error ? error.message : "Cannot create season.",
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
      const uploadedCoverUrl = await uploadSeriesArtwork(coverFile, "Cover", "cover");
      const uploadedBannerUrl = await uploadSeriesArtwork(bannerFile, "Banner", "banner");

      return updateSeries(series.id, {
        title: series.title,
        description: series.description,
        coverUrl: uploadedCoverUrl || series.coverUrl,
        bannerUrl: uploadedBannerUrl || series.bannerUrl,
        contentType: series.contentType,
        visibility: series.visibility,
        ageRating: series.ageRating,
        language: series.language,
        categoryIds: series.categoryIds,
        tagIds: series.tagIds,
      });
    },
    onSuccess: () => {
      setUploadMessage("Series updated.");
      setEditModal(null);
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "series"],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Cannot update series.",
      );
    },
  });

  const deleteSeriesMutation = useMutation({
    mutationFn: async (series: SeriesRow) => {
      await deleteSeries(series.id);
      return series;
    },
    onSuccess: () => {
      setUploadMessage("Series deleted.");
      setDeleteModal(null);
      openSeriesManagement();
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "series"],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Cannot delete series.",
      );
    },
  });

  const hideSeriesMutation = useMutation({
    mutationFn: (series: SeriesRow) => hideSeries(series.id),
    onSuccess: () => {
      setUploadMessage("Series hidden.");
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "series"] });
    },
    onError: (error) => {
      setUploadMessage(error instanceof Error ? error.message : "Cannot hide series.");
    },
  });

  const unhideSeriesMutation = useMutation({
    mutationFn: (series: SeriesRow) => unhideSeries(series.id),
    onSuccess: () => {
      setUploadMessage("Series visible.");
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "series"] });
    },
    onError: (error) => {
      setUploadMessage(error instanceof Error ? error.message : "Cannot unhide series.");
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
      setUploadMessage("Đã cập nhật mùa.");
      setEditModal(null);
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "seasons", selectedSeries?.id],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Cannot update season.",
      );
    },
  });

  const deleteSeasonMutation = useMutation({
    mutationFn: async (season: SeasonRow) => {
      await deleteSeason(season.id);
      return season;
    },
    onSuccess: () => {
      setUploadMessage("Đã xóa mùa.");
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
        error instanceof Error ? error.message : "Cannot delete season.",
      );
    },
  });

  const hideSeasonMutation = useMutation({
    mutationFn: (season: SeasonRow) => hideSeason(season.id),
    onSuccess: () => {
      setUploadMessage("Đã ẩn mùa.");
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "seasons", selectedSeries?.id] });
    },
    onError: (error) => {
      setUploadMessage(error instanceof Error ? error.message : "Cannot hide season.");
    },
  });

  const unhideSeasonMutation = useMutation({
    mutationFn: (season: SeasonRow) => unhideSeason(season.id),
    onSuccess: () => {
      setUploadMessage("Mùa đã hiển thị.");
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "seasons", selectedSeries?.id] });
    },
    onError: (error) => {
      setUploadMessage(error instanceof Error ? error.message : "Cannot unhide season.");
    },
  });

  const updateEpisodeMutation = useMutation({
    mutationFn: async (episode: EpisodeRow) => {
      const normalizedPriceVnd =
        episode.unlockType === "PAID" ? episode.priceVnd : 0;

      return updateEpisode(episode.id, {
        title: episode.title,
        episodeNumber: episode.episodeNumber,
        description: episode.description,
        contentType: episode.contentType,
        unlockType: episode.unlockType,
        priceVnd: normalizedPriceVnd,
        totalPage: episode.totalPage,
      });
    },
    onSuccess: () => {
      setUploadMessage("Episode updated.");
      setEditModal(null);
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "episodes", selectedSeason?.id],
      });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Cannot update episode.",
      );
    },
  });

  const deleteEpisodeMutation = useMutation({
    mutationFn: async (episode: EpisodeRow) => {
      await deleteEpisode(episode.id);
      return episode;
    },
    onSuccess: () => {
      setUploadMessage("Episode deleted.");
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
        error instanceof Error ? error.message : "Cannot delete episode.",
      );
    },
  });

  const hideEpisodeMutation = useMutation({
    mutationFn: (episode: EpisodeRow) => hideEpisode(episode.id),
    onSuccess: () => {
      setUploadMessage("Episode hidden.");
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "episodes", selectedSeason?.id] });
    },
    onError: (error) => {
      setUploadMessage(error instanceof Error ? error.message : "Cannot hide episode.");
    },
  });

  const unhideEpisodeMutation = useMutation({
    mutationFn: (episode: EpisodeRow) => unhideEpisode(episode.id),
    onSuccess: () => {
      setUploadMessage("Episode visible.");
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "episodes", selectedSeason?.id] });
    },
    onError: (error) => {
      setUploadMessage(error instanceof Error ? error.message : "Cannot unhide episode.");
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
      setUploadMessage("Publish schedule saved.");
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
        error instanceof Error ? error.message : "Cannot schedule publish.",
      );
    },
  });

  const cancelScheduleMutation = useMutation({
    mutationFn: (episodeId: string) => cancelEpisodeSchedulePublish(episodeId),
    onSuccess: () => {
      setUploadMessage("Schedule canceled.");
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "episodes", selectedSeason?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "series"] });
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "seasons", selectedSeries?.id] });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Cannot cancel schedule.",
      );
    },
  });

  const publishEpisodeMutation = useMutation({
    mutationFn: (episodeId: string) => publishEpisode(episodeId),
    onSuccess: () => {
      setUploadMessage("Episode published successfully.");
      queryClient.invalidateQueries({
        queryKey: ["creator-dashboard", "episodes", selectedSeason?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "series"] });
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "seasons", selectedSeries?.id] });
    },
    onError: (error) => {
      setUploadMessage(
        error instanceof Error ? error.message : "Cannot publish episode.",
      );
    },
  });

  const saveComicPagesMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEpisode) {
        throw new Error("Select an episode before saving display order.");
      }

      const pagesToSave = displayComicPages.map((page, index) => ({
        ...page,
        displayOrder: index + 1,
      }));
      const savedPages = pagesToSave.filter(
        (page) => !isLocalPageId(page.id),
      );
      const localPages = pagesToSave.filter((page) => page.file);

      if (savedPages.length === 0 && localPages.length === 0) {
        throw new Error("Choose comic page files before saving.");
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

      return createComicPageMedia(
        selectedEpisode.id,
        uploadedPages,
        accountId,
      );
    },
    onSuccess: (createdPages) => {
      setUploadMessage(
        createdPages.length > 0
          ? `${createdPages.length} page(s) uploaded and display order saved.`
          : "Display order saved.",
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
        error instanceof Error ? error.message : "Cannot save display order.",
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
        setUploadMessage("Video deleted.");
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
    const lastDisplayOrder = basePages.reduce(
      (maxOrder, page) => Math.max(maxOrder, page.displayOrder),
      0,
    );
    const nextPages = selectedFiles.map((file, index) => ({
      id: `LOCAL-${batchId}-${file.name}-${file.lastModified}-${index}`,
      image: URL.createObjectURL(file),
      title: file.name,
      mimeType: file.type || "image/jpeg",
      fileSize: formatBytes(file.size),
      fileSizeBytes: file.size,
      checksum: "generated",
      displayOrder: lastDisplayOrder + index + 1,
      file,
    }));

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
    setDashboardRouteState(defaultDashboardRouteState);
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

  function handleLayoutNavigate(view: DashboardView) {
    setUploadMessage(null);

    if (view === "series") {
      openSeriesManagement();
      return;
    }

    if (view === "create") {
      openCreateSeries();
      return;
    }

    clearUploadDrafts();
    setDashboardRouteState({
      view,
      seriesId: "",
      seasonId: "",
      episodeId: "",
    });
  }

  return (
    <>
      <CreatorDashboardLayout
        activeView={activeView}
        title={viewMeta[activeView].title}
        description={viewMeta[activeView].description}
        onNavigate={handleLayoutNavigate}
      >
        <section className="min-w-0">
          {uploadMessage && activeView !== "comic" && activeView !== "video" && (
            <div className="mb-6 rounded-2xl border border-yellow-400/20 bg-[#161616] px-4 py-3 text-sm font-bold text-zinc-300">
              {uploadMessage}
            </div>
          )}

          {activeView === "series" && (
            <SeriesManagementView
              rows={displaySeriesRows}
              isLoading={seriesQuery.isLoading}
              onCreateSeries={openCreateSeries}
              onSelectSeries={openSeriesSeasons}
              onUpdateSeries={handleUpdateSeries}
              onDeleteSeries={handleDeleteSeries}
              onHideSeries={(series) => hideSeriesMutation.mutate(series)}
              onUnhideSeries={(series) => unhideSeriesMutation.mutate(series)}
            />
          )}

          {activeView === "seasons" && selectedSeries && (
            <SeasonManagementView
              selectedSeries={selectedSeries}
              seasons={displaySeasonRows}
              isLoading={seasonsQuery.isLoading}
              onBack={openSeriesManagement}
              onSelectSeason={openSeasonEpisodes}
              onCreateSeason={handleCreateSeason}
              isCreatingSeason={createSeasonMutation.isPending}
              onUpdateSeason={handleUpdateSeason}
              onDeleteSeason={handleDeleteSeason}
              onHideSeason={(season) => hideSeasonMutation.mutate(season)}
              onUnhideSeason={(season) => unhideSeasonMutation.mutate(season)}
            />
          )}

          {activeView === "seasons" &&
            !selectedSeries &&
            isRestoringSeriesSelection && (
              <SelectionStatePanel
                title="Loading selected series..."
                description="Loading data for the selected series."
              />
            )}

          {activeView === "seasons" &&
            !selectedSeries &&
            !isRestoringSeriesSelection && (
              <SelectionStatePanel
                title="No series selected."
                description="Create or select a series before managing seasons."
              />
            )}

          {activeView === "episodes" && selectedSeries && selectedSeason && (
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
          )}

          {activeView === "episodes" &&
            (!selectedSeries || !selectedSeason) &&
            (isRestoringSeriesSelection || isRestoringSeasonSelection) && (
              <SelectionStatePanel
                title="Loading selected season..."
                description="Loading data for the selected season."
              />
            )}

          {activeView === "episodes" &&
            (!selectedSeries || !selectedSeason) &&
            !isRestoringSeriesSelection &&
            !isRestoringSeasonSelection && (
              <SelectionStatePanel
                title="No season selected."
                description="Create or select a season before managing episodes."
              />
            )}

          {activeView === "create" && (
            <CreateSeriesView
              contentType={contentType}
              onContentTypeChange={setContentType}
              onSubmit={(input) => createSeriesMutation.mutate(input)}
              isSubmitting={createSeriesMutation.isPending}
            />
          )}

          {activeView === "comic" && selectedEpisode && (
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
              onSaveEpisode={(episode) => updateEpisodeMutation.mutate(episode)}
              isSavingEpisode={updateEpisodeMutation.isPending}
              canSchedulePublish={hasApprovedComicMedia}
              onSchedulePublish={(episode) =>
                handleSchedulePublish({ kind: "episode", value: episode })
              }
              onHideEpisode={(episode) => hideEpisodeMutation.mutate(episode)}
              onUnhideEpisode={(episode) => unhideEpisodeMutation.mutate(episode)}
              isHidingEpisode={hideEpisodeMutation.isPending || unhideEpisodeMutation.isPending}
              onCancelSchedule={(episode) => cancelScheduleMutation.mutate(episode.id)}
              isCancelingSchedule={cancelScheduleMutation.isPending}
              onPublishNow={(episode) => publishEpisodeMutation.mutate(episode.id)}
              isPublishingNow={publishEpisodeMutation.isPending}
              onBack={() =>
                setDashboardRouteState({
                  view: "episodes",
                  seriesId: selectedSeries?.id ?? selectedSeriesId,
                  seasonId: selectedSeason?.id ?? selectedSeasonId,
                  episodeId: "",
                })
              }
            />
          )}

          {activeView === "comic" &&
            !selectedEpisode &&
            isRestoringEpisodeSelection && (
              <SelectionStatePanel
                title="Loading selected episode..."
                description="Loading data for the selected episode."
              />
            )}

          {activeView === "comic" &&
            !selectedEpisode &&
            !isRestoringEpisodeSelection && (
              <SelectionStatePanel
                title="No episode selected."
                description="Create or select an episode before uploading comic pages."
              />
            )}

          {activeView === "video" && selectedEpisode && (
            <VideoUploadView
              selectedSeries={selectedSeries}
              selectedSeason={selectedSeason}
              selectedEpisode={selectedEpisode}
              videos={existingVideoMedia}
              isLoadingMedia={mediaQuery.isLoading}
              uploadMessage={uploadMessage}
              onUploadCompleted={handleVideoUploadCompleted}
              onDeleteVideo={handleDeleteVideo}
              onSaveEpisode={(episode) => updateEpisodeMutation.mutate(episode)}
              isSavingEpisode={updateEpisodeMutation.isPending}
              accountId={accountId}
              onSchedulePublish={(episode) =>
                handleSchedulePublish({ kind: "episode", value: episode })
              }
              onHideEpisode={(episode) => hideEpisodeMutation.mutate(episode)}
              onUnhideEpisode={(episode) => unhideEpisodeMutation.mutate(episode)}
              isHidingEpisode={hideEpisodeMutation.isPending || unhideEpisodeMutation.isPending}
              onCancelSchedule={(episode) => cancelScheduleMutation.mutate(episode.id)}
              isCancelingSchedule={cancelScheduleMutation.isPending}
              onPublishNow={(episode) => publishEpisodeMutation.mutate(episode.id)}
              isPublishingNow={publishEpisodeMutation.isPending}
              onBack={() =>
                setDashboardRouteState({
                  view: "episodes",
                  seriesId: selectedSeries?.id ?? selectedSeriesId,
                  seasonId: selectedSeason?.id ?? selectedSeasonId,
                  episodeId: "",
                })
              }
            />
          )}

          {activeView === "video" &&
            !selectedEpisode &&
            isRestoringEpisodeSelection && (
              <SelectionStatePanel
                title="Loading selected episode..."
                description="Loading data for the selected episode."
              />
            )}

          {activeView === "video" &&
            !selectedEpisode &&
            !isRestoringEpisodeSelection && (
              <SelectionStatePanel
                title="No episode selected."
                description="Create or select an episode before uploading video."
              />
            )}

          {activeView === "combos" && <ComboManagementView />}

          {(activeView === "dashboard" ||
            activeView === "analytics" ||
            activeView === "revenue" ||
            activeView === "production") && (
            <CreatorPlaceholderView view={activeView} />
          )}
        </section>
      </CreatorDashboardLayout>
      <EditEntityModal
        key={editModal ? `${editModal.kind}-${editModal.value.id}` : "closed"}
        modal={editModal}
        isSaving={
          updateSeriesMutation.isPending ||
          updateSeasonMutation.isPending ||
          updateEpisodeMutation.isPending
        }
        uploadMessage={uploadMessage}
        onClose={() => setEditModal(null)}
        onSubmit={handleSubmitEdit}
      />
      <SchedulePublishModal
        modal={scheduleModal}
        isSaving={schedulePublishMutation.isPending}
        onClose={() => setScheduleModal(null)}
        onSubmit={(scheduledPublishAt) => {
          if (!scheduleModal) {
            return;
          }

          schedulePublishMutation.mutate({
            target: scheduleModal,
            scheduledPublishAt,
          });
        }}
      />
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
    </>
  );
}

function EditEntityModal({
  modal,
  isSaving,
  uploadMessage,
  onClose,
  onSubmit,
}: {
  modal: EditModalState;
  isSaving: boolean;
  uploadMessage: string | null;
  onClose: () => void;
  onSubmit: (nextValue: EditSubmitState) => void;
}) {
  const [coverFile, setCoverFile] = useState<File | undefined>();
  const [bannerFile, setBannerFile] = useState<File | undefined>();

  if (!modal) {
    return null;
  }

  const controlClass =
    "h-11 w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-3 text-sm font-semibold text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-yellow-400/50 focus:ring-4 focus:ring-yellow-400/10";
  const textareaClass =
    "min-h-24 w-full resize-none rounded-xl border border-white/10 bg-[#1A1A1A] p-3 text-sm font-semibold text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-yellow-400/50 focus:ring-4 focus:ring-yellow-400/10";

  function handleSeriesSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = readFormString(form, "title");

    if (!title) {
      return;
    }

    onSubmit({
      kind: "series",
      coverFile,
      bannerFile,
      value: {
        ...(modal!.value as SeriesRow),
        title,
        description: readFormString(form, "description"),
        coverUrl: readFormString(form, "coverUrl"),
        bannerUrl: readFormString(form, "bannerUrl"),
        contentType: readFormString(form, "contentType") as ContentType,
        visibility: readFormString(form, "visibility") as Visibility,
        ageRating: readFormString(form, "ageRating"),
        language: readFormString(form, "language"),
        categoryIds: splitIdList(readFormString(form, "categoryIds")),
        tagIds: splitIdList(readFormString(form, "tagIds")),
      },
    });
  }

  function handleSeasonSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = readFormString(form, "title");

    if (!title) {
      return;
    }

    const season = modal!.value as SeasonRow;

    onSubmit({
      kind: "season",
      value: {
        ...season,
        seasonNumber: readFormNumber(
          form,
          "seasonNumber",
          season.seasonNumber,
        )!,
        title,
        description: readFormString(form, "description"),
      },
    });
  }

  function handleEpisodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = readFormString(form, "title");

    if (!title) {
      return;
    }

    const episode = modal!.value as EpisodeRow;
    const totalPage = readFormNumber(form, "totalPage", episode.totalPage);
    const unlockType = readFormString(form, "unlockType") as EpisodeUnlockType;
    const priceVnd =
      unlockType === "PAID"
        ? readFormNumber(form, "priceVnd", episode.priceVnd) ?? 0
        : 0;

    if (unlockType === "PAID" && priceVnd <= 0) {
      return;
    }

    onSubmit({
      kind: "episode",
      value: {
        ...episode,
        episodeNumber: readFormNumber(
          form,
          "episodeNumber",
          episode.episodeNumber,
        )!,
        title,
        description: readFormString(form, "description"),
        contentType: readFormString(form, "contentType") as ContentType,
        unlockType,
        priceVnd,
        totalPage,
      },
    });
  }

  const title =
    modal.kind === "series"
      ? "Cập nhật Series"
      : modal.kind === "season"
        ? "Cập nhật Mùa"
        : "Cập nhật Tập";

  return (
    <ModalShell title={title} subtitle="Chỉnh sửa thông tin và lưu thay đổi." onClose={onClose}>
      {modal.kind === "series" && (
        <form onSubmit={handleSeriesSubmit} className="space-y-5">
          {uploadMessage && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-300">
              {uploadMessage}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Loại nội dung" required>
              <select
                name="contentType"
                defaultValue={modal.value.contentType}
                className={controlClass}
              >
                <option value="COMIC">COMIC</option>
                <option value="VIDEO">VIDEO</option>
              </select>
            </Field>
          </div>

          <Field label="Tiêu đề" required>
            <input
              name="title"
              required
              defaultValue={modal.value.title}
              className={controlClass}
            />
          </Field>

          <Field label="Mô tả">
            <textarea
              name="description"
              defaultValue={modal.value.description}
              className={textareaClass}
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Cover URL">
              <input
                name="coverUrl"
                defaultValue={modal.value.coverUrl}
                className={controlClass}
              />
            </Field>
            <Field label="Banner URL">
              <input
                name="bannerUrl"
                defaultValue={modal.value.bannerUrl}
                className={controlClass}
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ArtworkUploadField
              title="Thay ảnh bìa"
              helper="Ảnh mới không bắt buộc"
              file={coverFile}
              onFileChange={setCoverFile}
            />
            <ArtworkUploadField
              title="Thay banner"
              helper="Ảnh mới không bắt buộc"
              file={bannerFile}
              onFileChange={setBannerFile}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Trạng thái">
              <input
                value={formatStatusLabel(modal.value.status)}
                readOnly
                className={controlClass}
              />
            </Field>
            <Field label="Hiển thị">
              <select
                name="visibility"
                defaultValue={modal.value.visibility}
                className={controlClass}
              >
                <option value="PUBLIC">Công khai</option>
                <option value="PRIVATE">Riêng tư</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Độ tuổi">
              <input
                name="ageRating"
                defaultValue={modal.value.ageRating}
                className={controlClass}
              />
            </Field>
            <Field label="Ngôn ngữ">
              <select
                name="language"
                defaultValue={modal.value.language}
                className={controlClass}
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">Tiếng Anh</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Thể loại (Genres)">
              <select
                name="categoryIds"
                defaultValue={modal.value.categoryIds[0] ?? ""}
                className={controlClass}
              >
                <option value="">Chọn thể loại</option>
                <option value="action">Hành động</option>
                <option value="fantasy">Fantasy</option>
                <option value="romance">Lãng mạn</option>
                <option value="mystery">Bí ẩn</option>
              </select>
            </Field>
            <Field label="Từ khóa (Tags)">
              <select
                name="tagIds"
                defaultValue={modal.value.tagIds[0] ?? ""}
                className={controlClass}
              >
                <option value="">Chọn từ khóa</option>
                <option value="slow-burn">Slow burn</option>
                <option value="revenge">Báo thù</option>
                <option value="royal">Hoàng gia</option>
                <option value="adventure">Phiêu lưu</option>
              </select>
            </Field>
          </div>

          <ModalActions isSaving={isSaving} onClose={onClose} />
        </form>
      )}

      {modal.kind === "season" && (
        <form onSubmit={handleSeasonSubmit} className="space-y-5">
          <Field label="Số mùa">
            <input
              type="number"
              min={1}
              name="seasonNumber"
              defaultValue={modal.value.seasonNumber}
              className={controlClass}
            />
          </Field>
          <Field label="Tiêu đề" required>
            <input
              name="title"
              required
              defaultValue={modal.value.title}
              className={controlClass}
            />
          </Field>
          <Field label="Mô tả">
            <textarea
              name="description"
              defaultValue={modal.value.description}
              className={textareaClass}
            />
          </Field>
          <Field label="Trạng thái">
            <input
              value={formatStatusLabel(modal.value.status)}
              readOnly
              className={controlClass}
            />
          </Field>
          <ModalActions isSaving={isSaving} onClose={onClose} />
        </form>
      )}

      {modal.kind === "episode" && (
        <form onSubmit={handleEpisodeSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Số tập">
              <input
                type="number"
                min={1}
                name="episodeNumber"
                defaultValue={modal.value.episodeNumber}
                className={controlClass}
              />
            </Field>
            <Field label="Loại nội dung">
              <select
                name="contentType"
                defaultValue={modal.value.contentType}
                className={controlClass}
              >
                <option value="COMIC">COMIC</option>
                <option value="VIDEO">VIDEO</option>
              </select>
            </Field>
          </div>
          <Field label="Tiêu đề" required>
            <input
              name="title"
              required
              defaultValue={modal.value.title}
              className={controlClass}
            />
          </Field>
          <Field label="Mô tả">
            <textarea
              name="description"
              defaultValue={modal.value.description}
              className={textareaClass}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Trạng thái">
              <input
                value={formatStatusLabel(modal.value.status)}
                readOnly
                className={controlClass}
              />
            </Field>
            <Field label="Tổng số trang">
              <input
                type="number"
                min={0}
                name="totalPage"
                defaultValue={modal.value.totalPage ?? 0}
                className={controlClass}
              />
            </Field>
          </div>
          <EpisodeUnlockFields
            defaultUnlockType={modal.value.unlockType}
            defaultPriceVnd={modal.value.priceVnd}
            controlClass={controlClass}
          />
          <ModalActions isSaving={isSaving} onClose={onClose} />
        </form>
      )}
    </ModalShell>
  );
}

function SchedulePublishModal({
  modal,
  isSaving,
  onClose,
  onSubmit,
}: {
  modal: ScheduleModalState;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (scheduledPublishAt: string) => void;
}) {
  if (!modal) {
    return null;
  }

  const title = modal.value.title;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const scheduledPublishAt = readFormString(form, "scheduledPublishAt");

    if (!scheduledPublishAt) {
      return;
    }

    onSubmit(scheduledPublishAt);
  }

  return (
    <ModalShell
      title="Lên lịch xuất bản"
      subtitle="Chỉ những tập có media đã duyệt mới có thể lên lịch."
      onClose={onClose}
      compact
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">
            {modal.kind}
          </p>
          <p className="mt-1 text-lg font-black text-zinc-50">{title}</p>
          <p className="mt-2 text-xs font-bold text-zinc-400">
            Lịch hiện tại: {formatDateTime(modal.value.scheduledPublishAt)}
          </p>
        </div>

        <Field label="Thời điểm xuất bản" required>
          <input
            name="scheduledPublishAt"
            type="datetime-local"
            required
            min={toDateTimeLocalValue()}
            defaultValue={toDateTimeLocalValue(modal.value.scheduledPublishAt)}
            className="h-12 w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 text-sm font-semibold text-zinc-100 outline-none transition focus:border-yellow-400/50 focus:ring-4 focus:ring-yellow-400/10"
          />
        </Field>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700 bg-transparent px-5 py-3 text-sm font-black text-zinc-400 transition hover:border-white/20 hover:text-white"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Đang lưu..." : "Lưu lịch"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function DeleteEntityModal({
  modal,
  isDeleting,
  onClose,
  onConfirm,
}: {
  modal: DeleteModalState;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!modal) {
    return null;
  }

  const entityLabel =
    modal.kind === "series"
      ? modal.value.title
      : modal.kind === "season"
        ? modal.value.title
        : modal.kind === "episode"
          ? modal.value.title
          : isBackendMediaTarget(modal.value)
            ? `${modal.value.mediaType} media`
            : `Page ${modal.value.displayOrder}`;

  return (
    <ModalShell
      title="Xác nhận xóa"
      subtitle="Kiểm tra lại mục này trước khi xóa khỏi workspace."
      onClose={onClose}
      compact
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm font-bold text-zinc-400">
            Bạn đang xóa:
          </p>
          <p className="mt-1 text-lg font-black text-red-300">
            {entityLabel}
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700 bg-transparent px-5 py-3 text-sm font-black text-zinc-400 transition hover:border-white/20 hover:text-white"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-xl bg-red-500 px-5 py-3 text-sm font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Đang xóa..." : "Xóa"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  title,
  subtitle,
  children,
  onClose,
  compact,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  onClose: () => void;
  compact?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          "max-h-[90vh] w-full overflow-y-auto rounded-[24px] border border-white/10 bg-[#121212] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.4)]",
          compact ? "max-w-lg" : "max-w-3xl",
        )}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-zinc-50">{title}</h2>
            <p className="mt-1 text-sm font-semibold text-zinc-400">
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({
  isSaving,
  onClose,
}: {
  isSaving: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl border border-zinc-700 bg-transparent px-5 py-3 text-sm font-black text-zinc-400 transition hover:border-white/20 hover:text-white"
      >
        Hủy
      </button>
      <button
        type="submit"
        disabled={isSaving}
        className="rounded-xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </div>
  );
}

function CreatorPlaceholderView({ view }: { view: DashboardView }) {
  const labels: Partial<Record<DashboardView, string>> = {
    dashboard: "Tổng quan Creator Studio đang được kết nối với dữ liệu thật.",
    analytics: "Analytics sẽ hiển thị lượt xem, tỷ lệ hoàn thành và xu hướng nội dung.",
    revenue: "Doanh thu sẽ tổng hợp số dư, VNĐ, giao dịch và lịch sử rút tiền.",
    production: "Production sẽ theo dõi pipeline sản xuất, kiểm duyệt và lịch xuất bản.",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
      <div className="max-w-2xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">
          Sắp ra mắt
        </p>
        <h2 className="mt-3 text-2xl font-black text-zinc-50">
          {viewMeta[view].title}
        </h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-zinc-400">
          {labels[view] ?? "View này đang được chuẩn bị cho Creator Dashboard."}
        </p>
      </div>
    </div>
  );
}

function SeriesManagementView({
  rows,
  isLoading,
  onCreateSeries,
  onSelectSeries,
  onUpdateSeries,
  onDeleteSeries,
  onHideSeries,
  onUnhideSeries,
}: {
  rows: SeriesRow[];
  isLoading: boolean;
  onCreateSeries: () => void;
  onSelectSeries: (seriesId: string) => void;
  onUpdateSeries: (series: SeriesRow) => void;
  onDeleteSeries: (series: SeriesRow) => void;
  onHideSeries: (series: SeriesRow) => void;
  onUnhideSeries: (series: SeriesRow) => void;
}) {
  const [filter, setFilter] = useState<"ALL" | ContentType>("ALL");

  const filteredRows =
    filter === "ALL"
      ? rows
      : rows.filter((row) => row.contentType === filter);

  return (
    <div className="space-y-7">
      <CreationStepper currentStep={1} />

      <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-[#121212] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">
            Creator Library
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-50">
            Series của tôi
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-zinc-400">
            Quản lý series, mùa và các tập của bạn.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateSeries}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-black text-black shadow-[0_4px_20px_rgba(250,204,21,0.15)] transition hover:bg-yellow-300"
        >
          <Plus className="h-5 w-5" />
          Tạo Series mới
        </button>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-[#121212] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative w-full lg:max-w-xl">
            <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              placeholder="Tìm kiếm tên series..."
              className="h-14 w-full rounded-full border border-white/10 bg-white/[0.06] pl-14 pr-5 text-sm font-semibold text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-yellow-400/50 focus:bg-white/[0.08] focus:ring-4 focus:ring-yellow-400/10"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="grid h-12 grid-cols-3 rounded-xl border border-white/5 bg-zinc-900 p-1 text-sm font-black">
              <FilterTab
                active={filter === "ALL"}
                label="Tất cả"
                onClick={() => setFilter("ALL")}
              />
              <FilterTab
                active={filter === "COMIC"}
                label="Truyện"
                onClick={() => setFilter("COMIC")}
              />
              <FilterTab
                active={filter === "VIDEO"}
                label="Video"
                onClick={() => setFilter("VIDEO")}
              />
            </div>

            <button className="flex h-12 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-5 text-sm font-bold text-zinc-300 transition hover:border-yellow-400/50 hover:text-yellow-400">
              Tất cả trạng thái
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
        <ApiStateNote isLoading={isLoading} />
      </div>

      <div>
        {!isLoading && filteredRows.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#121212] px-8 py-10 text-center text-sm font-bold text-zinc-400 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            Creator này chưa có series nào.
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {filteredRows.map((series) => (
            <SeriesCard
              key={series.id}
              series={series}
              onSelectSeries={onSelectSeries}
              onUpdateSeries={onUpdateSeries}
              onDeleteSeries={onDeleteSeries}
              onHideSeries={onHideSeries}
              onUnhideSeries={onUnhideSeries}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-lg px-5 transition",
        active
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/10"
          : "text-zinc-400 hover:text-yellow-300",
      )}
    >
      {label}
    </button>
  );
}

function ApiStateNote({
  isLoading,
}: {
  isLoading: boolean;
}) {
  if (!isLoading) {
    return null;
  }

  return (
    <div className="mt-4 rounded-2xl border border-white/5 bg-[#1A1A1A] px-4 py-3 text-xs font-bold text-zinc-400">
      Loading content...
    </div>
  );
}

function SelectionStatePanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Panel className="border-white/10 bg-[#121212] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
      <div className="py-10 text-center">
        <p className="text-lg font-black text-zinc-50">{title}</p>
        <p className="mt-2 text-sm font-bold text-zinc-400">{description}</p>
      </div>
    </Panel>
  );
}

function SeriesCoverImage({
  src,
  className,
}: {
  src?: string;
  className: string;
}) {
  if (!src) {
    return (
      <div
        className={cx(
          className,
          "flex items-center justify-center border border-white/10 bg-[#1A1A1A] text-zinc-500",
        )}
      >
        <ImageIcon className="h-7 w-7" />
      </div>
    );
  }

  return <img src={src} alt="" className={className} />;
}

function SeriesCard({
  series,
  onSelectSeries,
  onUpdateSeries,
  onDeleteSeries,
  onHideSeries,
  onUnhideSeries,
}: {
  series: SeriesRow;
  onSelectSeries: (seriesId: string) => void;
  onUpdateSeries: (series: SeriesRow) => void;
  onDeleteSeries: (series: SeriesRow) => void;
  onHideSeries: (series: SeriesRow) => void;
  onUnhideSeries: (series: SeriesRow) => void;
}) {
  const isComic = series.contentType === "COMIC";
  const isPublished = series.status === "PUBLISHED";
  const isDraft = series.status === "DRAFT";
  const isHidden = series.status === "HIDDEN";
  const isActionRequired = series.status === "ACTION_REQUIRED";
  const statusClass = cx(
    "border border-white/20 bg-black/60 text-zinc-100 backdrop-blur-md",
    isPublished && "text-cyan-300",
    isDraft && "text-zinc-300",
    (isHidden || isActionRequired) && "text-amber-300",
    !isPublished && !isDraft && !isHidden && !isActionRequired && "text-red-300",
  );

  function stopAction(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectSeries(series.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectSeries(series.id);
        }
      }}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121212] shadow-[0_4px_20px_rgba(0,0,0,0.4)] outline-none transition-all duration-300 hover:-translate-y-1 hover:border-yellow-400/50 focus-visible:border-yellow-400/70 focus-visible:ring-4 focus-visible:ring-yellow-400/10"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#1A1A1A]">
        <SeriesCoverImage
          src={series.coverUrl}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span
          className={cx(
            "absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black",
            statusClass,
          )}
        >
          <span
            className={cx(
              "h-2 w-2 rounded-full",
              isPublished && "bg-cyan-400",
              isDraft && "bg-zinc-500",
              (isHidden || isActionRequired) && "bg-amber-400",
              !isPublished &&
                !isDraft &&
                !isHidden &&
                !isActionRequired &&
                "bg-red-400",
            )}
          />
          {formatStatusLabel(series.status)}
        </span>

        <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <button
            type="button"
            onClick={(event) => {
              stopAction(event);
              onUpdateSeries(series);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-black/55 text-zinc-200 backdrop-blur-md transition hover:border-yellow-400/50 hover:text-yellow-400"
            title="Cập nhật series"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          {isPublished && (
            <button
              type="button"
              onClick={(event) => {
                stopAction(event);
                onHideSeries(series);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-black/55 text-zinc-200 backdrop-blur-md transition hover:border-yellow-400/50 hover:text-yellow-400"
              title="Ẩn series"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          {isHidden && (
            <button
              type="button"
              onClick={(event) => {
                stopAction(event);
                onUnhideSeries(series);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-black/55 text-zinc-200 backdrop-blur-md transition hover:border-yellow-400/50 hover:text-yellow-400"
              title="Hiện series"
            >
              <Zap className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={(event) => {
              stopAction(event);
              onDeleteSeries(series);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-black/55 text-zinc-200 backdrop-blur-md transition hover:border-red-400/50 hover:text-red-400"
            title="Xóa series"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pt-4">
        <h3 className="truncate text-lg font-black text-zinc-50">
          {series.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-zinc-400">
          {series.description || series.subtitle || "Chưa có mô tả cho series này."}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs font-bold text-zinc-400">
        <span className="flex min-w-0 items-center gap-2">
          {isComic ? (
            <BookOpen className="h-4 w-4 shrink-0 text-purple-300" />
          ) : (
            <Clapperboard className="h-4 w-4 shrink-0 text-cyan-300" />
          )}
          <span className="truncate">{isComic ? "Truyện tranh" : "Video"}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <Eye className="h-4 w-4" />
          {series.views || "0 Views"}
        </span>
      </div>
    </div>
  );
}

function SeasonManagementView({
  selectedSeries,
  seasons,
  isLoading,
  onBack,
  onSelectSeason,
  onCreateSeason,
  isCreatingSeason,
  onUpdateSeason,
  onDeleteSeason,
  onHideSeason,
  onUnhideSeason,
}: {
  selectedSeries: SeriesRow;
  seasons: SeasonRow[];
  isLoading: boolean;
  onBack: () => void;
  onSelectSeason: (seasonId: string) => void;
  onCreateSeason: () => void;
  isCreatingSeason: boolean;
  onUpdateSeason: (season: SeasonRow) => void;
  onDeleteSeason: (season: SeasonRow) => void;
  onHideSeason: (season: SeasonRow) => void;
  onUnhideSeason: (season: SeasonRow) => void;
}) {
  return (
    <div className="space-y-6">
      <CreationStepper currentStep={2} />

      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-zinc-300 transition hover:border-yellow-400/50 hover:text-yellow-400"
      >
        <ChevronLeft className="h-4 w-4" />
        Quay lại Series
      </button>

      <Panel className="border-white/10 bg-[#121212] shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <SeriesCoverImage
              src={selectedSeries.coverUrl}
              className="h-20 w-20 shrink-0 rounded-2xl object-cover"
            />
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-black text-zinc-50">
                {selectedSeries.title}
              </h2>
              <p className="text-sm font-bold text-zinc-400">
                {selectedSeries.contentType} series . {seasons.length} mùa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCreateSeason}
            disabled={isCreatingSeason}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-black text-black shadow-[0_4px_20px_rgba(250,204,21,0.15)] transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-5 w-5" />
            {isCreatingSeason ? "Đang tạo..." : "Tạo Mùa"}
          </button>
        </div>
        <ApiStateNote isLoading={isLoading} />
      </Panel>

      <div className="grid gap-4">
        {!isLoading && seasons.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#121212] px-5 py-8 text-center text-sm font-bold text-zinc-400 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            Series này chưa có mùa nào.
          </div>
        )}
        {seasons.map((season) => (
          <SeasonCard
            key={season.id}
            season={season}
            onSelect={() => onSelectSeason(season.id)}
            onUpdate={() => onUpdateSeason(season)}
            onDelete={() => onDeleteSeason(season)}
            onHide={() => onHideSeason(season)}
            onUnhide={() => onUnhideSeason(season)}
          />
        ))}
      </div>
    </div>
  );
}

function SeasonCard({
  season,
  onSelect,
  onUpdate,
  onDelete,
  onHide,
  onUnhide,
}: {
  season: SeasonRow;
  onSelect: () => void;
  onUpdate: () => void;
  onDelete: () => void;
  onHide: () => void;
  onUnhide: () => void;
}) {
  const statusStyle =
    season.status === "PUBLISHED"
      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.1)]"
      : season.status === "DRAFT"
        ? "border-zinc-700 bg-zinc-800/60 text-zinc-400"
        : "border-amber-500/30 bg-amber-500/10 text-amber-400";
  const isHidden = season.status === "HIDDEN";
  const isPublished = season.status === "PUBLISHED";

  return (
    <div className="rounded-[22px] border border-white/10 bg-[#121212] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-colors duration-200 hover:bg-white/[0.02]">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_140px_140px_minmax(0,240px)] lg:items-center">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-300">
              Mùa {season.seasonNumber}
            </span>
            <span
              className={cx(
                "rounded-full border px-3 py-1 text-xs font-black",
                statusStyle,
              )}
            >
              {formatStatusLabel(season.status)}
            </span>
          </div>
          <h3 className="truncate text-xl font-black text-zinc-50">{season.title}</h3>
          <p className="mt-1 max-w-2xl break-words text-sm font-semibold text-zinc-400">
            {season.description}
          </p>
          <p className="mt-2 truncate text-xs font-bold text-zinc-500">{season.id}</p>
        </div>

        <MetricBox label="Tập" value={String(season.episodes)} />
        <MetricBox
          label="Đã xuất bản"
          value={String(season.publishedEpisodes)}
        />
        <div className="flex min-w-0 flex-wrap items-center justify-start gap-2 lg:justify-end">
          <button
            type="button"
            onClick={onUpdate}
            className="rounded-xl p-2 text-zinc-400 transition hover:bg-white/[0.05] hover:text-yellow-400"
            title="Cập nhật mùa"
          >
            <Edit3 className="h-5 w-5" />
          </button>
          {isPublished && (
            <button
              type="button"
              onClick={onHide}
              className="rounded-xl p-2 text-zinc-400 transition hover:bg-white/[0.05] hover:text-yellow-400"
              title="Ẩn mùa"
            >
              <Eye className="h-5 w-5" />
            </button>
          )}
          {isHidden && (
            <button
              type="button"
              onClick={onUnhide}
              className="rounded-xl p-2 text-zinc-400 transition hover:bg-white/[0.05] hover:text-yellow-400"
              title="Hiện mùa"
            >
              <Zap className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="rounded-xl p-2 text-zinc-400 transition hover:bg-white/[0.05] hover:text-red-400"
            title="Xóa mùa"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onSelect}
            className="min-w-0 rounded-xl border border-yellow-400/30 bg-yellow-400/5 px-5 py-3 text-sm font-black text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
          >
            Quản lý Tập
          </button>
        </div>
      </div>
    </div>
  );
}

function EpisodeManagementView({
  selectedSeries,
  selectedSeason,
  episodes,
  isLoading,
  onBack,
  onCreateEpisode,
  isCreatingEpisode,
  onOpenUpload,
  onUpdateEpisode,
  onDeleteEpisode,
}: {
  selectedSeries: SeriesRow;
  selectedSeason: SeasonRow;
  episodes: EpisodeRow[];
  isLoading: boolean;
  onBack: () => void;
  onCreateEpisode: () => void;
  isCreatingEpisode: boolean;
  onOpenUpload: (episode: EpisodeRow) => void;
  onUpdateEpisode: (episode: EpisodeRow) => void;
  onDeleteEpisode: (episode: EpisodeRow) => void;
}) {
  return (
    <div className="space-y-6">
      <CreationStepper currentStep={3} />

      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-zinc-300 transition hover:border-yellow-400/50 hover:text-yellow-400"
      >
        <ChevronLeft className="h-4 w-4" />
        Quay lại Mùa
      </button>

      <Panel className="border-white/10 bg-[#121212] shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-black text-zinc-50">
              {selectedSeason.title}
            </h2>
            <p className="truncate text-sm font-bold text-zinc-400">
              {selectedSeries.title} . Mùa {selectedSeason.seasonNumber} .
              Danh sách tập trong mùa này
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateEpisode}
            disabled={isCreatingEpisode}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-black text-black shadow-[0_4px_20px_rgba(250,204,21,0.15)] transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-5 w-5" />
            {isCreatingEpisode ? "Đang tạo..." : "Tạo Tập"}
          </button>
        </div>
        <ApiStateNote isLoading={isLoading} />
      </Panel>

      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#121212] shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div className="grid grid-cols-[minmax(0,1.4fr)_110px_120px_100px_minmax(0,260px)] border-b border-white/10 bg-[#1A1A1A] px-8 py-5 text-xs font-black uppercase tracking-[0.12em] text-zinc-400 max-lg:hidden">
          <span>Thông tin Tập</span>
          <span>Loại</span>
          <span>Trạng thái</span>
          <span>Media</span>
          <span className="text-right">Hành động</span>
        </div>
        <div className="divide-y divide-white/10">
          {!isLoading && episodes.length === 0 && (
            <div className="px-8 py-10 text-center text-sm font-bold text-zinc-400">
              Mùa này chưa có tập nào.
            </div>
          )}
          {episodes.map((episode) => (
            <EpisodeTableRow
              key={episode.id}
              episode={episode}
              onOpenUpload={() => onOpenUpload(episode)}
              onUpdate={() => onUpdateEpisode(episode)}
              onDelete={() => onDeleteEpisode(episode)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EpisodeTableRow({
  episode,
  onOpenUpload,
  onUpdate,
  onDelete,
}: {
  episode: EpisodeRow;
  onOpenUpload: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}) {
  const isComic = episode.contentType === "COMIC";
  const statusStyle =
    episode.status === "PUBLISHED"
      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.1)]"
      : episode.status === "REVIEW"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
        : episode.status === "DRAFT"
          ? "border-zinc-700 bg-zinc-800/60 text-zinc-400"
          : "border-amber-500/30 bg-amber-500/10 text-amber-400";

  return (
    <div className="grid min-h-[104px] min-w-0 grid-cols-1 gap-4 px-5 py-5 transition-colors duration-200 hover:bg-white/[0.02] lg:grid-cols-[minmax(0,1.4fr)_110px_120px_100px_minmax(0,260px)] lg:items-center lg:px-8">
      <div className="min-w-0">
        <p className="truncate text-lg font-black text-zinc-50">
          Tập {episode.episodeNumber}: {episode.title}
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-zinc-400">
          {episode.description}
        </p>
        <p className="mt-1 truncate text-xs font-bold text-zinc-500">{episode.id}</p>
      </div>
      <div>
        <span
          className={cx(
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-black",
            isComic
              ? "border-purple-400/20 bg-purple-400/10 text-purple-300"
              : "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
          )}
        >
          {isComic ? (
            <BookOpen className="h-4 w-4" />
          ) : (
            <Clapperboard className="h-4 w-4" />
          )}
          {isComic ? "Truyện tranh" : "Video"}
        </span>
      </div>
      <div className="space-y-2">
        <span
          className={cx(
            "rounded-full border px-3 py-1.5 text-xs font-black",
            statusStyle,
          )}
        >
          {formatStatusLabel(episode.status)}
        </span>
      </div>
      <div className="text-sm font-bold text-zinc-400">
        {isComic
          ? `${episode.totalPage ?? episode.mediaCount} trang`
          : `${episode.mediaCount} video`}
      </div>
      <div className="flex min-w-0 flex-wrap items-center justify-start gap-3 lg:justify-end">
        <button
          type="button"
          onClick={onUpdate}
          className="rounded-xl p-2 text-zinc-400 transition hover:bg-white/[0.05] hover:text-yellow-400"
          title="Cập nhật tập"
        >
          <Edit3 className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-xl p-2 text-zinc-400 transition hover:bg-white/[0.05] hover:text-red-400"
          title="Xóa tập"
        >
          <Trash2 className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onOpenUpload}
          className="min-w-0 rounded-xl border border-yellow-400/30 bg-yellow-400/5 px-5 py-2.5 text-sm font-black text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
        >
          {isComic ? "Mở upload truyện tranh" : "Mở upload video"}
        </button>
      </div>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#1A1A1A] p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-zinc-50">{value}</p>
    </div>
  );
}

function CreateSeriesView({
  contentType,
  onContentTypeChange,
  onSubmit,
  isSubmitting,
}: {
  contentType: ContentType;
  onContentTypeChange: (type: ContentType) => void;
  onSubmit: (input: CreateSeriesInput) => void;
  isSubmitting: boolean;
}) {
  const [coverFile, setCoverFile] = useState<File | undefined>();
  const [bannerFile, setBannerFile] = useState<File | undefined>();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = readFormString(form, "title");

    if (!title) {
      return;
    }

    onSubmit({
      title,
      description: readFormString(form, "description"),
      contentType,
      visibility: readFormString(form, "visibility") as Visibility,
      ageRating: readFormString(form, "ageRating"),
      language: readFormString(form, "language"),
      categoryIds: splitIdList(readFormString(form, "categoryIds")),
      tagIds: splitIdList(readFormString(form, "tagIds")),
      coverFile,
      bannerFile,
    });
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#1A1A1A] p-4 text-sm font-semibold text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-yellow-400/50 focus:ring-4 focus:ring-yellow-400/10";
  const compactInputClass =
    "h-12 w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 text-sm font-semibold text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-yellow-400/50 focus:ring-4 focus:ring-yellow-400/10";
  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-6xl space-y-8">
      <CreationStepper currentStep={1} />

      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
          Bản sắc cốt lõi
        </p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-zinc-50">
          Thông tin cốt lõi
        </h2>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-zinc-400">
          Xác định bầu không khí cốt lõi cho series, định vị thể loại và chuẩn
          bị artwork trước khi bước vào cấu trúc mùa/tập.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
            <div className="grid gap-5">
              <Field label="Tên Series" required>
                <input
                  name="title"
                  required
                  defaultValue="The Lost Horizon"
                  placeholder="Nhập tên series..."
                  className={compactInputClass}
                />
              </Field>

              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-zinc-400">
                  Phân loại thể loại <span className="text-yellow-400">*</span>
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TypeOption
                    active={contentType === "COMIC"}
                    icon={BookOpen}
                    title="Truyện tranh"
                    description="Tập truyện sử dụng các trang ảnh theo thứ tự."
                    onClick={() => onContentTypeChange("COMIC")}
                  />
                  <TypeOption
                    active={contentType === "VIDEO"}
                    icon={Clapperboard}
                    title="Video truyện"
                    description="Tập truyện sử dụng một video media chính."
                    onClick={() => onContentTypeChange("VIDEO")}
                  />
                </div>
              </div>

              <Field label="Mô tả" required>
                <textarea
                  name="description"
                  rows={6}
                  placeholder="Mô tả bối cảnh, cảm xúc và lời hứa trải nghiệm của series..."
                  className={cx(inputClass, "resize-none")}
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Hiển thị">
                  <select name="visibility" defaultValue="PUBLIC" className={compactInputClass}>
                    <option value="PUBLIC">Công khai</option>
                    <option value="PRIVATE">Riêng tư</option>
                  </select>
                </Field>
                <Field label="Độ tuổi">
                  <select name="ageRating" defaultValue="13+" className={compactInputClass}>
                    <option value="13+">13+</option>
                    <option value="16+">16+</option>
                    <option value="18+">18+</option>
                  </select>
                </Field>
                <Field label="Ngôn ngữ">
                  <select
                    name="language"
                    defaultValue="vi"
                    className={compactInputClass}
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">Tiếng Anh</option>
                  </select>
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-50">
                  Phân loại nội dung
                </h3>
                <p className="text-sm font-semibold text-zinc-400">
                  Chọn thể loại và từ khóa để định vị series trong thư viện.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Thể loại (Genres)">
                <select
                  name="categoryIds"
                  defaultValue=""
                  className={compactInputClass}
                >
                  <option value="">Chọn thể loại</option>
                  <option value="action">Hành động</option>
                  <option value="fantasy">Fantasy</option>
                  <option value="romance">Lãng mạn</option>
                  <option value="mystery">Bí ẩn</option>
                </select>
              </Field>
              <Field label="Từ khóa (Tags)">
                <select
                  name="tagIds"
                  defaultValue=""
                  className={compactInputClass}
                >
                  <option value="">Chọn từ khóa</option>
                  <option value="slow-burn">Slow burn</option>
                  <option value="revenge">Báo thù</option>
                  <option value="royal">Hoàng gia</option>
                  <option value="adventure">Phiêu lưu</option>
                </select>
              </Field>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-50">
                  Ảnh chủ đạo
                </h3>
                <p className="text-sm font-semibold text-zinc-400">
                  Ảnh đại diện sẽ được upload trước rồi lưu URL vào Series.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <ArtworkUploadField
                title="Ảnh banner"
                helper="3840 x 2160 Recommended"
                file={bannerFile}
                onFileChange={setBannerFile}
              />
              <ArtworkUploadField
                title="Poster / Bìa"
                helper="1500 x 2000 Recommended"
                file={coverFile}
                onFileChange={setCoverFile}
                tall
              />
            </div>
          </section>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-14 w-full items-center justify-center rounded-xl bg-yellow-400 text-sm font-black text-black shadow-[0_18px_46px_rgba(250,204,21,0.18)] transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Đang tạo..." : "Tạo Series & Tiếp tục ->"}
          </button>
        </aside>
      </div>
    </form>
  );
}

function ComicUploadView({
  selectedSeries,
  selectedSeason,
  selectedEpisode,
  pages,
  draggingPageId,
  onDragStart,
  onDragEnd,
  onDropPage,
  onMovePage,
  onFilesSelected,
  isUploading,
  onSaveOrder,
  isSavingOrder,
  onDeletePage,
  isLoadingMedia,
  uploadMessage,
  onSaveEpisode,
  isSavingEpisode,
  canSchedulePublish,
  onSchedulePublish,
  onHideEpisode,
  onUnhideEpisode,
  isHidingEpisode,
  onCancelSchedule,
  isCancelingSchedule,
  onPublishNow,
  isPublishingNow,
  onBack,
}: {
  selectedSeries: SeriesRow | null;
  selectedSeason: SeasonRow | null;
  selectedEpisode: EpisodeRow;
  pages: ComicPage[];
  draggingPageId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDropPage: (fromId: string, toId: string) => void;
  onMovePage: (pageId: string, offset: number) => void;
  onFilesSelected: (files: FileList | File[] | null) => void;
  isUploading: boolean;
  onSaveOrder: () => void;
  isSavingOrder: boolean;
  onDeletePage: (page: ComicPage) => void;
  isLoadingMedia: boolean;
  uploadMessage: string | null;
  onSaveEpisode: (episode: EpisodeRow) => void;
  isSavingEpisode: boolean;
  canSchedulePublish: boolean;
  onSchedulePublish: (episode: EpisodeRow) => void;
  onHideEpisode: (episode: EpisodeRow) => void;
  onUnhideEpisode: (episode: EpisodeRow) => void;
  isHidingEpisode: boolean;
  onCancelSchedule: (episode: EpisodeRow) => void;
  isCancelingSchedule: boolean;
  onPublishNow: (episode: EpisodeRow) => void;
  isPublishingNow: boolean;
  onBack: () => void;
}) {
  const episodeControlClass =
    "h-12 w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 text-sm font-semibold text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-yellow-400/50 focus:ring-4 focus:ring-yellow-400/10";

  function handlePageDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    onFilesSelected(Array.from(event.dataTransfer.files));
  }

  function handleEpisodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = readFormString(form, "title");

    if (!title) {
      return;
    }

    onSaveEpisode({
      ...selectedEpisode,
      episodeNumber: readFormNumber(
        form,
        "episodeNumber",
        selectedEpisode.episodeNumber,
      )!,
      title,
      description: readFormString(form, "description"),
      contentType: "COMIC",
      totalPage: readFormNumber(form, "totalPage", selectedEpisode.totalPage),
    });
  }

  function handleUnlockSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const unlockType = readFormString(form, "unlockType") as EpisodeUnlockType;
    const priceVnd =
      unlockType === "PAID"
        ? readFormNumber(form, "priceVnd", selectedEpisode.priceVnd) ?? 0
        : 0;

    if (unlockType === "PAID" && priceVnd <= 0) {
      return;
    }

    onSaveEpisode({
      ...selectedEpisode,
      unlockType,
      priceVnd,
    });
  }

  return (
    <div className="space-y-4">
      <CreationStepper currentStep={4} />

      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-zinc-300 transition hover:border-yellow-400/50 hover:text-yellow-400"
      >
        <ChevronLeft className="h-4 w-4" />
        Quay lại Tập
      </button>

      <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <Panel>
          <PanelHeader
            icon={BookOpen}
            title="Thông tin Tập"
            subtitle="Chỉnh metadata của tập truyện tranh và lưu riêng với danh sách trang."
          />
          <div className="mb-5 grid gap-3 text-sm font-bold text-[#5D5160]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                Series
              </p>
              <p className="mt-1 text-base font-black text-[#151A23]">
                {selectedSeries?.title ?? "Unknown series"}
              </p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                Mùa
              </p>
              <p className="mt-1 text-base font-black text-[#151A23]">
                {selectedSeason
                  ? `Mùa ${selectedSeason.seasonNumber}: ${selectedSeason.title}`
                  : selectedEpisode.seasonId}
              </p>
            </div>
          </div>
          <form
            key={`comic-details-${selectedEpisode.id}`}
            onSubmit={handleEpisodeSubmit}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Số tập">
                <input
                  type="number"
                  min={1}
                  name="episodeNumber"
                  defaultValue={selectedEpisode.episodeNumber}
                  className={episodeControlClass}
                />
              </Field>
              <Field label="Tổng số trang">
                <input
                  type="number"
                  min={0}
                  name="totalPage"
                  defaultValue={selectedEpisode.totalPage ?? 0}
                  className={episodeControlClass}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Trạng thái">
                <input
                  value={formatStatusLabel(selectedEpisode.status)}
                  readOnly
                  className={episodeControlClass}
                />
              </Field>
              <Field label="Loại">
                <input
                  value="COMIC"
                  readOnly
                  className={episodeControlClass}
                />
              </Field>
            </div>
            <Field label="Tiêu đề tập" required>
              <input
                name="title"
                required
                defaultValue={selectedEpisode.title}
                placeholder="Điều gì xảy ra trong tập này?"
                className={episodeControlClass}
              />
            </Field>
            <Field label="Mô tả">
              <textarea
                name="description"
                rows={4}
                defaultValue={selectedEpisode.description}
                placeholder="Ghi chú tác giả hoặc mô tả tập..."
                className="w-full resize-none rounded-xl border border-white/10 bg-[#1A1A1A] p-4 text-sm font-semibold text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-yellow-400/50 focus:ring-4 focus:ring-yellow-400/10"
              />
            </Field>
            <button
              type="submit"
              disabled={isSavingEpisode}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 text-sm font-black text-black shadow-[0_4px_20px_rgba(250,204,21,0.15)] transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSavingEpisode ? "Đang lưu..." : "Lưu thông tin Tập"}
            </button>
          </form>
          </Panel>

          <Panel>
          <PanelHeader
            icon={Lock}
            title="Thiết lập mở khóa"
            subtitle="Cấu hình cách mở khóa tập này và lưu riêng với thông tin tập."
          />
          <form
            key={`comic-unlock-${selectedEpisode.id}-${selectedEpisode.unlockType}-${selectedEpisode.priceVnd}`}
            onSubmit={handleUnlockSubmit}
            className="space-y-4"
          >
            <EpisodeUnlockFields
              defaultUnlockType={selectedEpisode.unlockType}
              defaultPriceVnd={selectedEpisode.priceVnd}
              controlClass={episodeControlClass}
            />
            <p className="text-xs font-semibold leading-relaxed text-slate-500">
              Tập này sẽ khả dụng sau khi được duyệt. Trang truyện được lưu dưới dạng
              image URL và sắp xếp theo displayOrder.
            </p>
            <button
              type="submit"
              disabled={isSavingEpisode}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSavingEpisode ? "Đang lưu..." : "Lưu mở khóa"}
            </button>
          </form>
          </Panel>

          <Panel>
          <PanelHeader icon={Calendar} title="Xuất bản" />
          <div className="space-y-4">
            <div
              className={cx(
                "rounded-xl border p-4 text-xs font-bold leading-relaxed",
                getApprovalChipClass(
                  canSchedulePublish ? "APPROVED" : "PENDING_REVIEW",
                ),
              )}
            >
              Kiểm duyệt media: {canSchedulePublish ? "Đã có trang được duyệt" : "Cần trang đã duyệt"}
            </div>
            <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-4 text-xs font-bold leading-relaxed text-zinc-400">
              Lịch xuất bản: {formatDateTime(selectedEpisode.scheduledPublishAt)}
            </div>
            {selectedEpisode.status === "PUBLISHED" && (
              <button
                type="button"
                onClick={() => onHideEpisode(selectedEpisode)}
                disabled={isHidingEpisode}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 text-sm font-black text-amber-300 transition hover:bg-amber-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Eye className="h-4 w-4" />
                {isHidingEpisode ? "Đang xử lý..." : "Ẩn Tập"}
              </button>
            )}
            {selectedEpisode.status === "HIDDEN" && (
              <button
                type="button"
                onClick={() => onUnhideEpisode(selectedEpisode)}
                disabled={isHidingEpisode}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-sm font-black text-cyan-300 transition hover:bg-cyan-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Zap className="h-4 w-4" />
                {isHidingEpisode ? "Đang xử lý..." : "Hiện Tập"}
              </button>
            )}
            {selectedEpisode.status === "SCHEDULED" ? (
              <button
                type="button"
                onClick={() => onCancelSchedule(selectedEpisode)}
                disabled={isCancelingSchedule}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 text-sm font-black text-red-300 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
                {isCancelingSchedule ? "Đang hủy..." : "Hủy lịch"}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onSchedulePublish(selectedEpisode)}
                  disabled={!canSchedulePublish || selectedEpisode.status === "PUBLISHED"}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-yellow-400/30 bg-yellow-400/5 text-sm font-black text-yellow-400 transition hover:bg-yellow-400 hover:text-black disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-zinc-600"
                >
                  <Calendar className="h-4 w-4" />
                  Lên lịch
                </button>
                <button
                  type="button"
                  onClick={() => onPublishNow(selectedEpisode)}
                  disabled={!canSchedulePublish || selectedEpisode.status === "PUBLISHED" || isPublishingNow}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-600"
                >
                  <CloudUpload className="h-4 w-4" />
                  {isPublishingNow ? "Đang xuất bản..." : "Xuất bản ngay"}
                </button>
              </div>
            )}
          </div>
          </Panel>
        </aside>

        <div className="space-y-6">
          <Panel>
          <div className="mb-5 flex items-start justify-between gap-4">
            <PanelHeader
            icon={UploadCloud}
            title="Trang truyện tranh"
            subtitle="Chọn trang từ máy, sau đó lưu một lần để upload và giữ thứ tự."
            compact
          />
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-zinc-300">
              {pages.length} trang đã chọn
            </span>
          </div>

          <div
            className="mb-6 flex min-h-[230px] flex-col items-center justify-center rounded-2xl border border-dashed border-yellow-400/30 bg-yellow-400/5 p-8 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handlePageDrop}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400/10 text-yellow-400">
              <CloudUpload className="h-7 w-7" />
            </div>
            <p className="text-lg font-black text-zinc-50">
              Kéo thả trang truyện vào đây
            </p>
            <p className="mt-2 max-w-md text-sm font-semibold leading-relaxed text-zinc-400">
              Chọn hoặc thả trang truyện. Chưa có gì được upload cho tới khi bạn lưu.
            </p>
            <label className="mt-5 inline-flex cursor-pointer rounded-xl border border-yellow-400/30 bg-yellow-400/5 px-5 py-2.5 text-xs font-black text-yellow-400 transition hover:bg-yellow-400 hover:text-black">
              Chọn file
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(event) => {
                  onFilesSelected(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">
              Thứ tự trang
            </p>
            <p className="flex items-center gap-2 text-xs font-bold text-zinc-400">
              <GripVertical className="h-4 w-4" />
              Kéo để sắp xếp
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {isLoadingMedia && (
              <div className="col-span-full rounded-2xl border border-white/10 bg-[#1A1A1A] px-4 py-5 text-center text-sm font-bold text-zinc-400">
                Đang tải trang hiện có...
              </div>
            )}

            {!isLoadingMedia && pages.length === 0 && (
              <div className="col-span-full rounded-2xl border border-white/10 bg-[#1A1A1A] px-4 py-5 text-center text-sm font-bold text-zinc-400">
                Tập này chưa có trang media. Hãy chọn file ảnh để upload.
              </div>
            )}

            {pages.map((page) => (
              <ComicPageCard
                key={page.id}
                page={page}
                dragging={draggingPageId === page.id}
                onDragStart={() => onDragStart(page.id)}
                onDragEnd={onDragEnd}
                onDrop={() => {
                  if (draggingPageId) {
                    onDropPage(draggingPageId, page.id);
                  }
                }}
                onMoveUp={() => onMovePage(page.id, -1)}
                onMoveDown={() => onMovePage(page.id, 1)}
                onDelete={() => onDeletePage(page)}
              />
            ))}

            <label className="flex aspect-[3/4] min-h-[220px] cursor-pointer items-center justify-center rounded-xl border border-dashed border-yellow-400/30 bg-yellow-400/5 text-yellow-400 transition hover:bg-yellow-400 hover:text-black">
              <Plus className="h-7 w-7" />
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(event) => {
                  onFilesSelected(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </div>
          </Panel>

          {uploadMessage && (
            <div className="rounded-2xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-sm font-bold text-zinc-300">
              {uploadMessage}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            {isUploading && (
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-300">
                Đang lưu trang...
              </span>
            )}
            <button
              type="button"
              onClick={onSaveOrder}
              disabled={isSavingOrder}
              className="rounded-xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingOrder ? "Đang lưu..." : "Lưu trang"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComicPageCard({
  page,
  dragging,
  onDragStart,
  onDragEnd,
  onDrop,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  page: ComicPage;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      className={cx(
        "group relative overflow-hidden rounded-xl border-2 bg-[#121212] shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-colors duration-200",
        dragging
          ? "scale-95 border-yellow-400 opacity-60"
          : "border-white/10 hover:border-yellow-400/50",
      )}
    >
      <div className="relative aspect-[3/4]">
        {page.image ? (
          <img src={page.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#1A1A1A] text-xs font-black text-zinc-500">
            No preview
          </div>
        )}
        <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-[#151A23] text-xs font-black text-white">
          {page.displayOrder}
        </span>
        <span className="absolute right-2 top-2 rounded-lg bg-black/70 p-1.5 text-zinc-200 shadow">
          <GripVertical className="h-4 w-4" />
        </span>
      </div>

      <div className="space-y-2 p-3">
        <p className="truncate text-sm font-black text-zinc-50">
          {page.title}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            aria-label={`Move ${page.title} up`}
            title="Move up"
            onClick={onMoveUp}
            className="flex h-9 min-w-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:text-yellow-400"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`Move ${page.title} down`}
            title="Move down"
            onClick={onMoveDown}
            className="flex h-9 min-w-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:text-yellow-400"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${page.title}`}
            title="Delete"
            onClick={onDelete}
            className="flex h-9 min-w-0 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 transition hover:bg-red-500 hover:text-white"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function VideoUploadView({
  selectedSeries,
  selectedSeason,
  selectedEpisode,
  videos,
  isLoadingMedia,
  uploadMessage,
  onUploadCompleted,
  onDeleteVideo,
  onSaveEpisode,
  isSavingEpisode,
  accountId,
  onSchedulePublish,
  onHideEpisode,
  onUnhideEpisode,
  isHidingEpisode,
  onCancelSchedule,
  isCancelingSchedule,
  onPublishNow,
  isPublishingNow,
  onBack,
}: {
  selectedSeries: SeriesRow | null;
  selectedSeason: SeasonRow | null;
  selectedEpisode: EpisodeRow;
  videos: MediaResponse[];
  isLoadingMedia: boolean;
  uploadMessage: string | null;
  onUploadCompleted: (media: MediaResponse) => void;
  onDeleteVideo: (media: MediaResponse) => void;
  onSaveEpisode: (episode: EpisodeRow) => void;
  isSavingEpisode: boolean;
  accountId: string;
  onSchedulePublish: (episode: EpisodeRow) => void;
  onHideEpisode: (episode: EpisodeRow) => void;
  onUnhideEpisode: (episode: EpisodeRow) => void;
  isHidingEpisode: boolean;
  onCancelSchedule: (episode: EpisodeRow) => void;
  isCancelingSchedule: boolean;
  onPublishNow: (episode: EpisodeRow) => void;
  isPublishingNow: boolean;
  onBack: () => void;
}) {
  const currentVideo = videos[0];
  const canSchedule = videos.some(
    (video) =>
      video.approvalStatus === "APPROVED" && isPlayableVideoStatus(video.status),
  );
  const episodeControlClass =
    "h-12 w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 text-sm font-semibold text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-yellow-400/50 focus:ring-4 focus:ring-yellow-400/10";

  function handleEpisodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = readFormString(form, "title");

    if (!title) {
      return;
    }

    onSaveEpisode({
      ...selectedEpisode,
      episodeNumber: readFormNumber(
        form,
        "episodeNumber",
        selectedEpisode.episodeNumber,
      )!,
      title,
      description: readFormString(form, "description"),
      contentType: "VIDEO",
    });
  }

  function handleUnlockSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const unlockType = readFormString(form, "unlockType") as EpisodeUnlockType;
    const priceVnd =
      unlockType === "PAID"
        ? readFormNumber(form, "priceVnd", selectedEpisode.priceVnd) ?? 0
        : 0;

    if (unlockType === "PAID" && priceVnd <= 0) {
      return;
    }

    onSaveEpisode({
      ...selectedEpisode,
      unlockType,
      priceVnd,
    });
  }

  const [violationMediaId, setViolationMediaId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <CreationStepper currentStep={4} />

      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-zinc-300 transition hover:border-yellow-400/50 hover:text-yellow-400"
      >
        <ChevronLeft className="h-4 w-4" />
        Quay lại Tập
      </button>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
        <Panel>
          <PanelHeader
            icon={Clapperboard}
            title="Thông tin Tập"
            subtitle="Chỉnh metadata của tập video và lưu trước khi xuất bản."
          />
          <div className="mb-5 grid gap-3 text-sm font-bold text-[#5D5160] md:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                Series
              </p>
              <p className="mt-1 text-base font-black text-[#151A23]">
                {selectedSeries?.title ?? "Unknown series"}
              </p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                Mùa
              </p>
              <p className="mt-1 text-base font-black text-[#151A23]">
                {selectedSeason
                  ? `Mùa ${selectedSeason.seasonNumber}: ${selectedSeason.title}`
                  : selectedEpisode.seasonId}
              </p>
            </div>
          </div>
          <form
            key={selectedEpisode.id}
            onSubmit={handleEpisodeSubmit}
            className="space-y-5"
          >
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Số tập">
                <input
                  type="number"
                  min={1}
                  name="episodeNumber"
                  defaultValue={selectedEpisode.episodeNumber}
                  className={episodeControlClass}
                />
              </Field>
              <Field label="Trạng thái">
                <input
                  value={formatStatusLabel(selectedEpisode.status)}
                  readOnly
                  className={episodeControlClass}
                />
              </Field>
              <Field label="Loại nội dung">
                <input
                  value="VIDEO"
                  readOnly
                  className={episodeControlClass}
                />
              </Field>
            </div>
            <Field label="Tiêu đề tập" required>
              <input
                name="title"
                required
                defaultValue={selectedEpisode.title}
                className={episodeControlClass}
              />
            </Field>
            <Field label="Mô tả">
              <textarea
                name="description"
                rows={5}
                defaultValue={selectedEpisode.description}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#1A1A1A] p-4 text-sm font-semibold text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-yellow-400/50 focus:ring-4 focus:ring-yellow-400/10"
              />
            </Field>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSavingEpisode}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-black text-black shadow-[0_4px_20px_rgba(250,204,21,0.15)] transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isSavingEpisode ? "Đang lưu..." : "Lưu thông tin Tập"}
              </button>
            </div>
          </form>
        </Panel>

        <Panel>
          <PanelHeader
            icon={FileVideo}
            title="Media video"
            subtitle="Gắn một file video cho tập này."
          />
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-black text-zinc-400">
                Video hiện tại
              </p>
              {isLoadingMedia && (
                <div className="rounded-2xl border border-white/10 bg-[#1A1A1A] px-4 py-5 text-center text-sm font-bold text-zinc-400">
                  Đang tải video...
                </div>
              )}
              {!isLoadingMedia && videos.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-[#1A1A1A] px-4 py-5 text-center text-sm font-bold text-zinc-400">
                  Tập này chưa có video.
                </div>
              )}
              {!isLoadingMedia && videos.length > 0 && (
                <div className="space-y-4">
                  {videos.map((video) => (
                    <div
                      key={video.mediaId}
                      className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-3"
                    >
                      {isPlayableVideoStatus(video.status) ? (
                        <SignedHlsPlayer episodeId={video.episodeId} compact creatorMode />
                      ) : (
                        <VideoProcessingState video={video} onViewViolation={setViolationMediaId} />
                      )}
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-zinc-400">
                          <span>
                            {video.mimeType} . {formatBytes(video.fileSize)} .{" "}
                            {formatMediaStatusLabel(video.status)}
                          </span>
                          <span
                            className={cx(
                              "rounded-full border px-3 py-1 font-black",
                              getApprovalChipClass(video.approvalStatus ?? "PENDING_REVIEW"),
                            )}
                          >
                            {formatApprovalStatusLabel(video.approvalStatus ?? "PENDING_REVIEW")}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={`/watch/${video.episodeId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-black text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
                            >
                              Xem trang
                            </a>
                            <button
                              type="button"
                              onClick={() => onDeleteVideo(video)}
                              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 font-black text-red-400 transition hover:bg-red-500 hover:text-white"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-black text-zinc-400">
                File video
              </p>
              <ResumableVideoUploader
                key={selectedEpisode.id}
                episodeId={selectedEpisode.id}
                creatorId={selectedSeries?.creatorId}
                actorId={accountId}
                disabledReason={
                  videos.length > 0
                    ? "Xóa video hiện tại trước khi upload file thay thế."
                    : undefined
                }
                onCompleted={onUploadCompleted}
              />
            </div>

          </div>
        </Panel>
        </div>

        <aside className="space-y-5">
        <Panel>
          <PanelHeader
            icon={Lock}
            title="Thiết lập mở khóa"
            subtitle="Cấu hình cách mở khóa tập này và lưu riêng với thông tin tập."
          />
          <form
            key={`${selectedEpisode.id}-${selectedEpisode.unlockType}-${selectedEpisode.priceVnd}`}
            onSubmit={handleUnlockSubmit}
            className="space-y-4"
          >
            <EpisodeUnlockFields
              defaultUnlockType={selectedEpisode.unlockType}
              defaultPriceVnd={selectedEpisode.priceVnd}
              controlClass={episodeControlClass}
            />
            <button
              type="submit"
              disabled={isSavingEpisode}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSavingEpisode ? "Đang lưu..." : "Lưu mở khóa"}
            </button>
          </form>
        </Panel>

        <Panel>
          <PanelHeader icon={Calendar} title="Xuất bản" />
          <div className="space-y-4">
            <div
              className={cx(
                "rounded-xl border p-4 text-xs font-bold leading-relaxed",
                getApprovalChipClass(currentVideo?.approvalStatus ?? "PENDING_REVIEW"),
              )}
            >
              Kiểm duyệt media:{" "}
              {formatApprovalStatusLabel(currentVideo?.approvalStatus ?? "PENDING_REVIEW")}
            </div>
            <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-4 text-xs font-bold leading-relaxed text-zinc-400">
              Lịch xuất bản: {formatDateTime(selectedEpisode.scheduledPublishAt)}
            </div>
            <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-xs font-bold leading-relaxed text-cyan-300">
              Tập mới cần kiểm duyệt trước khi được xuất bản.
            </div>
            {/* Hide / Unhide episode */}
            {selectedEpisode.status === "PUBLISHED" && (
              <button
                type="button"
                onClick={() => onHideEpisode(selectedEpisode)}
                disabled={isHidingEpisode}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 text-sm font-black text-amber-300 transition hover:bg-amber-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Eye className="h-4 w-4" />
                {isHidingEpisode ? "Đang xử lý..." : "Ẩn Tập"}
              </button>
            )}
            {selectedEpisode.status === "HIDDEN" && (
              <button
                type="button"
                onClick={() => onUnhideEpisode(selectedEpisode)}
                disabled={isHidingEpisode}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-sm font-black text-cyan-300 transition hover:bg-cyan-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Zap className="h-4 w-4" />
                {isHidingEpisode ? "Đang xử lý..." : "Hiện Tập"}
              </button>
            )}

            {selectedEpisode.status === "SCHEDULED" ? (
              <button
                type="button"
                onClick={() => onCancelSchedule(selectedEpisode)}
                disabled={isCancelingSchedule}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 text-sm font-black text-red-300 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
                {isCancelingSchedule ? "Đang hủy..." : "Hủy lịch"}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onSchedulePublish(selectedEpisode)}
                  disabled={!canSchedule || selectedEpisode.status === "PUBLISHED"}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-yellow-400/30 bg-yellow-400/5 text-sm font-black text-yellow-400 transition hover:bg-yellow-400 hover:text-black disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-zinc-600"
                >
                  <Calendar className="h-4 w-4" />
                  Lên lịch
                </button>
                <button
                  type="button"
                  onClick={() => onPublishNow(selectedEpisode)}
                  disabled={!canSchedule || selectedEpisode.status === "PUBLISHED" || isPublishingNow}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-600"
                >
                  <CloudUpload className="h-4 w-4" />
                  {isPublishingNow ? "Đang xuất bản..." : "Xuất bản ngay"}
                </button>
              </div>
            )}
          </div>
        </Panel>

        {uploadMessage && (
          <div className="rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-sm font-bold text-zinc-300">
            {uploadMessage}
          </div>
        )}

        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-black text-zinc-300 transition hover:border-yellow-400/50 hover:text-yellow-400">
          <CheckCircle2 className="h-4 w-4" />
          Lưu nháp
        </button>
        </aside>
      </div>
      <ViolationDetailDialog
        mediaId={violationMediaId ?? ""}
        open={violationMediaId !== null}
        onOpenChange={(open) => { if (!open) setViolationMediaId(null); }}
      />
    </div>
  );
}

function VideoProcessingState({ video, onViewViolation }: { video: MediaResponse; onViewViolation?: (mediaId: string) => void }) {
  const failed = video.status === "FAILED";
  const pending = video.status === "PENDING";
  const inactive = video.status === "INACTIVE";

  const bgClass = failed || inactive
    ? "border-red-500/30 bg-red-500/10 text-red-300"
    : pending
      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
      : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300";

  return (
    <div className={cx("flex aspect-video w-full flex-col items-center justify-center rounded-xl border px-4 text-center", bgClass)}>
      {failed || inactive ? (
        <CircleAlert className="mb-3 h-8 w-8" />
      ) : pending ? (
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-amber-600" />
      ) : (
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#007A8A]" />
      )}
      <p className="text-sm font-black text-zinc-50">
        {inactive ? "Nội dung vi phạm chính sách" : pending ? "Đang kiểm duyệt nội dung" : failed ? "Xử lý video thất bại" : "Video đang được xử lý"}
      </p>
      <p className="mt-2 max-w-md text-xs font-bold leading-relaxed">
        {inactive ? "Nội dung đã bị ẩn do vi phạm bản quyền hoặc kiểm duyệt." : pending ? "Đang kiểm tra bản quyền và nội dung..." : failed ? (video.errorMessage || "Không thể xử lý video.") : "Vui lòng chờ trong giây lát."}
      </p>
      <span className={cx("mt-3 rounded-full px-3 py-1 text-[11px] font-black", inactive ? "bg-red-500/10 text-red-300" : pending ? "bg-amber-500/10 text-amber-300" : "bg-cyan-400/10 text-cyan-300")}>
        {formatMediaStatusLabel(video.status)}
      </span>
      {inactive && onViewViolation && (
        <button onClick={() => onViewViolation(video.mediaId)} className="mt-2 text-xs font-semibold text-red-300 underline hover:text-red-200">
          Xem chi tiết vi phạm
        </button>
      )}
    </div>
  );
}

function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-[20px] border border-white/10 bg-[#121212] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.4)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function PanelHeader({
  icon: Icon,
  title,
  subtitle,
  compact,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <div className={cx("flex items-start gap-3", !compact && "mb-5")}>
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h2 className="text-lg font-black text-zinc-50">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm font-semibold leading-relaxed text-zinc-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function EpisodeUnlockFields({
  defaultUnlockType,
  defaultPriceVnd,
  controlClass,
}: {
  defaultUnlockType: EpisodeUnlockType;
  defaultPriceVnd: number;
  controlClass: string;
}) {
  const [unlockType, setUnlockType] = useState<EpisodeUnlockType>(
    defaultUnlockType ?? "FREE",
  );

  return (
    <div
      className={cx(
        "grid gap-4",
        unlockType === "PAID" ? "md:grid-cols-2" : "md:grid-cols-1",
      )}
    >
      <Field label="Kiểu mở khóa">
        <select
          name="unlockType"
          value={unlockType}
          onChange={(event) =>
            setUnlockType(event.target.value as EpisodeUnlockType)
          }
          className={controlClass}
        >
          <option value="FREE">Miễn phí</option>
          <option value="PAID">Trả phí</option>
        </select>
      </Field>

      {unlockType === "PAID" && (
        <Field label="Giá VNĐ" required>
          <input
            type="number"
            min={1}
            max={99999}
            name="priceVnd"
            required
            defaultValue={defaultPriceVnd > 0 ? defaultPriceVnd : 1000}
            className={controlClass}
          />
        </Field>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-zinc-400">
        {label} {required && <span className="text-yellow-400">*</span>}
      </span>
      {children}
    </label>
  );
}

function TypeOption({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "group min-h-36 rounded-2xl border bg-[#1A1A1A] p-5 text-left transition hover:border-yellow-400/50 hover:bg-[#202020]",
        active
          ? "border-yellow-400 shadow-[0_0_34px_rgba(250,204,21,0.12)]"
          : "border-white/10",
      )}
    >
      <div
        className={cx(
          "mb-4 flex h-11 w-11 items-center justify-center rounded-xl border transition",
          active
            ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-400"
            : "border-white/10 bg-white/[0.04] text-zinc-500 group-hover:text-yellow-400",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <span className="block text-base font-black text-zinc-50">{title}</span>
      <p className="mt-2 text-sm font-semibold leading-6 text-zinc-400">
        {description}
      </p>
    </button>
  );
}

function ArtworkUploadField({
  title,
  helper,
  file,
  onFileChange,
  tall,
}: {
  title: string;
  helper: string;
  file?: File;
  onFileChange: (file: File | undefined) => void;
  tall?: boolean;
}) {
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : undefined),
    [file],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-300">
        {title}
      </p>
      <p className="mt-1 text-[11px] font-semibold text-zinc-500">{helper}</p>
      <label
        className={cx(
          "mt-3 flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/10 bg-[#1A1A1A] text-center transition hover:border-yellow-400/50 hover:bg-[#202020]",
          tall ? "aspect-[3/4]" : "aspect-video",
        )}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="px-5">
            <ImageIcon className="mx-auto mb-3 h-7 w-7 text-yellow-400" />
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-200">
              Tải lên
            </p>
            <p className="mt-2 text-xs font-semibold text-zinc-500">
              Chọn file ảnh
            </p>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => onFileChange(event.target.files?.[0])}
        />
      </label>
      {file && (
        <p className="mt-2 truncate text-xs font-bold text-yellow-400">
          {file.name}
        </p>
      )}
    </div>
  );
}
