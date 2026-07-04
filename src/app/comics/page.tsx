import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  Crown,
  Eye,
  Flame,
  Heart,
  Library,
  Rocket,
  Sparkles,
  Star,
  Swords,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ComicItem = {
  id: number;
  title: string;
  chapter: string;
  img: string;
};

type ContinueItem = ComicItem & {
  progress: string;
  percent: number;
};

type GenreItem = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  className: string;
};

type EditorPickItem = {
  id: number;
  title: string;
  description: string;
  tag: string;
  img: string;
};

const heroComic = {
  title: "CELESTIAL VANGUARD",
  description:
    "Khi cánh cổng thiên giới mở ra giữa thành phố đổ nát, một đội tiên phong trẻ tuổi phải lựa chọn giữa lời thề bảo vệ nhân loại và bí mật bị chôn giấu của chính họ.",
  views: "12,8 Tr lượt đọc",
  rating: "4.9",
  cover:
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=2200&auto=format&fit=crop",
};

const continueReading: ContinueItem[] = [
  {
    id: 1,
    title: "Ma Tôn Bản Truyền Kỳ",
    chapter: "Chapter 124",
    progress: "Đã đọc 78%",
    percent: 78,
    img: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Huyết Nguyệt Cổ Thành",
    chapter: "Chapter 48",
    progress: "Đã đọc 41%",
    percent: 41,
    img: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Thiên Sứ Gác Đêm",
    chapter: "Chapter 86",
    progress: "Đã đọc 63%",
    percent: 63,
    img: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Kẻ Vẽ Sao Băng",
    chapter: "Chapter 31",
    progress: "Đã đọc 25%",
    percent: 25,
    img: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?q=80&w=900&auto=format&fit=crop",
  },
];

const newReleases: ComicItem[] = [
  {
    id: 1,
    title: "Ma Tôn Bản Truyền Kỳ",
    chapter: "Chapter 124",
    img: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Vệ Binh Thiên Hà Đen",
    chapter: "Chapter 57",
    img: "https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Lời Nguyền Học Viện",
    chapter: "Chapter 92",
    img: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Đế Chế Hoa Tuyết",
    chapter: "Chapter 16",
    img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "Nữ Hoàng Bóng Tối",
    chapter: "Chapter 203",
    img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: 6,
    title: "Sổ Tay Diệt Quỷ",
    chapter: "Chapter 75",
    img: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: 7,
    title: "Thành Phố Neon Rực Cháy",
    chapter: "Chapter 41",
    img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: 8,
    title: "Cánh Cổng Linh Hồn",
    chapter: "Chapter 108",
    img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: 9,
    title: "Hồ Ly Và Kiếm Sĩ",
    chapter: "Chapter 66",
    img: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: 10,
    title: "Kỵ Sĩ Không Mặt",
    chapter: "Chapter 19",
    img: "https://images.unsplash.com/photo-1520509414578-d9cbf09933a1?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: 11,
    title: "Bản Giao Hưởng Hư Không",
    chapter: "Chapter 134",
    img: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: 12,
    title: "Người Giữ Mưa Sao",
    chapter: "Chapter 28",
    img: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=900&auto=format&fit=crop",
  },
];

const webtoonAdaptations: ComicItem[] = [
  {
    id: 101,
    title: "Solo Leveling: Hậu Nhật Thực",
    chapter: "Chapter 34",
    img: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: 102,
    title: "Tòa Tháp Vô Tận",
    chapter: "Chapter 87",
    img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: 103,
    title: "Nàng Thơ Của Quỷ Vương",
    chapter: "Chapter 52",
    img: "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: 104,
    title: "Hợp Đồng Định Mệnh",
    chapter: "Chapter 71",
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: 105,
    title: "Thợ Săn Vực Sâu",
    chapter: "Chapter 45",
    img: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: 106,
    title: "Ánh Sáng Cuối Cùng",
    chapter: "Chapter 98",
    img: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=900&auto=format&fit=crop",
  },
];

