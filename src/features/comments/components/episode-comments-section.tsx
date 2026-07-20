"use client";

import React, { useState } from "react";
import { MessageSquare, Send, Loader2, RefreshCw } from "lucide-react";
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
    } catch {
      // toast handled in hook
    }
  };

  const totalComments = pageData?.numberOfElements
    ? comments.length
    : comments.length;

  return (
    <section className={`w-full rounded-2xl border border-white/5 bg-[#141416] p-5 md:p-6 shadow-xl ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
            <MessageSquare size={18} />
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-wide">
              Bình luận ({totalComments})
            </h3>
            <p className="text-[11px] font-semibold text-zinc-450">
              Chia sẻ cảm nghĩ của bạn về tập phim này
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={isFetching}
          className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
          title="Làm mới bình luận"
        >
          <RefreshCw size={14} className={isFetching ? "animate-spin text-[#D4AF37]" : ""} />
        </button>
      </div>

      {/* Input box */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-zinc-800 flex items-center justify-center text-sm font-black text-[#D4AF37]">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              (user?.fullName || user?.username || "U").charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 space-y-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                isAuthenticated
                  ? "Viết bình luận của bạn..."
                  : "Vui lòng đăng nhập để tham gia bình luận."
              }
              disabled={!isAuthenticated || isCreating}
              rows={3}
              className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 p-3 text-xs text-white placeholder-zinc-500 focus:border-[#D4AF37] focus:outline-none disabled:opacity-50 resize-none transition-colors"
            />
            {isAuthenticated && (
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isCreating || !content.trim()}
                  className="flex items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-2 text-xs font-black text-stone-950 transition-all hover:bg-yellow-400 hover:shadow-lg hover:shadow-yellow-500/10 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {isCreating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  Đăng bình luận
                </button>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-6">
        {isLoading && comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37] mb-2" />
            <p className="text-xs text-zinc-400">Đang tải bình luận...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-white/5 bg-white/[0.01]">
            <MessageSquare size={36} className="text-zinc-600 mb-2" />
            <p className="text-xs font-bold text-zinc-300">
              Chưa có bình luận nào
            </p>
            <p className="text-[10px] text-zinc-500 mt-1">
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

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={loadMore}
              disabled={isFetching}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white transition-all hover:border-white/20 hover:bg-zinc-800 disabled:opacity-50"
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
