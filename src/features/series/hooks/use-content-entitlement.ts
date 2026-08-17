"use client";

import { useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
  useActiveSubscription,
  useContentOrderHistory,
} from "@/features/payment/api/payment.api";
import { useGetPublicCombos } from "@/features/public/hooks/use-public-combos";
import {
  getPublicEpisodeMedia,
  type PublicEpisodeItem,
} from "../api/series-api";
import { getEpisodePlayback } from "@/features/playback/api/playback-api";

export interface UseContentEntitlementParams {
  contentType?: "VIDEO" | "COMIC" | string;
  creatorAccountId?: string | null;
  episodes?:
    | PublicEpisodeItem[]
    | Array<{
        episodeId?: string;
        unlockType?: string;
        episodeNumber?: number;
        title?: string;
        isLocked?: boolean;
        isEntitled?: boolean;
        isPurchased?: boolean;
        isUnlocked?: boolean;
        creatorId?: string;
        [key: string]: any;
      }>;
}

// Module-level persistent cache across components and page navigations
const globalPurchasedCache = new Set<string>();

export function useContentEntitlement({
  contentType,
  creatorAccountId,
  episodes = [],
}: UseContentEntitlementParams = {}) {
  const authUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isComic = String(contentType || "").toUpperCase() === "COMIC";

  // 1. Kiểm tra xem người dùng có phải là tác giả của series / tập không
  const isCreator = useMemo(() => {
    if (!isAuthenticated || !authUser?.accountId || !creatorAccountId)
      return false;
    return (
      String(authUser.accountId).toLowerCase() ===
      String(creatorAccountId).toLowerCase()
    );
  }, [isAuthenticated, authUser?.accountId, creatorAccountId]);

  // 2. Kiểm tra gói Subscription đang hoạt động của người dùng
  const { data: activeSubscription, isLoading: isSubscriptionLoading } =
    useActiveSubscription(Boolean(isAuthenticated && authUser?.accountId));

  const isSubscriptionUnlocked = useMemo(() => {
    if (!activeSubscription) return false;
    const typeUpper = (contentType || "").toUpperCase();
    if (typeUpper === "VIDEO") {
      return Boolean(activeSubscription.isMovieUnlocked);
    }
    if (typeUpper === "COMIC") {
      return Boolean(activeSubscription.isStoryUnlocked);
    }
    return Boolean(
      activeSubscription.isMovieUnlocked || activeSubscription.isStoryUnlocked,
    );
  }, [activeSubscription, contentType]);

  const isFullyUnlocked = isCreator || isSubscriptionUnlocked;

  // 3. Lấy lịch sử mua tập / combo qua API đơn hàng
  const { data: orderHistoryData, isLoading: isOrdersLoading } =
    useContentOrderHistory(1, 100);

  // 4. Lấy danh sách combo công khai để map combo đã mua ra danh sách episodeId
  const { data: combos = [], isLoading: isCombosLoading } =
    useGetPublicCombos();

  // 5. Lọc các tập trả phí để thực hiện kiểm tra trực tiếp qua Playback/Media API của Backend
  const paidEpisodesToCheck = useMemo(() => {
    return episodes.filter(
      (ep) =>
        ep &&
        ep.unlockType === "PAID" &&
        ep.episodeId &&
        typeof ep.episodeId === "string",
    );
  }, [episodes]);

  // 6. Direct backend entitlement verification (kiểm tra trực tiếp endpoint backend xem viewerId có xem/đọc được không)
  const directEntitlementQueries = useQueries({
    queries: paidEpisodesToCheck.map((ep) => ({
      queryKey: [
        "directEpisodeEntitlement",
        ep.episodeId,
        isComic ? "COMIC" : "VIDEO",
        authUser?.accountId ?? "anonymous",
      ],
      queryFn: async () => {
        if (!ep.episodeId || !authUser?.accountId) {
          return { episodeId: ep.episodeId, unlocked: false };
        }
        try {
          if (isComic) {
            const mediaRes = await getPublicEpisodeMedia(
              ep.episodeId,
              authUser.accountId,
            );
            const mediaList = Array.isArray(mediaRes)
              ? mediaRes
              : (mediaRes as any)?.data ?? [];
            const isLocked = Boolean(
              (mediaRes as any)?.isLocked === true ||
                (mediaRes as any)?.isEntitled === false ||
                (Array.isArray(mediaList) &&
                  mediaList.length > 0 &&
                  mediaList.some(
                    (m: any) => m.isLocked === true || m.locked === true,
                  )),
            );
            return {
              episodeId: ep.episodeId,
              unlocked: !isLocked && mediaList.length > 0,
            };
          } else {
            const playback = await getEpisodePlayback(
              ep.episodeId,
              authUser.accountId,
            );
            const isLocked = Boolean(
              playback?.isLocked === true || playback?.playbackType === "MP4",
            );
            const hasStream = Boolean(
              playback?.manifestUrl ||
                playback?.hlsUrl ||
                playback?.playbackUrl,
            );
            return {
              episodeId: ep.episodeId,
              unlocked: !isLocked && hasStream,
            };
          }
        } catch {
          return { episodeId: ep.episodeId, unlocked: false };
        }
      },
      enabled: Boolean(isAuthenticated && authUser?.accountId && ep.episodeId),
      staleTime: 30 * 1000,
      retry: false,
    })),
  });

  // 7. Tập hợp tất cả episodeId đã được mua / mở khóa thành công
  const purchasedEpisodeIds = useMemo(() => {
    const purchasedSet = new Set<string>(globalPurchasedCache);
    if (!isAuthenticated) return purchasedSet;

    // A. Kiểm tra từ Order History
    const orders = orderHistoryData?.content ?? [];
    for (const order of orders) {
      const status = String(order.status || "").toUpperCase();
      if (
        status === "COMPLETED" ||
        status === "PAID" ||
        status === "SUCCESS" ||
        status === "SUCCESSFUL" ||
        status === "DONE"
      ) {
        const itemType = String(order.itemType || "").toUpperCase();
        if (itemType === "EPISODE") {
          const epId = order.itemId || order.episodeId || order.contentId;
          if (epId) {
            purchasedSet.add(String(epId));
            globalPurchasedCache.add(String(epId));
          }

          // Match by title / episodeNumber nếu itemId không trả về
          if (order.itemTitle && episodes.length > 0) {
            const matchedEp = episodes.find((ep) => {
              if (!ep) return false;
              if (ep.title && order.itemTitle.toLowerCase().includes(ep.title.toLowerCase())) {
                return true;
              }
              if (
                ep.episodeNumber &&
                (order.itemTitle.includes(`Tập ${ep.episodeNumber}`) ||
                  order.itemTitle.includes(`Chương ${ep.episodeNumber}`))
              ) {
                return true;
              }
              return false;
            });
            if (matchedEp?.episodeId) {
              purchasedSet.add(String(matchedEp.episodeId));
              globalPurchasedCache.add(String(matchedEp.episodeId));
            }
          }
        } else if (itemType === "COMBO") {
          const comboId = order.itemId || order.contentId;
          if (comboId && combos.length > 0) {
            const foundCombo = combos.find(
              (c) =>
                String(c.comboId) === String(comboId) ||
                (c.title &&
                  order.itemTitle &&
                  c.title.toLowerCase() === order.itemTitle.toLowerCase()),
            );
            if (foundCombo?.episodes && Array.isArray(foundCombo.episodes)) {
              for (const ep of foundCombo.episodes) {
                if (ep.episodeId) {
                  purchasedSet.add(String(ep.episodeId));
                  globalPurchasedCache.add(String(ep.episodeId));
                }
              }
            }
          }
        }
      }
    }

    // B. Kiểm tra từ Direct Entitlement Playback/Media queries
    for (const query of directEntitlementQueries) {
      if (query.data && query.data.unlocked && query.data.episodeId) {
        purchasedSet.add(String(query.data.episodeId));
        globalPurchasedCache.add(String(query.data.episodeId));
      }
    }

    return purchasedSet;
  }, [
    isAuthenticated,
    orderHistoryData?.content,
    combos,
    episodes,
    directEntitlementQueries,
  ]);

  // 8. Hàm kiểm tra tập phim / chương truyện cụ thể đã mở khóa chưa
  const isEpisodeUnlocked = useMemo(() => {
    return (
      ep:
        | {
            episodeId?: string;
            unlockType?: string;
            isLocked?: boolean;
            isEntitled?: boolean;
            isPurchased?: boolean;
            isUnlocked?: boolean;
            creatorId?: string;
            [key: string]: any;
          }
        | null
        | undefined,
    ): boolean => {
      if (!ep) return false;

      // Tập miễn phí luôn được mở khóa
      if (ep.unlockType !== "PAID") return true;

      // Nếu toàn bộ series được mở khóa (tác giả hoặc gói Premium phù hợp)
      if (isFullyUnlocked) return true;

      // Nếu người dùng là tác giả của tập cụ thể này
      if (
        isAuthenticated &&
        authUser?.accountId &&
        ep.creatorId &&
        String(authUser.accountId).toLowerCase() ===
          String(ep.creatorId).toLowerCase()
      ) {
        return true;
      }

      // Các cờ backend trả về trực tiếp (nếu có)
      if (
        ep.isLocked === false ||
        ep.isEntitled === true ||
        ep.isPurchased === true ||
        ep.isUnlocked === true
      ) {
        return true;
      }

      // Kiểm tra trong danh sách các tập đã mua riêng lẻ, qua combo hoặc qua Playback API
      const epIdStr = ep.episodeId ? String(ep.episodeId) : "";
      if (
        epIdStr &&
        (purchasedEpisodeIds.has(epIdStr) || globalPurchasedCache.has(epIdStr))
      ) {
        return true;
      }

      return false;
    };
  }, [
    isFullyUnlocked,
    isAuthenticated,
    authUser?.accountId,
    purchasedEpisodeIds,
  ]);

  return {
    isEpisodeUnlocked,
    isFullyUnlocked,
    isCreator,
    isSubscriptionUnlocked,
    purchasedEpisodeIds,
    isLoading: isSubscriptionLoading || isOrdersLoading || isCombosLoading,
  };
}
