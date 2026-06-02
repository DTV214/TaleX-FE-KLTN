import Link from "next/link";
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen w-full bg-[#0B0B0C]">
      {/* NỬA TRÁI: Visual & Branding (Chỉ hiện trên Desktop / Tablet ngang) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden md:flex border-r border-white/5">
        {/* Background Image phong cách Sci-Fi/Cyberpunk */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[20000ms] hover:scale-110"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
          }}
        />
        {/* Gradient overlay để làm mượt phần viền nối với nửa bên phải */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0B0B0C]/40 to-[#0B0B0C]" />

        {/* Header trái (Logo) */}
        <div className="relative z-10 p-8 lg:p-12">
          <Link
            href="/"
            className="font-heading text-3xl font-extrabold text-[#D4AF37] tracking-widest drop-shadow-lg"
          >
            TaleX
          </Link>
        </div>

        {/* Footer trái (Slogan & Accent line) */}
        <div className="relative z-10 p-8 lg:p-12">
          <p className="text-white text-lg font-medium mb-4 tracking-wide drop-shadow-md">
            Khám phá thế giới mới.
          </p>
          <div className="h-1 w-16 bg-[#D4AF37] rounded-full shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
        </div>
      </div>

      {/* NỬA PHẢI: Form Area & Navigation (Chiếm 100% trên Mobile, 50% trên Desktop) */}
      <div className="relative flex w-full flex-col md:w-1/2">
        {/* Mobile Logo (Chỉ hiện trên Mobile, vì nửa trái đã bị ẩn) */}
        <div className="flex md:hidden items-center justify-between p-6">
          <Link
            href="/"
            className="font-heading text-2xl font-extrabold text-[#D4AF37] tracking-widest"
          >
            TaleX
          </Link>
          <Link href="/login" className="text-sm font-semibold text-[#D4AF37]">
            Sign In
          </Link>
        </div>

        {/* Header phải (Chỉ hiện trên Desktop) */}
        <header className="hidden md:flex items-center justify-end gap-8 p-8 lg:px-12 text-sm font-medium">
          <Link
            href="/features"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-[#D4AF37] hover:text-[#E5C158] transition-colors font-semibold"
          >
            Sign In
          </Link>
        </header>

        {/* Nội dung trung tâm (Nơi hiển thị Form Login / Register) */}
        <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>

        {/* Footer phải */}
        <footer className="flex flex-col sm:flex-row items-center justify-center md:justify-between gap-4 p-6 md:p-8 lg:px-12 text-[11px] sm:text-xs text-gray-500">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/privacy"
              className="hover:text-gray-300 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-gray-300 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/help"
              className="hover:text-gray-300 transition-colors"
            >
              Help Center
            </Link>
          </div>
          <p>© 2024 TaleX Cinema. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
