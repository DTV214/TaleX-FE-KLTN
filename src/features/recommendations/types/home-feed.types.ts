export type HomeFeedPoolKey =
  | "promoted"
  | "trending"
  | "newReleases"
  | "recentlyUpdated"
  | "latestCommunityChoice"
  | "communityChoice"
  | "randomCategory"
  | "accountSubscription";

export type HomeFeedRequest = {
  promotedLimit?: number;
  trendingLimit?: number;
  newReleasesLimit?: number;
  recentlyUpdatedLimit?: number;
  latestCommunityChoiceLimit?: number;
  communityChoiceLimit?: number;
  randomCategoryLimit?: number;
  subscriptionLimit?: number;
};

export type HomeFeedSeries = {
  seriesId: string;
  accountId?: string;
  creatorId?: string;
  creatorName?: string;
  creatorAvatar?: string | null;
  totalCreatorFollowers?: number;
  title: string;
  description?: string;
  coverUrl?: string | null;
  bannerUrl?: string | null;
  contentType?: "VIDEO" | "COMIC" | string;
  ageRating?: string;
  language?: string;
  totalViews?: number;
  totalSubscriptions?: number;
  averageRating?: number;
  createdAt?: string;
  updatedAt?: string;
  releasedUpdateTime?: string;
};

export type HomeFeedResponse = Record<HomeFeedPoolKey, HomeFeedSeries[]>;
