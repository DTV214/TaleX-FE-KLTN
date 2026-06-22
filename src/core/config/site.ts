export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "TaleX",
  description:
    "Where Stories Come Alive - Nền tảng kể chuyện qua video ngắn, manga và animation.",
  // Đường dẫn Logo (hiện tại ta để rỗng hoặc text, sau này có file ảnh logo chỉ cần đổi ở đây)
  logo: "",

  // Cấu hình thanh điều hướng chính (Main Navigation)
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Introduction",
      href: "/intro",
    },
    {
      title: "Series",
      href: "/series",
    },
    {
      title: "Comics",
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
