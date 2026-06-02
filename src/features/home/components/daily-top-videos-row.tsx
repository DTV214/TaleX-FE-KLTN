import { MediaRow, MediaItem } from "./media-row";

export function DailyTopVideosRow() {
  const data: MediaItem[] = [
    {
      id: 501,
      title: "Arcane Secrets",
      subtitle: "Animation • 9 Episodes",
      badge: "Top 1",
      badgeColor: "bg-[#D4AF37] text-black",
      image:
        "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 502,
      title: "Cyber Edge",
      subtitle: "Action, Sci-Fi • 10 Episodes",
      badge: "Trending",
      badgeColor: "bg-[#E50914] text-white",
      image:
        "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 503,
      title: "Arcane Secrets",
      subtitle: "Animation • 9 Episodes",
      badge: "Top 1",
      badgeColor: "bg-[#D4AF37] text-black",
      image:
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 504,
      title: "Cyber Edge",
      subtitle: "Action, Sci-Fi • 10 Episodes",
      badge: "Trending",
      badgeColor: "bg-[#E50914] text-white",
      image:
        "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 505,
      title: "Arcane Secrets",
      subtitle: "Animation • 9 Episodes",
      badge: "Top 1",
      badgeColor: "bg-[#D4AF37] text-black",
      image:
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 506,
      title: "Cyber Edge",
      subtitle: "Action, Sci-Fi • 10 Episodes",
      badge: "Trending",
      badgeColor: "bg-[#E50914] text-white",
      image:
        "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop",
    },
  ];

  return (
    <MediaRow
      title="Video Hay Mỗi Ngày"
      description="Tuyển tập những series phim/animation không thể bỏ lỡ hôm nay."
      href="/category/daily-top-videos"
      items={data}
      layout="landscape"
    />
  );
}
