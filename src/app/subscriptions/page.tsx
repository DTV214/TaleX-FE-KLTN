"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getFollowedCreators } from "@/features/series/api/creator-follows-api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { Users, Loader2, Calendar } from "lucide-react";
import Link from "next/link";
import { FollowButton } from "@/features/series/components/follow-button";
import { useCreatorFollow } from "@/features/series/hooks/use-creator-follow";

// Component con quản lý trạng thái follow của từng Creator riêng biệt
function FollowedCreatorCard({ creator }: { creator: any }) {
  const { isFollowing, toggleFollow, isMutating } = useCreatorFollow(creator.accountId);

  return (
    <div className="group flex items-center justify-between p-4.5 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 transition-all duration-300">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 overflow-hidden relative flex-none shadow-md group-hover:border-[#D4AF37]/30 transition duration-300">
          <img
            src={
              creator.avatarUrl ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop"
            }
            alt={creator.username}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        {/* Metadata */}
        <div>
          <h3 className="text-base font-bold text-white leading-snug group-hover:text-[#D4AF37] transition duration-300">
            {creator.username}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mt-1">
            <Calendar className="w-3.5 h-3.5 text-gray-600" />
            <span>Theo dõi từ {new Date(creator.followedAt).toLocaleDateString("vi-VN")}</span>
          </div>
        </div>
      </div>

      <FollowButton
        isFollowing={isFollowing}
        onFollowToggle={toggleFollow}
        isMutating={isMutating}
        className="shrink-0"
      />
    </div>
  );
}

export default function SubscriptionsPage() {
  const authUser = useAuthStore((state) => state.user);
  const observerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch danh sách creator đang theo dõi (Infinite Query)
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["myFollowedCreatorsInfinite"],
    queryFn: ({ pageParam = 0 }) => getFollowedCreators(pageParam, 15),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.last ? undefined : lastPage.number + 1;
    },
    enabled: !!authUser,
  });

  const followedCreators = data?.pages.flatMap((page) => page.content) || [];

  // 2. Tự động load trang tiếp theo khi cuộn xuống dưới cùng
  useEffect(() => {
    const triggerEl = observerRef.current;
    if (!triggerEl || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(triggerEl);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Trạng thái chưa đăng nhập
  if (!authUser) {
    return (
      <div className="relative min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(212,175,55,0.08),transparent_50%)]" />
        <div className="relative z-10 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 text-slate-400">
            <Users className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Kênh đăng ký</h1>
          <p className="text-sm text-gray-400 mb-8">
            Vui lòng đăng nhập tài khoản TaleX để quản lý và xem danh sách các nhà sáng tạo bạn đã theo dõi.
          </p>
          <Link
            href="/login"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#D4AF37] text-black font-extrabold hover:bg-[#E5C158] transition-all active:scale-[0.98]"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#080808] text-white pb-24">
      {/* Lớp nền gradient mờ */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(212,175,55,0.06),transparent_35%),radial-gradient(circle_at_85%_15%,rgba(125,211,252,0.03),transparent_30%),linear-gradient(180deg,#080808_0%,#0e0e11_60%,#080808_100%)]" />

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-4 py-8 md:px-8">
        
        {/* Banner tiêu đề */}
        <div className="mb-8 pb-6 border-b border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-wide text-white flex items-center gap-2.5">
              <Users className="w-6 h-6 text-[#D4AF37]" />
              Kênh đăng ký
            </h1>
            <p className="text-xs text-gray-500 font-semibold">
              Đang theo dõi: {followedCreators.length} nhà sáng tạo
            </p>
          </div>
        </div>

        {/* LOADING BAN ĐẦU */}
        {isLoading && (
          <div className="min-h-[300px] flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37] mb-3" />
            <p className="text-xs text-gray-500 animate-pulse font-bold">
              Đang tải danh sách...
            </p>
          </div>
        )}

        {/* LỖI TẢI TRANG */}
        {isError && (
          <div className="min-h-[300px] flex flex-col items-center justify-center text-center">
            <h2 className="text-sm font-bold text-red-400 mb-1">Tải dữ liệu thất bại</h2>
            <p className="text-xs text-gray-500 mb-4">Vui lòng tải lại trang web.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold"
            >
              Tải lại
            </button>
          </div>
        )}

        {/* DANH SÁCH RỖNG */}
        {!isLoading && !isError && followedCreators.length === 0 && (
          <div className="min-h-[300px] rounded-2xl border border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center p-8">
            <Users className="w-8 h-8 text-gray-600 mb-3 stroke-[1.5]" />
            <h2 className="text-sm font-bold text-gray-400">Chưa đăng ký kênh nào</h2>
            <p className="text-xs text-gray-600 mt-1 max-w-xs">
              Các nhà sáng tạo bạn theo dõi sẽ xuất hiện tại đây.
            </p>
          </div>
        )}

        {/* DANH SÁCH CREATOR */}
        {!isLoading && !isError && followedCreators.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {followedCreators.map((creator) => (
              <FollowedCreatorCard key={creator.accountId} creator={creator} />
            ))}
          </div>
        )}

        {/* Trọng điểm cuộn vô hạn */}
        <div ref={observerRef} className="h-10 w-full flex items-center justify-center mt-6">
          {isFetchingNextPage && (
            <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
          )}
        </div>

      </div>
    </div>
  );
}
