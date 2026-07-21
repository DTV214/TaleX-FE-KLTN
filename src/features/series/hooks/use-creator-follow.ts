import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { followCreator, unfollowCreator, getFollowedCreators } from "../api/creator-follows-api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { toast } from "sonner";

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

  const followedList = followedQuery.data?.content || [];

  const candidateList = useMemo(() => {
    const list = [creatorAccountId, ...(additionalIds || [])].filter(
      (id): id is string => Boolean(id && typeof id === "string")
    );
    return Array.from(new Set(list));
  }, [creatorAccountId, additionalIds]);

  const followedItem = useMemo(() => {
    if (candidateList.length === 0 || followedList.length === 0) return null;
    return (
      followedList.find((item: any) =>
        candidateList.some((cand) => {
          const lowerCand = cand.toLowerCase();
          return (
            (item.accountId && item.accountId.toLowerCase() === lowerCand) ||
            (item.creatorId && item.creatorId.toLowerCase() === lowerCand) ||
            (item.id && item.id.toLowerCase() === lowerCand) ||
            (item.username && item.username.toLowerCase() === lowerCand)
          );
        })
      ) || null
    );
  }, [candidateList, followedList]);

  // Xác định trạng thái đã follow chưa
  const isFollowing = useMemo(() => {
    return Boolean(followedItem);
  }, [followedItem]);

  // Mutation: Theo dõi
  const followMutation = useMutation({
    mutationFn: () => followCreator(creatorAccountId!),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["followedCreators"] });
      const previousData = queryClient.getQueryData(["followedCreators"]);

      // Optimistic update
      queryClient.setQueryData(["followedCreators"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          content: [
            ...old.content,
            { accountId: creatorAccountId, followedAt: new Date().toISOString() },
          ],
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["followedCreators"], context.previousData);
      }
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
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["followedCreators"] });
      const previousData = queryClient.getQueryData(["followedCreators"]);

      // Optimistic update
      queryClient.setQueryData(["followedCreators"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          content: old.content.filter((item: any) => item.accountId !== creatorAccountId),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["followedCreators"], context.previousData);
      }
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
