import { MediaRow, MediaItem } from "./media-row";

export function MysteryThrillerRow() {
  const data: MediaItem[] = [
    {
      id: 101,
      title: "Ảo Ảnh Trong Đêm",
      subtitle: "Giật gân • 45 chương",
      image:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 102,
      title: "Những Linh Hồn Trống Rỗng",
      subtitle: "Bí ẩn công nghệ • 112 chương",
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 103,
      title: "Ngôi Nhà Tăm Tối",
      subtitle: "Kinh dị • 16 chương",
      image:
        "https://images.unsplash.com/photo-1505635552518-3448ff116af3?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 104,
      title: "Ranh Giới Dối Trá",
      subtitle: "Hành động giật gân • 58 chương",
      image:
        "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 105,
      title: "Ảo Ảnh Trong Đêm",
      subtitle: "Giật gân • 45 chương",
      image:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 106,
      title: "Những Linh Hồn Trống Rỗng",
      subtitle: "Bí ẩn công nghệ • 112 chương",
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 107,
      title: "Ngôi Nhà Tăm Tối",
      subtitle: "Kinh dị • 16 chương",
      image:
        "https://images.unsplash.com/photo-1505635552518-3448ff116af3?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 108,
      title: "Ranh Giới Dối Trá",
      subtitle: "Hành động giật gân • 58 chương",
      image:
        "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop",
    },
  ];

  return (
    <MediaRow
      title="Bí Ẩn & Giật Gân"
      description="Đắm mình trong những câu chuyện rợn người và các vụ án hóc búa."
      href="/category/mystery"
      items={data}
      layout="portrait"
    />
  );
}
