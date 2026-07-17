import { useMutation, useQueryClient } from "@tanstack/react-query";
import { shareEpisode } from "../api/episode-shares-api";
import { toast } from "sonner";

export function useEpisodeShares(episodeId: string, contentType?: "VIDEO" | "COMIC" | string) {
  const queryClient = useQueryClient();

  const shareMutation = useMutation({
    mutationFn: () => shareEpisode(episodeId),
    onSuccess: () => {
      // Invalidate chi tiết tập phim để lấy số lượng share mới nếu có hiển thị
      queryClient.invalidateQueries({ queryKey: ["publicEpisodeDetail", episodeId] });
    },
    onError: () => {
      console.warn("Không thể ghi nhận lượt chia sẻ lên server.");
    },
  });

  const handleShare = async () => {
    // 1. Lấy URL chia sẻ chính thức
    const shareUrl = `${window.location.origin}/${contentType === "COMIC" ? "read" : "watch"}/${episodeId}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      const label = contentType === "COMIC" ? "truyện" : "phim";
      toast.success(`Đã sao chép liên kết chia sẻ tập ${label}!`);
    } catch {
      toast.error("Không thể sao chép liên kết chia sẻ.");
    }

    // 2. Gọi API ghi nhận lượt chia sẻ lên server
    shareMutation.mutate();
  };

  return {
    share: handleShare,
    isSharing: shareMutation.isPending,
  };
}
