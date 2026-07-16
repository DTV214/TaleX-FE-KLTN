import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEpisodeLikes,
  likeEpisode,
  unlikeEpisode,
  getMyLikedEpisodes,
} from "../api/episode-likes-api";
import { getPublicEpisodeDetail } from "../api/series-api";
import { useAuthStore, isFullProfile } from "@/features/auth/store/auth.store";
import { toast } from "sonner";

export function useEpisodeLikes(episodeId: string, page = 0, size = 10) {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);

  // 1. Query danh sách tập phim đã thích của chính mình (chỉ chạy khi đã login)
  const myLikesQuery = useQuery({
    queryKey: ["myLikedEpisodes"],
    queryFn: () => getMyLikedEpisodes(0, 200),
    enabled: !!authUser,
  });

  // Xác định user hiện tại đã thích tập này chưa
  const isLiked =
    myLikesQuery.data?.content.some((item) => item.episodeId === episodeId) ??
    false;

  // 2. Query chi tiết tập phim để lấy số lượng likes thực tế
  const detailQuery = useQuery({
    queryKey: ["publicEpisodeDetail", episodeId],
    queryFn: () => getPublicEpisodeDetail(episodeId),
    enabled: !!episodeId,
  });

  // 3. Query danh sách tài khoản đã thích tập phim này (public)
  const likesQuery = useQuery({
    queryKey: ["episodeLikes", episodeId, page, size],
    queryFn: () => getEpisodeLikes(episodeId, page, size),
    enabled: !!episodeId,
  });

  // 4. Mutation Thích tập phim (Optimistic Update)
  const likeMutation = useMutation({
    mutationFn: () => likeEpisode(episodeId),
    onMutate: async () => {
      // Hủy bỏ các query đang chạy để tránh conflict
      await queryClient.cancelQueries({ queryKey: ["myLikedEpisodes"] });
      await queryClient.cancelQueries({ queryKey: ["publicEpisodeDetail", episodeId] });
      await queryClient.cancelQueries({ queryKey: ["episodeLikes", episodeId] });

      // Lưu trữ snapshot cũ
      const previousMyLikes = queryClient.getQueryData(["myLikedEpisodes"]);
      const previousDetail = queryClient.getQueryData(["publicEpisodeDetail", episodeId]);
      const previousLikes = queryClient.getQueryData(["episodeLikes", episodeId, page, size]);

      // 1. Cập nhật danh sách tập đã thích của tôi (thêm tập mới)
      if (previousMyLikes) {
        queryClient.setQueryData(["myLikedEpisodes"], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            content: [
              {
                episodeId,
                likedAt: new Date().toISOString(),
              },
              ...old.content,
            ],
          };
        });
      }

      // 2. Cập nhật số lượng likes trong chi tiết tập phim (+1)
      if (previousDetail) {
        queryClient.setQueryData(["publicEpisodeDetail", episodeId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            likes: (old.likes || 0) + 1,
          };
        });
      }

      // 3. Cập nhật danh sách người đã thích (thêm user hiện tại vào danh sách người thích)
      if (authUser) {
        const username = isFullProfile(authUser) ? authUser.username : "Bạn";
        const avatarUrl = isFullProfile(authUser) ? authUser.avatarUrl : undefined;

        queryClient.setQueryData(
          ["episodeLikes", episodeId, page, size],
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              content: [
                {
                  accountId: authUser.accountId,
                  username,
                  avatarUrl,
                  likedAt: new Date().toISOString(),
                },
                ...old.content,
              ],
            };
          },
        );
      }

      return { previousMyLikes, previousDetail, previousLikes };
    },
    onError: (err, variables, context) => {
      // Rollback về trạng thái cũ nếu lỗi
      if (context?.previousMyLikes) {
        queryClient.setQueryData(["myLikedEpisodes"], context.previousMyLikes);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(["publicEpisodeDetail", episodeId], context.previousDetail);
      }
      if (context?.previousLikes) {
        queryClient.setQueryData(
          ["episodeLikes", episodeId, page, size],
          context.previousLikes,
        );
      }
      toast.error("Không thể thích tập phim. Vui lòng đăng nhập hoặc thử lại!");
    },
    onSuccess: () => {
      // Invalidate để đồng bộ lại dữ liệu chuẩn xác từ server
      queryClient.invalidateQueries({ queryKey: ["myLikedEpisodes"] });
      queryClient.invalidateQueries({ queryKey: ["publicEpisodeDetail", episodeId] });
      queryClient.invalidateQueries({ queryKey: ["episodeLikes", episodeId] });
      queryClient.invalidateQueries({ queryKey: ["publicSeasonEpisodes"] });
    },
  });

  // 5. Mutation Bỏ thích tập phim (Optimistic Update)
  const unlikeMutation = useMutation({
    mutationFn: () => unlikeEpisode(episodeId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["myLikedEpisodes"] });
      await queryClient.cancelQueries({ queryKey: ["publicEpisodeDetail", episodeId] });
      await queryClient.cancelQueries({ queryKey: ["episodeLikes", episodeId] });

      const previousMyLikes = queryClient.getQueryData(["myLikedEpisodes"]);
      const previousDetail = queryClient.getQueryData(["publicEpisodeDetail", episodeId]);
      const previousLikes = queryClient.getQueryData(["episodeLikes", episodeId, page, size]);

      // 1. Cập nhật danh sách tập đã thích (xóa tập ra)
      if (previousMyLikes) {
        queryClient.setQueryData(["myLikedEpisodes"], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.filter((item: any) => item.episodeId !== episodeId),
          };
        });
      }

      // 2. Cập nhật số lượng likes trong chi tiết tập phim (-1)
      if (previousDetail) {
        queryClient.setQueryData(["publicEpisodeDetail", episodeId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            likes: Math.max(0, (old.likes || 0) - 1),
          };
        });
      }

      // 3. Cập nhật danh sách người thích (xóa user ra)
      if (authUser) {
        queryClient.setQueryData(
          ["episodeLikes", episodeId, page, size],
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              content: old.content.filter(
                (user: any) => user.accountId !== authUser.accountId,
              ),
            };
          },
        );
      }

      return { previousMyLikes, previousDetail, previousLikes };
    },
    onError: (err, variables, context) => {
      if (context?.previousMyLikes) {
        queryClient.setQueryData(["myLikedEpisodes"], context.previousMyLikes);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(["publicEpisodeDetail", episodeId], context.previousDetail);
      }
      if (context?.previousLikes) {
        queryClient.setQueryData(
          ["episodeLikes", episodeId, page, size],
          context.previousLikes,
        );
      }
      toast.error("Không thể bỏ thích tập phim. Vui lòng thử lại!");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myLikedEpisodes"] });
      queryClient.invalidateQueries({ queryKey: ["publicEpisodeDetail", episodeId] });
      queryClient.invalidateQueries({ queryKey: ["episodeLikes", episodeId] });
      queryClient.invalidateQueries({ queryKey: ["publicSeasonEpisodes"] });
    },
  });

  const handleLikeToggle = async () => {
    if (!authUser) {
      toast.error("Vui lòng đăng nhập để thực hiện chức năng này!");
      return;
    }
    if (isLiked) {
      await unlikeMutation.mutateAsync();
    } else {
      await likeMutation.mutateAsync();
    }
  };

  const totalLikes = detailQuery.data?.likes || 0;
  const listLikesCount = likesQuery.data?.content?.length || 0;
  // Fallback UX: Lấy số lớn nhất giữa (likes từ detail, số lượng người thích lấy trực tiếp từ DB ở trang đầu, hoặc 1 nếu user đã thích)
  const displayLikes = Math.max(totalLikes, listLikesCount, isLiked ? 1 : 0);

  return {
    likedUsers: likesQuery.data?.content || [],
    totalLikes: displayLikes,
    isLiked,
    isLoading: likesQuery.isLoading || myLikesQuery.isLoading || detailQuery.isLoading,
    isError: likesQuery.isError || detailQuery.isError,
    toggleLike: handleLikeToggle,
    isMutating: likeMutation.isPending || unlikeMutation.isPending,
  };
}
