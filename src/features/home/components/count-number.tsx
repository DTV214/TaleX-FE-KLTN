"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Eye,
  Heart,
  PenTool,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";

const stats = [
  {
    label: "Lượt xem",
    value: 10,
    suffix: "M+",
    description: "cinematic views across TaleX worlds",
    icon: Eye,
  },
  {
    label: "Creators",
    value: 500,
    suffix: "+",
    description: "artists building original story universes",
    icon: PenTool,
  },
  {
    label: "Truy cập",
    value: 2,
    suffix: "M+",
    description: "monthly visits from readers and viewers",
    icon: Users,
  },
  {
    label: "Yêu thích",
    value: 850,
    suffix: "K+",
    description: "series saved into personal watchlists",
    icon: Heart,
  },
];

const floatingIcons = [
  { Icon: Sparkles, className: "left-[8%] top-12", delay: "0s" },
  { Icon: Star, className: "right-[12%] top-20", delay: "0.6s" },
  { Icon: BookOpen, className: "left-[18%] bottom-16", delay: "1.1s" },
  { Icon: Zap, className: "right-[20%] bottom-12", delay: "1.7s" },
];

function useCountUp(target: number, shouldStart: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldStart) return;

    let frame = 0;
    let startTime: number | null = null;
    const duration = 1500;

    const tick = (timestamp: number) => {
      startTime ??= timestamp;

      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setCount(Math.round(target * easedProgress));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [shouldStart, target]);

  return count;
}

function StatCard({
  stat,
  isVisible,
}: {
  stat: (typeof stats)[number];
  isVisible: boolean;
}) {
  const count = useCountUp(stat.value, isVisible);
  const Icon = stat.icon;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:border-primary/40 hover:bg-primary/[0.08] hover:shadow-[0_22px_70px_rgba(212,175,55,0.14)]">
      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.05)_35%,rgba(212,175,55,0.24)_50%,rgba(255,255,255,0.06)_65%,transparent_100%)] transition-transform duration-1000 group-hover:translate-x-full" />

      <div className="relative z-10">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary shadow-[0_0_24px_rgba(212,175,55,0.12)]">
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
            {stat.label}
          </span>
        </div>

        <div className="font-heading text-4xl font-extrabold leading-none text-white md:text-5xl">
          {count.toLocaleString()}
          <span className="text-primary">{stat.suffix}</span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {stat.description}
        </p>
      </div>
    </div>
  );
}

export function CountNumber() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-background py-20 md:py-28"
    >
      <div className="absolute left-1/2 top-1/2 -z-10 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[140px]" />

      {floatingIcons.map(({ Icon, className, delay }) => (
        <div
          key={className}
          className={`pointer-events-none absolute hidden h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-black/30 text-primary/70 shadow-[0_0_30px_rgba(212,175,55,0.12)] backdrop-blur-md md:flex ${className}`}
          style={{
            animation: "floatStatIcon 4.5s ease-in-out infinite",
            animationDelay: delay,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
      ))}

      <div className="container mx-auto px-4 md:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.45em] text-primary">
            <Sparkles className="h-4 w-4" />
            TaleX Momentum
          </span>
          <h2 className="font-heading text-4xl font-extrabold leading-tight text-foreground md:text-5xl">
            Numbers That Keep Moving
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            Every view, creator, visit, and favorite adds another pulse to the
            TaleX story universe.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} isVisible={isVisible} />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes floatStatIcon {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-16px) rotate(8deg);
          }
        }
      `}</style>
    </section>
  );
}
