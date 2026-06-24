import { MediaRow, MediaItem } from "./media-row";

export function KoreanDramaRow() {
  const data: MediaItem[] = [
    {
      id: 301,
      title: "Dưới Ánh Trăng Xanh",
      subtitle: "Lãng mạn, Chính kịch • 16 tập",
      badge: "Đã hoàn tất",
      image:
        "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 302,
      title: "Mật Lệnh Seoul",
      subtitle: "Khoa học viễn tưởng, Hành động • 12 tập",
      badge: "Đã hoàn tất",
      image:
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 303,
      title: "Lời Hứa Cuối Cùng",
      subtitle: "Cổ trang, Lãng mạn • 20 tập",
      badge: "Đã hoàn tất",
      image:
        "https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 304,
      title: "Dưới Ánh Trăng Xanh",
      subtitle: "Lãng mạn, Chính kịch • 16 tập",
      badge: "Đã hoàn tất",
      image:
        "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 305,
      title: "Mật Lệnh Seoul",
      subtitle: "Khoa học viễn tưởng, Hành động • 12 tập",
      badge: "Đã hoàn tất",
      image:
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 306,
      title: "Lời Hứa Cuối Cùng",
      subtitle: "Cổ trang, Lãng mạn • 20 tập",
      badge: "Đã hoàn tất",
      image:
        "https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?q=80&w=800&auto=format&fit=crop",
    },
  ];

  return (
    <MediaRow
      title="Tuyển Tập Phim Hàn Quốc"
      description="Những bộ phim Hàn Quốc cuốn hút đáng để xem liền mạch."
      href="/category/korean-drama"
      items={data}
      layout="landscape"
    />
  );
}
