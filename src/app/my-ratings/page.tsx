"use client";

import React from "react";
import { MyRatingsView } from "@/features/series/components/my-ratings-view";
import {
  Sparkles,
  Star,
  Heart,
  BookOpen,
  Clapperboard,
  Film,
  Flame,
  Tag,
} from "lucide-react";

function PageAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.14]"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2200&auto=format&fit=crop)",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(212,175,55,0.18),transparent_32%),radial-gradient(circle_at_88%_18%,rgba(151,176,255,0.12),transparent_28%),linear-gradient(180deg,rgba(18,16,13,0.7)_0%,rgba(8,8,8,0.93)_48%,#080808_100%)]" />
      <div className="absolute -left-28 top-28 h-72 w-[720px] rotate-[-10deg] rounded-[100%] border-t border-[#D4AF37]/14" />
      <div className="absolute right-[-180px] top-20 h-[380px] w-[760px] rotate-[16deg] rounded-[100%] border-t border-cyan-100/10" />

      {/* Floating Translucent Lucide Icons */}
      <Sparkles className="absolute left-[8%] top-[8%] h-7 w-7 text-[#D4AF37]/20" />
      <Star className="absolute right-[12%] top-[12%] h-8 w-8 text-[#D4AF37]/18" />
      <Clapperboard className="absolute left-[44%] top-[10%] h-8 w-8 rotate-[-12deg] text-white/10" />
      <BookOpen className="absolute left-[6%] top-[35%] h-8 w-8 text-cyan-100/14" />
      <Heart className="absolute right-[8%] top-[30%] h-7 w-7 text-rose-300/14" />
      <Film className="absolute left-[38%] top-[45%] h-9 w-9 rotate-[14deg] text-amber-200/12" />
      <Flame className="absolute right-[22%] top-[55%] h-8 w-8 text-orange-400/14" />
      <Tag className="absolute left-[14%] top-[70%] h-8 w-8 rotate-[-18deg] text-emerald-200/12" />
      <Sparkles className="absolute right-[10%] top-[8%] h-9 w-9 text-[#D4AF37]/20" />
      <Star className="absolute left-[48%] top-[85%] h-8 w-8 text-[#D4AF37]/16" />
    </div>
  );
}

export default function MyRatingsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#12100d] pb-24 text-gray-100 antialiased">
      <PageAtmosphere />
      <main className="relative z-10 mx-auto w-full max-w-[1680px] px-4 pt-8 md:px-8">
        <MyRatingsView />
      </main>
    </div>
  );
}