const genres: GenreItem[] = [
  {
    title: "Action",
    subtitle: "Chiến đấu",
    icon: Swords,
    className: "from-[#3A0609] via-[#7A1118] to-[#E50914]",
  },
  {
    title: "Romance",
    subtitle: "Cảm xúc",
    icon: Heart,
    className: "from-[#321026] via-[#7A1F52] to-[#D4AF37]",
  },
  {
    title: "Fantasy",
    subtitle: "Huyền giới",
    icon: Sparkles,
    className: "from-[#14102D] via-[#34216A] to-[#6D5BD0]",
  },
  {
    title: "Sci-Fi",
    subtitle: "Tương lai",
    icon: Rocket,
    className: "from-[#062422] via-[#0B5B52] to-[#2EC4B6]",
  },
  {
    title: "Trending",
    subtitle: "Đang hot",
    icon: Flame,
    className: "from-[#2B1403] via-[#8C3D0A] to-[#D4AF37]",
  },
];

const editorPicks: EditorPickItem[] = [
  {
    id: 201,
    title: "Bên Kia Cánh Cổng Thiên Giới",
    description:
      "Một series dark fantasy có nhịp truyện chặt, nét vẽ lạnh và những trận chiến được dựng như điện ảnh.",
    tag: "Editor's Choice",
    img: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: 202,
    title: "Bản Đồ Sao Và Lời Thề Máu",
    description:
      "Cuộc hành trình của nhóm thợ săn cổ vật trong một thế giới nơi ký ức có thể bị mua bán.",
    tag: "Dark Fantasy",
    img: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: 203,
    title: "Học Viện Sau Nửa Đêm",
    description:
      "Một webtoon học đường bí ẩn, càng đọc càng thấy những chi tiết nhỏ kết nối đáng sợ.",
    tag: "Mystery",
    img: "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: 204,
    title: "Người Máy Biết Mơ",
    description:
      "Tựa sci-fi giàu cảm xúc về một thành phố neon và linh hồn cuối cùng còn sót lại trong máy móc.",
    tag: "Sci-Fi",
    img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1400&auto=format&fit=crop",
  },
];

export default function ComicsPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0C] pb-24 font-sans text-white">
      <HeroBanner />

      <div className="relative z-10 -mt-20 max-w-[100vw] space-y-14 px-4 md:px-12 xl:px-16">
        <ContinueReadingSection />
        <ComicGridSection
          title="Mới phát hành"
          href="/comics/new-releases"
          items={newReleases}
        />
        <GenreSection />
        <ComicGridSection
          title="Webtoon chuyển thể"
          href="/comics/webtoon-adaptations"
          items={webtoonAdaptations}
        />
        <EditorPicksSection />
      </div>
    </main>
  );
}

function HeroBanner() {
  return (
    <section className="relative h-[70vh] min-h-[580px] w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroComic.cover})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0C] via-[#0B0B0C]/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C]/20 to-transparent" />

      <div className="relative z-10 flex h-full max-w-4xl flex-col justify-center px-4 pt-16 md:px-12 xl:px-16">
        <span className="mb-5 inline-flex w-fit items-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#D4AF37]">
          Cập nhật mới
        </span>

        <h1 className="font-heading text-5xl font-extrabold leading-none tracking-tight text-white md:text-7xl">
          {heroComic.title}
        </h1>

        <p className="mt-6 max-w-2xl text-sm font-medium leading-relaxed text-white/68 md:text-base">
          {heroComic.description}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-semibold text-white/70">
          <span className="inline-flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#D4AF37]" />
            {heroComic.views}
          </span>
          <span className="inline-flex items-center gap-2">
            <Star className="h-4 w-4 fill-[#D4AF37] text-[#D4AF37]" />
            {heroComic.rating}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-widest text-white/70">
            Dark fantasy
          </span>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/comics/celestial-vanguard"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#E5C158] hover:shadow-[0_0_30px_rgba(212,175,55,0.35)]"
          >
            <BookOpen className="h-5 w-5" />
            Đọc ngay
          </Link>
          <Link
            href="/library"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:border-white/20 hover:bg-white/15"
          >
            <Library className="h-5 w-5" />
            Thư viện
          </Link>
        </div>
      </div>
    </section>
  );
}

