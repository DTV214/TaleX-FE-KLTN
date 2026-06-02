import { MediaRow, MediaItem } from "./media-row";

export function MysteryThrillerRow() {
  const data: MediaItem[] = [
    {
      id: 101,
      title: "The Night Mirage",
      subtitle: "Thriller • 45 Chapters",
      image:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 102,
      title: "Empty Souls",
      subtitle: "Cyber Mystery • 112 Chapters",
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 103,
      title: "Dark House",
      subtitle: "Horror • 16 Chapters",
      image:
        "https://images.unsplash.com/photo-1505635552518-3448ff116af3?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 104,
      title: "Edges of Lies",
      subtitle: "Action Thriller • 58 Chapters",
      image:
        "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 105,
      title: "The Night Mirage",
      subtitle: "Thriller • 45 Chapters",
      image:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 106,
      title: "Empty Souls",
      subtitle: "Cyber Mystery • 112 Chapters",
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 107,
      title: "Dark House",
      subtitle: "Horror • 16 Chapters",
      image:
        "https://images.unsplash.com/photo-1505635552518-3448ff116af3?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 108,
      title: "Edges of Lies",
      subtitle: "Action Thriller • 58 Chapters",
      image:
        "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop",
    },
  ];

  return (
    <MediaRow
      title="Mystery & Thriller"
      description="Drop into spine-chilling stories and perplexing cases."
      href="/category/mystery"
      items={data}
      layout="portrait"
    />
  );
}
