"use client";

import Link from "next/link";
import {
  ChevronRight,
  Heart,
  Swords,
  Zap,
  Ghost,
  Eye,
  Rocket,
  Sparkles,
} from "lucide-react";
import { motion, Variants } from "framer-motion";

export function InterestCategories() {
  const categories = [
    {
      id: 1,
      name: "Lãng mạn",
      slug: "romance",
      icon: Heart,
      image:
        "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=500&auto=format&fit=crop",
    },
    {
      id: 2,
      name: "Kỳ ảo",
      slug: "fantasy",
      icon: Swords,
      image:
        "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=500&auto=format&fit=crop",
    },
    {
      id: 3,
      name: "Hành động",
      slug: "action",
      icon: Zap,
      image:
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=500&auto=format&fit=crop",
    },
    {
      id: 4,
      name: "Kinh dị",
      slug: "horror",
      icon: Ghost,
      image:
        "https://images.unsplash.com/photo-1505635552518-3448ff116af3?q=80&w=500&auto=format&fit=crop",
    },
    {
      id: 5,
      name: "Giật gân",
      slug: "thriller",
      icon: Eye,
      image:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=500&auto=format&fit=crop",
    },
    {
      id: 6,
      name: "Khoa học viễn tưởng",
      slug: "sci-fi",
      icon: Rocket,
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=500&auto=format&fit=crop",
    },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <section className="w-full py-12 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-8"
        >
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-white tracking-wide mb-1">
              Bạn Quan Tâm Điều Gì?
            </h3>
            <p className="text-sm text-gray-400">
              Những tuyển tập được chọn lọc theo cảm hứng điện ảnh của bạn.
            </p>
          </div>
          <Link
            href="/explore"
            className="group flex items-center text-sm font-semibold text-[#D4AF37] hover:text-[#E5C158] transition-colors whitespace-nowrap"
          >
            Khám phá tất cả
            <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="flex overflow-x-auto gap-4 md:gap-6 pb-6 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.id}
                variants={itemVariants}
                className="flex-none snap-start"
              >
                <Link
                  href={`/genre/${cat.slug}`}
                  className="relative block w-[140px] sm:w-[160px] md:w-[180px] aspect-square rounded-2xl overflow-hidden group bg-white/5 border border-white/5 hover:border-[#D4AF37]/50 transition-all shadow-lg hover:shadow-[0_10px_30px_rgba(212,175,55,0.15)] hover:-translate-y-2"
                >
                  {/* Background Image trực tiếp */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[1500ms] ease-out group-hover:scale-110 opacity-60 group-hover:opacity-100"
                    style={{ backgroundImage: `url(${cat.image})` }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors duration-500" />

                  <div className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.05)_35%,rgba(212,175,55,0.3)_50%,rgba(255,255,255,0.05)_65%,transparent_100%)] transition-transform duration-[1200ms] ease-in-out group-hover:translate-x-full z-20" />

                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-30">
                    <Sparkles className="absolute top-4 right-4 w-4 h-4 text-[#D4AF37] animate-pulse" />
                    <Sparkles className="absolute bottom-1/2 left-3 w-3 h-3 text-white/80 animate-pulse delay-150" />
                  </div>

                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10 transition-transform duration-500 group-hover:scale-110">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 bg-black/30 backdrop-blur-sm flex items-center justify-center mb-3 text-white group-hover:text-[#D4AF37] group-hover:border-[#D4AF37]/50 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                      <Icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <h4 className="text-white font-heading font-extrabold text-base md:text-lg tracking-wider drop-shadow-md group-hover:text-white transition-colors">
                      {cat.name}
                    </h4>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
