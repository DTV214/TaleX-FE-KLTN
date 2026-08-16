export interface ChannelSeriesCard {
  seriesId: string;
  accountId: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  totalCreatorFollowers: number;
  title: string;
  description: string;
  coverUrl: string;
  bannerUrl: string;
  contentType: "VIDEO" | "COMIC" | string;
  ageRating: string;
  language: string;
  totalViews: number;
  createdAt: string;
  updatedAt: string;
  averageRating: number;
  releasedUpdateTime: string;
}

export interface RecommendationPoolItem {
  score: string;
  seriesCard: ChannelSeriesCard;
}

export interface UserInteractions {
  totalClicks: number;
  totalLikes: number;
  totalBookmarks: number;
  totalShares: number;
  totalComments: number;
  likeToClickRatio: number;
  bookmarkToClickRatio: number;
  shareToClickRatio: number;
  commentToClickRatio: number;
  clicksLast7d: number;
  likesLast7d: number;
  bookmarksLast7d: number;
  sharesLast7d: number;
  commentsLast7d: number;
  likeToClickRatioLast7d: number;
  bookmarkToClickRatioLast7d: number;
  shareToClickRatioLast7d: number;
  commentToClickRatioLast7d: number;
  clicksLast24h: number;
  likesLast24h: number;
  bookmarksLast24h: number;
  sharesLast24h: number;
  commentsLast24h: number;
  likeToClickRatioLast24h: number;
  bookmarkToClickRatioLast24h: number;
  shareToClickRatioLast24h: number;
  commentToClickRatioLast24h: number;
}

export interface UserDeepEngagement {
  totalWatchTime: number;
  watchTimeLast24h: number;
  watchTimeLast7d: number;
}

export interface UserPreferences {
  genresClicksRaw: Record<string, number>;
  genresWatchTimeRaw: Record<string, number>;
  tagsClicksRaw: Record<string, number>;
  tagsWatchTimeRaw: Record<string, number>;
  preferredGenresByClicks: Record<string, number>;
  preferredGenresByWatchTime: Record<string, number>;
  preferredTagsByClicks: Record<string, number>;
  preferredTagsByWatchTime: Record<string, number>;
  preferredGenresByClicksLast7d?: Record<string, number>;
  preferredGenresByWatchTimeLast7d?: Record<string, number>;
  preferredTagsByClicksLast7d?: Record<string, number>;
  preferredTagsByWatchTimeLast7d?: Record<string, number>;
  preferredGenresByClicksLast24h?: Record<string, number>;
  preferredGenresByWatchTimeLast24h?: Record<string, number>;
  preferredTagsByClicksLast24h?: Record<string, number>;
  preferredTagsByWatchTimeLast24h?: Record<string, number>;
}

export interface MongoUserFeatures {
  accountId: string;
  language: string;
  gender: string;
  age: string;
  createdAt: string | null;
  onboardingGenres: string[];
  onboardingTags: string[];
  interactions: UserInteractions;
  deepEngagement: UserDeepEngagement;
  preferences: UserPreferences;
}

export interface MongoUserDynamicFeatures {
  categories: string[];
  tags: string[];
}

export interface SeriesFeatureInteractionStats {
  totalClicks?: number;
  totalLikes?: number;
  totalBookmarks?: number;
  totalShares?: number;
  totalComments?: number;
  likeToClickRatio?: number;
  bookmarkToClickRatio?: number;
  shareToClickRatio?: number;
  commentToClickRatio?: number;
  clicksLast7d?: number;
  likesLast7d?: number;
  bookmarksLast7d?: number;
  sharesLast7d?: number;
  commentsLast7d?: number;
  likeToClickRatioLast7d?: number;
  bookmarkToClickRatioLast7d?: number;
  shareToClickRatioLast7d?: number;
  commentToClickRatioLast7d?: number;
  clicksLast24h?: number;
  likesLast24h?: number;
  bookmarksLast24h?: number;
  sharesLast24h?: number;
  commentsLast24h?: number;
  likeToClickRatioLast24h?: number;
  bookmarkToClickRatioLast24h?: number;
  shareToClickRatioLast24h?: number;
  commentToClickRatioLast24h?: number;
}

export interface SeriesFeatureEngagementStats {
  totalWatchTime?: number;
  watchTimeLast7d?: number;
  watchTimeLast24h?: number;
}

