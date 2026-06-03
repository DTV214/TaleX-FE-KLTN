"use client";

import { motion } from "framer-motion";

export function EditorialSpotlight() {
  return (
    <section className="w-full py-12">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative w-full bg-[#181614] rounded-[2rem] overflow-hidden flex flex-col md:flex-row border border-[#D4AF37]/10 shadow-2xl"
        >
          {/* Nửa trái: Nội dung */}
          <div className="relative z-10 w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
            <h4 className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.2em] mb-6">
              TaleX Editorial Spotlight
            </h4>

            <h3 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-6 leading-[1.2]">
              Stories that <br /> linger long <br /> after the final <br />{" "}
              page is turned.
            </h3>

            <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-8 max-w-sm">
              Discover the Most Emotional Fantasy Stories curated by our lead
              editors. These are journeys of sacrifice, love, and the human
              spirit.
            </p>

            <div className="flex items-center gap-4">
              <button className="px-8 py-3.5 bg-[#D4AF37] hover:bg-[#E5C158] text-black rounded-md font-bold text-sm transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                Read the Feature
              </button>

              {/* Giả lập Users Avatar */}
              <div className="flex items-center bg-black/40 px-3 py-2 rounded-lg border border-white/5">
                <div className="flex -space-x-2 mr-3">
                  <div className="w-6 h-6 rounded-full bg-gray-600 border border-[#181614] bg-[url('https://i.pravatar.cc/100?img=1')] bg-cover" />
                  <div className="w-6 h-6 rounded-full bg-gray-500 border border-[#181614] bg-[url('https://i.pravatar.cc/100?img=2')] bg-cover" />
                </div>
                <span className="text-xs font-bold text-gray-300">+12k</span>
              </div>
            </div>
          </div>

          {/* Nửa phải: Hình ảnh vầng dương */}
          <div className="relative w-full md:w-1/2 h-[300px] md:h-auto">
            <div
              className="absolute inset-0 bg-cover bg-center md:bg-right transition-transform duration-[10000ms] hover:scale-110"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=1200&auto=format&fit=crop')`,
              }}
            />
            {/* Lớp blend màu mượt mà */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#181614] to-transparent md:bg-gradient-to-r md:from-[#181614] md:via-[#181614]/50 md:to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
