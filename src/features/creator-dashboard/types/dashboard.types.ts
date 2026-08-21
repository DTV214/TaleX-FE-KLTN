import { type ContentApprovalStatus as ApiContentApprovalStatus, type MediaStatus, type MediaResponse, type EpisodeUnlockType } from '@/features/creator-dashboard/api/creator-content-api';



export type DashboardView =
  | "dashboard"
  | "series"
  | "seasons"
  | "episodes"
  | "create"
  | "comic"
  | "video"
  | "combos"
  | "monetization"
  | "payment-profiles"
  | "violations"
  | "campaign"
  | "campaigns"
  | "publish"
  | "analytics"
  | "revenue"
  | "settlements";


export type DashboardRouteState = {
  view: DashboardView;
  seriesId: string;
  seasonId: string;
  episodeId: string;
};


export type ContentType = "COMIC" | "VIDEO";

export type ApiLifecycleStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "HIDDEN"
  | "DELETED"
  | "SCHEDULED"
  | "FORCE_HIDDEN";

export type SeriesStatus = ApiLifecycleStatus | "ACTION_REQUIRED";

export type SeasonStatus = ApiLifecycleStatus;

export type EpisodeStatus = ApiLifecycleStatus | "REVIEW";

export type ContentApprovalStatus = ApiContentApprovalStatus;

export type Visibility = "PUBLIC" | "PRIVATE";


export type EditModalState =
  | { kind: "series"; value: SeriesRow }
  | { kind: "season"; value: SeasonRow }
  | { kind: "episode"; value: EpisodeRow }
  | null;


export type EditSubmitState =
  | {
    kind: "series";
    value: SeriesRow;
    coverFile?: File;
    bannerFile?: File;
  }
  | { kind: "season"; value: SeasonRow }
  | { kind: "episode"; value: EpisodeRow };


export type CreateSeriesInput = {
  title: string;
  description: string;
  contentType: ContentType;
  visibility: Visibility;
  ageRating: string;
  contentWarnings: string[];
  language: string;
  categoryIds: string[];
  tagIds: string[];
  coverFile?: File;
  bannerFile?: File;
};


export type DeleteModalState =
  | { kind: "series"; value: SeriesRow }
  | { kind: "season"; value: SeasonRow }
  | { kind: "episode"; value: EpisodeRow }
  | { kind: "media"; value: ComicPage | MediaResponse }
  | null;


export type ScheduleModalState = { kind: "episode"; value: EpisodeRow } | null;


export type ActiveScheduleModal = Exclude<ScheduleModalState, null>;


export type SeriesRow = {
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
  contentWarnings: string[];
  language: string;
  categoryIds: string[];
  tagIds: string[];
  views: string;
  revenue?: string;
  episodes: number;
};


export type SeasonRow = {
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


export type EpisodeRow = {
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


export type EpisodeUnlockSettingsUpdate = {
  id: string;
  unlockType: EpisodeUnlockType;
  priceVnd: number;
};


export type ComicPage = {
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
  errorMessage?: string;
  contentId?: string;
  hasWatermark?: boolean;
  file?: File;
};
