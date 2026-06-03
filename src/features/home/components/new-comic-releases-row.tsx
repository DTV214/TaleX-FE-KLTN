import { MediaRow, MediaItem } from "./media-row";

export function NewReleasesRow() {
  const data: MediaItem[] = [
    {
      id: 701,
      title: "Void Walker",
      subtitle: "CH. 88 • ACTION",
      image:
        "https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 702,
      title: "Emerald Empire",
      subtitle: "CH. 12 • FANTASY",
      image:
        "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 703,
      title: "Alchemist Code",
      subtitle: "CH. 45 • MYSTERY",
      image:
        "https://images.unsplash.com/photo-1505635552518-3448ff116af3?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 704,
      title: "Neon Shadow",
      subtitle: "CH. 202 • SCI-FI",
      image:
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 705,
      title: "Midnight Melodies",
      subtitle: "CH. 34 • ROMANCE",
      image:
        "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=600&auto=format&fit=crop",
    },
  ];

  return (
    <MediaRow
      title="New Releases"
      description="Freshly published chapters for your journey"
      href="/comics/new"
      items={data}
      layout="portrait"
    />
  );
}
