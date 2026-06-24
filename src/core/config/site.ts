export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "TaleX",
  description:
    "Nơi câu chuyện trở nên sống động - Nền tảng kể chuyện qua video ngắn, truyện tranh và hoạt hình.",
  // Đường dẫn Logo (hiện tại ta để rỗng hoặc text, sau này có file ảnh logo chỉ cần đổi ở đây)
  logo: "",

  // Cấu hình thanh điều hướng chính (Main Navigation)
  mainNav: [
    {
      title: "Trang chủ",
      href: "/",
    },
    {
      title: "Giới thiệu",
      href: "/intro",
    },
    {
      title: "Phim bộ",
      href: "/series",
    },
    {
      title: "Truyện tranh",
      href: "/comics",
    },
    {
      title: "Creator",
      href: "/creator-dashboard",
    },
  ],

  // Cấu hình các liên kết quan trọng khác (Mạng xã hội, Footer...)
  links: {
    twitter: "https://twitter.com/talex",
    github: "https://github.com/talex",
  },
};