export interface SeriesFeatureData {
  id: string;
  contentType: string;
  title: string;
  description: string;
  category: string[];
  tags: string[];
  ageRating: string;
  language: string;
  creatorTier?: string | null;
  rating: number;
  releasedUpdatedAt: string;
  coverUrl?: string | null;
  bannerUrl?: string | null;
  interactionStats?: SeriesFeatureInteractionStats;
  engagementStats?: SeriesFeatureEngagementStats;
}

export type MainTabKey = "general" | "personal" | "ai-brain";

export interface TrainInitResponse {
  status: string;
  message: string;
  total_samples_generated: number;
  model_saved_at: string;
}

export interface TrainInitRealParams {
  token?: string;
  max_samples?: number;
}

export interface RankCandidateItem {
  seriesId: string;
  score?: number;
  rank?: number;
  title?: string;
  coverUrl?: string;
  [key: string]: unknown;
}

export interface RankCandidatesRequest {
  accountId?: string;
  candidateSeriesIds?: string[];
  candidate_ids?: string[];
  [key: string]: unknown;
}

export interface RankCandidatesResponse {
  status?: string;
  message?: string;
  accountId?: string;
  rankedCandidates?: RankCandidateItem[];
  ranked_candidates?: RankCandidateItem[];
  items?: RankCandidateItem[];
  [key: string]: unknown;
}


export type ChannelKey =
  | "promoted"
  | "new-releases"
  | "recently-updated"
  | "latest-community-choice"
  | "community-choice"
  | "random-category"
  | "trending";

export interface ChannelMeta {
  key: ChannelKey;
  label: string;
  description: string;
  apiEndpoint: string;
  badgeColor: string;
  badgeBg: string;
}

export const GENERAL_CHANNELS: ChannelMeta[] = [
  {
    key: "promoted",
    label: "Kênh Quảng Bá",
    description: "Danh sách series được quảng bá nổi bật trên nền tảng",
    apiEndpoint: "/api/v1/channels/promoted/cards",
    badgeColor: "text-amber-600",
    badgeBg: "bg-amber-50 border-amber-200 text-amber-700",
  },
  {
    key: "new-releases",
    label: "Kênh Mới ra mắt",
    description: "Danh sách series vừa được phát hành gần đây",
    apiEndpoint: "/api/v1/channels/new-releases/cards",
    badgeColor: "text-blue-600",
    badgeBg: "bg-blue-50 border-blue-200 text-blue-700",
  },
  {
    key: "recently-updated",
    label: "Kênh Mới cập nhật",
    description: "Series mới đăng tải tập mới hoặc cập nhật nội dung",
    apiEndpoint: "/api/v1/channels/recently-updated/cards",
    badgeColor: "text-emerald-600",
    badgeBg: "bg-emerald-50 border-emerald-200 text-emerald-700",
  },
  {
    key: "latest-community-choice",
    label: "Cộng đồng bình chọn mới nhất",
    description: "Series nhận được đánh giá cao nhất trong thời gian gần đây",
    apiEndpoint: "/api/v1/channels/latest-community-choice/cards",
    badgeColor: "text-purple-600",
    badgeBg: "bg-purple-50 border-purple-200 text-purple-700",
  },
  {
    key: "community-choice",
    label: "Cộng đồng bình chọn",
    description: "Series xuất sắc nhất do khán giả bình chọn mọi thời đại",
    apiEndpoint: "/api/v1/channels/community-choice/cards",
    badgeColor: "text-rose-600",
    badgeBg: "bg-rose-50 border-rose-200 text-rose-700",
  },
  {
    key: "random-category",
    label: "Thể loại ngẫu nhiên",
    description: "Danh sách series gợi ý thuộc thể loại ngẫu nhiên",
    apiEndpoint: "/api/v1/channels/random-category/cards",
    badgeColor: "text-indigo-600",
    badgeBg: "bg-indigo-50 border-indigo-200 text-indigo-700",
  },
  {
    key: "trending",
    label: "Kênh Xu Hướng",
    description: "Top series đang có xu hướng tăng trưởng lượt xem & tương tác cao",
    apiEndpoint: "/api/v1/channels/trending/cards",
    badgeColor: "text-cyan-600",
    badgeBg: "bg-cyan-50 border-cyan-200 text-cyan-700",
  },
];
