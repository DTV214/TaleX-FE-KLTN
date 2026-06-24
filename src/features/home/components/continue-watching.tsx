"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion, Variants } from "framer-motion";

export function ContinueWatching() {
  // Dữ liệu mock (có thể thay bằng API sau này)
  const watchHistory = [
    {
      id: 1,
      title: "Bí Ẩn Tốc Độ",
      progressText: "Mùa 1 • Tập 4 • Còn 15 phút",
      progressPercent: 75,
      image:
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 2,
      title: "Khúc Ca Thức Tỉnh",
      progressText: "Mùa 1 • Tập 2 • Còn 24 phút",
      progressPercent: 40,
      image:
        "https://images.unsplash.com/photo-1640903581708-8d491706515b?q=80&w=2575&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 3,
      title: "Công Chúa Điểm Ảnh",
      progressText: "Mùa 1 • Tập 10 • Còn 5 phút",
      progressPercent: 90,
      image:
        "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 4,
      title: "Công Chúa Điểm Ảnh",
      progressText: "Mùa 1 • Tập 10 • Còn 5 phút",
      progressPercent: 90,
      image:
        "https://plus.unsplash.com/premium_photo-1666700698946-fbf7baa0134a?q=80&w=1036&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 5,
      title: "Công Chúa Điểm Ảnh",
      progressText: "Mùa 1 • Tập 10 • Còn 5 phút",
      progressPercent: 90,
      image:
        "https://images.unsplash.com/photo-1668293750324-bd77c1f08ca9?q=80&w=927&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 6,
      title: "Công Chúa Điểm Ảnh",
      progressText: "Mùa 1 • Tập 10 • Còn 5 phút",
      progressPercent: 90,
      image:
        "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 7,
      title: "Công Chúa Điểm Ảnh",
      progressText: "Mùa 1 • Tập 10 • Còn 5 phút",
      progressPercent: 90,
      image:
        "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=800&auto=format&fit=crop",
    },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section className="w-full pt-12 pb-6 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header của Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-6"
        >
          <h3 className="text-xl md:text-2xl font-bold text-white tracking-wide">
            Tiếp tục xem
          </h3>
          <Link
            href="/history"
            className="group flex items-center text-sm font-semibold text-[#D4AF37] hover:text-[#E5C158] transition-colors"
          >
            Xem tất cả
            <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Lưới hiển thị Video với Animation */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="flex overflow-x-auto gap-4 md:gap-6 pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {watchHistory.map((item) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              className="flex-none snap-start"
            >
              <Link
                href={`/watch/${item.id}`}
                className="relative block w-[280px] md:w-[340px] group cursor-pointer"
              >
                {/* Khung hình ảnh 16:9 */}
                <div className="relative aspect-video rounded-md overflow-hidden bg-white/5 mb-3 border border-white/5 group-hover:border-white/20 transition-colors shadow-lg">
                  {/* Background Image trực tiếp, không dùng Skeleton nữa */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                  {/* Lớp phủ đen làm dịu ảnh */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300 pointer-events-none" />

                  {/* Thanh Tiến Trình (Progress Bar) có Animation */}
                  <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/60 backdrop-blur-sm z-20">
                    <motion.div
                      className="h-full bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.8)]"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.progressPercent}%` }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 1.2,
                        delay: 0.3,
                        ease: "easeOut",
                      }}
                    />
                  </div>
                </div>

                {/* Thông tin Text */}
                <div className="px-1">
                  <h4 className="text-white font-bold text-sm md:text-base truncate group-hover:text-[#D4AF37] transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-gray-400 text-xs md:text-sm mt-1">
                    {item.progressText}
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
