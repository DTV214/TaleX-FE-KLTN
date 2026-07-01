import type { Metadata } from "next";
import { Montserrat, DM_Sans } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/shared/ui/site-header";
import { SiteFooter } from "@/shared/ui/site-footer";
import { BackToTop } from "@/shared/ui/back-to-top";
import { FloatingPremiumButton } from "@/features/premium/components/floating-premium-button";
import { AppProviders } from "@/core/providers/app-providers";
// Thêm đường dẫn import cho AuthProvider vừa tạo ở bước trước
import { AuthProvider } from "@/features/auth/providers/auth-provider";

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
  title: "TaleX - Nơi Câu Chuyện Trở Nên Sống Động",
  description: "Nền tảng kể chuyện qua video ngắn, truyện tranh và hoạt hình.",
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
        <AppProviders>
          {/* Bọc AuthProvider ở đây để đảm bảo mọi component bên trong (bao gồm SiteHeader)
            đều có thể truy cập và lắng nghe trạng thái đăng nhập toàn cục từ Zustand Store.
          */}
          <AuthProvider>
            {/* Navbar nằm ở vị trí cao nhất */}
            <SiteHeader />

            {/* Vùng chứa nội dung chính sẽ tự động đẩy giãn nhờ flex-1 */}
            <main className="flex-1 flex flex-col">{children}</main>

            {/* Footer luôn nằm ở dưới cùng của mọi trang */}
            <SiteFooter />

            <BackToTop />
            <FloatingPremiumButton />
          </AuthProvider>
        </AppProviders>
      </body>
    </html>
  );
}
