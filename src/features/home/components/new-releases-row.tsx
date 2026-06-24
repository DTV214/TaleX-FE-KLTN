import { MediaRow, MediaItem } from "./media-row";

export function NewReleasesRow() {
  const data: MediaItem[] = [
    {
      id: 401,
      title: "Thăng Cấp Một Mình",
      subtitle: "Hành động • Chương 200",
      badge: "Nổi bật",
      badgeColor: "bg-[#E50914] text-white",
      image:
        "https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 402,
      title: "Độc Giả Toàn Tri",
      subtitle: "Kỳ ảo • Chương 155",
      badge: "Mới",
      badgeColor: "bg-[#D4AF37] text-black",
      image:
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 403,
      title: "Khởi Nguyên",
      subtitle: "Phép thuật • Chương 80",
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 404,
      title: "Tháp Thần",
      subtitle: "Phiêu lưu • Chương 550",
      image:
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 405,
      title: "Độc Giả Toàn Tri",
      subtitle: "Kỳ ảo • Chương 155",
      badge: "Mới",
      badgeColor: "bg-[#D4AF37] text-black",
      image:
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 406,
      title: "Khởi Nguyên",
      subtitle: "Phép thuật • Chương 80",
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 407,
      title: "Tháp Thần",
      subtitle: "Phiêu lưu • Chương 550",
      image:
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop",
    },
  ];

  return (
    <MediaRow
      title="Mới nhất trên TaleX"
      description="Những siêu phẩm truyện tranh vừa cập bến."
      href="/category/new-comics"
      items={data}
      layout="portrait"
    />
  );
}
