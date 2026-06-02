"use client";

import { Play, Sparkles, Plus } from "lucide-react";
import { motion } from "framer-motion";

export function FeaturedPromo() {
  return (
    <section className="w-full py-16 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        {/* Khối Banner Bo góc lớn - Tích hợp Animation trượt lên */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="group relative w-full bg-[#121214] rounded-[2.5rem] overflow-hidden flex flex-col-reverse md:flex-row border border-white/5 hover:border-white/15 transition-all duration-700 shadow-2xl hover:shadow-[0_20px_80px_rgba(229,9,20,0.15)]"
        >
          {/* Vệt sáng lướt qua khi đưa chuột vào (Shine Effect) */}
          <div className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.02)_35%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.02)_65%,transparent_100%)] transition-transform duration-[1500ms] ease-in-out group-hover:translate-x-full z-30" />

          {/* Nửa trái: Nội dung Text & Nút bấm */}
          <div className="relative z-20 w-full md:w-[55%] lg:w-1/2 p-8 md:p-14 lg:p-20 flex flex-col justify-center">
            {/* Badge */}
            <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-bold uppercase tracking-[0.2em] mb-5">
              <Sparkles className="w-4 h-4" />
              Featured Visual Novels
            </div>

            {/* Tiêu đề - Hiệu ứng đẩy nhẹ khi hover */}
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-white mb-6 leading-tight transition-transform duration-500 group-hover:translate-x-2">
              Wings of the <br /> Fallen
            </h3>

            {/* Mô tả */}
            <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-10 max-w-md transition-transform duration-500 delay-75 group-hover:translate-x-2">
              Experience a tale of betrayal, redemption, and cosmic wars. Dive
              into the interactive visual novel that is taking the TaleX
              community by storm. Uncover the secrets of the celestial realm.
            </p>

            {/* Khu vực nút bấm */}
            <div className="flex flex-wrap items-center gap-4 transition-transform duration-500 delay-150 group-hover:translate-x-2">
              {/* Nút màu đỏ đặc trưng */}
              <button className="flex items-center justify-center gap-2 px-8 py-4 bg-[#E50914] hover:bg-[#ff0a16] text-white rounded-md font-bold text-sm sm:text-base transition-all hover:scale-105 shadow-[0_0_20px_rgba(229,9,20,0.4)] active:scale-95">
                <Play className="w-5 h-5 fill-current" />
                Watch Season 1
              </button>

              {/* Nút lưu/thêm vào danh sách (Kính mờ) */}
              <button className="flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-md font-bold text-sm sm:text-base transition-all border border-white/10 backdrop-blur-md hover:border-white/30 active:scale-95">
                <Plus className="w-5 h-5" />
                Add to List
              </button>
            </div>
          </div>

          {/* Nửa phải: Hình ảnh hòa trộn (Blended Image) */}
          <div className="relative w-full md:w-[45%] lg:w-1/2 h-[350px] md:h-auto md:absolute md:right-0 md:top-0 md:bottom-0 overflow-hidden">
            {/* Ảnh nền với hiệu ứng Zoom cực chậm (Cinematic Zoom) */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-[3000ms] ease-out group-hover:scale-110"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1668293750324-bd77c1f08ca9?q=80&w=927&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
              }}
            />

            {/* Lớp phủ Gradient: Cực kỳ quan trọng để blend ảnh mượt vào nền đen */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-[#121214]/60 to-transparent md:hidden z-10" />
            <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#121214] via-[#121214]/90 to-transparent z-10" />

            {/* Lớp làm tối ảnh nhẹ, sẽ sáng lên một chút khi hover */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-700 z-10" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