function ContinueReadingSection() {
  return (
    <section>
      <SectionHeader title="Tiếp tục đọc" href="/comics/continue-reading" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {continueReading.map((item) => (
          <ContinueReadingCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function ContinueReadingCard({ item }: { item: ContinueItem }) {
  return (
    <Link
      href={`/comics/${item.id}`}
      className="group flex min-w-0 gap-4 rounded-2xl border border-white/5 bg-[#161618] p-3 transition hover:border-[#D4AF37]/35 hover:bg-white/[0.06]"
    >
      <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-xl bg-white/5">
        <div
          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${item.img})` }}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="truncate text-sm font-bold text-white transition group-hover:text-[#D4AF37]">
          {item.title}
        </p>
        <p className="mt-1 text-xs font-semibold text-[#7C766B]">
          {item.chapter}
        </p>
        <p className="mt-3 text-xs font-medium text-white/45">{item.progress}</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#D4AF37]"
            style={{ width: `${item.percent}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

function ComicGridSection({
  title,
  href,
  items,
}: {
  title: string;
  href: string;
  items: ComicItem[];
}) {
  return (
    <section>
      <SectionHeader title={title} href={href} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6 lg:grid-cols-6">
        {items.map((item) => (
          <ComicCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function ComicCard({ item }: { item: ComicItem }) {
  return (
    <Link href={`/comics/${item.id}`} className="group block min-w-0">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/5 bg-[#161618] shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
        <div
          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${item.img})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-70" />
      </div>
      <h3 className="mt-3 truncate text-sm font-bold text-white transition group-hover:text-[#D4AF37] md:text-base">
        {item.title}
      </h3>
      <p className="mt-1 text-xs font-semibold text-[#7C766B]">
        {item.chapter}
      </p>
    </Link>
  );
}

function GenreSection() {
  return (
    <section>
      <SectionHeader title="Chọn thể loại" href="/comics/genres" />

      <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {genres.map((genre) => (
          <GenreCard key={genre.title} genre={genre} />
        ))}
      </div>
    </section>
  );
}

function GenreCard({ genre }: { genre: GenreItem }) {
  const Icon = genre.icon;

  return (
    <Link
      href={`/comics/genres/${genre.title.toLowerCase()}`}
      className={`group relative flex h-36 min-w-[220px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${genre.className} p-5 shadow-[0_18px_45px_rgba(0,0,0,0.35)]`}
    >
      <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/0" />
      <Icon className="relative h-9 w-9 text-white drop-shadow" strokeWidth={1.8} />
      <div className="relative">
        <h3 className="font-heading text-2xl font-bold text-white">
          {genre.title}
        </h3>
        <p className="mt-1 text-sm font-semibold text-white/70">
          {genre.subtitle}
        </p>
      </div>
    </Link>
  );
}

function EditorPicksSection() {
  return (
    <section>
      <SectionHeader title="Lựa chọn của biên tập viên" href="/comics/editor-picks" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {editorPicks.map((item) => (
          <EditorPickCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function EditorPickCard({ item }: { item: EditorPickItem }) {
  return (
    <Link
      href={`/comics/editor-picks/${item.id}`}
      className="group relative block h-56 overflow-hidden rounded-2xl border border-white/5 bg-[#161618] md:h-64"
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
        style={{ backgroundImage: `url(${item.img})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C]/55 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
        <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
          <Crown className="h-3.5 w-3.5" />
          {item.tag}
        </span>
        <h3 className="font-heading text-2xl font-bold tracking-tight text-white">
          {item.title}
        </h3>
        <p className="mt-2 line-clamp-2 max-w-2xl text-sm font-medium leading-relaxed text-white/65">
          {item.description}
        </p>
      </div>
    </Link>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
          TaleX Comics
        </p>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-white md:text-3xl">
          {title}
        </h2>
      </div>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-[#D4AF37] transition hover:text-[#E5C158]"
      >
        Xem tất cả
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
