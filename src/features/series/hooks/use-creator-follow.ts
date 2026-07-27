import { useMemo } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import {
  followCreator,
  unfollowCreator,
  getFollowedCreators,
  type AccountFollowInfoDto,
} from "../api/creator-follows-api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { toast } from "sonner";

type FollowMutationContext = {
  previousFollowedCreators?: unknown;
  previousSeriesDetails: Array<[QueryKey, unknown]>;
};

type FollowedCreatorItem = AccountFollowInfoDto & {
  creatorId?: string | null;
  id?: string | null;
};

type FollowedCreatorsData = Omit<
  Awaited<ReturnType<typeof getFollowedCreators>>,
  "content"
> & {
  content?: FollowedCreatorItem[];
};

type SeriesFollowerCache = {
  accountId?: string | null;
  creatorId?: string | null;
  totalCreatorFollowers?: number | null;
} & Record<string, unknown>;

function matchesCreator(value: unknown, creatorAccountId?: string) {
  if (!creatorAccountId || !value || typeof value !== "string") return false;
  return value.toLowerCase() === creatorAccountId.toLowerCase();
}

function matchesFollowedCreator(
  item: FollowedCreatorItem,
  candidateList: string[]
) {
  return candidateList.some((cand) => {
    const lowerCand = cand.toLowerCase();
    return (
      item.accountId?.toLowerCase() === lowerCand ||
      item.creatorId?.toLowerCase() === lowerCand ||
      item.id?.toLowerCase() === lowerCand ||
      item.username?.toLowerCase() === lowerCand
    );
  });
}

function updateSeriesFollowerCount<T extends SeriesFollowerCache | undefined>(
  old: T,
  creatorAccountId: string,
  delta: 1 | -1
): T {
  if (!old) return old;

  const belongsToCreator =
    matchesCreator(old.accountId, creatorAccountId) ||
    matchesCreator(old.creatorId, creatorAccountId);

  if (!belongsToCreator) return old;

  const currentCount = Number(old.totalCreatorFollowers ?? 0);
  return {
    ...old,
    totalCreatorFollowers: Math.max(0, currentCount + delta),
  } as T;
}

