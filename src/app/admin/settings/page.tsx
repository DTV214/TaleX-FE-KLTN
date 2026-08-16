"use client";

import {
  CreditCard,
  Image as ImageIcon,
  Key,
  Mail,
  Moon,
  Settings as SettingsIcon,
  Shield,
  Sun,
  type LucideIcon,
} from "lucide-react";

import { useBackofficeTheme } from "@/shared/ui/backoffice-theme-provider";

type SettingItem = {
  name: string;
  description: string;
  icon: LucideIcon;
};

const comingSoonItems: SettingItem[] = [
  {
    name: "Bảo mật",
    description: "Cấu hình bảo mật quản trị sẽ được kết nối API sau.",
    icon: Shield,
  },
  {
    name: "Cổng thanh toán",
    description: "Quản lý payment gateway đang trong giai đoạn phát triển.",
    icon: CreditCard,
  },
  {
    name: "Mẫu email",
    description: "Bộ mẫu thông báo hệ thống chưa mở thao tác chỉnh sửa.",
    icon: Mail,
  },
  {
    name: "API keys",
    description: "Khu vực khóa tích hợp sẽ được bổ sung khi BE sẵn sàng.",
    icon: Key,
  },
  {
    name: "Media config",
    description: "Cấu hình media nâng cao tạm thời chưa hiển thị tại settings.",
    icon: ImageIcon,
  },
];

export default function SettingsPage() {
  const { isDark, toggleTheme } = useBackofficeTheme();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <div>
        <p className="mb-3 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-700 backoffice-dark:border-[var(--backoffice-primary)]/35 backoffice-dark:bg-[var(--backoffice-primary)]/10 backoffice-dark:text-[var(--backoffice-primary)]">
          Admin Settings
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 backoffice-dark:text-white">
          Cài đặt hệ thống
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-gray-500 backoffice-dark:text-white/55">
          Hiện tại trang này chỉ mở cấu hình giao diện Admin/Staff. Các nhóm cấu
          hình chưa có API thật sẽ được khóa để tránh thao tác nhầm.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          <button
            type="button"
            className="flex items-center gap-3 rounded-xl bg-[#00D1FF] px-4 py-3 text-left text-sm font-bold text-white shadow-md shadow-[#00D1FF]/20 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black backoffice-dark:shadow-[0_12px_30px_rgba(212,175,55,0.14)]"
          >
            <SettingsIcon className="h-5 w-5" />
            Giao diện
          </button>

          {comingSoonItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                type="button"
                disabled
                className="flex cursor-not-allowed items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-gray-400 opacity-75 backoffice-dark:text-white/35"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  {item.name}
                </span>
                <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 backoffice-dark:border-white/10 backoffice-dark:text-white/35">
                  Dev
                </span>
              </button>
            );
          })}
        </aside>

        <main className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] sm:p-8">
          <section>
            <div className="mb-6 flex items-center gap-2 text-[#007A8A] backoffice-dark:text-[var(--backoffice-primary)]">
              {isDark ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              <h2 className="text-lg font-bold">Giao diện Admin/Staff</h2>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50/80 p-5 backoffice-dark:border-white/10 backoffice-dark:bg-black/25 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 backoffice-dark:text-white">
                  Chế độ sáng / tối
                </h3>
                <p className="mt-1 max-w-2xl text-xs font-medium leading-5 text-gray-500 backoffice-dark:text-white/55">
                  Light giữ tông quản trị hiện tại. Dark dùng tông cinematic
                  đen/vàng đồng bộ với trải nghiệm TaleX.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                role="switch"
                aria-checked={isDark}
                aria-label={
                  isDark
                    ? "Đang dùng giao diện tối"
                    : "Đang dùng giao diện sáng"
                }
                className="backoffice-theme-switch relative inline-flex h-8 w-16 shrink-0 items-center rounded-full border transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/35"
              >
                <span
                  className={`backoffice-theme-switch-knob inline-flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-200 ${
                    isDark ? "translate-x-8" : "translate-x-1"
                  }`}
                >
                  {isDark ? (
                    <Moon className="h-3.5 w-3.5" />
                  ) : (
                    <Sun className="h-3.5 w-3.5" />
                  )}
                </span>
              </button>
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 backoffice-dark:text-white">
                Cấu hình đang phát triển
              </h2>
              <p className="mt-1 text-sm font-medium text-gray-500 backoffice-dark:text-white/55">
                Các mục dưới đây được khóa tạm thời, không dùng dữ liệu hard
                code và không gửi thao tác lên hệ thống.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {comingSoonItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.name}
                    className="rounded-2xl border border-dashed border-gray-200 bg-black-50/70 p-4 opacity-80 backoffice-dark:border-white/10 backoffice-dark:bg-[#0b0b0d] backoffice-dark:opacity-100"
                  >
                    <div className="flex items-start gap-3">
                      <span className="rounded-xl bg-white p-2 text-gray-400 shadow-sm backoffice-dark:bg-black backoffice-dark:text-white/70">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-gray-700 backoffice-dark:text-white">
                            {item.name}
                          </h3>
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700 backoffice-dark:border-[var(--backoffice-primary)]/30 backoffice-dark:bg-[var(--backoffice-primary)]/10 backoffice-dark:text-[var(--backoffice-primary)]">
                            Đang phát triển
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium leading-5 text-gray-500 backoffice-dark:text-white/65">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
