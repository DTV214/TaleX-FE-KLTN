import { MediaRow, MediaItem } from "./media-row";

export function KoreanDramaRow() {
  const data: MediaItem[] = [
    {
      id: 301,
      title: "Under the Blue Moon",
      subtitle: "Romance, Drama • 16 Episodes",
      badge: "Completed",
      image:
        "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 302,
      title: "Seoul Protocol",
      subtitle: "Sci-Fi, Action • 12 Episodes",
      badge: "Completed",
      image:
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 303,
      title: "The Last Promise",
      subtitle: "Historical, Romance • 20 Episodes",
      badge: "Completed",
      image:
        "https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 304,
      title: "Under the Blue Moon",
      subtitle: "Romance, Drama • 16 Episodes",
      badge: "Completed",
      image:
        "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 305,
      title: "Seoul Protocol",
      subtitle: "Sci-Fi, Action • 12 Episodes",
      badge: "Completed",
      image:
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 306,
      title: "The Last Promise",
      subtitle: "Historical, Romance • 20 Episodes",
      badge: "Completed",
      image:
        "https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?q=80&w=800&auto=format&fit=crop",
    },
  ];

  return (
    <MediaRow
      title="Korean Drama Collection"
      description="Binge-worthy shows from South Korea."
      href="/category/korean-drama"
      items={data}
      layout="landscape"
    />
  );
}