export function useCreatorFollow(
  creatorAccountId?: string,
  additionalIds?: (string | undefined | null)[]
) {
  const authUser = useAuthStore((state) => state.user);
  const isAuthenticated = !!authUser;
  const queryClient = useQueryClient();

  // Query danh sách đang theo dõi của user
  const followedQuery = useQuery({
    queryKey: ["followedCreators"],
    queryFn: () => getFollowedCreators(0, 250),
    enabled: isAuthenticated,
  });

  const followedList = useMemo(
    () => followedQuery.data?.content ?? [],
    [followedQuery.data?.content]
  );

  const candidateList = useMemo(() => {
    const list = [creatorAccountId, ...(additionalIds || [])].filter(
      (id): id is string => Boolean(id && typeof id === "string")
    );
    return Array.from(new Set(list));
  }, [creatorAccountId, additionalIds]);

  const followedItem = useMemo(() => {
    if (candidateList.length === 0 || followedList.length === 0) return null;
    return (
      followedList.find((item) => matchesFollowedCreator(item, candidateList)) ||
      null
    );
  }, [candidateList, followedList]);

  // Xác định trạng thái đã follow chưa
  const isFollowing = useMemo(() => {
    return Boolean(followedItem);
  }, [followedItem]);

  // Mutation: Theo dõi
  const followMutation = useMutation({
    mutationFn: () => followCreator(creatorAccountId!),
    onMutate: async (): Promise<FollowMutationContext> => {
      await queryClient.cancelQueries({ queryKey: ["followedCreators"] });
      await queryClient.cancelQueries({ queryKey: ["publicSeriesDetail"] });

      const previousFollowedCreators = queryClient.getQueryData([
        "followedCreators",
      ]);
      const previousSeriesDetails = queryClient.getQueriesData({
        queryKey: ["publicSeriesDetail"],
      });

      // Optimistic update
      queryClient.setQueryData<FollowedCreatorsData>(
        ["followedCreators"],
        (old) => {
          if (!old) return old;
          const alreadyExists = old.content?.some((item) =>
            matchesFollowedCreator(item, candidateList)
          );

          if (alreadyExists) return old;

          return {
            ...old,
            content: [
              ...(old.content ?? []),
              {
                accountId: creatorAccountId!,
                username: "",
                avatarUrl: null,
                followedAt: new Date().toISOString(),
              },
            ],
          };
        }
      );

      queryClient.setQueriesData<SeriesFollowerCache | undefined>(
        { queryKey: ["publicSeriesDetail"] },
        (old) => updateSeriesFollowerCount(old, creatorAccountId!, 1)
      );

      return { previousFollowedCreators, previousSeriesDetails };
    },
    onError: (err, variables, context) => {
      if (context?.previousFollowedCreators) {
        queryClient.setQueryData(
          ["followedCreators"],
          context.previousFollowedCreators
        );
      }
      context?.previousSeriesDetails.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error("Không thể theo dõi kênh. Vui lòng thử lại!");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followedCreators"] });
      queryClient.invalidateQueries({ queryKey: ["publicSeriesDetail"] });
      queryClient.invalidateQueries({ queryKey: ["publicSeriesListAll"] });
      queryClient.invalidateQueries({ queryKey: ["creatorDetailPublic"] });
      queryClient.invalidateQueries({ queryKey: ["creatorDetail"] });
      queryClient.invalidateQueries({ queryKey: ["publicSeries"] });
      queryClient.invalidateQueries({ queryKey: ["ownCreatorFollowers"] });
      queryClient.invalidateQueries({ queryKey: ["creator-followers"] });
      toast.success("Đã theo dõi nhà sáng tạo.");
    },
  });

  // Mutation: Hủy theo dõi
  const unfollowMutation = useMutation({
    mutationFn: () => unfollowCreator(creatorAccountId!),
    onMutate: async (): Promise<FollowMutationContext> => {
      await queryClient.cancelQueries({ queryKey: ["followedCreators"] });
      await queryClient.cancelQueries({ queryKey: ["publicSeriesDetail"] });

      const previousFollowedCreators = queryClient.getQueryData([
        "followedCreators",
      ]);
      const previousSeriesDetails = queryClient.getQueriesData({
        queryKey: ["publicSeriesDetail"],
      });

      // Optimistic update
      queryClient.setQueryData<FollowedCreatorsData>(
        ["followedCreators"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            content: (old.content ?? []).filter(
              (item) => !matchesFollowedCreator(item, candidateList)
            ),
          };
        }
      );

      queryClient.setQueriesData<SeriesFollowerCache | undefined>(
        { queryKey: ["publicSeriesDetail"] },
        (old) => updateSeriesFollowerCount(old, creatorAccountId!, -1)
      );

      return { previousFollowedCreators, previousSeriesDetails };
    },
    onError: (err, variables, context) => {
      if (context?.previousFollowedCreators) {
        queryClient.setQueryData(
          ["followedCreators"],
          context.previousFollowedCreators
        );
      }
      context?.previousSeriesDetails.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error("Không thể hủy theo dõi. Vui lòng thử lại!");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followedCreators"] });
      queryClient.invalidateQueries({ queryKey: ["publicSeriesDetail"] });
      queryClient.invalidateQueries({ queryKey: ["publicSeriesListAll"] });
      queryClient.invalidateQueries({ queryKey: ["creatorDetailPublic"] });
      queryClient.invalidateQueries({ queryKey: ["creatorDetail"] });
      queryClient.invalidateQueries({ queryKey: ["publicSeries"] });
      queryClient.invalidateQueries({ queryKey: ["ownCreatorFollowers"] });
      queryClient.invalidateQueries({ queryKey: ["creator-followers"] });
      toast.success("Đã hủy theo dõi nhà sáng tạo.");
    },
  });

  const handleFollowToggle = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để theo dõi nhà sáng tạo.");
      return;
    }
    if (!creatorAccountId) return;

    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  return {
    isFollowing,
    followedItem,
    toggleFollow: handleFollowToggle,
    isLoading: followedQuery.isLoading,
    isMutating: followMutation.isPending || unfollowMutation.isPending,
  };
}
