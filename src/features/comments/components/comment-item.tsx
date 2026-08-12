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
  ThumbsUp,
  ThumbsDown,
  Pin,
  ChevronDown,
  CheckCircle2,
  Heart,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { cn } from "@/shared/utils/utils";
import type { CommentDto } from "../api/comments-api";
import { useCommentReplies, useCommentMutations } from "../hooks/use-comments";
import { toast } from "sonner";

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

  // Chỉ ADMIN hoặc STAFF mới có quyền ẩn bình luận (API PATCH /comments/{id})
  const canHideComment =
    user?.roleName === "ADMIN" || user?.roleName === "STAFF";

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

  const [likeCount, setLikeCount] = useState<number>(
    (comment as any).likesCount ?? (comment as any).likeCount ?? 0,
  );
  const [isLiked, setIsLiked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const toggleLikeComment = () => {
    setIsLiked((prev) => {
      setLikeCount((c) => (prev ? c - 1 : c + 1));
      return !prev;
    });
  };

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

  const handleHide = () => {
    toast.custom(
      (t) => (
        <div className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-900 p-4 shadow-2xl shadow-black/60">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">
              <EyeOff size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Ẩn bình luận này?</p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
                Bình luận sẽ bị ẩn vĩnh viễn và{" "}
                <span className="font-semibold text-[#D4AF37]">
                  không thể khôi phục
                </span>
                .
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t)}
              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t);
                try {
                  await hideComment(comment.commentId);
                } catch {
                  // toast handled in hook
                }
              }}
              className="flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-stone-950 hover:bg-yellow-400 transition-colors"
            >
              <EyeOff size={12} />
              Xác nhận ẩn
            </button>
          </div>
        </div>
      ),
      { position: "top-center", duration: 10000 }
    );
  };

  const isHidden = comment.status === "HIDDEN";

  return (
    <div
      className={cn(
        "group relative space-y-2",
        depth > 0 && "pl-4 md:pl-8 border-l border-zinc-800 mt-3",
      )}
    >
      <div className="flex gap-3 items-start">
        {/* User Avatar Round */}
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#27272a] text-white font-bold flex items-center justify-center text-sm border border-white/10">
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

        {/* Comment Content Body */}
        <div className="min-w-0 flex-1 space-y-1">
          {/* Header username & date + Menu 3 chấm */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-xs md:text-sm">
                @{comment.displayName || comment.username || "nguoidung"}
              </span>

              {comment.createdAt && (
                <span className="text-xs font-normal text-zinc-400">
                  {new Date(comment.createdAt).toLocaleDateString("vi-VN")}
                </span>
              )}

              {isHidden && (
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-400">
                  Đã ẩn
                </span>
              )}
            </div>

            {/* Menu 3 chấm góc phải */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu((prev) => !prev)}
                className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-6 z-20 w-32 rounded-xl border border-white/10 bg-zinc-900 p-1 shadow-xl text-xs font-semibold text-zinc-200 space-y-1">
                  {isCommentOwner && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Sửa
                    </button>
                  )}
                  {isCommentOwner && (
                    <button
                      onClick={() => {
                        handleDelete();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 text-red-400 rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa
                    </button>
                  )}
                  {canHideComment && !isCommentOwner && (
                    <button
                      onClick={() => {
                        handleHide();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 text-amber-400 rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <EyeOff className="w-3.5 h-3.5" /> Ẩn
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Nội dung bình luận / Mode Chỉnh sửa */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={2}
                className="w-full bg-transparent border-b border-white text-sm text-white focus:outline-none pb-1"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="px-3 py-1 rounded-full text-xs font-bold text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isUpdating || !editContent.trim()}
                  className="px-4 py-1 rounded-full text-xs font-extrabold bg-[#D4AF37] text-stone-950 hover:bg-yellow-400 disabled:opacity-50 cursor-pointer"
                >
                  {isUpdating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Lưu"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-normal text-zinc-200 whitespace-pre-line font-normal mt-0.5">
              {comment.content}
            </p>
          )}

          {/* Dòng Nút Phản Hồi */}
          {!isEditing && (
            <div className="flex items-center gap-3 pt-1 text-xs text-zinc-400 font-semibold">
              <button
                type="button"
                onClick={() => setIsReplying((prev) => !prev)}
                className="hover:text-white transition-colors cursor-pointer text-xs font-bold"
              >
                Phản hồi
              </button>
            </div>
          )}

          {/* Form Nhập Phản Hồi */}
          {isReplying && (
            <div className="mt-3 flex gap-3">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Trả lời @${comment.displayName || comment.username}...`}
                className="flex-1 bg-transparent border-b border-zinc-700 focus:border-white text-xs text-white placeholder-zinc-500 focus:outline-none pb-1"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsReplying(false)}
                  className="px-3 py-1 rounded-full text-xs font-bold text-zinc-400 hover:bg-zinc-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={isCreating || !replyContent.trim()}
                  className="px-4 py-1 rounded-full text-xs font-extrabold bg-[#D4AF37] text-stone-950 hover:bg-yellow-400 disabled:opacity-50 cursor-pointer"
                >
                  {isCreating ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    "Phản hồi"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Accordion Nút Ẩn/Hiện Phản Hồi Chuẩn YouTube */}
          {((comment.repliesCount ?? comment.replyCount ?? 0) > 0 || showReplies) && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowReplies((prev) => !prev)}
                className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-[#D4AF37] hover:bg-[#D4AF37]/10 px-3 py-1.5 rounded-full w-fit transition-colors cursor-pointer"
              >
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    showReplies ? "rotate-180" : "",
                  )}
                />
                <span>
                  {showReplies
                    ? "Ẩn phản hồi"
                    : `${(comment.repliesCount ?? comment.replyCount) || replies.length || 1} phản hồi`}
                </span>
              </button>
            </div>
          )}

          {/* Hiển thị Danh Sách Phản Hồi Con */}
          {showReplies && (
            <div className="mt-2 space-y-3 pt-1">
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
                  className="text-xs font-bold text-zinc-400 hover:text-white transition-colors pt-1"
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
