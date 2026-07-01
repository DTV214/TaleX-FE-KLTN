import type { Metadata } from "next";
import { SeriesList } from "@/features/series/components/series-list";

export const metadata: Metadata = {
  title: "Khám Phá Series - TaleX",
  description:
    "Thư viện tổng hợp những bộ phim hoạt hình ngắn đặc sắc, phim bộ và truyện tranh độc đáo nhất từ những nhà sáng tạo hàng đầu trên TaleX.",
};

export default function SeriesPage() {
  return (
    <main className="w-full">
      <SeriesList />
    </main>
  );
}
