
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlayCircle, ImagePlus, Video, ShieldAlert, AlertTriangle, Fingerprint } from "lucide-react";
import { Toaster } from "sonner";
import { CreatorSeasonsList } from "@/features/creator-dashboard/components/creator-seasons-list";
import { CreatorEpisodesList } from "@/features/creator-dashboard/components/creator-episodes-list";
import { CreatorSeriesList } from "@/features/creator-dashboard/components/creator-series-list";
import { CreatorLayout } from "@/features/creator-dashboard/components/creator-layout";
import { CreatorStepper, StepState } from "@/features/creator-dashboard/components/creator-stepper";
import { CoreIdentityStep } from "@/features/creator-dashboard/components/steps/core-identity-step";
import { SeasonStructureStep } from "@/features/creator-dashboard/components/steps/season-structure-step";
import { MediaUploadStep } from "@/features/creator-dashboard/components/steps/media-upload-step";
import { ReadyPublishStep } from "@/features/creator-dashboard/components/steps/ready-publish-step";
import { FinalReviewStep } from "@/features/creator-dashboard/components/steps/final-review-step";
import { FinalReviewComicStep } from "@/features/creator-dashboard/components/steps/final-review-comic-step";

import {
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
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clapperboard,
  CloudUpload,
  Crown,
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
  Rocket,
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
import { usePipelineSSE } from "@/features/creator-dashboard/hooks/use-pipeline-sse";
import { SignedHlsPlayer } from "@/features/playback/components/signed-hls-player";
import { ComboManagementView } from "@/features/creator-dashboard/components/combo-management";
import { CreatorMonetizationView } from "@/features/creator-dashboard/components/views/creator-monetization-view";
import { AIPolicyAndCopyright } from "@/features/creator-dashboard/components/ai-policy-and-copyright";
import {
  getBlockingCopyrightViolations,
  getRejectedCensorshipResults,
  isMediaPipelinePending,
  isMediaReadyForPublish,
} from "@/features/creator-dashboard/utils/media-violations";

type DashboardView =
  | "series"
  | "seasons"
  | "episodes"
  | "create"
  | "comic"
  | "video"
  | "combos"
  | "monetization"
  | "campaign"
  | "publish";

type DashboardRouteState = {
  view: DashboardView;
  seriesId: string;
  seasonId: string;
  episodeId: string;
};

const dashboardViews: DashboardView[] = [
  "series",
  "seasons",
  "episodes",
  "create",
  "comic",
  "video",
  "combos",
  "monetization",
  "campaign",
  "publish",
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
  thumbnail?: string;
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
  status?: MediaStatus;
  approvalStatus?: ContentApprovalStatus;
  file?: File;
};

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
    description: "Thiết lập series truyện tranh hoặc video theo mô hình Series.",
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
  monetization: {
    title: "Kiếm tiền",
    description: "Hoàn thành các bước điều khoản, thuế và thanh toán để bật doanh thu Creator.",
  },
  publish: {
    title: "Xuất bản",
    description: "Xuất bản nội dung của bạn",
  },
  campaign: {
    title: "Đẩy mạnh tương tác",
    description: "Tiếp cận hàng ngàn độc giả và khán giả mới bằng các gói đẩy xu hướng.",
  },
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
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
  return () => { };
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

function formatApprovalStatusLabel(status: ContentApprovalStatus) {
  switch (status) {
    case "APPROVED":
      return "Đã duyệt";
    case "REJECTED":
      return "Bị từ chối";
    default:
      return "Chờ duyệt";
  }
}

function formatStatusLabel(status: SeriesStatus | SeasonStatus | EpisodeStatus) {
  if (status === "ACTION_REQUIRED") {
    return "Cần xử lý";
  }

  if (status === "REVIEW") {
    return "Đang xem xét";
  }

  return status;
}


function getApprovalChipClass(status: ContentApprovalStatus) {
  switch (status) {
    case "APPROVED":
      return "border-[#25B67A] bg-[#E9FBF2] text-[#067647]";
    case "REJECTED":
      return "border-red-500/50 bg-red-500/10 text-red-400";
    default:
      return "border-[#F4B9CC] bg-[#FFF4F8] text-[#B83268]";
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
    const message = error instanceof Error ? error.message : "Tải lên thất bại.";
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
    thumbnail: episode.thumbnail ? normalizeAssetUrl(episode.thumbnail) : undefined,
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
    status: media.status,
    approvalStatus: media.approvalStatus,
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


function MultiSelectField({ name, options, initialValues }: { name: string, options: { id: string, name: string }[], initialValues: string[] }) {
  const [selected, setSelected] = useState<string[]>(initialValues);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div>
      <input type="hidden" name={name} value={selected.join(',')} />
      <div className="flex flex-wrap gap-2 mt-2">
        {options.map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors border ${selected.includes(opt.id)
              ? "bg-creator-gold text-black border-creator-gold font-medium"
              : "bg-creator-sidebar border-creator-border text-creator-muted hover:border-white/30"
              }`}
          >
            {opt.name}
          </button>
        ))}
      </div>
    </div>
  );
}


function CreatorDashboardContent() {
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await getCategories();
      return res.content?.map((c: any) => ({ id: c.categoryId, name: c.categoryName })) || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const tagsQuery = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await getTags();
      return res.content?.map((t: any) => ({ id: t.tagId, name: t.tagName })) || [];
    },
    staleTime: 5 * 60 * 1000,
  });
  usePipelineSSE({ enabled: true });

  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const accountId = authUser?.accountId ?? "";
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
    console.log("[CreatorDashboard] setDashboardRouteState", {
      fromView: activeView,
      nextState,
      accountId,
      roleName: authUser?.roleName,
    });

    setActiveView(nextState.view);
    setSelectedSeriesId(nextState.seriesId);
    setSelectedSeasonId(nextState.seasonId);
    setSelectedEpisodeId(nextState.episodeId);
    writeDashboardRouteState(nextState);

  }

  useEffect(() => {
    console.log("[CreatorDashboard] active route state", {
      activeView,
      selectedSeriesId,
      selectedSeasonId,
      selectedEpisodeId,
      accountId,
      roleName: authUser?.roleName,
      location:
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "",
    });
  }, [
    activeView,
    selectedSeriesId,
    selectedSeasonId,
    selectedEpisodeId,
    accountId,
    authUser?.roleName,
  ]);

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
      (activeView === "comic" || activeView === "video" || activeView === "publish"),
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
    () => {
      const comicMedia = (mediaQuery.data ?? []).filter(
        (media) => media.mediaType === "IMAGE" && !media.isDeleted,
      );

      return comicMedia.length > 0 && comicMedia.every(isMediaReadyForPublish);
    },
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
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "series"] });
    },
    onError: (error) => {
      setUploadMessage(error instanceof Error ? error.message : "Không thể ẩn series.");
    },
  });

  const unhideSeriesMutation = useMutation({
    mutationFn: (series: SeriesRow) => unhideSeries(series.id),
    onSuccess: () => {
      setUploadMessage("Đã hiện Series.");
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "series"] });
    },
    onError: (error) => {
      setUploadMessage(error instanceof Error ? error.message : "Không thể hiện series.");
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
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "seasons", selectedSeries?.id] });
    },
    onError: (error) => {
      setUploadMessage(error instanceof Error ? error.message : "Không thể ẩn mùa.");
    },
  });

  const unhideSeasonMutation = useMutation({
    mutationFn: (season: SeasonRow) => unhideSeason(season.id),
    onSuccess: () => {
      setUploadMessage("Đã hiện Mùa.");
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "seasons", selectedSeries?.id] });
    },
    onError: (error) => {
      setUploadMessage(error instanceof Error ? error.message : "Không thể hiện mùa.");
    },
  });

  const updateEpisodeMutation = useMutation({
    mutationFn: async (episode: EpisodeRow & { thumbnailFile?: File }) => {
      const uploadedThumbnailUrl = episode.thumbnailFile
        ? await uploadSeriesArtwork(episode.thumbnailFile, "Thumbnail", "cover")
        : undefined;

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
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "episodes", selectedSeason?.id] });
    },
    onError: (error) => {
      setUploadMessage(error instanceof Error ? error.message : "Không thể ẩn tập.");
    },
  });

  const unhideEpisodeMutation = useMutation({
    mutationFn: (episode: EpisodeRow) => unhideEpisode(episode.id),
    onSuccess: () => {
      setUploadMessage("Đã hiện Tập.");
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "episodes", selectedSeason?.id] });
    },
    onError: (error) => {
      setUploadMessage(error instanceof Error ? error.message : "Không thể hiện tập.");
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
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "series"] });
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "seasons", selectedSeries?.id] });
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
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "series"] });
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "seasons", selectedSeries?.id] });
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
      const savedPages = pagesToSave.filter(
        (page) => !isLocalPageId(page.id),
      );
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
        error instanceof Error ? error.message : "Không thể lưu thứ tự hiển thị.",
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
    { id: "core", label: "Series", state: (activeView === "create" || activeView === "series") ? "current" : (["seasons", "episodes", "comic", "video", "publish"].includes(activeView) ? "completed" : "upcoming") as any },
    { id: "structure", label: "Season", state: activeView === "seasons" ? "current" : (["episodes", "comic", "video", "publish"].includes(activeView) ? "completed" : "upcoming") as any },
    { id: "content", label: "Episode", state: activeView === "episodes" ? "current" : (["comic", "video", "publish"].includes(activeView) ? "completed" : "upcoming") as any },
    { id: "moderation", label: "Media", state: (activeView === "comic" || activeView === "video") ? "current" : (activeView === "publish" ? "completed" : "upcoming") as any },
    { id: "publishing", label: "Xuất bản", state: activeView === "publish" ? "current" : "upcoming" as any },
  ];

  const isSeriesFlow = ["series", "create", "seasons", "episodes", "comic", "video", "publish"].includes(activeView);

  return (
    <>
      <CreatorLayout activeView={activeView} onNavigate={(view) => { clearUploadDrafts(); setDashboardRouteState({ view: view as any, seriesId: "", seasonId: "", episodeId: "" }); }}>
        <div className="w-full">
          {isSeriesFlow && <CreatorStepper steps={stepperSteps} />}

          <div className="mt-4 pb-20">
            {activeView === "series" ? (
              <CreatorSeriesList
                seriesList={displaySeriesRows}
                onSelect={(seriesId) => {
                  setSelectedSeriesId(seriesId);
                  setDashboardRouteState({ view: "seasons", seriesId, seasonId: "", episodeId: "" });
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
                  language: selectedSeries?.language || "vi",
                  categoryIds: selectedSeries?.categoryIds || [],
                  tagIds: selectedSeries?.tagIds || [],
                  coverUrl: selectedSeries?.coverUrl,
                  bannerUrl: selectedSeries?.bannerUrl,
                }}
                categories={categoriesQuery.data || []}
                tags={tagsQuery.data || []}
                onSave={(data) => {
                  if (!selectedSeriesId || activeView === "create" && !selectedSeries) {
                    createSeriesMutation.mutate(data as any);
                  } else if (selectedSeries) {
                    handleSubmitEdit({ kind: "series", value: { ...selectedSeries, ...data } as any, coverFile: data.coverFile, bannerFile: data.bannerFile });
                  }
                }}
                onCancel={() => openSeriesManagement()}
              />
            ) : activeView === "seasons" ? (
              <CreatorSeasonsList
                seasons={displaySeasonRows}
                onSelect={(seasonId) => {
                  setSelectedSeasonId(seasonId);
                  setDashboardRouteState({ view: "episodes", seriesId: selectedSeriesId, seasonId, episodeId: "" });
                }}
                onCreate={() => createSeasonMutation.mutate()}
                onEdit={(season) => handleUpdateSeason(season)}
                onDelete={handleDeleteSeason}
                onBack={() => setDashboardRouteState({ view: "series", seriesId: "", seasonId: "", episodeId: "" })}
              />
            ) : activeView === "episodes" ? (
              (selectedSeries && selectedSeason ? (
                <EpisodeManagementView
                  selectedSeries={selectedSeries}
                  selectedSeason={selectedSeason}
                  episodes={displayEpisodeRows}
                  isLoading={episodesQuery.isLoading}
                  onBack={() => setDashboardRouteState({ view: "seasons", seriesId: selectedSeries.id, seasonId: "", episodeId: "" })}
                  onCreateEpisode={() => createEpisodeMutation.mutate()}
                  isCreatingEpisode={createEpisodeMutation.isPending}
                  onOpenUpload={openEpisodeUpload}
                  onUpdateEpisode={handleUpdateEpisode}
                  onDeleteEpisode={handleDeleteEpisode}
                />
              ) : (
                <div className="p-8 text-white flex flex-col items-center justify-center min-h-[50vh]">
                  <h2 className="text-xl font-bold mb-4">No season selected.</h2>
                </div>
              ))
            ) : activeView === "comic" ? (
              (selectedSeries && selectedSeason && selectedEpisode ? (
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
                  onGoToPublishing={() => setDashboardRouteState({ view: "publish", seriesId: selectedSeries.id, seasonId: selectedSeason.id, episodeId: selectedEpisode.id })}
                  canSchedulePublish={hasApprovedComicMedia}
                  onSchedulePublish={(episode) => handleSchedulePublish({ kind: "episode", value: episode })}
                  onHideEpisode={(episode) => hideEpisodeMutation.mutate(episode)}
                  onUnhideEpisode={(episode) => unhideEpisodeMutation.mutate(episode)}
                  isHidingEpisode={hideEpisodeMutation.isPending || unhideEpisodeMutation.isPending}
                  onCancelSchedule={(episode) => cancelScheduleMutation.mutate(episode.id)}
                  isCancelingSchedule={cancelScheduleMutation.isPending}
                  onPublishNow={(episode) => publishEpisodeMutation.mutate(episode.id)}
                  isPublishingNow={publishEpisodeMutation.isPending}
                  onBack={() => setDashboardRouteState({ view: "episodes", seriesId: selectedSeries.id, seasonId: selectedSeason.id, episodeId: "" })}
                />
              ) : (
                <div className="p-8 text-white flex flex-col items-center justify-center min-h-[50vh]">
                  <h2 className="text-xl font-bold mb-4">No episode selected.</h2>
                </div>
              ))
            ) : activeView === "video" ? (
              (selectedSeries && selectedSeason && selectedEpisode ? (
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
                  onGoToPublishing={() => setDashboardRouteState({ view: "publish", seriesId: selectedSeries.id, seasonId: selectedSeason.id, episodeId: selectedEpisode.id })}
                  accountId={accountId}
                  onSchedulePublish={(episode) => handleSchedulePublish({ kind: "episode", value: episode })}
                  onHideEpisode={(episode) => hideEpisodeMutation.mutate(episode)}
                  onUnhideEpisode={(episode) => unhideEpisodeMutation.mutate(episode)}
                  isHidingEpisode={hideEpisodeMutation.isPending || unhideEpisodeMutation.isPending}
                  onCancelSchedule={(episode) => cancelScheduleMutation.mutate(episode.id)}
                  isCancelingSchedule={cancelScheduleMutation.isPending}
                  onPublishNow={(episode) => publishEpisodeMutation.mutate(episode.id)}
                  isPublishingNow={publishEpisodeMutation.isPending}
                  onBack={() => setDashboardRouteState({ view: "episodes", seriesId: selectedSeries.id, seasonId: selectedSeason.id, episodeId: "" })}
                />
              ) : (
                <div className="p-8 text-white flex flex-col items-center justify-center min-h-[50vh]">
                  <h2 className="text-xl font-bold mb-4">No episode selected.</h2>
                </div>
              ))
            ) : activeView === "publish" as any ? (
              selectedEpisode?.contentType === "COMIC" ? (
                <FinalReviewComicStep
                  pages={displayComicPages}
                  isPublishing={publishEpisodeMutation.isPending}
                  onPublish={() => publishEpisodeMutation.mutate(selectedEpisodeId)}
                  onSchedulePublish={() => handleSchedulePublish({ kind: "episode", value: selectedEpisode! })}
                  onSaveDraft={() => openSeriesManagement()}
                  onBack={() => {
                    if (selectedEpisode?.status === "PUBLISHED") {
                      setDashboardRouteState({ view: "episodes", seriesId: selectedSeriesId, seasonId: selectedSeasonId, episodeId: "" });
                    } else {
                      setDashboardRouteState({ view: "comic", seriesId: selectedSeriesId, seasonId: selectedSeasonId, episodeId: selectedEpisodeId });
                    }
                  }}
                  selectedEpisode={selectedEpisode}
                  onSaveEpisode={(episode) => updateEpisodeMutation.mutate(episode)}
                  isSavingEpisode={updateEpisodeMutation.isPending}
                  onHideEpisode={(episode) => hideEpisodeMutation.mutate(episode)}
                  isHidingEpisode={hideEpisodeMutation.isPending}
                />
              ) : (
                <FinalReviewStep
                  mediaId={existingVideoMedia[0]?.mediaId}
                  mediaUrl={existingVideoMedia[0]?.fileUrl || existingVideoMedia[0]?.originalUrl || ""}
                  mediaStatus={existingVideoMedia[0]?.status}
                  approvalStatus={existingVideoMedia[0]?.approvalStatus}
                  isPublishing={publishEpisodeMutation.isPending}
                  onPublish={() => publishEpisodeMutation.mutate(selectedEpisodeId)}
                  onSchedulePublish={() => handleSchedulePublish({ kind: "episode", value: selectedEpisode! })}
                  onSaveDraft={() => openSeriesManagement()}
                  onBack={() => {
                    if (selectedEpisode?.status === "PUBLISHED") {
                      setDashboardRouteState({ view: "episodes", seriesId: selectedSeriesId, seasonId: selectedSeasonId, episodeId: "" });
                    } else {
                      setDashboardRouteState({ view: "video", seriesId: selectedSeriesId, seasonId: selectedSeasonId, episodeId: selectedEpisodeId });
                    }
                  }}
                  selectedEpisode={selectedEpisode}
                  onSaveEpisode={(episode) => updateEpisodeMutation.mutate(episode)}
                  isSavingEpisode={updateEpisodeMutation.isPending}
                  onHideEpisode={(episode) => hideEpisodeMutation.mutate(episode)}
                  isHidingEpisode={hideEpisodeMutation.isPending}
                />
              )
            ) : activeView === "combos" ? (
              <ComboManagementView />
            ) : activeView === "monetization" ? (
              <CreatorMonetizationView />
            ) : activeView === "campaign" ? (
              <CampaignPurchaseView />
            ) : (
              <div className="p-8 text-white flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-xl font-bold mb-4">View not mapped yet ({activeView})</h2>
                <button
                  onClick={openSeriesManagement}
                  className="px-6 py-2 bg-creator-gold text-black rounded"
                >
                  Back to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </CreatorLayout>

      {editModal && (
        <EditEntityModal
          modal={editModal}
          isSaving={updateSeriesMutation.isPending || updateSeasonMutation.isPending || updateEpisodeMutation.isPending}
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
          isDeleting={deleteSeriesMutation.isPending || deleteSeasonMutation.isPending || deleteEpisodeMutation.isPending || deleteMediaMutation.isPending}
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
      <Toaster position="top-center" />
    </>
  );
}

function EditEntityModal({
  modal,
  isSaving,
  uploadMessage,
  onClose,
  onSubmit,
  categories,
  tags,
}: {
  modal: EditModalState;
  isSaving: boolean;
  uploadMessage: string | null;
  onClose: () => void;
  onSubmit: (nextValue: EditSubmitState) => void;
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
}) {
  const [coverFile, setCoverFile] = useState<File | undefined>();
  const [bannerFile, setBannerFile] = useState<File | undefined>();

  if (!modal) {
    return null;
  }

  const controlClass =
    "h-11 w-full rounded-xl border border-creator-border bg-creator-bg px-3 text-sm font-semibold outline-none focus:border-creator-gold focus:bg-creator-bg text-white";
  const textareaClass =
    "min-h-24 w-full resize-none rounded-xl border border-creator-border bg-creator-bg p-3 text-sm font-semibold outline-none focus:border-creator-gold focus:bg-creator-bg text-white";

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
      ? "Update Series"
      : modal.kind === "season"
        ? "Update Season"
        : "Update Episode";


  if (modal.kind === "series") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 overflow-y-auto">
        <div
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-7xl rounded-[24px] border border-creator-border bg-creator-bg shadow-[0_30px_90px_rgba(15,23,42,0.25)]"
        >
          <div className="sticky top-0 z-10 flex justify-between items-center bg-creator-bg p-6 pb-2 border-b border-creator-border rounded-t-[24px]">
            <h2 className="text-2xl font-bold text-white">Cập nhật Series</h2>
            <button
              onClick={onClose}
              type="button"
              className="rounded-full bg-creator-sidebar p-2 text-creator-muted transition-colors hover:bg-slate-700 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[80vh]">
            <CoreIdentityStep
              isUpdate={true}
              initialData={{
                title: modal.value.title,
                description: modal.value.description,
                contentType: modal.value.contentType,
                visibility: modal.value.visibility,
                ageRating: modal.value.ageRating,
                language: modal.value.language,
                categoryIds: modal.value.categoryIds,
                tagIds: modal.value.tagIds,
                coverUrl: modal.value.coverUrl,
                bannerUrl: modal.value.bannerUrl,
              }}
              categories={categories}
              tags={tags}
              onCancel={onClose}
              onSave={(data) => {
                onSubmit({
                  kind: "series",
                  value: { ...modal.value, ...data } as any,
                  coverFile: data.coverFile,
                  bannerFile: data.bannerFile
                });
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <ModalShell title={title} subtitle="Edit the fields and save your changes." onClose={onClose}>

      {modal.kind === "season" && (
        <form onSubmit={handleSeasonSubmit} className="space-y-5">
          <Field label="Season Number">
            <input
              type="number"
              min={1}
              name="seasonNumber"
              defaultValue={modal.value.seasonNumber}
              className={controlClass}
            />
          </Field>
          <Field label="Title" required>
            <input
              name="title"
              required
              defaultValue={modal.value.title}
              className={controlClass}
            />
          </Field>
          <Field label="Description">
            <textarea
              name="description"
              defaultValue={modal.value.description}
              className={textareaClass}
            />
          </Field>
          <Field label="Lifecycle">
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
            <Field label="Episode Number">
              <input
                type="number"
                min={1}
                name="episodeNumber"
                defaultValue={modal.value.episodeNumber}
                className={controlClass}
              />
            </Field>
            <Field label="Content Type">
              <select
                name="contentType"
                defaultValue={modal.value.contentType}
                className={controlClass}
              >
                <option value="COMIC">Truyện tranh</option>
                <option value="VIDEO">Video</option>
              </select>
            </Field>
          </div>
          <Field label="Title" required>
            <input
              name="title"
              required
              defaultValue={modal.value.title}
              className={controlClass}
            />
          </Field>
          <Field label="Description">
            <textarea
              name="description"
              defaultValue={modal.value.description}
              className={textareaClass}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Lifecycle">
              <input
                value={formatStatusLabel(modal.value.status)}
                readOnly
                className={controlClass}
              />
            </Field>
            <Field label="Total Page">
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
      title="Schedule Publish"
      subtitle="Chỉ những tập có media đã được duyệt mới có thể được lên lịch."
      onClose={onClose}
      compact
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-[#D9E2F0] bg-creator-bg p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            {modal.kind}
          </p>
          <p className="mt-1 text-lg font-black text-white">{title}</p>
          <p className="mt-2 text-xs font-bold text-creator-muted">
            Current schedule: {formatDateTime(modal.value.scheduledPublishAt)}
          </p>
        </div>

        <Field label="Publish At" required>
          <input
            name="scheduledPublishAt"
            type="datetime-local"
            required
            min={toDateTimeLocalValue()}
            defaultValue={toDateTimeLocalValue(modal.value.scheduledPublishAt)}
            className="h-12 w-full rounded-xl border border-creator-border bg-creator-bg px-4 text-sm font-semibold outline-none focus:border-creator-gold focus:bg-creator-bg text-white"
          />
        </Field>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-creator-border bg-creator-bg text-white border border-creator-border px-5 py-3 hover:border-creator-gold transition-colors text-sm font-black text-creator-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-full bg-[#007A8A] px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Schedule"}
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
      title="Confirm Delete"
      subtitle="Review the item before removing it from your workspace."
      onClose={onClose}
      compact
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-4">
          <p className="text-sm font-bold text-creator-muted">
            You are deleting:
          </p>
          <p className="mt-1 text-lg font-black text-red-400">
            {entityLabel}
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-creator-border bg-creator-bg text-white border border-creator-border px-5 py-3 hover:border-creator-gold transition-colors text-sm font-black text-creator-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-full bg-red-500 hover:bg-red-600 transition-colors px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Delete"}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          "max-h-[90vh] w-full overflow-y-auto rounded-[24px] border border-creator-border bg-creator-sidebar p-6 shadow-[0_30px_90px_rgba(15,23,42,0.25)]",
          compact ? "max-w-lg" : "max-w-3xl",
        )}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">{title}</h2>
            <p className="mt-1 text-sm font-semibold text-creator-muted">
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-creator-bg border border-creator-border text-creator-muted text-creator-muted transition hover:text-white transition-colors"
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
    <div className="flex justify-end gap-3 border-t border-[#E8EDF5] pt-5">
      <button
        type="button"
        onClick={onClose}
        className="rounded-full border border-creator-border bg-creator-bg text-white border border-creator-border px-5 py-3 hover:border-creator-gold transition-colors text-sm font-black text-creator-muted"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isSaving}
        className="rounded-full bg-creator-gold px-5 py-3 text-sm font-black text-black hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

function DashboardNavButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm font-black transition",
        active
          ? "bg-[#151A23] text-white shadow-lg shadow-slate-900/15"
          : "text-slate-500 hover:bg-creator-sidebar hover:text-white",
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

function MobileTab({
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
        "h-9 rounded-full px-4 text-xs font-black transition",
        active ? "bg-[#151A23] text-white" : "bg-creator-sidebar text-creator-muted",
      )}
    >
      {label}
    </button>
  );
}

function ModelStep({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-creator-bg border border-creator-border px-3 py-2 text-white">
      <span>{label}</span>
      <ChevronRight className="h-4 w-4 text-slate-300" />
    </div>
  );
}

function SeriesManagementView({
  rows,
  isLoading,
  onSelectSeries,
  onUpdateSeries,
  onDeleteSeries,
  onHideSeries,
  onUnhideSeries,
}: {
  rows: SeriesRow[];
  isLoading: boolean;
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
      <div className="rounded-[24px] border-creator-border bg-creator-sidebar p-4 shadow-[0_20px_60px_rgba(30,42,68,0.07)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative w-full lg:max-w-xl">
            <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7F6F7A]" />
            <input
              type="search"
              placeholder="Search series title..."
              className="h-14 w-full rounded-full border border-creator-border bg-creator-bg pl-14 pr-5 text-sm font-semibold text-white outline-none transition focus:border-creator-gold focus:bg-creator-bg text-white"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="grid h-12 grid-cols-3 rounded-xl bg-[#ECF1FA] p-1 text-sm font-black text-slate-600">
              <FilterTab
                active={filter === "ALL"}
                label="All"
                onClick={() => setFilter("ALL")}
              />
              <FilterTab
                active={filter === "COMIC"}
                label="Comics"
                onClick={() => setFilter("COMIC")}
              />
              <FilterTab
                active={filter === "VIDEO"}
                label="Videos"
                onClick={() => setFilter("VIDEO")}
              />
            </div>

            <button className="flex h-12 items-center justify-between gap-3 rounded-xl border border-creator-border bg-creator-bg px-5 text-sm font-bold text-white">
              All Statuses
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
        <ApiStateNote isLoading={isLoading} />
      </div>

      <div className="overflow-hidden rounded-[24px] border border-creator-border bg-creator-sidebar shadow-[0_20px_60px_rgba(30,42,68,0.07)]">
        <div className="grid grid-cols-[1.8fr_0.8fr_1fr_1fr_1.15fr] bg-creator-bg border border-creator-border text-creator-muted px-8 py-5 text-xs font-black uppercase tracking-[0.12em] text-creator-muted max-lg:hidden">
          <span>Chi tiết Series</span>
          <span>Loại</span>
          <span>Trạng thái</span>
          <span>Hiệu suất</span>
          <span className="text-right">Thao tác</span>
        </div>

        <div className="divide-y divide-[#E6EBF3]">
          {!isLoading && filteredRows.length === 0 && (
            <div className="px-8 py-10 text-center text-sm font-bold text-slate-500">
              No series found for this creator.
            </div>
          )}
          {filteredRows.map((series) => (
            <SeriesTableRow
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

        <div className="flex items-center justify-between bg-creator-bg border border-creator-border text-creator-muted px-8 py-5 text-sm font-bold text-creator-muted">
          <span>Showing {filteredRows.length} series</span>
          <div className="flex items-center gap-3">
            <ChevronLeft className="h-5 w-5 text-slate-400" />
            <ChevronRight className="h-5 w-5 text-slate-900" />
          </div>
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
        active ? "bg-creator-bg text-white shadow-sm" : "text-creator-muted",
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
    <div className="mt-4 rounded-2xl bg-creator-bg px-4 py-3 text-xs font-bold text-slate-500">
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
    <Panel>
      <div className="py-10 text-center">
        <p className="text-lg font-black text-white">{title}</p>
        <p className="mt-2 text-sm font-bold text-slate-500">{description}</p>
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
          "flex items-center justify-center bg-creator-bg border border-creator-border text-creator-muted text-slate-400",
        )}
      >
        <ImageIcon className="h-7 w-7" />
      </div>
    );
  }

  return <img src={src} alt="" className={className} />;
}

function SeriesTableRow({
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

  return (
    <div className="grid min-h-[116px] grid-cols-1 gap-4 px-5 py-5 lg:grid-cols-[1.8fr_0.8fr_1fr_1fr_1.15fr] lg:items-center lg:px-8">
      <div className="flex items-center gap-4">
        <SeriesCoverImage
          src={series.coverUrl}
          className="h-20 w-20 rounded-xl object-cover shadow-sm"
        />
        <div className="min-w-0">
          <p className="truncate text-lg font-black text-white">
            {series.title}
          </p>
          <p className="text-sm font-bold text-creator-muted">
            {series.subtitle} <span className="text-slate-300">.</span>{" "}
            {series.episodes} Episodes
          </p>
          <p className="mt-1 text-xs font-bold text-slate-400">{series.id}</p>
        </div>
      </div>

      <div>
        <span
          className={cx(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black",
            isComic ? "bg-[#E9D3FF] text-[#5E1AA3]" : "bg-[#CDEEFF] text-[#075985]",
          )}
        >
          {isComic ? (
            <BookOpen className="h-4 w-4" />
          ) : (
            <Clapperboard className="h-4 w-4" />
          )}
          {isComic ? "Comic" : "Video"}
        </span>
      </div>

      <div className="space-y-2">
        <span
          className={cx(
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black",
            isPublished && "border border-[#24B5FF] bg-[#E8F8FF] text-[#0074A6]",
            isDraft && "border border-creator-border bg-creator-bg border border-creator-border text-red-400",
            !isPublished &&
            !isDraft &&
            "bg-[#FFD8D4] text-red-400",
          )}
        >
          {isPublished ? (
            <span className="h-2 w-2 rounded-full bg-[#24B5FF]" />
          ) : isDraft ? (
            <span className="h-2 w-2 rounded-full bg-[#E8BBCB]" />
          ) : (
            <CircleAlert className="h-4 w-4" />
          )}
          {formatStatusLabel(series.status)}
        </span>
      </div>

      <div className="text-sm font-bold text-creator-muted">
        {series.revenue ? (
          <div className="space-y-1">
            <p className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {series.views}
            </p>
            <p className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              {series.revenue}
            </p>
          </div>
        ) : (
          <span>{series.views}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
        <button
          type="button"
          onClick={() => onUpdateSeries(series)}
          className="rounded-full p-2 text-creator-muted transition hover:bg-[#F3E8EE] hover:text-[#B83268]"
          title="Update series"
        >
          <Edit3 className="h-5 w-5" />
        </button>
        {isPublished && (
          <button
            type="button"
            onClick={() => onHideSeries(series)}
            className="rounded-full p-2 text-creator-muted transition hover:bg-[#FFF3CD] hover:text-[#856404]"
            title="Hide series"
          >
            <Eye className="h-5 w-5" />
          </button>
        )}
        {isHidden && (
          <button
            type="button"
            onClick={() => onUnhideSeries(series)}
            className="rounded-full p-2 text-creator-muted transition hover:bg-[#E8F8FF] hover:text-creator-gold"
            title="Unhide series"
          >
            <Zap className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDeleteSeries(series)}
          className="rounded-full p-2 text-creator-muted transition hover:bg-[#FFE8E8] hover:text-red-400"
          title="Delete series"
        >
          <Trash2 className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => onSelectSeries(series.id)}
          className={cx(
            "rounded-full px-5 py-3 text-sm font-black transition",
            isDraft
              ? "bg-[#B83268] text-white"
              : "bg-creator-bg border border-creator-border text-creator-muted text-white hover:text-white transition-colors",
          )}
        >
          Manage Seasons
        </button>
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
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-md bg-creator-sidebar border border-creator-border px-4 py-2 text-sm font-black text-creator-gold shadow-sm"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Series
      </button>

      <Panel>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <SeriesCoverImage
              src={selectedSeries.coverUrl}
              className="h-20 w-20 rounded-2xl object-cover"
            />
            <div>
              <h2 className="text-2xl font-black text-white">
                {selectedSeries.title}
              </h2>
              <p className="text-sm font-bold text-creator-muted">
                {selectedSeries.contentType} series . {seasons.length} seasons
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCreateSeason}
            disabled={isCreatingSeason}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#007A8A] px-5 text-sm font-black text-white shadow-lg shadow-cyan-900/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-5 w-5" />
            {isCreatingSeason ? "Creating..." : "Tạo Mùa"}
          </button>
        </div>
        <ApiStateNote isLoading={isLoading} />
      </Panel>

      <div className="grid gap-4">
        {!isLoading && seasons.length === 0 && (
          <div className="rounded-2xl bg-creator-sidebar border border-creator-border px-5 py-8 text-center text-sm font-bold text-slate-500 shadow-sm">
            No seasons found for this series.
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
      ? "bg-[#E8F8FF] text-[#0074A6] border-[#24B5FF]"
      : season.status === "DRAFT"
        ? "bg-creator-bg border border-creator-border text-red-400 border-creator-border"
        : "bg-creator-bg border border-creator-border text-creator-muted text-slate-500 border-[#D9E2F0]";
  const isHidden = season.status === "HIDDEN";
  const isPublished = season.status === "PUBLISHED";

  return (
    <div className="rounded-[22px] border border-creator-border bg-creator-sidebar p-5 shadow-[0_16px_44px_rgba(30,42,68,0.05)]">
      <div className="grid gap-5 lg:grid-cols-[1fr_180px_180px_180px] lg:items-center">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#151A23] px-3 py-1 text-xs font-black text-white">
              Season {season.seasonNumber}
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
          <h3 className="text-xl font-black text-white">{season.title}</h3>
          <p className="mt-1 max-w-2xl text-sm font-semibold text-creator-muted">
            {season.description}
          </p>
          <p className="mt-2 text-xs font-bold text-slate-400">{season.id}</p>
        </div>

        <MetricBox label="Số tập" value={String(season.episodes)} />
        <MetricBox
          label="Đã xuất bản"
          value={String(season.publishedEpisodes)}
        />
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onUpdate}
            className="rounded-full p-2 text-creator-muted transition hover:bg-[#F3E8EE] hover:text-[#B83268]"
            title="Update season"
          >
            <Edit3 className="h-5 w-5" />
          </button>
          {isPublished && (
            <button
              type="button"
              onClick={onHide}
              className="rounded-full p-2 text-creator-muted transition hover:bg-[#FFF3CD] hover:text-[#856404]"
              title="Hide season"
            >
              <Eye className="h-5 w-5" />
            </button>
          )}
          {isHidden && (
            <button
              type="button"
              onClick={onUnhide}
              className="rounded-full p-2 text-creator-muted transition hover:bg-[#E8F8FF] hover:text-creator-gold"
              title="Unhide season"
            >
              <Zap className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full p-2 text-creator-muted transition hover:bg-[#FFE8E8] hover:text-red-400"
            title="Delete season"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onSelect}
            className="rounded-full bg-creator-bg border border-creator-border text-creator-muted px-5 py-3 text-sm font-black text-white transition hover:text-white transition-colors"
          >
            Manage Episodes
          </button>
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// EPISODE MANAGEMENT VIEW
// ============================================================================
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
    <div className="max-w-5xl mx-auto p-6 text-creator-text space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-bold text-creator-muted hover:text-white transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Seasons
          </button>
          <h2 className="text-3xl font-bold text-white mb-2">
            {selectedSeason.title}
          </h2>
          <p className="text-creator-muted">
            {selectedSeries.title} . Season {selectedSeason.seasonNumber}
          </p>
        </div>
      </div>

      <ApiStateNote isLoading={isLoading} />

      {/* Season Card matching Mockup */}


      <div className="bg-creator-sidebar border border-creator-border rounded-xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-creator-border flex flex-col sm:flex-row justify-between items-start sm:items-center bg-creator-card/30 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-bold px-2.5 py-1 bg-creator-gold/10 text-creator-gold rounded border border-creator-gold/20">
                SEASON {selectedSeason.seasonNumber < 10 ? `0${selectedSeason.seasonNumber}` : selectedSeason.seasonNumber}
              </span>
              <h3 className="text-xl font-bold text-white">{selectedSeason.title}</h3>
            </div>
            <p className="text-sm text-creator-muted mt-2 max-w-2xl">{selectedSeason.description}</p>
          </div>
          <button
            type="button"
            onClick={onCreateEpisode}
            disabled={isCreatingEpisode}
            className="inline-flex h-10 items-center justify-center gap-2 rounded bg-creator-gold px-5 text-sm font-black text-black transition-colors hover:bg-creator-gold-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {isCreatingEpisode ? "Creating..." : "Add Episode"}
          </button>
        </div>

        <div className="p-0">
          {!isLoading && episodes.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-creator-bg border border-creator-border flex items-center justify-center mb-4">
                <PlayCircle size={32} className="text-creator-muted" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Chưa có tập nào</h3>
              <p className="text-sm text-creator-muted">Nhấn "Thêm Tập" để bắt đầu xây dựng mùa này.</p>
            </div>
          ) : (
            <ul className="divide-y divide-creator-border">
              {episodes.map((episode) => (
                <li key={episode.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => onOpenUpload(episode)}>
                    <GripVertical size={18} className="text-creator-border group-hover:text-creator-muted cursor-grab hidden sm:block" />
                    <div className="w-10 h-10 shrink-0 rounded-lg bg-creator-bg border border-creator-border flex items-center justify-center text-sm font-bold text-creator-muted shadow-inner">
                      {episode.episodeNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-white truncate">{episode.title}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-creator-muted font-medium">
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-creator-bg border border-creator-border">
                          {episode.contentType === "COMIC" ? <BookOpen size={12} /> : <Clapperboard size={12} />}
                          {episode.contentType === "COMIC" ? `${episode.totalPage ?? episode.mediaCount} pages` : `${episode.mediaCount} video`}
                        </span>
                        <span>•</span>
                        <span className={cx(
                          "px-2 py-0.5 rounded border",
                          episode.status === "PUBLISHED" ? "border-green-500/30 text-green-400 bg-green-500/10" :
                            episode.status === "REVIEW" ? "border-creator-gold/30 text-creator-gold bg-creator-gold/10" :
                              "border-creator-muted/30 text-creator-muted bg-creator-bg"
                        )}>
                          {formatStatusLabel(episode.status)}
                        </span>
                        <span className="truncate max-w-[200px]">{episode.description}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Container */}
                  <div className="flex items-center gap-2 pl-14 sm:pl-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); onUpdateEpisode(episode); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-creator-bg border border-creator-border rounded hover:bg-white/10 transition-colors"
                      title="Settings (Unlock, Schedule)"
                    >
                      <Edit3 size={14} /> Settings
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpenUpload(episode); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-black bg-creator-gold rounded hover:bg-creator-gold-hover transition-colors"
                      title="Upload Media"
                    >
                      {episode.contentType === "COMIC" ? <ImagePlus size={14} /> : <Video size={14} />} Media
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteEpisode(episode); }}
                      className="p-1.5 text-creator-muted hover:text-red-400 rounded hover:bg-red-400/10 transition-colors ml-1"
                      title="Delete Episode"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
      ? "border-[#24B5FF] bg-[#E8F8FF] text-[#0074A6]"
      : episode.status === "REVIEW"
        ? "border-[#F4B9CC] bg-[#FFF4F8] text-[#B83268]"
        : "border-creator-border bg-creator-sidebar text-[#9B536D]";

  return (
    <div className="grid min-h-[104px] grid-cols-1 gap-4 px-5 py-5 lg:grid-cols-[1.4fr_0.7fr_0.8fr_0.8fr_1fr] lg:items-center lg:px-8">
      <div>
        <p className="text-lg font-black text-white">
          Ep {episode.episodeNumber}: {episode.title}
        </p>
        <p className="mt-1 text-sm font-semibold text-creator-muted">
          {episode.description}
        </p>
        <p className="mt-1 text-xs font-bold text-creator-muted">{episode.id}</p>
      </div>
      <div>
        <span
          className={cx(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black",
            isComic ? "bg-[#E9D3FF] text-[#5E1AA3]" : "bg-[#CDEEFF] text-[#075985]",
          )}
        >
          {isComic ? (
            <BookOpen className="h-4 w-4" />
          ) : (
            <Clapperboard className="h-4 w-4" />
          )}
          {isComic ? "Comic" : "Video"}
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
      <div className="text-sm font-bold text-creator-muted">
        {isComic
          ? `${episode.totalPage ?? episode.mediaCount} pages`
          : `${episode.mediaCount} video`}
      </div>
      <div className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
        <button
          type="button"
          onClick={onUpdate}
          className="rounded-full p-2 text-creator-muted transition hover:bg-[#F3E8EE] hover:text-[#B83268]"
          title="Update episode"
        >
          <Edit3 className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-full p-2 text-creator-muted transition hover:bg-[#FFE8E8] hover:text-red-400"
          title="Delete episode"
        >
          <Trash2 className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onOpenUpload}
          className="rounded-full bg-creator-bg border border-creator-border text-creator-muted px-5 py-3 text-sm font-black text-white transition hover:text-white transition-colors"
        >
          {isComic ? "Open Comic Upload" : "Open Video Upload"}
        </button>
      </div>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-creator-bg p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-creator-muted">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}


// ============================================================================
// COMIC UPLOAD VIEW
// ============================================================================
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
  onGoToPublishing,
  onBack,
}: {
  selectedSeries: SeriesRow | null;
  selectedSeason: SeasonRow | null;
  selectedEpisode: EpisodeRow;
  pages: ComicPage[];
  draggingPageId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: (id: string) => void;
  onDropPage: (draggedId: string, targetId: string) => void;
  onMovePage: (id: string, offset: number) => void;
  onFilesSelected: (files: FileList | File[] | null) => void;
  isUploading: boolean;
  onSaveOrder: () => void;
  isSavingOrder: boolean;
  onDeletePage: (page: ComicPage) => void;
  isLoadingMedia: boolean;
  uploadMessage: string | null;
  onSaveEpisode: (episode: EpisodeRow & { thumbnailFile?: File }) => void;
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
  onGoToPublishing: () => void;
  onBack: () => void;
}) {
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(selectedEpisode.thumbnail || null);
  const [thumbnailFile, setThumbnailFile] = useState<File | undefined>(undefined);

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const objectUrl = URL.createObjectURL(file);
      setThumbnailPreview(objectUrl);
    }
  };

  const [editForm, setEditForm] = useState({ episodeNumber: selectedEpisode.episodeNumber, title: selectedEpisode.title, description: selectedEpisode.description || "", unlockType: selectedEpisode.unlockType || "FREE", priceVnd: selectedEpisode.priceVnd || 0 });
  return (
    <div className="max-w-6xl mx-auto p-6 text-creator-text space-y-8">
      {/* Header matching mockup */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-creator-muted hover:text-white transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Season
        </button>
        <h2 className="text-4xl font-bold text-white mb-3">Đang kiểm duyệt nội dung cuối cùng</h2>
        <p className="text-creator-muted max-w-2xl text-sm leading-relaxed">
          Upload your high-fidelity cinematic assets and let TaleX AI ensure policy compliance and original content verification.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left Column: Upload Workspace */}
        <div className="space-y-6">

          <div className="bg-creator-sidebar border border-creator-border rounded-xl p-8 shadow-xl mb-6">
            <h3 className="text-lg font-bold text-white mb-6">Chi tiết Tập</h3>
            <div className="grid gap-6 md:grid-cols-[1fr_240px]">
              <div className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Số thứ tự Tập</label>
                    <input
                      type="number"
                      min={1}
                      value={editForm.episodeNumber}
                      onChange={(e) => setEditForm({ ...editForm, episodeNumber: Number(e.target.value) })}
                      className="h-10 w-full rounded-md border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Tiêu đề Tập *</label>
                    <input
                      type="text"
                      required
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="h-10 w-full rounded-md border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Mô tả</label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full resize-none rounded-md border border-creator-border bg-creator-bg p-3 text-sm text-white outline-none focus:border-creator-gold"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2 mt-4 pt-4 border-t border-creator-border">
                  <div>
                    <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Kiểu mở khóa</label>
                    <select
                      value={editForm.unlockType}
                      onChange={(e) => setEditForm({ ...editForm, unlockType: e.target.value as EpisodeUnlockType })}
                      className="h-10 w-full rounded-md border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold"
                    >
                      <option value="FREE">Miễn phí</option>
                      <option value="PAID">Trả phí</option>
                    </select>
                  </div>

                  {editForm.unlockType === "PAID" && (
                    <div>
                      <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Giá (VNĐ) *</label>
                      <input
                        type="number"
                        min={1}
                        value={editForm.priceVnd}
                        onChange={(e) => setEditForm({ ...editForm, priceVnd: Number(e.target.value) })}
                        className="h-10 w-full rounded-md border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Thumbnail upload */}
              <div className="flex flex-col">
                <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Ảnh Thumbnail Tập *</label>
                <div 
                  onClick={() => thumbnailInputRef.current?.click()}
                  className={`relative w-full aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden group ${
                    thumbnailPreview ? "border-creator-gold" : "border-creator-border hover:border-creator-gold/50"
                  }`}
                >
                  {thumbnailPreview ? (
                    <>
                      <img src={thumbnailPreview} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <UploadCloud size={20} className="text-white mb-1" />
                        <span className="text-xs font-medium text-white">Đổi Thumbnail</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-creator-border rounded-full flex items-center justify-center mb-2">
                        <ImageIcon size={18} className="text-creator-muted" />
                      </div>
                      <span className="text-xs text-creator-muted px-4 text-center">Tải Thumbnail</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={thumbnailInputRef} 
                    onChange={handleThumbnailUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-creator-sidebar border border-creator-border rounded-xl p-8 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Khu vực làm việc</h3>
              <span className="text-xs font-bold px-3 py-1.5 bg-creator-bg border border-creator-border rounded text-creator-muted uppercase tracking-wider">
                JPG, PNG accepted
              </span>
            </div>

            {/* Dropzone */}
            <label className="mb-8 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-creator-gold/30 bg-[#13110F] p-8 text-center transition hover:bg-creator-bg group">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => onFilesSelected(e.target.files)}
                disabled={isUploading}
              />
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-creator-gold/10 text-creator-gold group-hover:bg-creator-gold/20 transition-colors">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-white mb-2">Kéo & thả tài nguyên vào đây</p>
              <p className="text-xs font-medium text-creator-muted">Kích thước tối đa: 10MB mỗi trang</p>
            </label>

            {uploadMessage && (
              <div className="mb-6 p-4 rounded-xl bg-creator-bg border border-creator-border text-sm text-creator-muted flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-creator-gold border-t-transparent rounded-full animate-spin"></div>
                  <span>{uploadMessage}</span>
                </div>
              </div>
            )}

            {/* Grid of uploaded pages */}
            {pages.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-creator-border">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white">Uploaded Pages ({pages.length})</h4>
                  <button
                    onClick={onSaveOrder}
                    disabled={isSavingOrder}
                    className="text-xs font-bold px-4 py-2 bg-creator-bg border border-creator-border text-white rounded hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    {isSavingOrder ? "Saving..." : "Save Order"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {pages.map((page, index) => (
                    <ComicPageCard
                      key={page.id}
                      page={page}
                      dragging={draggingPageId === page.id}
                      onDragStart={() => onDragStart(page.id)}
                      onDragEnd={() => onDragEnd(page.id)}
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
                </div>
              </div>
            )}
          </div>

          {/* Alert Box matching mockup */}
          <div className="bg-creator-sidebar border border-creator-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-5 h-5 rounded-full bg-creator-gold flex items-center justify-center shrink-0 mt-0.5">
                <Info className="h-3 w-3 text-black" />
              </div>
              <p className="text-sm font-medium text-creator-muted max-w-sm">
                Scans typically take 2-5 minutes.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onSaveEpisode({ ...selectedEpisode, ...editForm, thumbnailFile })}
                disabled={isSavingEpisode}
                className="px-6 py-2.5 bg-creator-bg border border-creator-border text-white text-sm font-bold rounded hover:bg-white/10 shrink-0 disabled:opacity-50"
              >
                {isSavingEpisode ? "Saving..." : "Save Details"}
              </button>
              {canSchedulePublish && (
                <button
                  onClick={onGoToPublishing}
                  className="px-6 py-2.5 bg-creator-gold text-black text-sm font-bold rounded hover:bg-creator-gold-hover shrink-0"
                >
                  Continue to Publishing
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Policy Scan */}
        <AIPolicyAndCopyright
          mediaId={pages.find((page) => !page.id.startsWith("LOCAL-"))?.id}
          mediaStatus={pages.find((page) => !page.id.startsWith("LOCAL-"))?.status}
          approvalStatus={pages.find((page) => !page.id.startsWith("LOCAL-"))?.approvalStatus}
        />
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
  const isLocal = page.id.startsWith("LOCAL-");
  const violationsQuery = useQuery({
    queryKey: ["creator-dashboard", "media-violations", page.id],
    queryFn: () => getMediaViolations(page.id),
    enabled: !isLocal,
    refetchInterval: isMediaPipelinePending({
      status: page.status,
      approvalStatus: page.approvalStatus,
    })
      ? 5000
      : false,
  });

  const violations = violationsQuery.data;
  const copyrightViolations = getBlockingCopyrightViolations(violations);
  const censorshipViolations = getRejectedCensorshipResults(violations);
  const hasCopyrightViolations = copyrightViolations.length > 0;
  const hasCensorshipViolations = censorshipViolations.length > 0;
  const hasAnyViolations = hasCopyrightViolations || hasCensorshipViolations;

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={() => onDragEnd()}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      className={cx(
        "group relative overflow-hidden rounded-xl border-2 shadow-sm transition",
        hasAnyViolations ? "bg-red-500/5 border-red-500" : "bg-creator-sidebar border-transparent hover:border-[#007A8A]",
        dragging && "scale-95 border-[#B83268] opacity-60"
      )}
    >
      <div className="relative aspect-[3/4]">
        {page.image ? (
          <img src={page.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-creator-bg border border-creator-border text-creator-muted text-xs font-black text-creator-muted">
            No preview
          </div>
        )}
        <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-[#151A23] text-xs font-black text-white z-20">
          {page.displayOrder}
        </span>
        <span className="absolute right-2 top-2 rounded-lg bg-creator-sidebar/90 p-1.5 text-creator-text shadow z-20">
          <GripVertical className="h-4 w-4" />
        </span>
        
        {hasAnyViolations && (
          <div className="absolute top-2 right-10 bg-red-500 text-white p-1.5 rounded-lg shadow z-20">
            <ShieldAlert size={16} />
          </div>
        )}
        
        {hasAnyViolations && (
          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-center items-center text-center overflow-y-auto backdrop-blur-sm z-10 cursor-help">
            <AlertTriangle className="text-red-500 mb-2" size={24} />
            <span className="text-red-400 font-bold text-sm mb-2">Nội dung không đạt kiểm duyệt</span>
            {hasCopyrightViolations && (
              <p className="text-xs text-gray-300 mb-1">
                <span className="font-semibold text-white">Bản quyền:</span> {copyrightViolations.length} vi phạm
              </p>
            )}
            {hasCensorshipViolations && (
              <p className="text-xs text-gray-300">
                <span className="font-semibold text-white">Nội dung:</span> {censorshipViolations.map((item) => item.primaryViolationLabel).filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2 p-3 relative z-20">
        <p className={`truncate text-sm font-black ${hasAnyViolations ? 'text-red-400' : 'text-white'}`}>
          {page.title}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            aria-label={`Move ${page.title} up`}
            title="Move up"
            onClick={onMoveUp}
            className="flex h-9 min-w-0 items-center justify-center rounded-lg bg-creator-bg border border-creator-border text-creator-muted text-creator-muted transition hover:bg-[#E3EBF7]"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`Move ${page.title} down`}
            title="Move down"
            onClick={onMoveDown}
            className="flex h-9 min-w-0 items-center justify-center rounded-lg bg-creator-bg border border-creator-border text-creator-muted text-creator-muted transition hover:bg-[#E3EBF7]"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${page.title}`}
            title="Delete"
            onClick={onDelete}
            className="flex h-9 min-w-0 items-center justify-center rounded-lg bg-[#FFE8E8] text-red-400 transition hover:bg-[#FFDCDC]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// VIDEO UPLOAD VIEW
// ============================================================================
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
  onGoToPublishing,
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
  onSaveEpisode: (episode: EpisodeRow & { thumbnailFile?: File }) => void;
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
  onGoToPublishing: () => void;
  onBack: () => void;
}) {
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(selectedEpisode.thumbnail || null);
  const [thumbnailFile, setThumbnailFile] = useState<File | undefined>(undefined);

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const objectUrl = URL.createObjectURL(file);
      setThumbnailPreview(objectUrl);
    }
  };

  const [violationMediaId, setViolationMediaId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ episodeNumber: selectedEpisode.episodeNumber, title: selectedEpisode.title, description: selectedEpisode.description || "", unlockType: selectedEpisode.unlockType || "FREE", priceVnd: selectedEpisode.priceVnd || 0 });
  const canSchedule = videos.length > 0 && videos.every(isMediaReadyForPublish);
  return (
    <div className="max-w-6xl mx-auto p-6 text-creator-text space-y-8">
      {/* Header matching mockup */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-creator-muted hover:text-white transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Season
        </button>
        <h2 className="text-4xl font-bold text-white mb-3">Đang kiểm duyệt nội dung cuối cùng</h2>
        <p className="text-creator-muted max-w-2xl text-sm leading-relaxed">
          Upload your high-fidelity cinematic assets and let TaleX AI ensure policy compliance and original content verification.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left Column: Upload Workspace */}
        <div className="space-y-6">
          <div className="bg-creator-sidebar border border-creator-border rounded-xl p-8 shadow-xl mb-6">
            <h3 className="text-lg font-bold text-white mb-6">Chi tiết Tập</h3>
            <div className="grid gap-6 md:grid-cols-[1fr_240px]">
              <div className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Số thứ tự Tập</label>
                    <input
                      type="number"
                      min={1}
                      value={editForm.episodeNumber}
                      onChange={(e) => setEditForm({ ...editForm, episodeNumber: Number(e.target.value) })}
                      className="h-10 w-full rounded-md border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Tiêu đề Tập *</label>
                    <input
                      type="text"
                      required
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="h-10 w-full rounded-md border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Mô tả</label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full resize-none rounded-md border border-creator-border bg-creator-bg p-3 text-sm text-white outline-none focus:border-creator-gold"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2 mt-4 pt-4 border-t border-creator-border">
                  <div>
                    <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Kiểu mở khóa</label>
                    <select
                      value={editForm.unlockType}
                      onChange={(e) => setEditForm({ ...editForm, unlockType: e.target.value as EpisodeUnlockType })}
                      className="h-10 w-full rounded-md border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold"
                    >
                      <option value="FREE">Miễn phí</option>
                      <option value="PAID">Trả phí</option>
                    </select>
                  </div>

                  {editForm.unlockType === "PAID" && (
                    <div>
                      <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Giá (VNĐ) *</label>
                      <input
                        type="number"
                        min={1}
                        value={editForm.priceVnd}
                        onChange={(e) => setEditForm({ ...editForm, priceVnd: Number(e.target.value) })}
                        className="h-10 w-full rounded-md border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Thumbnail upload */}
              <div className="flex flex-col">
                <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Ảnh Thumbnail Tập *</label>
                <div 
                  onClick={() => thumbnailInputRef.current?.click()}
                  className={`relative w-full aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden group ${
                    thumbnailPreview ? "border-creator-gold" : "border-creator-border hover:border-creator-gold/50"
                  }`}
                >
                  {thumbnailPreview ? (
                    <>
                      <img src={thumbnailPreview} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <UploadCloud size={20} className="text-white mb-1" />
                        <span className="text-xs font-medium text-white">Đổi Thumbnail</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-creator-border rounded-full flex items-center justify-center mb-2">
                        <ImageIcon size={18} className="text-creator-muted" />
                      </div>
                      <span className="text-xs text-creator-muted px-4 text-center">Tải Thumbnail</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={thumbnailInputRef} 
                    onChange={handleThumbnailUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-creator-sidebar border border-creator-border rounded-xl p-8 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Khu vực làm việc</h3>
              <span className="text-xs font-bold px-3 py-1.5 bg-creator-bg border border-creator-border rounded text-creator-muted uppercase tracking-wider">
                MP4, MOV, CBR accepted
              </span>
            </div>

            <div className="mb-6">
              <ResumableVideoUploader
                key={selectedEpisode.id}
                episodeId={selectedEpisode.id}
                creatorId={selectedSeries?.creatorId}
                actorId={accountId}
                disabledReason={
                  videos.length > 0
                    ? "Delete the current video before uploading a replacement."
                    : undefined
                }
                onCompleted={onUploadCompleted}
              />
            </div>

            {/* List of uploaded files */}
            {isLoadingMedia ? (
              <div className="p-6 rounded-xl bg-creator-bg border border-creator-border flex flex-col items-center justify-center text-creator-muted">
                <div className="w-6 h-6 border-2 border-creator-gold border-t-transparent rounded-full animate-spin mb-3"></div>
                <span className="text-sm font-bold">Đang tải tài nguyên...</span>
              </div>
            ) : videos.length > 0 && (
              <div className="space-y-4">
                {videos.map((video) => (
                  <div key={video.mediaId} className="rounded-xl border border-creator-border bg-creator-bg overflow-hidden group">
                    <div className="p-4 border-b border-creator-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clapperboard className="h-5 w-5 text-creator-gold" />
                        <div>
                          <p className="text-sm font-bold text-white max-w-[200px] truncate" title={(video as any).fileName || video.fileUrl?.split("/").pop() || video.fileUrl}>
                            {(video as any).fileName || video.fileUrl?.split("/").pop() || "Video File"}
                          </p>
                          <p className="text-xs font-medium text-creator-muted uppercase tracking-wider">
                            {video.mimeType} • {formatBytes(video.fileSize)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cx(
                          "px-2.5 py-1 text-[10px] font-bold rounded uppercase tracking-wider border",
                          getApprovalChipClass(video.approvalStatus ?? "PENDING_REVIEW")
                        )}>
                          {formatApprovalStatusLabel(video.approvalStatus ?? "PENDING_REVIEW")}
                        </span>
                        <button
                          onClick={() => onDeleteVideo(video)}
                          className="w-8 h-8 flex items-center justify-center rounded bg-creator-sidebar text-creator-muted hover:text-red-400 hover:bg-red-400/10 transition-colors border border-creator-border hover:border-red-400/30"
                          title="Delete Video"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-black/20">
                      {isPlayableVideoStatus(video.status) ? (
                        <div className="rounded-lg overflow-hidden border border-creator-border">
                          <SignedHlsPlayer episodeId={video.episodeId} compact creatorMode />
                        </div>
                      ) : (
                        <VideoProcessingState video={video} onViewViolation={setViolationMediaId} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alert Box matching mockup */}
          <div className="bg-creator-sidebar border border-creator-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-5 h-5 rounded-full bg-creator-gold flex items-center justify-center shrink-0 mt-0.5">
                <Info className="h-3 w-3 text-black" />
              </div>
              <p className="text-sm font-medium text-creator-muted max-w-sm">
                Scans typically take 2-5 minutes.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onSaveEpisode({ ...selectedEpisode, ...editForm })}
                disabled={isSavingEpisode}
                className="px-6 py-2.5 bg-creator-bg border border-creator-border text-white text-sm font-bold rounded hover:bg-white/10 shrink-0 disabled:opacity-50"
              >
                {isSavingEpisode ? "Saving..." : "Save Details"}
              </button>
              {canSchedule && (
                <button
                  onClick={onGoToPublishing}
                  className="px-6 py-2.5 bg-creator-gold text-black text-sm font-bold rounded hover:bg-creator-gold-hover shrink-0"
                >
                  Continue to Publishing
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Policy Scan & Copyright Protection */}
        <AIPolicyAndCopyright
          mediaId={videos[0]?.mediaId}
          mediaStatus={videos[0]?.status}
          approvalStatus={videos[0]?.approvalStatus}
        />
      </div>
    </div>
  );
}

function VideoProcessingState({ video, onViewViolation }: { video: MediaResponse; onViewViolation?: (mediaId: string) => void }) {
  const failed = video.status === "FAILED";
  const pending = video.status === "PENDING";
  const inactive = video.status === "INACTIVE";

  const bgClass = failed || inactive
    ? "border-red-500/50 bg-red-500/10 text-red-400"
    : pending
      ? "border-amber-300/30 bg-amber-50 text-amber-800"
      : "border-[#D9E2F0] bg-creator-sidebar text-creator-muted";

  return (
    <div className={cx("flex aspect-video w-full flex-col items-center justify-center rounded-xl border px-4 text-center", bgClass)}>
      {failed || inactive ? (
        <CircleAlert className="mb-3 h-8 w-8" />
      ) : pending ? (
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-amber-600" />
      ) : (
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-creator-gold" />
      )}
      <p className="text-sm font-black text-white">
        {inactive ? "Nội dung vi phạm chính sách" : pending ? "Đang kiểm duyệt nội dung" : failed ? "Video processing failed" : "Video is still processing"}
      </p>
      <p className="mt-2 max-w-md text-xs font-bold leading-relaxed">
        {inactive ? "Nội dung đã bị ẩn do vi phạm bản quyền hoặc kiểm duyệt." : pending ? "Đang kiểm tra bản quyền và nội dung..." : failed ? (video.errorMessage || "Không thể xử lý video.") : "Vui lòng chờ trong giây lát."}
      </p>
      <span className={cx("mt-3 rounded-full px-3 py-1 text-[11px] font-black", inactive ? "bg-red-100 text-red-700" : pending ? "bg-amber-100 text-amber-700" : "bg-[#E8F8FF] text-[#075985]")}>
        {formatMediaStatusLabel(video.status)}
      </span>
      {inactive && onViewViolation && (
        <button onClick={() => onViewViolation(video.mediaId)} className="mt-2 text-xs font-semibold text-red-600 underline hover:text-red-800">
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
        "rounded-[20px] border border-[#E5EAF3] bg-creator-sidebar p-6 shadow-[0_20px_60px_rgba(30,42,68,0.06)]",
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
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FCE8F0] text-[#B83268]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h2 className="text-lg font-black text-white">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm font-semibold leading-relaxed text-creator-muted">
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
      <span className="mb-2 block text-xs font-black text-creator-muted">
        {label} {required && <span className="text-[#B83268]">*</span>}
      </span>
      {children}
    </label>
  );
}
const campaignPlans = [
  {
    name: "Gói Khởi Động",
    price: "50.000 VNĐ",
    description: "Thử sức đẩy tương tác cho series mới ra mắt.",
    benefits: ["5.000 Lượt xem", "100 Lượt thích", "Ưu tiên hiển thị 24 giờ"],
    icon: Zap,
    iconClass: "text-zinc-400",
  },
  {
    name: "Gói Xu Hướng",
    price: "150.000 VNĐ",
    description: "Tăng tốc để tác phẩm lọt vào dòng đề xuất nổi bật.",
    popular: true,
    benefits: [
      "20.000 Lượt xem",
      "1.000 Lượt thích",
      "Đề xuất trang chủ",
      "Tối ưu tệp khán giả bằng AI",
    ],
    icon: Rocket,
    iconClass: "text-yellow-400 group-hover:animate-bounce",
  },
  {
    name: "Gói Toàn Cầu",
    price: "500.000 VNĐ",
    description: "Phủ sóng mạnh cho chiến dịch ra mắt hoặc mùa mới.",
    benefits: [
      "100.000 Lượt xem",
      "5.000 Lượt thích",
      "Thông báo Push toàn hệ thống",
      "Báo cáo hiệu suất nâng cao",
    ],
    icon: Crown,
    iconClass: "text-zinc-400 group-hover:animate-pulse",
  },
];

const campaignBenefits: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
    {
      title: "Khán giả thực",
      description: "Tăng tiếp cận tới người dùng đang hoạt động trong hệ sinh thái TaleX.",
      icon: Eye,
    },
    {
      title: "AI Target chuẩn xác",
      description: "Phân phối nội dung theo thể loại, hành vi đọc/xem và lịch sử tương tác.",
      icon: Zap,
    },
    {
      title: "Thống kê thời gian thực",
      description: "Theo dõi lượt xem, lượt thích và hiệu quả từng gói ngay trong dashboard.",
      icon: BarChart3,
    },
  ];

function CampaignPurchaseView() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#121212] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.4)] md:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
              Creator Growth
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-zinc-50 md:text-5xl">
              TaleX Boost
            </h2>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-zinc-400">
              Đẩy tác phẩm của bạn tới đúng nhóm độc giả và khán giả tiềm năng,
              tăng tốc lượt xem, lượt thích và cơ hội xuất hiện trên các khu vực đề xuất.
            </p>
          </div>

          <div className="relative flex flex-col justify-between gap-5 rounded-2xl border border-yellow-400/20 bg-[#1A1A1A] p-5 shadow-inner sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div
                className="h-16 w-12 shrink-0 rounded-lg border border-white/10 bg-cover bg-center object-cover shadow-[0_12px_30px_rgba(0,0,0,0.35)] sm:h-20 sm:w-14"
                style={{
                  backgroundImage:
                    "linear-gradient(160deg, rgba(250,204,21,0.18), rgba(8,47,73,0.7)), url('https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=400&q=80')",
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="mb-1 truncate text-xs font-semibold text-zinc-400">
                  Bạn đang chọn đẩy tương tác cho:
                </p>
                <h3 className="truncate text-base font-black text-zinc-50 sm:text-lg">
                  The Lost Horizon
                </h3>
                <p className="mt-0.5 truncate text-xs font-bold text-yellow-400 sm:text-sm">
                  Season 1 . Fantasy Adventure
                </p>
              </div>
            </div>
            <button
              type="button"
              className="mt-2 flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-300 transition-colors hover:bg-white/10 hover:text-yellow-400 sm:mt-0 sm:w-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Đổi nội dung
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {campaignPlans.map((plan) => {
          const Icon = plan.icon;
          const content = (
            <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-[#121212] p-6">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-400/[0.03] to-transparent" />
              {plan.popular && (
                <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-yellow-400 px-4 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-black shadow-[0_0_24px_rgba(250,204,21,0.25)]">
                  Phổ biến nhất
                </div>
              )}

              <div className="relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                  <Icon className={cx("h-6 w-6 transition-transform", plan.iconClass)} />
                </div>
                <h3 className={cx("text-xl font-black text-zinc-50", plan.popular ? "mt-8" : "mt-5")}>
                  {plan.name}
                </h3>
                <p className="mt-3 min-h-12 text-sm font-semibold leading-6 text-zinc-400">
                  {plan.description}
                </p>
                <div className="mt-6 flex items-end gap-2">
                  <span className="text-3xl font-black tracking-tight text-zinc-50">
                    {plan.price}
                  </span>
                </div>
              </div>

              <ul className="relative z-10 mt-7 flex-1 space-y-4">
                {plan.benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-3 text-sm font-bold leading-6 text-zinc-300"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
                    {benefit}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={cx(
                  "relative z-10 mt-8 h-12 rounded-xl text-sm font-black transition",
                  plan.popular
                    ? "bg-yellow-400 text-black shadow-[0_4px_20px_rgba(250,204,21,0.18)] hover:bg-yellow-300 hover:shadow-[0_0_20px_rgba(250,204,21,0.4)]"
                    : "border border-yellow-400/30 bg-yellow-400/5 text-yellow-400 hover:bg-yellow-400 hover:text-black",
                )}
              >
                Mua Gói Này
              </button>
            </div>
          );

          if (plan.popular) {
            return (
              <div
                key={plan.name}
                className="group relative overflow-hidden rounded-2xl p-[2px] shadow-[0_0_30px_rgba(250,204,21,0.15)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(250,204,21,0.15)] md:scale-105"
              >
                <div className="absolute inset-[-100%] bg-[conic-gradient(from_90deg_at_50%_50%,#121212_0%,#FACC15_50%,#121212_100%)] opacity-50 transition-opacity duration-500 animate-[spin_8s_linear_infinite] group-hover:opacity-100" />
                {content}
              </div>
            );
          }

          return (
            <div
              key={plan.name}
              className="group relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-500 hover:-translate-y-2 hover:border-yellow-400/40 hover:shadow-[0_0_40px_rgba(250,204,21,0.15)]"
            >
              {content}
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {campaignBenefits.map((benefit) => {
          const Icon = benefit.icon;

          return (
            <div
              key={benefit.title}
              className="group rounded-2xl border border-white/10 bg-[#121212] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-yellow-400/40"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
                <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
              </div>
              <h3 className="mt-4 text-lg font-black text-zinc-50">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-zinc-400">
                {benefit.description}
              </p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
