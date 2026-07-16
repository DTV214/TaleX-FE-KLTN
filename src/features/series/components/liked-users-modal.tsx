"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getEpisodeLikes } from "../api/episode-likes-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Loader2, Heart } from "lucide-react";
import { cn } from "@/shared/utils/utils";

interface LikedUsersModalProps {
  episodeId: string;
  trigger: React.ReactNode;
}

export function LikedUsersModal({ episodeId, trigger }: LikedUsersModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  // 1. Sử dụng useInfiniteQuery để tự động quản lý phân trang dạng cuộn (Slice)
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["episodeLikesInfinite", episodeId],
    queryFn: ({ pageParam = 0 }) => getEpisodeLikes(episodeId, pageParam, 20),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      // Nếu là trang cuối (last === true) thì không tải tiếp (trả về undefined)
      return lastPage.last ? undefined : lastPage.number + 1;
    },
    enabled: !!episodeId,
  });

  // Gộp tất cả dữ liệu từ các trang (pages) thành một danh sách phẳng
  const likedUsers = data?.pages.flatMap((page) => page.content) || [];

  // 2. Theo dõi sự kiện cuộn xuống dưới cùng bằng IntersectionObserver
  useEffect(() => {
    const container = containerRef.current;
    const triggerEl = observerRef.current;
    if (!container || !triggerEl || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void fetchNextPage();
        }
      },
      {
        root: container, // Theo dõi sự kiện cuộn bên trong khung modal
        threshold: 0.1,
      }
    );

    observer.observe(triggerEl);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#161619] border-white/5 text-white max-h-[80vh] flex flex-col p-6 rounded-2xl">
        <DialogHeader className="pb-4 border-b border-white/5">
          <DialogTitle className="text-base font-extrabold flex items-center gap-2">
            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
            Danh Sách Thích
          </DialogTitle>
        </DialogHeader>

        {/* Màn loading trang đầu */}
        {isLoading && (
          <div className="flex-1 min-h-[250px] flex flex-col items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-[#D4AF37] mb-2" />
            <p className="text-xs text-gray-500 animate-pulse">
              Đang tải danh sách...
            </p>
          </div>
        )}

        {/* Màn lỗi */}
        {isError && (
          <div className="flex-1 min-h-[250px] flex flex-col items-center justify-center text-center">
            <p className="text-xs text-red-400 font-bold mb-1">
              Lỗi tải danh sách người thích
            </p>
            <p className="text-[11px] text-gray-500">Vui lòng thử lại sau.</p>
          </div>
        )}

        {/* Màn trống */}
        {!isLoading && !isError && likedUsers.length === 0 && (
          <div className="flex-1 min-h-[250px] flex flex-col items-center justify-center text-center">
            <Heart className="w-8 h-8 text-gray-600 mb-3 stroke-[1.5]" />
            <p className="text-xs text-gray-400 font-semibold">
              Chưa có lượt thích nào
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5">
              Hãy là người đầu tiên thích tập này!
            </p>
          </div>
        )}

        {/* Danh sách người thích với tính năng cuộn vô hạn */}
        {!isLoading && !isError && likedUsers.length > 0 && (
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto py-2 space-y-3 pr-1 max-h-[350px] no-scrollbar"
          >
            {likedUsers.map((user, idx) => (
              <div
                key={`${user.accountId}-${idx}`}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-all duration-200"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 overflow-hidden flex-none relative">
                  <img
                    src={
                      user.avatarUrl ||
                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=80&auto=format&fit=crop"
                    }
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Username */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-200 truncate">
                    {user.username}
                  </p>
                  {user.likedAt && (
                    <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                      Thích lúc:{" "}
                      {new Date(user.likedAt).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Element mốc để kích hoạt Trigger load tiếp */}
            <div ref={observerRef} className="py-4 text-center">
              {isFetchingNextPage ? (
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                  Đang tải thêm...
                </div>
              ) : hasNextPage ? (
                <div className="h-4" /> // Khoảng trống nhỏ để observer nhận biết
              ) : (
                <p className="text-[10px] text-gray-600 font-semibold">
                  Đã hiển thị hết danh sách
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
