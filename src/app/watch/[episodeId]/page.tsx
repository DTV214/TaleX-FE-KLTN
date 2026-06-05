import { SignedHlsPlayer } from "@/features/playback/components/signed-hls-player";

type WatchEpisodePageProps = {
  params: Promise<{
    episodeId: string;
  }>;
};

export default async function WatchEpisodePage({
  params,
}: WatchEpisodePageProps) {
  const { episodeId } = await params;

  return <SignedHlsPlayer episodeId={episodeId} />;
}
