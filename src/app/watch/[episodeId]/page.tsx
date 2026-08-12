import { SignedHlsPlayer } from "@/features/playback/components/signed-hls-player";
import { AntiPiracyWrapper } from "@/features/playback/components/anti-piracy-wrapper";

type WatchEpisodePageProps = {
  params: Promise<{
    episodeId: string;
  }>;
};

export default async function WatchEpisodePage({
  params,
}: WatchEpisodePageProps) {
  const { episodeId } = await params;

  return (
    <AntiPiracyWrapper>
      <SignedHlsPlayer episodeId={episodeId} />
    </AntiPiracyWrapper>
  );
}
