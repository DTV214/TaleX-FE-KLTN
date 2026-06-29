import type { Metadata } from "next";
import { SeriesDetail } from "@/features/series/components/series-detail";
import { getPublicSeriesDetail } from "@/features/series/api/series-api";

type SeriesDetailPageProps = {
  params: Promise<{
    seriesId: string;
  }>;
};

// Thiết lập SEO động dựa trên thông tin Series thực tế từ Backend
export async function generateMetadata({
  params,
}: SeriesDetailPageProps): Promise<Metadata> {
  const { seriesId } = await params;
  try {
    const series = await getPublicSeriesDetail(seriesId);
    return {
      title: `${series.title} - Khám Phá Series tại TaleX`,
      description:
        series.description ||
        `Xem thông tin chi tiết, danh sách các phần (seasons) và toàn bộ các tập của series ${series.title} tại TaleX.`,
    };
  } catch {
    return {
      title: "Chi Tiết Series - TaleX",
      description:
        "Thông tin chi tiết tác phẩm, danh sách các phần và tập phim của các series đặc sắc tại TaleX.",
    };
  }
}

export default async function SeriesDetailPage({
  params,
}: SeriesDetailPageProps) {
  const { seriesId } = await params;

  return (
    <main className="w-full">
      <SeriesDetail seriesId={seriesId} />
    </main>
  );
}
