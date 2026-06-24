"use client";

import Link from "next/link";
import { Zap, Skull, Heart, Rocket, Eye } from "lucide-react";
import { motion, Variants } from "framer-motion";

export function DestinyCategories() {
  const destinies = [
    {
      id: 1,
      name: "TƯƠNG LAI PHẢN ĐỊA ĐÀNG",
      slug: "cyberpunk",
      icon: Zap,
      bg: "from-[#2A1B43] to-[#10081E]",
    },
    {
      id: 2,
      name: "KỲ ẢO ĐEN TỐI",
      slug: "dark-fantasy",
      icon: Skull,
      bg: "from-[#3D1818] to-[#170505]",
    },
    {
      id: 3,
      name: "LÃNG MẠN",
      slug: "romance",
      icon: Heart,
      bg: "from-[#1E2B5C] to-[#0A122E]",
    },
    {
      id: 4,
      name: "SỬ THI KHÔNG GIAN",
      slug: "space-opera",
      icon: Rocket,
      bg: "from-[#133324] to-[#07170E]",
    },
    {
      id: 5,
      name: "BÍ ẨN",
      slug: "mystery",
      icon: Eye,
      bg: "from-[#452D1A] to-[#1A0E06]",
    },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section className="w-full py-12">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-8">
          <h3 className="text-xl md:text-2xl font-bold text-white tracking-wider mb-1 uppercase">
            Chọn Định Mệnh Của Bạn
          </h3>
          <p className="text-sm text-gray-400">
            Chọn trải nghiệm theo sắc thái của từng thế giới
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="flex overflow-x-auto gap-4 md:gap-6 pb-6 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {destinies.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                variants={itemVariants}
                className="flex-none snap-start"
              >
                <Link
                  href={`/destiny/${item.slug}`}
                  className={`relative flex flex-col items-center justify-center w-[150px] sm:w-[180px] aspect-square rounded-2xl bg-gradient-to-br ${item.bg} group shadow-lg hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-2 border border-white/5 hover:border-white/20`}
                >
                  <Icon className="w-8 h-8 text-[#D4AF37] mb-4 transition-transform duration-500 group-hover:scale-125 group-hover:drop-shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                  <span className="text-white text-xs sm:text-sm font-bold tracking-widest uppercase">
                    {item.name}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
