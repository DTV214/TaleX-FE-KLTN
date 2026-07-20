"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  CornerDownRight,
  Edit2,
  Trash2,
  EyeOff,
  Send,
  Loader2,
  Check,
  X,
  MoreVertical,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { cn } from "@/shared/utils/utils";
import type { CommentDto } from "../api/comments-api";
import { useCommentReplies, useCommentMutations } from "../hooks/use-comments";

interface CommentItemProps {
  comment: CommentDto;
  episodeId: string;
  depth?: number;
}

export function CommentItem({
  comment,
  episodeId,
  depth = 0,
}: CommentItemProps) {
  const user = useAuthStore((state) => state.user);
  const currentAccountId = user?.accountId;

  const isCommentOwner =
    comment.isOwner ||
    (Boolean(currentAccountId) &&
      Boolean(comment.accountId) &&
      currentAccountId === comment.accountId);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  const [showReplies, setShowReplies] = useState(false);

  const {
    replies,
    isLoading: isRepliesLoading,
    hasMoreReplies,
    loadMoreReplies,
  } = useCommentReplies(comment.commentId, showReplies);

  const {
    createComment,
    isCreating,
    updateComment,
    isUpdating,
    deleteComment,
    isDeleting,
    hideComment,
    isHiding,
  } = useCommentMutations(episodeId);

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await updateComment({
        commentId: comment.commentId,
        content: editContent.trim(),
      });
      setIsEditing(false);
    } catch {
      // toast handled in hook
    }
  };

  const handleSendReply = async () => {
    if (!replyContent.trim()) return;
    try {
      await createComment({
        content: replyContent.trim(),
        episodeId,
        commentParentId: comment.commentId,
      });
      setReplyContent("");
      setIsReplying(false);
      setShowReplies(true);
    } catch {
      // toast handled in hook
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;
    try {
      await deleteComment(comment.commentId);
    } catch {
      // toast handled in hook
    }
  };

  const handleHide = async () => {
    try {
      await hideComment(comment.commentId);
    } catch {
      // toast handled in hook
    }
  };

  const isHidden = comment.status === "HIDDEN";

  return (
    <div className={cn("group relative space-y-3", depth > 0 && "pl-4 md:pl-6 border-l border-white/5")}>
      <div className="flex gap-3">
        {/* User Avatar */}
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-zinc-800 flex items-center justify-center text-xs font-black text-[#D4AF37]">
          {comment.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={comment.avatarUrl}
              alt={comment.displayName || comment.username || "Avatar"}
              className="h-full w-full object-cover"
            />
          ) : (
            (comment.displayName || comment.username || "U")
              .charAt(0)
              .toUpperCase()
          )}
        </div>

        {/* Comment Body */}
        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Header info */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">
              {comment.displayName || comment.username || "Tài khoản TaleX"}
            </span>
            {comment.createdAt && (
              <span className="text-[10px] font-medium text-zinc-500">
                {new Date(comment.createdAt).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            {isHidden && (
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-400">
                Đã ẩn
              </span>
            )}
          </div>

          {/* Comment Content / Edit Mode */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-[#D4AF37]/50 bg-zinc-900 p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isUpdating || !editContent.trim()}
                  className="flex items-center gap-1 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-stone-950 hover:bg-yellow-400 disabled:opacity-50"
                >
                  {isUpdating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  Lưu
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-zinc-300 whitespace-pre-line">
              {comment.content}
            </p>
          )}

          {/* Actions Bar */}
          {!isEditing && (
            <div className="flex items-center gap-4 pt-1 text-[11px] font-semibold text-zinc-450">
              {/* Reply trigger */}
              <button
                type="button"
                onClick={() => setIsReplying((prev) => !prev)}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <CornerDownRight size={12} />
                Phản hồi
              </button>

              {/* Edit button if owner */}
              {isCommentOwner && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 hover:text-[#D4AF37] transition-colors"
                >
                  <Edit2 size={12} />
                  Sửa
                </button>
              )}

              {/* Delete button if owner */}
              {isCommentOwner && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-1 hover:text-red-400 transition-colors"
                >
                  {isDeleting ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                  Xóa
                </button>
              )}

              {/* Hide button */}
              {!isCommentOwner && (
                <button
                  type="button"
                  onClick={handleHide}
                  disabled={isHiding}
                  className="flex items-center gap-1 hover:text-amber-400 transition-colors"
                >
                  {isHiding ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <EyeOff size={12} />
                  )}
                  Ẩn
                </button>
              )}
            </div>
          )}

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-3 flex gap-2.5 rounded-xl border border-white/5 bg-zinc-900/60 p-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Trả lời ${comment.displayName || comment.username || "người dùng"}...`}
                rows={2}
                className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none resize-none"
              />
              <div className="flex flex-col justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsReplying(false)}
                  className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white"
                >
                  <X size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={isCreating || !replyContent.trim()}
                  className="flex items-center justify-center rounded-lg bg-[#D4AF37] p-2 text-stone-950 hover:bg-yellow-400 disabled:opacity-50"
                >
                  {isCreating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Toggle Replies List */}
          {((comment.replyCount ?? 0) > 0 || showReplies) && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowReplies((prev) => !prev)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-[#D4AF37] hover:underline"
              >
                <MessageSquare size={12} />
                {showReplies
                  ? "Ẩn phản hồi"
                  : `Xem ${comment.replyCount || replies.length || ""} phản hồi`}
              </button>
            </div>
          )}

          {/* Render Replies */}
          {showReplies && (
            <div className="mt-3 space-y-3 pt-1">
              {isRepliesLoading && replies.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-zinc-500 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
                  Đang tải phản hồi...
                </div>
              ) : (
                replies.map((reply) => (
                  <CommentItem
                    key={reply.commentId}
                    comment={reply}
                    episodeId={episodeId}
                    depth={depth + 1}
                  />
                ))
              )}

              {hasMoreReplies && (
                <button
                  type="button"
                  onClick={loadMoreReplies}
                  disabled={isRepliesLoading}
                  className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors"
                >
                  {isRepliesLoading ? "Đang tải..." : "Xem thêm phản hồi khác"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
