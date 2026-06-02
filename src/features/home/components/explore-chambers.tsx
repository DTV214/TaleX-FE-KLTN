import Link from "next/link";
import {
  ArrowUpRight,
  Compass,
  Heart,
  Sparkles,
  Sword,
  Telescope,
  Zap,
} from "lucide-react";

const chambers = [
  {
    title: "Fantasy Universes",
    eyebrow: "Immersive Realm",
    description:
      "Epic sagas of ancient magic and cosmic wars, told through cinematic episodes and sprawling vertical epics.",
    href: "/series?genre=fantasy",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1600&auto=format&fit=crop",
    icon: Sword,
    className: "lg:col-span-8 lg:row-span-2 min-h-[520px]",
    contentClassName: "max-w-xl",
    featured: true,
  },
  {
    title: "Emotional Romance",
    eyebrow: "Soul Stories",
    description: "Stories that touch the soul.",
    href: "/comics?genre=romance",
    image:
      "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=1000&auto=format&fit=crop",
    icon: Heart,
    className: "lg:col-span-4 lg:row-span-2 min-h-[520px]",
    contentClassName: "max-w-xs lg:ml-auto lg:text-left",
  },
  {
    title: "Dark Mysteries",
    eyebrow: "Hidden Cases",
    description: "Noir clues, secret rooms, and dangerous revelations.",
    href: "/comics?genre=mystery",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1000&auto=format&fit=crop",
    icon: Compass,
    className: "lg:col-span-4 min-h-[260px]",
    compact: true,
  },
  {
    title: "Action Thrillers",
    eyebrow: "High Velocity",
    description: "Fast cuts, sharp stakes, and stories that never slow down.",
    href: "/series?genre=action",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop",
    icon: Zap,
    className: "lg:col-span-4 min-h-[260px]",
    compact: true,
  },
  {
    title: "And More...",
    eyebrow: "50+ Ecosystems",
    description: "Discover unique story ecosystems across the dual-universe.",
    href: "/explore",
    icon: Telescope,
    className:
      "lg:col-span-4 min-h-[260px] bg-white/[0.05] hover:bg-primary/10",
    empty: true,
  },
];

export function ExploreChambers() {
  return (
    <section className="relative w-full overflow-hidden bg-background py-20 md:py-28">
      <div className="absolute left-1/2 top-1/2 -z-10 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[150px]" />

      <div className="container mx-auto px-4 md:px-8">
        <div className="mx-auto mb-16 flex max-w-3xl flex-col items-center text-center">
          <span className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.45em] text-primary">
            <Compass className="h-4 w-4" />
            Discover Genres
          </span>
          <h2 className="font-heading text-4xl font-extrabold leading-tight text-foreground md:text-5xl">
            Explore the Chambers
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Categorized by soul, not just genre. Find the atmosphere that
            speaks to your current mood.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:auto-rows-[260px]">
          {chambers.map((chamber) => {
            const Icon = chamber.icon;

            return (
              <Link
                key={chamber.title}
                href={chamber.href}
                className={`group relative isolate flex overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:border-primary/40 hover:shadow-[0_24px_90px_rgba(212,175,55,0.16)] ${chamber.className}`}
              >
                {!chamber.empty && (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-70 transition-all duration-700 group-hover:scale-110 group-hover:opacity-95"
                    style={{ backgroundImage: `url(${chamber.image})` }}
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/25" />

                <div className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.05)_35%,rgba(212,175,55,0.28)_50%,rgba(255,255,255,0.06)_65%,transparent_100%)] transition-transform duration-1000 group-hover:translate-x-full" />

                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <Sparkles className="absolute right-8 top-8 h-5 w-5 text-primary/80" />
                  <Sparkles className="absolute bottom-12 left-10 h-4 w-4 text-white/70" />
                </div>

                {chamber.empty ? (
                  <div className="relative z-10 m-auto flex max-w-sm flex-col items-center justify-center px-8 text-center">
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-heading text-3xl font-extrabold text-white">
                      {chamber.title}
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {chamber.description}
                    </p>
                  </div>
                ) : (
                  <div
                    className={`relative z-10 mt-auto flex flex-col p-7 md:p-9 ${chamber.contentClassName ?? ""}`}
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-black/35 text-primary opacity-0 backdrop-blur-md transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                      <Icon className="h-5 w-5" />
                    </div>

                    <span className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.28em] text-primary">
                      {chamber.eyebrow}
                    </span>
                    <h3
                      className={`font-heading font-extrabold leading-tight text-white ${
                        chamber.featured
                          ? "text-4xl md:text-5xl"
                          : chamber.compact
                            ? "text-2xl md:text-3xl"
                            : "text-3xl md:text-4xl"
                      }`}
                    >
                      {chamber.title}
                    </h3>
                    <p
                      className={`mt-4 leading-relaxed text-muted-foreground ${
                        chamber.compact ? "text-sm" : "text-base md:text-lg"
                      }`}
                    >
                      {chamber.description}
                    </p>

                    <span className="mt-7 inline-flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-white transition-colors group-hover:text-primary">
                      Enter Universe
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
