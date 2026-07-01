
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
} from "@/features/creator-dashboard/api/creator-content-api";
import { uploadImageToS3 } from "@/features/creator-dashboard/api/s3-upload-api";
import { toast } from "sonner";
import { ResumableVideoUploader } from "@/features/creator-dashboard/components/resumable-video-uploader";
import { ViolationDetailDialog } from "@/features/creator-dashboard/components/violation-detail-dialog";
import { usePipelineSSE } from "@/features/creator-dashboard/hooks/use-pipeline-sse";
import { SignedHlsPlayer } from "@/features/playback/components/signed-hls-player";
import { ComboManagementView } from "@/features/creator-dashboard/components/combo-management";

type DashboardView =
  | "series"
  | "seasons"
  | "episodes"
  | "create"
  | "comic"
  | "video"
  | "combos";

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
  series: {
    title: "Series Management",
    description:
      "All creator series are listed here. Open one series to manage seasons, then episodes.",
    action: "Create New Series",
  },
  seasons: {
    title: "Season Management",
    description:
      "A series can have one or many seasons. Open a season to manage its episodes.",
    action: "Create Season",
  },
  episodes: {
    title: "Episode Management",
    description:
      "Episodes are the season entries for both comic and video content.",
    action: "Create Episode",
  },
  create: {
    title: "Create New Series",
    description: "Set up a comic or video series using the Series model.",
  },
  comic: {
    title: "Upload Comic Chapter",
    description: "Create a comic episode and arrange pages by display order.",
  },
  video: {
    title: "Upload Video Episode",
    description: "Create a video episode and attach one active video media URL.",
  },
  combos: {
    title: "Combo Management",
    description: "Group multiple episodes into a single combo with a custom price.",
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
      return "border-[#25B67A] bg-[#E9FBF2] text-[#067647]";
    case "REJECTED":
      return "border-[#FFD8D4] bg-[#FFF7F6] text-[#B42318]";
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
        title: `Season ${nextSeasonNumber}`,
        description: "Draft season created from creator dashboard.",
      });
    },
    onSuccess: (season) => {
      setUploadMessage("Season created.");
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
      setUploadMessage("Season updated.");
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
      setUploadMessage("Season deleted.");
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
      setUploadMessage("Season hidden.");
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "seasons", selectedSeries?.id] });
    },
    onError: (error) => {
      setUploadMessage(error instanceof Error ? error.message : "Cannot hide season.");
    },
  });

  const unhideSeasonMutation = useMutation({
    mutationFn: (season: SeasonRow) => unhideSeason(season.id),
    onSuccess: () => {
      setUploadMessage("Season visible.");
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

  return (
    <main className="min-h-screen bg-[#F4F6FB] text-[#181E29]">
      <div className="mx-auto flex w-full max-w-[1440px] gap-6 px-6 py-6 lg:px-10">
        <aside className="hidden w-[260px] shrink-0 lg:block">
          <div className="sticky top-6 rounded-[24px] border border-white bg-white/80 p-5 shadow-[0_24px_60px_rgba(30,42,68,0.08)]">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#007A8A] text-white shadow-lg shadow-cyan-900/20">
                <Library className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black tracking-wide">TaleX</p>
                <p className="text-xs font-semibold text-slate-500">
                  Creator Studio
                </p>
              </div>
            </div>

            <nav className="space-y-2">
              <DashboardNavButton
                active={
                  activeView === "series" ||
                  activeView === "seasons" ||
                  activeView === "episodes" ||
                  activeView === "comic" ||
                  activeView === "video"
                }
                icon={Library}
                label="Series Management"
                onClick={openSeriesManagement}
              />
              <DashboardNavButton
                active={activeView === "create"}
                icon={Plus}
                label="Create Series"
                onClick={openCreateSeries}
              />
              <DashboardNavButton
                active={activeView === "combos"}
                icon={Tag}
                label="Combo Management"
                onClick={() => {
                  clearUploadDrafts();
                  setDashboardRouteState({
                    view: "combos",
                    seriesId: "",
                    seasonId: "",
                    episodeId: "",
                  });
                }}
              />
            </nav>

            <div className="mt-8 rounded-2xl border border-[#D9E2F0] bg-[#F7FAFF] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Workspace
              </p>
              <div className="mt-3 space-y-2 text-sm font-bold text-slate-700">
                <ModelStep label="Series" />
                <ModelStep label="Seasons" />
                <ModelStep label="Episodes" />
                <ModelStep label="Media" />
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2 lg:hidden">
                <MobileTab
                  active={
                    activeView === "series" ||
                    activeView === "seasons" ||
                    activeView === "episodes" ||
                    activeView === "comic" ||
                    activeView === "video"
                  }
                  label="Series Management"
                  onClick={openSeriesManagement}
                />
                <MobileTab
                  active={activeView === "create"}
                  label="Create"
                  onClick={openCreateSeries}
                />
              </div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#B83268]">
                Creator dashboard
              </p>
              <h1 className="text-3xl font-black tracking-tight text-[#151A23] md:text-5xl">
                {viewMeta[activeView].title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-[#5D5160] md:text-base">
                {viewMeta[activeView].description}
              </p>
            </div>

            {activeView === "series" && (
              <button
                type="button"
                onClick={openCreateSeries}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#007A8A] px-6 text-sm font-black text-white shadow-lg shadow-cyan-900/20 transition hover:bg-[#006B79]"
              >
                <Plus className="h-5 w-5" />
                {viewMeta.series.action}
              </button>
            )}
          </header>

          {uploadMessage && activeView !== "comic" && activeView !== "video" && (
            <div className="mb-6 rounded-2xl border border-[#D9E2F0] bg-white px-4 py-3 text-sm font-bold text-[#5D5160]">
              {uploadMessage}
            </div>
          )}

          {activeView === "series" && (
            <SeriesManagementView
              rows={displaySeriesRows}
              isLoading={seriesQuery.isLoading}
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
        </section>
      </div>
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
    </main>
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
    "h-11 w-full rounded-xl border border-[#E8BBCB] bg-[#F8FAFF] px-3 text-sm font-semibold outline-none focus:border-[#B83268] focus:bg-white";
  const textareaClass =
    "min-h-24 w-full resize-none rounded-xl border border-[#E8BBCB] bg-[#F8FAFF] p-3 text-sm font-semibold outline-none focus:border-[#B83268] focus:bg-white";

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

  return (
    <ModalShell title={title} subtitle="Edit the fields and save your changes." onClose={onClose}>
      {modal.kind === "series" && (
        <form onSubmit={handleSeriesSubmit} className="space-y-5">
          {uploadMessage && (
            <div className="rounded-xl border border-[#F5C2C7] bg-[#FFF3F4] px-4 py-3 text-sm font-bold text-[#B42318]">
              {uploadMessage}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Content Type" required>
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
              title="Replace Cover"
              helper="Optional new image"
              file={coverFile}
              onFileChange={setCoverFile}
            />
            <ArtworkUploadField
              title="Replace Banner"
              helper="Optional new image"
              file={bannerFile}
              onFileChange={setBannerFile}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Lifecycle">
              <input
                value={formatStatusLabel(modal.value.status)}
                readOnly
                className={controlClass}
              />
            </Field>
            <Field label="Visibility">
              <select
                name="visibility"
                defaultValue={modal.value.visibility}
                className={controlClass}
              >
                <option value="PUBLIC">PUBLIC</option>
                <option value="PRIVATE">PRIVATE</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Age Rating">
              <input
                name="ageRating"
                defaultValue={modal.value.ageRating}
                className={controlClass}
              />
            </Field>
            <Field label="Language">
              <input
                name="language"
                defaultValue={modal.value.language}
                className={controlClass}
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Category IDs">
              <input
                name="categoryIds"
                defaultValue={modal.value.categoryIds.join(", ")}
                placeholder="id1, id2"
                className={controlClass}
              />
            </Field>
            <Field label="Tag IDs">
              <input
                name="tagIds"
                defaultValue={modal.value.tagIds.join(", ")}
                placeholder="id1, id2"
                className={controlClass}
              />
            </Field>
          </div>

          <ModalActions isSaving={isSaving} onClose={onClose} />
        </form>
      )}

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
                <option value="COMIC">COMIC</option>
                <option value="VIDEO">VIDEO</option>
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
      subtitle="Only episodes with approved ready media can be scheduled."
      onClose={onClose}
      compact
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-[#D9E2F0] bg-[#F8FAFF] p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            {modal.kind}
          </p>
          <p className="mt-1 text-lg font-black text-[#151A23]">{title}</p>
          <p className="mt-2 text-xs font-bold text-[#5D5160]">
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
            className="h-12 w-full rounded-xl border border-[#E8BBCB] bg-[#F8FAFF] px-4 text-sm font-semibold outline-none focus:border-[#B83268] focus:bg-white"
          />
        </Field>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#E8BBCB] bg-white px-5 py-3 text-sm font-black text-[#5D5160]"
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
        <div className="rounded-2xl border border-[#FFD8D4] bg-[#FFF7F6] p-4">
          <p className="text-sm font-bold text-[#5D5160]">
            You are deleting:
          </p>
          <p className="mt-1 text-lg font-black text-[#B42318]">
            {entityLabel}
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#E8BBCB] bg-white px-5 py-3 text-sm font-black text-[#5D5160]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-full bg-[#B42318] px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
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
          "max-h-[90vh] w-full overflow-y-auto rounded-[24px] border border-[#E5EAF3] bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.25)]",
          compact ? "max-w-lg" : "max-w-3xl",
        )}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-[#151A23]">{title}</h2>
            <p className="mt-1 text-sm font-semibold text-[#5D5160]">
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF3FB] text-[#5D5160] transition hover:bg-[#E1E8F2]"
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
        className="rounded-full border border-[#E8BBCB] bg-white px-5 py-3 text-sm font-black text-[#5D5160]"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isSaving}
        className="rounded-full bg-[#B83268] px-5 py-3 text-sm font-black text-white shadow-lg shadow-pink-900/20 disabled:cursor-not-allowed disabled:opacity-60"
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
          : "text-slate-500 hover:bg-white hover:text-slate-900",
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
        active ? "bg-[#151A23] text-white" : "bg-white text-slate-600",
      )}
    >
      {label}
    </button>
  );
}

function ModelStep({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
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
      <div className="rounded-[24px] border border-white bg-white p-4 shadow-[0_20px_60px_rgba(30,42,68,0.07)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative w-full lg:max-w-xl">
            <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7F6F7A]" />
            <input
              type="search"
              placeholder="Search series title..."
              className="h-14 w-full rounded-full border border-[#E8BBCB] bg-[#F8FAFF] pl-14 pr-5 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#B83268] focus:bg-white"
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

            <button className="flex h-12 items-center justify-between gap-3 rounded-xl border border-[#E8BBCB] bg-white px-5 text-sm font-bold text-slate-700">
              All Statuses
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
        <ApiStateNote isLoading={isLoading} />
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#E1E7F0] bg-white shadow-[0_20px_60px_rgba(30,42,68,0.07)]">
        <div className="grid grid-cols-[1.8fr_0.8fr_1fr_1fr_1.15fr] bg-[#EEF3FB] px-8 py-5 text-xs font-black uppercase tracking-[0.12em] text-[#5D5160] max-lg:hidden">
          <span>Series Details</span>
          <span>Type</span>
          <span>Status</span>
          <span>Performance</span>
          <span className="text-right">Actions</span>
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

        <div className="flex items-center justify-between bg-[#EEF3FB] px-8 py-5 text-sm font-bold text-[#5D5160]">
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
        active ? "bg-white text-slate-900 shadow-sm" : "text-[#5D5160]",
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
    <div className="mt-4 rounded-2xl bg-[#F8FAFF] px-4 py-3 text-xs font-bold text-slate-500">
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
        <p className="text-lg font-black text-[#151A23]">{title}</p>
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
          "flex items-center justify-center bg-[#EEF3FB] text-slate-400",
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
          <p className="truncate text-lg font-black text-[#151A23]">
            {series.title}
          </p>
          <p className="text-sm font-bold text-[#5D5160]">
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
            isDraft && "border border-[#E8BBCB] bg-white text-[#9B536D]",
            !isPublished &&
              !isDraft &&
              "bg-[#FFD8D4] text-[#B42318]",
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

      <div className="text-sm font-bold text-[#5D5160]">
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
          className="rounded-full p-2 text-[#5D5160] transition hover:bg-[#F3E8EE] hover:text-[#B83268]"
          title="Update series"
        >
          <Edit3 className="h-5 w-5" />
        </button>
        {isPublished && (
          <button
            type="button"
            onClick={() => onHideSeries(series)}
            className="rounded-full p-2 text-[#5D5160] transition hover:bg-[#FFF3CD] hover:text-[#856404]"
            title="Hide series"
          >
            <Eye className="h-5 w-5" />
          </button>
        )}
        {isHidden && (
          <button
            type="button"
            onClick={() => onUnhideSeries(series)}
            className="rounded-full p-2 text-[#5D5160] transition hover:bg-[#E8F8FF] hover:text-[#007A8A]"
            title="Unhide series"
          >
            <Zap className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDeleteSeries(series)}
          className="rounded-full p-2 text-[#5D5160] transition hover:bg-[#FFE8E8] hover:text-[#B42318]"
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
              : "bg-[#EEF3FB] text-[#151A23] hover:bg-[#E1E8F2]",
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
        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#007A8A] shadow-sm"
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
              <h2 className="text-2xl font-black text-[#151A23]">
                {selectedSeries.title}
              </h2>
              <p className="text-sm font-bold text-[#5D5160]">
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
            {isCreatingSeason ? "Creating..." : "Create Season"}
          </button>
        </div>
        <ApiStateNote isLoading={isLoading} />
      </Panel>

      <div className="grid gap-4">
        {!isLoading && seasons.length === 0 && (
          <div className="rounded-2xl bg-white px-5 py-8 text-center text-sm font-bold text-slate-500 shadow-sm">
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
        ? "bg-white text-[#9B536D] border-[#E8BBCB]"
        : "bg-[#EEF3FB] text-slate-500 border-[#D9E2F0]";
  const isHidden = season.status === "HIDDEN";
  const isPublished = season.status === "PUBLISHED";

  return (
    <div className="rounded-[22px] border border-[#E5EAF3] bg-white p-5 shadow-[0_16px_44px_rgba(30,42,68,0.05)]">
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
          <h3 className="text-xl font-black text-[#151A23]">{season.title}</h3>
          <p className="mt-1 max-w-2xl text-sm font-semibold text-[#5D5160]">
            {season.description}
          </p>
          <p className="mt-2 text-xs font-bold text-slate-400">{season.id}</p>
        </div>

        <MetricBox label="Episodes" value={String(season.episodes)} />
        <MetricBox
          label="Published"
          value={String(season.publishedEpisodes)}
        />
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onUpdate}
            className="rounded-full p-2 text-[#5D5160] transition hover:bg-[#F3E8EE] hover:text-[#B83268]"
            title="Update season"
          >
            <Edit3 className="h-5 w-5" />
          </button>
          {isPublished && (
            <button
              type="button"
              onClick={onHide}
              className="rounded-full p-2 text-[#5D5160] transition hover:bg-[#FFF3CD] hover:text-[#856404]"
              title="Hide season"
            >
              <Eye className="h-5 w-5" />
            </button>
          )}
          {isHidden && (
            <button
              type="button"
              onClick={onUnhide}
              className="rounded-full p-2 text-[#5D5160] transition hover:bg-[#E8F8FF] hover:text-[#007A8A]"
              title="Unhide season"
            >
              <Zap className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full p-2 text-[#5D5160] transition hover:bg-[#FFE8E8] hover:text-[#B42318]"
            title="Delete season"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onSelect}
            className="rounded-full bg-[#EEF3FB] px-5 py-3 text-sm font-black text-[#151A23] transition hover:bg-[#E1E8F2]"
          >
            Manage Episodes
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
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#007A8A] shadow-sm"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Seasons
      </button>

      <Panel>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#151A23]">
              {selectedSeason.title}
            </h2>
            <p className="text-sm font-bold text-[#5D5160]">
              {selectedSeries.title} . Season {selectedSeason.seasonNumber} .
              Episodes for this season
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateEpisode}
            disabled={isCreatingEpisode}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#B83268] px-5 text-sm font-black text-white shadow-lg shadow-pink-900/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-5 w-5" />
            {isCreatingEpisode ? "Creating..." : "Create Episode"}
          </button>
        </div>
        <ApiStateNote isLoading={isLoading} />
      </Panel>

      <div className="overflow-hidden rounded-[24px] border border-[#E1E7F0] bg-white shadow-[0_20px_60px_rgba(30,42,68,0.07)]">
        <div className="grid grid-cols-[1.4fr_0.7fr_0.8fr_0.8fr_1fr] bg-[#EEF3FB] px-8 py-5 text-xs font-black uppercase tracking-[0.12em] text-[#5D5160] max-lg:hidden">
          <span>Episode Details</span>
          <span>Type</span>
          <span>Status</span>
          <span>Media</span>
          <span className="text-right">Actions</span>
        </div>
        <div className="divide-y divide-[#E6EBF3]">
          {!isLoading && episodes.length === 0 && (
            <div className="px-8 py-10 text-center text-sm font-bold text-slate-500">
              No episodes found for this season.
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
      ? "border-[#24B5FF] bg-[#E8F8FF] text-[#0074A6]"
      : episode.status === "REVIEW"
        ? "border-[#F4B9CC] bg-[#FFF4F8] text-[#B83268]"
        : "border-[#E8BBCB] bg-white text-[#9B536D]";

  return (
    <div className="grid min-h-[104px] grid-cols-1 gap-4 px-5 py-5 lg:grid-cols-[1.4fr_0.7fr_0.8fr_0.8fr_1fr] lg:items-center lg:px-8">
      <div>
        <p className="text-lg font-black text-[#151A23]">
          Ep {episode.episodeNumber}: {episode.title}
        </p>
        <p className="mt-1 text-sm font-semibold text-[#5D5160]">
          {episode.description}
        </p>
        <p className="mt-1 text-xs font-bold text-slate-400">{episode.id}</p>
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
      <div className="text-sm font-bold text-[#5D5160]">
        {isComic
          ? `${episode.totalPage ?? episode.mediaCount} pages`
          : `${episode.mediaCount} video`}
      </div>
      <div className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
        <button
          type="button"
          onClick={onUpdate}
          className="rounded-full p-2 text-[#5D5160] transition hover:bg-[#F3E8EE] hover:text-[#B83268]"
          title="Update episode"
        >
          <Edit3 className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-full p-2 text-[#5D5160] transition hover:bg-[#FFE8E8] hover:text-[#B42318]"
          title="Delete episode"
        >
          <Trash2 className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onOpenUpload}
          className="rounded-full bg-[#EEF3FB] px-5 py-3 text-sm font-black text-[#151A23] transition hover:bg-[#E1E8F2]"
        >
          {isComic ? "Open Comic Upload" : "Open Video Upload"}
        </button>
      </div>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F8FAFF] p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-[#151A23]">{value}</p>
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

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="space-y-6">
        <Panel>
          <PanelHeader
            icon={Info}
            title="Basic Information"
            subtitle="Set up the main series information before adding seasons."
          />
          <div className="grid gap-5">
            <Field label="Series Title" required>
              <input
                name="title"
                required
                defaultValue="The Lost Horizon"
                className="h-12 w-full rounded-xl border border-[#E8BBCB] bg-[#F8FAFF] px-4 text-sm font-semibold outline-none focus:border-[#B83268]"
              />
            </Field>

            <div>
              <p className="mb-2 text-xs font-black text-[#5D5160]">
                Content Type <span className="text-[#B83268]">*</span>
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <TypeOption
                  active={contentType === "COMIC"}
                  icon={BookOpen}
                  title="Comic"
                  description="Episode media uses image pages."
                  onClick={() => onContentTypeChange("COMIC")}
                />
                <TypeOption
                  active={contentType === "VIDEO"}
                  icon={Clapperboard}
                  title="Video"
                  description="Episode media uses one video URL."
                  onClick={() => onContentTypeChange("VIDEO")}
                />
              </div>
            </div>

            <Field label="Description" required>
              <textarea
                name="description"
                rows={4}
                placeholder="Tell readers what your story is about..."
                className="w-full resize-none rounded-xl border border-[#E8BBCB] bg-[#F8FAFF] p-4 text-sm font-semibold outline-none focus:border-[#B83268]"
              />
            </Field>
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            icon={ImageIcon}
            title="Artwork"
            subtitle="Cover and banner URLs are stored on the Series record."
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <ArtworkUploadField
              title="Vertical Cover"
              helper="Recommended 600x800px"
              file={coverFile}
              onFileChange={setCoverFile}
              tall
            />
            <ArtworkUploadField
              title="Landscape Banner"
              helper="Recommended 1920x1080px"
              file={bannerFile}
              onFileChange={setBannerFile}
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            icon={Tag}
            title="Categorization"
            subtitle="Only active categories and tags should be assigned."
          />
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Primary Genre" required>
              <input
                name="categoryIds"
                placeholder="Optional category IDs separated by comma"
                className="h-12 w-full rounded-xl border border-[#E8BBCB] bg-[#F8FAFF] px-4 text-sm font-semibold outline-none"
              />
            </Field>
            <Field label="Language">
              <input
                name="language"
                defaultValue="vi"
                className="h-12 w-full rounded-xl border border-[#E8BBCB] bg-[#F8FAFF] px-4 text-sm font-semibold outline-none"
              />
            </Field>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-black text-[#5D5160]">Tags</p>
            <input
              name="tagIds"
              placeholder="Optional tag IDs separated by comma"
              className="h-12 w-full rounded-xl border border-[#E8BBCB] bg-[#F8FAFF] px-4 text-sm font-semibold outline-none focus:border-[#B83268]"
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            icon={Settings2}
            title="Monetization and Visibility"
            subtitle="Control who can find this series and how episodes are unlocked."
          />
          <div className="space-y-3">
            <input type="hidden" name="visibility" defaultValue="PUBLIC" />
            <input type="hidden" name="ageRating" defaultValue="13+" />
            <ToggleRow
              title="Public Visibility"
              description="Make this series visible in search and library."
              enabled
            />
            <ToggleRow
              title="Point-based Unlock"
              description="Require users to spend points to unlock episodes."
            />
            <ToggleRow
              title="Fast Pass Enabled"
              description="Allow users to read ahead before public release."
              enabled
              highlight
            />
          </div>
        </Panel>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded-full border border-[#E8BBCB] bg-white px-5 py-3 text-sm font-black text-[#5D5160]"
          >
            Save Draft
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-[#B83268] px-5 py-3 text-sm font-black text-white shadow-lg shadow-pink-900/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create Series"}
          </button>
        </div>
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
    "h-12 w-full rounded-xl border border-[#E8BBCB] bg-[#F8FAFF] px-4 text-sm font-semibold outline-none focus:border-[#B83268] focus:bg-white";

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
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#007A8A] shadow-sm"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Episodes
      </button>

      <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <Panel>
          <PanelHeader
            icon={BookOpen}
            title="Chapter Details"
            subtitle="Edit comic episode metadata and save it separately from pages."
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
                Season
              </p>
              <p className="mt-1 text-base font-black text-[#151A23]">
                {selectedSeason
                  ? `Season ${selectedSeason.seasonNumber}: ${selectedSeason.title}`
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
              <Field label="Chapter No.">
                <input
                  type="number"
                  min={1}
                  name="episodeNumber"
                  defaultValue={selectedEpisode.episodeNumber}
                  className={episodeControlClass}
                />
              </Field>
              <Field label="Total Page">
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
              <Field label="Lifecycle">
                <input
                  value={formatStatusLabel(selectedEpisode.status)}
                  readOnly
                  className="h-12 w-full rounded-xl border border-[#E8BBCB] bg-[#F8FAFF] px-4 text-sm font-semibold"
                />
              </Field>
              <Field label="Type">
                <input
                  value="COMIC"
                  readOnly
                  className="h-12 w-full rounded-xl border border-[#E8BBCB] bg-[#F8FAFF] px-4 text-sm font-semibold"
                />
              </Field>
            </div>
            <Field label="Chapter Title" required>
              <input
                name="title"
                required
                defaultValue={selectedEpisode.title}
                placeholder="What happens in this chapter?"
                className={episodeControlClass}
              />
            </Field>
            <Field label="Description">
              <textarea
                name="description"
                rows={4}
                defaultValue={selectedEpisode.description}
                placeholder="Author notes or chapter description..."
                className="w-full resize-none rounded-xl border border-[#E8BBCB] bg-[#F8FAFF] p-4 text-sm font-semibold outline-none focus:border-[#B83268] focus:bg-white"
              />
            </Field>
            <button
              type="submit"
              disabled={isSavingEpisode}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#B83268] text-sm font-black text-white shadow-lg shadow-pink-900/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSavingEpisode ? "Saving..." : "Save Chapter Details"}
            </button>
          </form>
          </Panel>

          <Panel>
          <PanelHeader
            icon={Lock}
            title="Unlock Settings"
            subtitle="Set how this chapter is unlocked. Save this separately from chapter details."
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
              This chapter is available after approval. Media pages are saved as
              image URLs and sorted by displayOrder.
            </p>
            <button
              type="submit"
              disabled={isSavingEpisode}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#B83268] text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSavingEpisode ? "Saving..." : "Save Unlock Settings"}
            </button>
          </form>
          </Panel>

          <Panel>
          <PanelHeader icon={Calendar} title="Publishing" />
          <div className="space-y-4">
            <div
              className={cx(
                "rounded-xl border p-4 text-xs font-bold leading-relaxed",
                getApprovalChipClass(
                  canSchedulePublish ? "APPROVED" : "PENDING_REVIEW",
                ),
              )}
            >
              Media approval: {canSchedulePublish ? "Approved pages available" : "Needs approved pages"}
            </div>
            <div className="rounded-xl bg-[#F8FAFF] p-4 text-xs font-bold leading-relaxed text-[#5D5160]">
              Scheduled publish: {formatDateTime(selectedEpisode.scheduledPublishAt)}
            </div>
            {selectedEpisode.status === "HIDDEN" && (
              <button
                type="button"
                onClick={() => onUnhideEpisode(selectedEpisode)}
                disabled={isHidingEpisode}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#24B5FF] bg-[#E8F8FF] text-sm font-black text-[#007A8A] transition hover:bg-[#D0F2FF] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Zap className="h-4 w-4" />
                {isHidingEpisode ? "Processing..." : "Unhide Episode"}
              </button>
            )}
            {selectedEpisode.status === "SCHEDULED" ? (
              <button
                type="button"
                onClick={() => onCancelSchedule(selectedEpisode)}
                disabled={isCancelingSchedule}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FFE8E8] text-sm font-black text-[#B42318] disabled:cursor-not-allowed disabled:opacity-60 transition hover:bg-[#FFDCDC]"
              >
                <X className="h-4 w-4" />
                {isCancelingSchedule ? "Canceling..." : "Cancel Schedule"}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onSchedulePublish(selectedEpisode)}
                  disabled={!canSchedulePublish || selectedEpisode.status === "PUBLISHED"}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#007A8A] text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-[#D9E2F0] disabled:text-slate-500"
                >
                  <Calendar className="h-4 w-4" />
                  Schedule
                </button>
                <button
                  type="button"
                  onClick={() => onPublishNow(selectedEpisode)}
                  disabled={!canSchedulePublish || selectedEpisode.status === "PUBLISHED" || isPublishingNow}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#B83268] text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-[#D9E2F0] disabled:text-slate-500"
                >
                  <CloudUpload className="h-4 w-4" />
                  {isPublishingNow ? "Publishing..." : "Publish Now"}
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
            title="Comic Pages"
            subtitle="Select pages locally, then save once to upload and persist order."
            compact
          />
            <span className="rounded-full bg-[#EEF3FB] px-4 py-2 text-xs font-black text-slate-600">
              {pages.length} Pages Uploaded
            </span>
          </div>

          <div
            className="mb-6 flex min-h-[230px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8AFC1] bg-[#F1F5FE] p-8 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handlePageDrop}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F8C7DA] text-[#B83268]">
              <CloudUpload className="h-7 w-7" />
            </div>
            <p className="text-lg font-black text-[#151A23]">
              Drag and drop your pages here
            </p>
            <p className="mt-2 max-w-md text-sm font-semibold leading-relaxed text-[#5D5160]">
              Select or drop comic pages. Nothing is uploaded until you save.
            </p>
            <label className="mt-5 inline-flex cursor-pointer rounded-full border border-[#E8BBCB] bg-white px-5 py-2.5 text-xs font-black text-[#5D5160]">
              Browse Files
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
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#5D5160]">
              Page Order
            </p>
            <p className="flex items-center gap-2 text-xs font-bold text-[#5D5160]">
              <GripVertical className="h-4 w-4" />
              Drag to rearrange
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {isLoadingMedia && (
              <div className="col-span-full rounded-2xl bg-[#F8FAFF] px-4 py-5 text-center text-sm font-bold text-slate-500">
                Loading existing pages...
              </div>
            )}

            {!isLoadingMedia && pages.length === 0 && (
              <div className="col-span-full rounded-2xl bg-[#F8FAFF] px-4 py-5 text-center text-sm font-bold text-slate-500">
                This episode has no media pages yet. Choose image files to upload.
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

            <label className="flex aspect-[3/4] min-h-[220px] cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#E8AFC1] bg-[#F1F5FE] text-[#9B536D] transition hover:bg-white">
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
            <div className="rounded-2xl border border-[#D9E2F0] bg-white px-4 py-3 text-sm font-bold text-[#5D5160]">
              {uploadMessage}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            {isUploading && (
              <span className="rounded-full bg-white px-4 py-3 text-sm font-black text-[#007A8A]">
                Saving pages...
              </span>
            )}
            <button
              type="button"
              onClick={onSaveOrder}
              disabled={isSavingOrder}
              className="rounded-full bg-white px-5 py-3 text-sm font-black text-[#5D5160] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingOrder ? "Saving..." : "Save Pages"}
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
        "group relative overflow-hidden rounded-xl border-2 bg-white shadow-sm transition",
        dragging
          ? "scale-95 border-[#B83268] opacity-60"
          : "border-transparent hover:border-[#007A8A]",
      )}
    >
      <div className="relative aspect-[3/4]">
        {page.image ? (
          <img src={page.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#EEF3FB] text-xs font-black text-slate-500">
            No preview
          </div>
        )}
        <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-[#151A23] text-xs font-black text-white">
          {page.displayOrder}
        </span>
        <span className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-slate-700 shadow">
          <GripVertical className="h-4 w-4" />
        </span>
      </div>

      <div className="space-y-2 p-3">
        <p className="truncate text-sm font-black text-[#151A23]">
          {page.title}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            aria-label={`Move ${page.title} up`}
            title="Move up"
            onClick={onMoveUp}
            className="flex h-9 min-w-0 items-center justify-center rounded-lg bg-[#EEF3FB] text-slate-600 transition hover:bg-[#E3EBF7]"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`Move ${page.title} down`}
            title="Move down"
            onClick={onMoveDown}
            className="flex h-9 min-w-0 items-center justify-center rounded-lg bg-[#EEF3FB] text-slate-600 transition hover:bg-[#E3EBF7]"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${page.title}`}
            title="Delete"
            onClick={onDelete}
            className="flex h-9 min-w-0 items-center justify-center rounded-lg bg-[#FFE8E8] text-[#B42318] transition hover:bg-[#FFDCDC]"
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
    "h-12 w-full rounded-xl border border-[#E8BBCB] bg-[#F8FAFF] px-4 text-sm font-semibold outline-none focus:border-[#B83268] focus:bg-white";

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
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#007A8A] shadow-sm"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Episodes
      </button>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
        <Panel>
          <PanelHeader
            icon={Clapperboard}
            title="Episode Details"
            subtitle="Edit episode metadata and save before publishing."
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
                Season
              </p>
              <p className="mt-1 text-base font-black text-[#151A23]">
                {selectedSeason
                  ? `Season ${selectedSeason.seasonNumber}: ${selectedSeason.title}`
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
              <Field label="Episode Number">
                <input
                  type="number"
                  min={1}
                  name="episodeNumber"
                  defaultValue={selectedEpisode.episodeNumber}
                  className="h-12 w-full rounded-xl border border-[#E8BBCB] bg-[#F8FAFF] px-4 text-sm font-semibold outline-none focus:border-[#B83268] focus:bg-white"
                />
              </Field>
              <Field label="Lifecycle">
                <input
                  value={formatStatusLabel(selectedEpisode.status)}
                  readOnly
                  className="h-12 w-full rounded-xl border border-[#E8BBCB] bg-[#F8FAFF] px-4 text-sm font-semibold"
                />
              </Field>
              <Field label="Content Type">
                <input
                  value="VIDEO"
                  readOnly
                  className="h-12 w-full rounded-xl border border-[#E8BBCB] bg-[#F8FAFF] px-4 text-sm font-semibold"
                />
              </Field>
            </div>
            <Field label="Episode Title" required>
              <input
                name="title"
                required
                defaultValue={selectedEpisode.title}
                className="h-12 w-full rounded-xl border border-[#E8BBCB] bg-[#F8FAFF] px-4 text-sm font-semibold outline-none focus:border-[#B83268] focus:bg-white"
              />
            </Field>
            <Field label="Description">
              <textarea
                name="description"
                rows={5}
                defaultValue={selectedEpisode.description}
                className="w-full resize-none rounded-xl border border-[#E8BBCB] bg-[#F8FAFF] p-4 text-sm font-semibold outline-none focus:border-[#B83268] focus:bg-white"
              />
            </Field>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSavingEpisode}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#B83268] px-5 text-sm font-black text-white shadow-lg shadow-pink-900/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isSavingEpisode ? "Saving..." : "Save Episode Details"}
              </button>
            </div>
          </form>
        </Panel>

        <Panel>
          <PanelHeader
            icon={FileVideo}
            title="Media Files"
            subtitle="Attach one video file for this episode."
          />
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-black text-[#5D5160]">
                Current Video
              </p>
              {isLoadingMedia && (
                <div className="rounded-2xl bg-[#F8FAFF] px-4 py-5 text-center text-sm font-bold text-slate-500">
                  Loading video...
                </div>
              )}
              {!isLoadingMedia && videos.length === 0 && (
                <div className="rounded-2xl bg-[#F8FAFF] px-4 py-5 text-center text-sm font-bold text-slate-500">
                  This episode has no video yet.
                </div>
              )}
              {!isLoadingMedia && videos.length > 0 && (
                <div className="space-y-4">
                  {videos.map((video) => (
                    <div
                      key={video.mediaId}
                      className="rounded-2xl border border-[#E5EAF3] bg-[#F8FAFF] p-3"
                    >
                      {isPlayableVideoStatus(video.status) ? (
                        <SignedHlsPlayer episodeId={video.episodeId} compact creatorMode />
                      ) : (
                        <VideoProcessingState video={video} onViewViolation={setViolationMediaId} />
                      )}
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-[#5D5160]">
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
                              className="rounded-full bg-white px-3 py-2 font-black text-[#007A8A]"
                            >
                              Watch Page
                            </a>
                            <button
                              type="button"
                              onClick={() => onDeleteVideo(video)}
                              className="rounded-full bg-white px-3 py-2 font-black text-[#B42318]"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-black text-[#5D5160]">
                Video File
              </p>
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

          </div>
        </Panel>
        </div>

        <aside className="space-y-5">
        <Panel>
          <PanelHeader
            icon={Lock}
            title="Unlock Settings"
            subtitle="Set how this episode is unlocked. Save this separately from episode details."
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
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#B83268] text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSavingEpisode ? "Saving..." : "Save Unlock Settings"}
            </button>
          </form>
        </Panel>

        <Panel>
          <PanelHeader icon={Calendar} title="Publishing" />
          <div className="space-y-4">
            <div
              className={cx(
                "rounded-xl border p-4 text-xs font-bold leading-relaxed",
                getApprovalChipClass(currentVideo?.approvalStatus ?? "PENDING_REVIEW"),
              )}
            >
              Media approval:{" "}
              {formatApprovalStatusLabel(currentVideo?.approvalStatus ?? "PENDING_REVIEW")}
            </div>
            <div className="rounded-xl bg-[#F8FAFF] p-4 text-xs font-bold leading-relaxed text-[#5D5160]">
              Scheduled publish: {formatDateTime(selectedEpisode.scheduledPublishAt)}
            </div>
            <div className="rounded-xl bg-[#E8F8FF] p-4 text-xs font-bold leading-relaxed text-[#075985]">
              All new episodes require moderation approval before going live.
            </div>
            {/* Hide / Unhide episode */}
            {selectedEpisode.status === "PUBLISHED" && (
              <button
                type="button"
                onClick={() => onHideEpisode(selectedEpisode)}
                disabled={isHidingEpisode}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#FFC107] bg-[#FFF8E6] text-sm font-black text-[#856404] transition hover:bg-[#FFF3CD] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Eye className="h-4 w-4" />
                {isHidingEpisode ? "Processing..." : "Hide Episode"}
              </button>
            )}
            {selectedEpisode.status === "HIDDEN" && (
              <button
                type="button"
                onClick={() => onUnhideEpisode(selectedEpisode)}
                disabled={isHidingEpisode}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#24B5FF] bg-[#E8F8FF] text-sm font-black text-[#007A8A] transition hover:bg-[#D0F2FF] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Zap className="h-4 w-4" />
                {isHidingEpisode ? "Processing..." : "Unhide Episode"}
              </button>
            )}

            {selectedEpisode.status === "SCHEDULED" ? (
              <button
                type="button"
                onClick={() => onCancelSchedule(selectedEpisode)}
                disabled={isCancelingSchedule}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FFE8E8] text-sm font-black text-[#B42318] disabled:cursor-not-allowed disabled:opacity-60 transition hover:bg-[#FFDCDC]"
              >
                <X className="h-4 w-4" />
                {isCancelingSchedule ? "Canceling..." : "Cancel Schedule"}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onSchedulePublish(selectedEpisode)}
                  disabled={!canSchedule || selectedEpisode.status === "PUBLISHED"}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#007A8A] text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-[#D9E2F0] disabled:text-slate-500"
                >
                  <Calendar className="h-4 w-4" />
                  Schedule
                </button>
                <button
                  type="button"
                  onClick={() => onPublishNow(selectedEpisode)}
                  disabled={!canSchedule || selectedEpisode.status === "PUBLISHED" || isPublishingNow}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#B83268] text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-[#D9E2F0] disabled:text-slate-500"
                >
                  <CloudUpload className="h-4 w-4" />
                  {isPublishingNow ? "Publishing..." : "Publish Now"}
                </button>
              </div>
            )}
          </div>
        </Panel>

        {uploadMessage && (
          <div className="rounded-xl border border-[#D9E2F0] bg-white px-4 py-3 text-sm font-bold text-[#5D5160]">
            {uploadMessage}
          </div>
        )}

        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#E8BBCB] bg-white text-sm font-black text-[#5D5160]">
          <CheckCircle2 className="h-4 w-4" />
          Save as Draft
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
    ? "border-[#FFD8D4] bg-[#FFF7F6] text-[#B42318]"
    : pending
      ? "border-amber-300/30 bg-amber-50 text-amber-800"
      : "border-[#D9E2F0] bg-white text-[#5D5160]";

  return (
    <div className={cx("flex aspect-video w-full flex-col items-center justify-center rounded-xl border px-4 text-center", bgClass)}>
      {failed || inactive ? (
        <CircleAlert className="mb-3 h-8 w-8" />
      ) : pending ? (
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-amber-600" />
      ) : (
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#007A8A]" />
      )}
      <p className="text-sm font-black text-[#151A23]">
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
        "rounded-[20px] border border-[#E5EAF3] bg-white p-6 shadow-[0_20px_60px_rgba(30,42,68,0.06)]",
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
        <h2 className="text-lg font-black text-[#151A23]">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm font-semibold leading-relaxed text-[#5D5160]">
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
      <Field label="Unlock Type">
        <select
          name="unlockType"
          value={unlockType}
          onChange={(event) =>
            setUnlockType(event.target.value as EpisodeUnlockType)
          }
          className={controlClass}
        >
          <option value="FREE">FREE</option>
          <option value="PAID">PAID</option>
        </select>
      </Field>

      {unlockType === "PAID" && (
        <Field label="Price VND" required>
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
      <span className="mb-2 block text-xs font-black text-[#5D5160]">
        {label} {required && <span className="text-[#B83268]">*</span>}
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
        "rounded-xl border p-4 text-left transition",
        active
          ? "border-[#B83268] bg-[#FFF4F8] shadow-sm"
          : "border-[#E8BBCB] bg-white hover:bg-[#FFF9FB]",
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-5 w-5 text-[#5D5160]" />
        <span className="font-black text-[#151A23]">{title}</span>
      </div>
      <p className="text-xs font-semibold text-[#5D5160]">{description}</p>
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
      <p className="text-xs font-black text-[#5D5160]">{title}</p>
      <p className="mt-1 text-[11px] font-semibold text-slate-400">{helper}</p>
      <label
        className={cx(
          "mt-3 flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#E8AFC1] bg-[#F8FAFF] text-center transition hover:bg-white",
          tall ? "min-h-[320px]" : "min-h-[180px]",
        )}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div>
            <ImageIcon className="mx-auto mb-2 h-6 w-6 text-[#5D5160]" />
            <p className="text-xs font-black text-[#5D5160]">Upload</p>
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
        <p className="mt-2 truncate text-xs font-bold text-[#007A8A]">
          {file.name}
        </p>
      )}
    </div>
  );
}

function ToggleRow({
  title,
  description,
  enabled,
  highlight,
}: {
  title: string;
  description: string;
  enabled?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cx(
        "flex items-center justify-between gap-4 rounded-xl border p-4",
        highlight ? "border-[#F4B9CC] bg-[#FFF8FA]" : "border-[#E5EAF3] bg-[#F8FAFF]",
      )}
    >
      <div>
        <p className="text-sm font-black text-[#151A23]">{title}</p>
        <p className="text-xs font-semibold text-[#5D5160]">{description}</p>
      </div>
      <span
        className={cx(
          "flex h-6 w-11 items-center rounded-full p-1 transition",
          enabled ? "justify-end bg-[#B83268]" : "justify-start bg-[#CFD8E6]",
        )}
      >
        <span className="h-4 w-4 rounded-full bg-white shadow" />
      </span>
    </div>
  );
}

function SettingCard({
  title,
  active,
  icon: Icon,
}: {
  title: string;
  active?: boolean;
  icon?: LucideIcon;
}) {
  return (
    <button
      className={cx(
        "flex min-h-16 flex-col items-center justify-center rounded-xl border text-xs font-black transition",
        active
          ? "border-[#8B3DFF] bg-[#F5EDFF] text-[#5E1AA3]"
          : "border-[#E8BBCB] bg-white text-[#5D5160]",
      )}
    >
      {Icon && <Icon className="mb-1 h-4 w-4 text-[#E85D90]" />}
      {title}
    </button>
  );
}

function RadioCard({
  title,
  badge,
  active,
}: {
  title: string;
  badge: string;
  active?: boolean;
}) {
  return (
    <button
      className={cx(
        "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition",
        active ? "border-[#B83268] bg-[#FFF4F8]" : "border-[#E8BBCB] bg-white",
      )}
    >
      <span
        className={cx(
          "flex h-5 w-5 items-center justify-center rounded-full border",
          active ? "border-[#B83268]" : "border-slate-300",
        )}
      >
        {active && <span className="h-2.5 w-2.5 rounded-full bg-[#B83268]" />}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-black text-[#151A23]">{title}</span>
        <span className="block text-xs font-semibold text-[#5D5160]">
          Unlock policy
        </span>
      </span>
      <span className="rounded-full bg-[#E9D3FF] px-2 py-1 text-[10px] font-black uppercase text-[#5E1AA3]">
        {badge}
      </span>
    </button>
  );
}
