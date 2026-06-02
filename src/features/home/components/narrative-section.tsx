"use client";

import { useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

// Component phụ trợ: Hiển thị Skeleton cho đến khi ảnh tải xong
const ImageWithSkeleton = ({ src, alt }: { src: string; alt: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative w-full h-full bg-black/40">
      {/* Skeleton fade-out khi ảnh thật đã sẵn sàng */}
      <div
        className={`absolute inset-0 z-10 flex items-center justify-center bg-white/5 transition-opacity duration-500 ${
          isLoaded ? "pointer-events-none opacity-0" : "animate-pulse opacity-100"
        }`}
      >
        <div className="h-9 w-9 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>

      {/* Ảnh thật với hiệu ứng smooth fade-in khi load xong */}
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 50vw, 33vw"
        loader={({ src }) => src}
        unoptimized
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsLoaded(true)}
        loading="lazy"
        decoding="async"
        className={`object-cover transition-all duration-700 ease-out group-hover:scale-110 ${
          isLoaded
            ? "scale-100 opacity-75 blur-0 group-hover:opacity-100"
            : "scale-105 opacity-0 blur-sm"
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
    </div>
  );
};

export function NarrativeSection() {
  return (
    <section className="w-full py-32 relative overflow-hidden bg-background">
      {/* Vệt sáng trang trí mờ ảo ở góc */}
      <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] -z-10 pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* KHỐI BÊN TRÁI: Lưới hình ảnh (Asymmetric Grid) */}
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          {/* Cột 1: 1 Ảnh dọc lớn */}
          <motion.div
            className="space-y-4 pt-12"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <div className="aspect-[3/4] rounded-2xl overflow-hidden glass-panel relative group shadow-2xl">
              <ImageWithSkeleton
                src="https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?q=70&w=800&auto=format&fit=crop"
                alt="Cinematic visual 1"
              />
            </div>
          </motion.div>

          {/* Cột 2: 2 Ảnh vuông nhỏ xếp chồng */}
          <div className="space-y-4 md:space-y-6">
            <motion.div
              className="aspect-square rounded-2xl overflow-hidden glass-panel relative group shadow-xl"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <ImageWithSkeleton
                src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=70&w=700&auto=format&fit=crop"
                alt="Cinematic visual 2"
              />
            </motion.div>

            <motion.div
              className="aspect-square rounded-2xl overflow-hidden glass-panel relative group shadow-xl"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <ImageWithSkeleton
                src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=70&w=700&auto=format&fit=crop"
                alt="Cinematic visual 3"
              />
            </motion.div>
          </div>
        </div>

        {/* KHỐI BÊN PHẢI: Nội dung Text */}
        <motion.div
          className="flex flex-col space-y-8"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div>
            <span className="text-primary text-sm font-bold tracking-widest uppercase mb-4 block flex items-center gap-2">
              <span className="w-8 h-[2px] bg-primary"></span>
              Vision
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground leading-[1.1]">
              A New Paradigm in <br />
              <span className="text-muted-foreground">Narrative Depth</span>
            </h2>
          </div>

          <p className="text-muted-foreground text-lg md:text-xl font-sans leading-relaxed">
            We are redefining how stories are experienced. By blending cinematic
            visuals, immersive soundscapes, and interactive storytelling, TaleX
            brings you closer to the worlds you love.
          </p>

          <div className="space-y-6 pt-4">
            {/* Gạch đầu dòng 1 */}
            <motion.div
              className="flex items-start space-x-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
              whileHover={{ x: 10 }}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="text-foreground font-bold text-lg">
                  Seamless Transition
                </h4>
                <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                  Switch between reading manga and watching animated shorts
                  without breaking your flow.
                </p>
              </div>
            </motion.div>

            {/* Gạch đầu dòng 2 */}
            <motion.div
              className="flex items-start space-x-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
              whileHover={{ x: 10 }}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="text-foreground font-bold text-lg">
                  Creator First
                </h4>
                <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                  Empowering artists with the tools they need to bring their
                  imagination to life.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
