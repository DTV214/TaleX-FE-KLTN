import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen w-full bg-[#0B0B0C]">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-white/5 md:flex">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[20000ms] hover:scale-110"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0B0B0C]/40 to-[#0B0B0C]" />

        <div className="relative z-10 p-8 lg:p-12">
          <span className="font-heading text-3xl font-extrabold tracking-widest text-[#D4AF37] drop-shadow-lg">
            TaleX
          </span>
        </div>

        <div className="relative z-10 p-8 lg:p-12">
          <p className="mb-4 text-lg font-medium tracking-wide text-white drop-shadow-md">
            Khám phá thế giới mới.
          </p>
          <div className="h-1 w-16 rounded-full bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
        </div>
      </div>

      <div className="relative flex w-full flex-col md:w-1/2">
        <div className="flex items-center p-6 md:hidden">
          <span className="font-heading text-2xl font-extrabold tracking-widest text-[#D4AF37]">
            TaleX
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>

        <footer className="flex items-center justify-center p-6 text-[11px] text-gray-500 sm:text-xs md:p-8 lg:px-12">
          <p>© 2026 TaleX Cinema. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
