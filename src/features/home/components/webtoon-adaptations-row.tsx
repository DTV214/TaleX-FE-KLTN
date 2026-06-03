import { MediaRow, MediaItem } from "./media-row";

export function WebtoonAdaptationsRow() {
  const data: MediaItem[] = [
    {
      id: 801,
      title: "Tower of Sky",
      subtitle: "CH. 154 • FANTASY",
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 802,
      title: "Second Life",
      subtitle: "CH. 92 • DRAMA",
      image:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 803,
      title: "Omniscient View",
      subtitle: "CH. 200 • ACTION",
      image:
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 804,
      title: "Sweet Home",
      subtitle: "CH. 140 • HORROR",
      image:
        "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 805,
      title: "True Beauty",
      subtitle: "CH. 223 • ROMANCE",
      image:
        "https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?q=80&w=600&auto=format&fit=crop",
    },
  ];

  return (
    <MediaRow
      title="Webtoon Adaptations"
      description="The most loved webtoons brought to life"
      href="/comics/webtoon"
      items={data}
      layout="portrait"
    />
  );
}
