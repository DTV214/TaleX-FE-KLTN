import Link from "next/link";
import { siteConfig } from "@/core/config/site";
import { AtSign, Code, Video } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-white/10 bg-black/60 backdrop-blur-lg">
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Cột 1: Logo và Mô tả ngắn */}
          <div className="md:col-span-1 lg:col-span-2 flex flex-col items-start">
            <Link href="/" className="mb-4">
              <span className="text-3xl font-bold font-heading text-primary tracking-wider drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]">
                {siteConfig.name}
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm mb-6 leading-relaxed">
              {siteConfig.description}
            </p>
            {/* Mạng xã hội */}
            <div className="flex space-x-4">
              <Link
                href={siteConfig.links.twitter}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <AtSign className="h-5 w-5" />
              </Link>
              <Link
                href={siteConfig.links.github}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Code className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Video className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Cột 2: Điều hướng nền tảng */}
          <div>
            <h4 className="text-foreground font-bold mb-4 uppercase text-sm tracking-wider">
              Platform
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/series"
                  className="hover:text-primary transition-colors"
                >
                  Series
                </Link>
              </li>
              <li>
                <Link
                  href="/comics"
                  className="hover:text-primary transition-colors"
                >
                  Comics
                </Link>
              </li>
              <li>
                <Link
                  href="/creator"
                  className="hover:text-primary transition-colors"
                >
                  Creator Program
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-primary transition-colors"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Trợ giúp & Pháp lý */}
          <div>
            <h4 className="text-foreground font-bold mb-4 uppercase text-sm tracking-wider">
              Support
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/faq"
                  className="hover:text-primary transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-primary transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Thanh bản quyền dưới cùng */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p className="flex items-center gap-1">
            Made with <span className="text-secondary">♥</span> for
            storytellers.
          </p>
        </div>
      </div>
    </footer>
  );
}
