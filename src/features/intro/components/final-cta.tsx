import Link from "next/link";

export function FinalCta() {
  return (
    <section className="relative w-full py-32 md:py-48 overflow-hidden flex items-center justify-center">
      {/* Lớp nền hình ảnh (Dãy núi cinematic) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2560&auto=format&fit=crop')] bg-cover bg-bottom opacity-50" />
        {/* Lớp phủ Gradient: Làm tối ở trên và dưới để hòa quyện mượt mà với phần Creators và Footer */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Nội dung trung tâm */}
      <div className="container relative z-10 px-4 mx-auto text-center flex flex-col items-center">
        <h2 className="text-5xl md:text-6xl font-extrabold font-heading text-white mb-6 tracking-tight drop-shadow-lg">
          Your Next Story Begins <br className="hidden md:block" /> Here
        </h2>

        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mb-10 font-sans">
          Join a global community of dreamers, watchers, and readers.{" "}
          <br className="hidden md:block" />
          Experience the future of the storytelling universe today.
        </p>

        {/* 2 Nút bấm (Thiết kế bo góc nhẹ rounded-xl giống bản cập nhật mới nhất) */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <Link
            href="/series"
            className="flex items-center justify-center w-full sm:w-auto px-10 py-4 rounded-xl bg-[#C1A04F] text-black font-bold text-lg transition-all hover:bg-[#D4AF37] hover:scale-105 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
          >
            Start Watching
          </Link>

          <Link
            href="/comics"
            className="flex items-center justify-center w-full sm:w-auto px-10 py-4 rounded-xl border border-white/20 bg-black/40 backdrop-blur-md text-white font-bold text-lg transition-all hover:bg-white/10 hover:border-white/40 hover:scale-105"
          >
            Start Reading
          </Link>
        </div>
      </div>
    </section>
  );
}
