import { MediaRow, MediaItem } from "./media-row";

export function WebtoonAdaptationsRow() {
  const data: MediaItem[] = [
    {
      id: 801,
      title: "Tháp Trời",
      subtitle: "CHƯƠNG 154 • KỲ ẢO",
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 802,
      title: "Cuộc Đời Thứ Hai",
      subtitle: "CHƯƠNG 92 • CHÍNH KỊCH",
      image:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 803,
      title: "Góc Nhìn Toàn Tri",
      subtitle: "CHƯƠNG 200 • HÀNH ĐỘNG",
      image:
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 804,
      title: "Ngôi Nhà Thân Yêu",
      subtitle: "CHƯƠNG 140 • KINH DỊ",
      image:
        "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 805,
      title: "Vẻ Đẹp Đích Thực",
      subtitle: "CHƯƠNG 223 • LÃNG MẠN",
      image:
        "https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?q=80&w=600&auto=format&fit=crop",
    },
  ];

  return (
    <MediaRow
      title="Chuyển Thể Từ Truyện Mạng"
      description="Những bộ truyện mạng được yêu thích nhất nay đã trở nên sống động."
      href="/comics/webtoon"
      items={data}
      layout="portrait"
    />
  );
}
