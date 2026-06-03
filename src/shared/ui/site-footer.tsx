"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/core/config/site";
import { AtSign, Code, Video, ChevronRight, Sparkles } from "lucide-react";

export function SiteFooter() {
  const pathname = usePathname();

  // Kiểm tra xem có đang ở trang xác thực (Auth) không

  const isAuthOrAdminPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/staff"); // Chặn toàn bộ các trang nội bộ admin

  // Nếu đang ở trang Auth hoặc Admin, ẩn Footer này đi
  if (isAuthOrAdminPage) {
    return null;
  }

  return (
    <footer className="relative w-full overflow-hidden bg-[#0B0B0C] pt-16">
      {/* Vệt sáng ngang mờ ảo ngăn cách nội dung (Glowing Border) */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent shadow-[0_0_20px_rgba(212,175,55,0.5)]" />

      {/* Ánh sáng hắt nhẹ (Glow background) ở trung tâm */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[200px] bg-[#D4AF37]/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 md:px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Cột 1: Logo và Mô tả ngắn */}
          <div className="lg:col-span-2 flex flex-col items-start">
            <Link href="/" className="mb-6 flex items-center gap-2 group">
              <Sparkles className="w-5 h-5 text-[#D4AF37] group-hover:animate-pulse" />
              <span className="text-3xl font-extrabold font-heading text-white tracking-wider transition-colors group-hover:text-[#D4AF37]">
                {siteConfig.name}
              </span>
            </Link>
            <p className="text-gray-400 text-sm max-w-md mb-8 leading-relaxed">
              {siteConfig.description ||
                "Khám phá thế giới giải trí không giới hạn với những bộ phim và truyện tranh độc quyền. Trải nghiệm điện ảnh đỉnh cao ngay tại nhà."}
            </p>

            {/* Mạng xã hội - Dạng nút nổi bật (Floating Action Buttons) */}
            <div className="flex space-x-4">
              {[
                { icon: AtSign, href: siteConfig.links?.twitter || "#" },
                { icon: Code, href: siteConfig.links?.github || "#" },
                { icon: Video, href: "#" },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={index}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-400 transition-all duration-300 hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(212,175,55,0.3)]"
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Cột 2: Điều hướng nền tảng */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-[0.2em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
              Platform
            </h4>
            <ul className="space-y-4 text-sm text-gray-400">
              {["Series", "Comics", "Creator Program", "Pricing"].map(
                (item) => {
                  const linkHref =
                    item === "Creator Program"
                      ? "/creator"
                      : `/${item.toLowerCase()}`;
                  return (
                    <li key={item}>
                      <Link
                        href={linkHref}
                        className="group flex items-center transition-colors hover:text-[#D4AF37]"
                      >
                        <ChevronRight className="w-4 h-4 mr-1 opacity-0 -translate-x-3 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-[#D4AF37]" />
                        <span className="transition-transform duration-300 group-hover:translate-x-1">
                          {item}
                        </span>
                      </Link>
                    </li>
                  );
                },
              )}
            </ul>
          </div>

          {/* Cột 3: Trợ giúp & Pháp lý */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-[0.2em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
              Support
            </h4>
            <ul className="space-y-4 text-sm text-gray-400">
              {["FAQ", "Contact Us", "Terms of Service", "Privacy Policy"].map(
                (item) => {
                  const href =
                    item === "Contact Us"
                      ? "/contact"
                      : `/${item.split(" ")[0].toLowerCase()}`;
                  return (
                    <li key={item}>
                      <Link
                        href={href}
                        className="group flex items-center transition-colors hover:text-[#D4AF37]"
                      >
                        <ChevronRight className="w-4 h-4 mr-1 opacity-0 -translate-x-3 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-[#D4AF37]" />
                        <span className="transition-transform duration-300 group-hover:translate-x-1">
                          {item}
                        </span>
                      </Link>
                    </li>
                  );
                },
              )}
            </ul>
          </div>
        </div>

        {/* Thanh bản quyền dưới cùng */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 font-medium tracking-wide">
            Made with{" "}
            <span className="text-[#E50914] animate-pulse text-sm">♥</span> for
            storytellers.
          </p>
        </div>
      </div>
    </footer>
  );
}
