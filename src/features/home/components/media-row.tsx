"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion, Variants } from "framer-motion";

export interface MediaItem {
  id: string | number;
  title: string;
  subtitle: string;
  image: string;
  badge?: string;
  badgeColor?: string;
}

interface MediaRowProps {
  title: string;
  description: string;
  href: string;
  items: MediaItem[];
  layout?: "portrait" | "landscape";
}

export function MediaRow({
  title,
  description,
  href,
  items,
  layout = "portrait",
}: MediaRowProps) {
  const isPortrait = layout === "portrait";
  const cardAspect = isPortrait ? "aspect-[2/3]" : "aspect-video";
  const cardWidth = isPortrait
    ? "w-[140px] sm:w-[160px] md:w-[200px]"
    : "w-[260px] sm:w-[320px] md:w-[400px]";

  // Hiệu ứng Animation xếp tầng
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: 40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <section className="w-full py-8 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header với hiệu ứng trượt lên */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-6"
        >
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-white tracking-wide mb-1">
              {title}
            </h3>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
          <Link
            href={href}
            className="group flex items-center text-sm font-semibold text-[#D4AF37] hover:text-[#E5C158] transition-colors whitespace-nowrap"
          >
            VIEW ALL{" "}
            <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Danh sách cuộn ngang có Animation */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="flex overflow-x-auto gap-4 md:gap-6 pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              className="flex-none snap-start"
            >
              <Link
                href={`/detail/${item.id}`}
                className={`relative block ${cardWidth} group cursor-pointer`}
              >
                {/* Hình ảnh & Nhãn */}
                <div
                  className={`relative ${cardAspect} rounded-xl overflow-hidden bg-white/5 mb-3 border border-white/5 group-hover:border-[#D4AF37]/50 transition-colors duration-300 shadow-lg`}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                  {item.badge && (
                    <div
                      className={`absolute bottom-3 left-3 ${item.badgeColor || "bg-white/20 backdrop-blur-md border border-white/30 text-white"} text-[10px] sm:text-xs font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider`}
                    >
                      {item.badge}
                    </div>
                  )}
                </div>

                {/* Thông tin Text */}
                <div className="px-1">
                  <h4 className="text-white font-bold text-sm md:text-base truncate group-hover:text-[#D4AF37] transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-gray-400 text-xs md:text-sm mt-1 truncate">
                    {item.subtitle}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
