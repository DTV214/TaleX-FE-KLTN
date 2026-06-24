import { MediaRow, MediaItem } from "./media-row";

export function ChineseSeriesRow() {
  const data: MediaItem[] = [
    {
      id: 201,
      title: "Bậc Thầy Âm Dương",
      subtitle: "Tập 12 / 24 • Hành động, Kỳ ảo",
      badge: "Tập mới",
      badgeColor: "bg-[#D4AF37] text-black",
      image:
        "https://plus.unsplash.com/premium_photo-1677829177642-30def98b0963?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 202,
      title: "Thanh Kiếm Huyền Thoại",
      subtitle: "Tập 5 / 40 • Võ thuật, Lãng mạn",
      badge: "Đặc quyền",
      badgeColor: "bg-[#E50914] text-white",
      image:
        "https://images.unsplash.com/photo-1512850183-6d7990f42385?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 203,
      title: "Bậc Thầy Âm Dương",
      subtitle: "Tập 12 / 24 • Hành động, Kỳ ảo",
      badge: "Tập mới",
      badgeColor: "bg-[#D4AF37] text-black",
      image:
        "https://plus.unsplash.com/premium_photo-1677829177642-30def98b0963?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 204,
      title: "Thanh Kiếm Huyền Thoại",
      subtitle: "Tập 5 / 40 • Võ thuật, Lãng mạn",
      badge: "Đặc quyền",
      badgeColor: "bg-[#E50914] text-white",
      image:
        "https://images.unsplash.com/photo-1512850183-6d7990f42385?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 205,
      title: "Bậc Thầy Âm Dương",
      subtitle: "Tập 12 / 24 • Hành động, Kỳ ảo",
      badge: "Tập mới",
      badgeColor: "bg-[#D4AF37] text-black",
      image:
        "https://plus.unsplash.com/premium_photo-1677829177642-30def98b0963?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 206,
      title: "Thanh Kiếm Huyền Thoại",
      subtitle: "Tập 5 / 40 • Võ thuật, Lãng mạn",
      badge: "Đặc quyền",
      badgeColor: "bg-[#E50914] text-white",
      image:
        "https://images.unsplash.com/photo-1512850183-6d7990f42385?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
  ];

  return (
    <MediaRow
      title="Phim Bộ Trung Quốc Mới"
      description="Các tập mới vừa được bổ sung cho những thiên truyện kỳ vĩ này."
      href="/category/chinese-series"
      items={data}
      layout="landscape"
    />
  );
}
