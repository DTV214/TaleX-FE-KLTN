import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  bookmarkEpisode,
  unbookmarkEpisode,
  getEpisodeBookmarks,
  getMyBookmarkedEpisodes,
} from "../api/episode-bookmarks-api";
import { useAuthStore, isFullProfile } from "@/features/auth/store/auth.store";
import { toast } from "sonner";

export function useEpisodeBookmarks(
  episodeId: string,
  contentType?: "VIDEO" | "COMIC" | string,
  page = 0,
  size = 10
) {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);

  // 1. Query danh sách tập phim đã bookmark của chính mình (chỉ chạy khi đã login)
  const myBookmarksQuery = useQuery({
    queryKey: ["myBookmarkedEpisodes"],
    queryFn: () => getMyBookmarkedEpisodes(0, 200),
    enabled: !!authUser,
  });

  // Xác định user hiện tại đã bookmark tập này chưa
  const isBookmarked =
    myBookmarksQuery.data?.content.some((item) => item.episodeId === episodeId) ??
    false;

  // 2. Query danh sách tài khoản đã bookmark tập phim này
  const bookmarksQuery = useQuery({
    queryKey: ["episodeBookmarks", episodeId, page, size],
    queryFn: () => getEpisodeBookmarks(episodeId, page, size),
    enabled: !!episodeId,
  });

  const mediaLabel = contentType === "COMIC" ? "truyện" : "phim";

  // 3. Mutation Bookmark tập phim (Optimistic Update)
  const bookmarkMutation = useMutation({
    mutationFn: () => bookmarkEpisode(episodeId),
    onMutate: async () => {
      // Hủy bỏ các query đang chạy để tránh conflict
      await queryClient.cancelQueries({ queryKey: ["myBookmarkedEpisodes"] });
      await queryClient.cancelQueries({ queryKey: ["episodeBookmarks", episodeId] });

      // Lưu trữ snapshot cũ
      const previousMyBookmarks = queryClient.getQueryData(["myBookmarkedEpisodes"]);
      const previousBookmarks = queryClient.getQueryData(["episodeBookmarks", episodeId, page, size]);

      // 1. Cập nhật danh sách tập đã bookmark của tôi (thêm tập mới)
      if (previousMyBookmarks) {
        queryClient.setQueryData(["myBookmarkedEpisodes"], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            content: [
              {
                episodeId,
                bookmarkedAt: new Date().toISOString(),
              },
              ...old.content,
            ],
          };
        });
      }

      // 2. Cập nhật danh sách người đã bookmark
      if (authUser) {
        const username = isFullProfile(authUser) ? authUser.username : "Bạn";
        const avatarUrl = isFullProfile(authUser) ? authUser.avatarUrl : undefined;

        queryClient.setQueryData(
          ["episodeBookmarks", episodeId, page, size],
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              content: [
                {
                  accountId: authUser.accountId,
                  username,
                  avatarUrl,
                  bookmarkedAt: new Date().toISOString(),
                },
                ...old.content,
              ],
            };
          },
        );
      }

      return { previousMyBookmarks, previousBookmarks };
    },
    onError: (err, variables, context) => {
      // Rollback về trạng thái cũ nếu lỗi
      if (context?.previousMyBookmarks) {
        queryClient.setQueryData(["myBookmarkedEpisodes"], context.previousMyBookmarks);
      }
      if (context?.previousBookmarks) {
        queryClient.setQueryData(
          ["episodeBookmarks", episodeId, page, size],
          context.previousBookmarks,
        );
      }
      toast.error(`Không thể bookmark tập ${mediaLabel} này. Vui lòng đăng nhập hoặc thử lại!`);
    },
    onSuccess: () => {
      // Invalidate để đồng bộ lại dữ liệu chuẩn xác từ server
      queryClient.invalidateQueries({ queryKey: ["myBookmarkedEpisodes"] });
      queryClient.invalidateQueries({ queryKey: ["episodeBookmarks", episodeId] });
      toast.success(`Đã lưu tập ${mediaLabel} vào danh sách bookmark!`);
    },
  });

  // 4. Mutation Hủy Bookmark tập phim (Optimistic Update)
  const unbookmarkMutation = useMutation({
    mutationFn: () => unbookmarkEpisode(episodeId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["myBookmarkedEpisodes"] });
      await queryClient.cancelQueries({ queryKey: ["episodeBookmarks", episodeId] });

      const previousMyBookmarks = queryClient.getQueryData(["myBookmarkedEpisodes"]);
      const previousBookmarks = queryClient.getQueryData(["episodeBookmarks", episodeId, page, size]);

      // 1. Cập nhật danh sách tập đã bookmark (xóa tập ra)
      if (previousMyBookmarks) {
        queryClient.setQueryData(["myBookmarkedEpisodes"], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.filter((item: any) => item.episodeId !== episodeId),
          };
        });
      }

      // 2. Cập nhật danh sách người bookmark (xóa user ra)
      if (authUser) {
        queryClient.setQueryData(
          ["episodeBookmarks", episodeId, page, size],
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

      return { previousMyBookmarks, previousBookmarks };
    },
    onError: (err, variables, context) => {
      if (context?.previousMyBookmarks) {
        queryClient.setQueryData(["myBookmarkedEpisodes"], context.previousMyBookmarks);
      }
      if (context?.previousBookmarks) {
        queryClient.setQueryData(
          ["episodeBookmarks", episodeId, page, size],
          context.previousBookmarks,
        );
      }
      toast.error(`Không thể hủy bookmark tập ${mediaLabel} này. Vui lòng thử lại!`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBookmarkedEpisodes"] });
      queryClient.invalidateQueries({ queryKey: ["episodeBookmarks", episodeId] });
      toast.info(`Đã xóa tập ${mediaLabel} khỏi danh sách bookmark!`);
    },
  });

  const handleBookmarkToggle = async () => {
    if (!authUser) {
      toast.error("Vui lòng đăng nhập để thực hiện chức năng này!");
      return;
    }
    if (isBookmarked) {
      await unbookmarkMutation.mutateAsync();
    } else {
      await bookmarkMutation.mutateAsync();
    }
  };

  return {
    bookmarkedUsers: bookmarksQuery.data?.content || [],
    isBookmarked,
    isLoading: bookmarksQuery.isLoading || myBookmarksQuery.isLoading,
    isError: bookmarksQuery.isError,
    toggleBookmark: handleBookmarkToggle,
    isMutating: bookmarkMutation.isPending || unbookmarkMutation.isPending,
  };
}
