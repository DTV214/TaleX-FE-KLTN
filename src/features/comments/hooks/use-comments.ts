import { useState, useCallback, useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getEpisodeComments,
  getCommentReplies,
  createComment,
  updateComment,
  deleteComment,
  hideComment,
  type CommentDto,
  type CreateCommentPayload,
} from "../api/comments-api";
import { getApiErrorMessage } from "@/shared/api/http-client";

export function useEpisodeComments(episodeId: string, pageSize = 10) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [allComments, setAllComments] = useState<CommentDto[]>([]);

  const query = useQuery({
    queryKey: ["episode-comments", episodeId, page, pageSize],
    queryFn: () => getEpisodeComments(episodeId, page, pageSize),
    enabled: Boolean(episodeId),
    staleTime: 10 * 1000,
  });

  useEffect(() => {
    if (query.data?.content) {
      const content = query.data.content;
      if (page === 0) {
        setAllComments(content);
      } else {
        setAllComments((prev) => {
          const existingIds = new Set(prev.map((c) => c.commentId));
          const newItems = content.filter((c) => !existingIds.has(c.commentId));
          return [...prev, ...newItems];
        });
      }
    }
  }, [query.data, page]);

  const loadMore = useCallback(() => {
    if (query.data && !query.data.last) {
      setPage((prev) => prev + 1);
    }
  }, [query.data]);

  const refresh = useCallback(() => {
    setPage(0);
    queryClient.invalidateQueries({ queryKey: ["episode-comments", episodeId] });
  }, [episodeId, queryClient]);

  return {
    ...query,
    comments: allComments,
    hasMore: Boolean(query.data && !query.data.last),
    loadMore,
    refresh,
  };
}

export function useCommentReplies(commentId: string, enabled = false, pageSize = 10) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [allReplies, setAllReplies] = useState<CommentDto[]>([]);

  const query = useQuery({
    queryKey: ["comment-replies", commentId, page, pageSize],
    queryFn: () => getCommentReplies(commentId, page, pageSize),
    enabled: Boolean(commentId) && enabled,
    staleTime: 10 * 1000,
  });

  useEffect(() => {
    if (query.data?.content) {
      const content = query.data.content;
      if (page === 0) {
        setAllReplies(content);
      } else {
        setAllReplies((prev) => {
          const existingIds = new Set(prev.map((c) => c.commentId));
          const newItems = content.filter((c) => !existingIds.has(c.commentId));
          return [...prev, ...newItems];
        });
      }
    }
  }, [query.data, page]);

  const loadMoreReplies = useCallback(() => {
    if (query.data && !query.data.last) {
      setPage((prev) => prev + 1);
    }
  }, [query.data]);

  const refreshReplies = useCallback(() => {
    setPage(0);
    queryClient.invalidateQueries({ queryKey: ["comment-replies", commentId] });
  }, [commentId, queryClient]);

  return {
    ...query,
    replies: allReplies,
    hasMoreReplies: Boolean(query.data && !query.data.last),
    loadMoreReplies,
    refreshReplies,
  };
}

export function useCommentMutations(episodeId: string) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: CreateCommentPayload) => createComment(payload),
    onSuccess: (_, variables) => {
      toast.success(
        variables.commentParentId
          ? "Đã gửi phản hồi!"
          : "Đã đăng bình luận!"
      );
      if (variables.commentParentId) {
        queryClient.invalidateQueries({
          queryKey: ["comment-replies", variables.commentParentId],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["episode-comments", episodeId],
      });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err) || "Không thể gửi bình luận.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      commentId,
      content,
    }: {
      commentId: string;
      content: string;
    }) => updateComment(commentId, content),
    onSuccess: () => {
      toast.success("Đã cập nhật bình luận!");
      queryClient.invalidateQueries({
        queryKey: ["episode-comments", episodeId],
      });
      queryClient.invalidateQueries({ queryKey: ["comment-replies"] });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err) || "Không thể cập nhật bình luận.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      toast.success("Đã xóa bình luận!");
      queryClient.invalidateQueries({
        queryKey: ["episode-comments", episodeId],
      });
      queryClient.invalidateQueries({ queryKey: ["comment-replies"] });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err) || "Không thể xóa bình luận.");
    },
  });

  const hideMutation = useMutation({
    mutationFn: (commentId: string) => hideComment(commentId),
    onSuccess: () => {
      toast.success("Đã ẩn bình luận!");
      queryClient.invalidateQueries({
        queryKey: ["episode-comments", episodeId],
      });
      queryClient.invalidateQueries({ queryKey: ["comment-replies"] });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err) || "Không thể ẩn bình luận.");
    },
  });

  return {
    createComment: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateComment: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteComment: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    hideComment: hideMutation.mutateAsync,
    isHiding: hideMutation.isPending,
  };
}
