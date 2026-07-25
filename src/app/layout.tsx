import type { Metadata } from "next";
import Script from "next/script";
import { Be_Vietnam_Pro, Montserrat } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/core/providers/app-providers";
// Thêm đường dẫn import cho AuthProvider vừa tạo ở bước trước
import { AuthProvider } from "@/features/auth/providers/auth-provider";
import { PublicLayoutShell } from "@/shared/ui/public-layout-shell";

// Font cho Tiêu đề (Headlines) - Hỗ trợ chuẩn vietnamese
const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  variable: "--font-heading",
  display: "swap",
});

// Font cho Văn bản (Body/Labels)
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
  display: "swap",
});

const enableAdsense = process.env.NEXT_PUBLIC_ENABLE_ADS === "true";
const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "";

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
        className={`${beVietnamPro.variable} ${montserrat.variable} font-sans antialiased bg-background text-foreground flex min-h-screen flex-col relative`}
        suppressHydrationWarning
      >
        {enableAdsense && adsenseClientId ? (
          <Script
            id="google-adsense"
            strategy="afterInteractive"
            async
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
          />
        ) : null}
        <AppProviders>
          {/* Bọc AuthProvider ở đây để đảm bảo mọi component bên trong (bao gồm SiteHeader)
            đều có thể truy cập và lắng nghe trạng thái đăng nhập toàn cục từ Zustand Store.
          */}
          <AuthProvider>
            <PublicLayoutShell>{children}</PublicLayoutShell>
          </AuthProvider>
        </AppProviders>
      </body>
    </html>
  );
}
