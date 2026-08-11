"use client";

import React, { useState } from "react";
import { MessageSquare, Loader2, ArrowUpDown, Smile } from "lucide-react";
import { useAuthStore, isFullProfile } from "@/features/auth/store/auth.store";
import { useEpisodeComments, useCommentMutations } from "../hooks/use-comments";
import { CommentItem } from "./comment-item";

interface EpisodeCommentsSectionProps {
  episodeId: string;
  className?: string;
}

export function EpisodeCommentsSection({
  episodeId,
  className,
}: EpisodeCommentsSectionProps) {
  const rawUser = useAuthStore((state) => state.user);
  const user = isFullProfile(rawUser) ? rawUser : null;
  const isAuthenticated = Boolean(user);
  const [content, setContent] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const {
    comments,
    isLoading,
    isFetching,
    hasMore,
    loadMore,
    refresh,
    data: pageData,
  } = useEpisodeComments(episodeId);

  const { createComment, isCreating } = useCommentMutations(episodeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await createComment({
        content: content.trim(),
        episodeId,
      });
      setContent("");
      setIsFocused(false);
    } catch {
      // toast handled in hook
    }
  };

  const totalCommentsCount = pageData?.numberOfElements ?? comments.length;

  return (
    <section className={`w-full text-white ${className || ""}`}>
      {/* Header chuẩn YouTube: "[Count] bình luận" */}
      <div className="flex items-center gap-6 mb-6">
        <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">
          {totalCommentsCount.toLocaleString("vi-VN")} bình luận
        </h3>
      </div>

      {/* Form Viết Bình Luận Chuẩn YouTube */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex items-start gap-3 md:gap-4">
          {/* Avatar Người Dùng */}
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#27272a] text-white font-bold flex items-center justify-center text-sm border border-white/10">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              (user?.fullName || user?.username || "T").charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1 space-y-2">
            {/* Input gạch chân chuẩn YouTube */}
            <input
              type="text"
              value={content}
              onFocus={() => setIsFocused(true)}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                isAuthenticated
                  ? "Viết bình luận..."
                  : "Vui lòng đăng nhập để tham gia bình luận."
              }
              disabled={!isAuthenticated || isCreating}
              className="w-full bg-transparent border-b border-zinc-700 focus:border-white text-sm text-white placeholder-zinc-500 focus:outline-none pb-1.5 transition-colors"
            />

            {/* Thanh Nút Hủy / Bình Luận (Màu Vàng Theme) */}
            {(isFocused || content.trim().length > 0) && (
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setContent("");
                    setIsFocused(false);
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs md:text-sm font-bold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !content.trim()}
                  className="px-5 py-1.5 rounded-full text-xs md:text-sm font-extrabold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:bg-[#27272a] disabled:text-zinc-500 bg-[#D4AF37] text-stone-950 hover:bg-yellow-400 shadow-md shadow-[#D4AF37]/10"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin inline" />
                  ) : (
                    "Bình luận"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Danh Sách Bình Luận */}
      <div className="space-y-6">
        {isLoading && comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37] mb-2" />
            <p className="text-xs text-zinc-400">Đang tải bình luận...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-white/5 bg-white/[0.01]">
            <MessageSquare size={36} className="text-zinc-600 mb-2" />
            <p className="text-sm font-bold text-zinc-300">Chưa có bình luận nào</p>
            <p className="text-xs text-zinc-500 mt-1">
              Hãy là người đầu tiên để lại bình luận cho tập phim này!
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.commentId}
              comment={comment}
              episodeId={episodeId}
            />
          ))
        )}

        {/* Nút Tải Thêm Bình Luận */}
        {hasMore && (
          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={loadMore}
              disabled={isFetching}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-[#27272a] px-6 py-2.5 text-xs font-bold text-white transition-all hover:bg-zinc-700 disabled:opacity-50 cursor-pointer"
            >
              {isFetching ? (
                <>
                  <Loader2 size={14} className="animate-spin text-[#D4AF37]" />
                  Đang tải thêm...
                </>
              ) : (
                "Xem thêm bình luận khác"
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
