import { PenTool } from "lucide-react";

export function CreatorHighlight() {
  // Dữ liệu mock tĩnh cho Creators
  const creators = [
    {
      id: 1,
      name: "Julian Thorne",
      role: "Director, 'The Last Alchemist'",
      quote: `"TaleX allowed me to expand my cinematic vision into the literary world."`,
      avatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop",
    },
    {
      id: 2,
      name: "Elena Vance",
      role: "Lead Artist, 'Celestial Vanguard'",
      quote: `"The vertical format on TaleX is a game-changer for visual storytelling."`,
      avatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop",
    },
  ];

  return (
    <section className="w-full py-24 bg-background border-t border-white/5">
      <div className="container mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Cột trái: Nội dung và Nút bấm CTA */}
        <div className="flex flex-col items-start space-y-6 max-w-xl">
          <span className="text-primary text-xs font-bold tracking-widest uppercase">
            Creators
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground leading-tight">
            Become an Architect <br /> of Imagination
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed font-sans">
            Your story deserves to be heard. Join a global community of
            world-builders, writers, and artists who are turning their visions
            into the next generation of cinematic legends. Whether it is a
            sprawling series or an immersive comic, TaleX provides the canvas
            for your imagination.
          </p>

          {/* Nút bấm thiết kế chuẩn Figma: Bo góc vuông vức hơn (rounded-xl thay vì full), màu vàng, có shadow */}
          <button className="mt-4 flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl bg-primary text-black font-bold text-lg transition-all hover:bg-primary/90 hover:scale-105 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
            <PenTool className="w-5 h-5" />
            <span>Become a Creator</span>
          </button>
        </div>

        {/* Cột phải: Khung Avatar Creators (Glassmorphism Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {creators.map((creator) => (
            <div
              key={creator.id}
              className="flex flex-col items-center text-center p-8 rounded-2xl glass-panel bg-black/50 border border-white/5 shadow-2xl transition-transform duration-500 hover:-translate-y-2"
            >
              {/* Avatar hình vuông bo góc, viền mờ */}
              <div className="relative w-24 h-24 mb-6 rounded-2xl overflow-hidden border border-white/10 shadow-inner">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-110"
                  style={{ backgroundImage: `url(${creator.avatar})` }}
                />
              </div>

              <h3 className="text-xl font-bold text-foreground font-heading mb-1">
                {creator.name}
              </h3>
              <p className="text-primary text-[11px] uppercase tracking-wider font-semibold mb-6">
                {creator.role}
              </p>
              <p className="text-muted-foreground text-sm italic leading-relaxed">
                {creator.quote}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
