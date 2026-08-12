import type { Metadata } from "next";
import { ComicReader } from "@/features/comics/components/comic-reader";
import { AntiPiracyWrapper } from "@/features/playback/components/anti-piracy-wrapper";
import { EpisodeReportButton } from "@/features/moderation-reports/components/episode-report-button";

type ReadEpisodePageProps = {
  params: Promise<{
    episodeId: string;
  }>;
};

export async function generateMetadata({
  params,
}: ReadEpisodePageProps): Promise<Metadata> {
  const { episodeId } = await params;
  return {
    title: `Đọc truyện – TaleX`,
    description: `Đọc tập truyện tranh trực tuyến trên TaleX. Hỗ trợ chế độ cuộn dọc (Webtoon) và đọc từng trang.`,
  };
}

export default async function ReadEpisodePage({
  params,
}: ReadEpisodePageProps) {
  const { episodeId } = await params;

  return (
    <AntiPiracyWrapper type="comic">
      <ComicReader episodeId={episodeId} />
      <EpisodeReportButton episodeId={episodeId} />
    </AntiPiracyWrapper>
  );
}
