import type { Metadata } from "next";
import { Montserrat, DM_Sans } from "next/font/google";
import "./globals.css";
// Thêm đường dẫn import cho Navbar và Footer
import { SiteHeader } from "@/shared/ui/site-header";
import { SiteFooter } from "@/shared/ui/site-footer";
import { BackToTop } from "@/shared/ui/back-to-top";
import { AppProviders } from "@/core/providers/app-providers";

// Font cho Tiêu đề (Headlines) - Hỗ trợ chuẩn vietnamese
const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  variable: "--font-heading",
  display: "swap",
});

// Font cho Văn bản (Body/Labels) - Đã sửa lỗi TypeScript
const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TaleX - Where Stories Come Alive",
  description: "Nền tảng kể chuyện qua video ngắn, manga và animation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${montserrat.variable} font-sans antialiased bg-background text-foreground flex min-h-screen flex-col relative`}
        suppressHydrationWarning
      >
        {/* Navbar nằm ở vị trí cao nhất */}
        <AppProviders>
          <SiteHeader />

        {/* Vùng chứa nội dung chính sẽ tự động đẩy giãn nhờ flex-1 */}
          <main className="flex-1 flex flex-col">{children}</main>

        {/* Footer luôn nằm ở dưới cùng của mọi trang */}
          <SiteFooter />

          <BackToTop />
        </AppProviders>
      </body>
    </html>
  );
}
