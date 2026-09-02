"use client";

import { useState } from "react";
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
import { MediaConfigTab } from "./components/media-config-tab";

type SettingTabId =
  | "appearance"
  | "security"
  | "payment"
  | "email"
  | "apiKeys"
  | "media";

type SettingTab = {
  id: SettingTabId;
  name: string;
  description: string;
  icon: LucideIcon;
};

const settingTabs: SettingTab[] = [
  {
    id: "appearance",
    name: "Giao diện",
    description: "Chuyển đổi giao diện sáng/tối cho khu vực quản trị.",
    icon: SettingsIcon,
  },
  {
    id: "security",
    name: "Bảo mật",
    description: "Khu vực cấu hình chính sách bảo mật quản trị.",
    icon: Shield,
  },
  {
    id: "payment",
    name: "Cổng thanh toán",
    description: "Quản lý cấu hình cổng thanh toán và luồng giao dịch.",
    icon: CreditCard,
  },
  {
    id: "email",
    name: "Mẫu email",
    description: "Quản lý các mẫu thông báo gửi từ hệ thống.",
    icon: Mail,
  },
  {
    id: "apiKeys",
    name: "API keys",
    description: "Quản lý khóa tích hợp và kết nối hệ thống.",
    icon: Key,
  },
  {
    id: "media",
    name: "Media config",
    description: "Cấu hình giới hạn upload media cho creator.",
    icon: ImageIcon,
  },
];

const unlockedPanels: Record<
  Exclude<SettingTabId, "appearance" | "media">,
  {
    title: string;
    items: string[];
  }
> = {
  security: {
    title: "Bảo mật quản trị",
    items: [
      "Chính sách đăng nhập",
      "Phân quyền thao tác nhạy cảm",
      "Theo dõi phiên quản trị",
    ],
  },
  payment: {
    title: "Cổng thanh toán",
    items: [
      "Nhà cung cấp thanh toán",
      "Quy tắc xử lý giao dịch",
      "Đối soát và hoàn tiền",
    ],
  },
  email: {
    title: "Mẫu email hệ thống",
    items: [
      "Thông báo tài khoản",
      "Thông báo giao dịch",
      "Thông báo kiểm duyệt nội dung",
    ],
  },
  apiKeys: {
    title: "Khóa tích hợp",
    items: [
      "Khóa dịch vụ nội bộ",
      "Webhook",
      "Quyền truy cập API",
    ],
  },
};

export default function SettingsPage() {
  const { isDark, toggleTheme } = useBackofficeTheme();
  const [activeTab, setActiveTab] = useState<SettingTabId>("appearance");

  const activeSetting =
    settingTabs.find((tab) => tab.id === activeTab) ?? settingTabs[0];
  const ActiveIcon = activeSetting.icon;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 backoffice-dark:text-white">
          Cài Đặt Hệ Thống
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          {settingTabs.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeTab;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${isActive
                  ? "bg-[#00D1FF] text-white shadow-md shadow-[#00D1FF]/20 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black backoffice-dark:shadow-[0_12px_30px_rgba(212,175,55,0.14)]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 backoffice-dark:text-white/65 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
                  }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="min-w-0 truncate">{item.name}</span>
              </button>
            );
          })}
        </aside>

        <main className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] sm:p-8">
          <div className="mb-8 flex flex-col gap-3 border-b border-slate-100 pb-6 backoffice-dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-[#007A8A] backoffice-dark:bg-[var(--backoffice-primary)]/10 backoffice-dark:text-[var(--backoffice-primary)]">
                <ActiveIcon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-gray-900 backoffice-dark:text-white">
                  {activeSetting.name}
                </h2>
                <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-gray-500 backoffice-dark:text-white/55">
                  {activeSetting.description}
                </p>
              </div>
            </div>
          </div>

          {activeTab === "appearance" ? (
            <AppearancePanel isDark={isDark} toggleTheme={toggleTheme} />
          ) : activeTab === "media" ? (
            <MediaConfigTab />
          ) : (
            <UnlockedSettingsPanel tabId={activeTab} />
          )}
        </main>
      </div>
    </div>
  );
}

function AppearancePanel({
  isDark,
  toggleTheme,
}: {
  isDark: boolean;
  toggleTheme: () => void;
}) {
  return (
    <section>
      <div className="mb-6 flex items-center gap-2 text-[#007A8A] backoffice-dark:text-[var(--backoffice-primary)]">
        {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        <h3 className="text-lg font-bold">Giao diện Admin/Staff</h3>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50/80 p-5 backoffice-dark:border-white/10 backoffice-dark:bg-black/25 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-bold text-gray-900 backoffice-dark:text-white">
            Chế độ sáng / tối
          </h4>
          <p className="mt-1 max-w-2xl text-xs font-medium leading-5 text-gray-500 backoffice-dark:text-white/55">
            Light giữ tông quản trị hiện tại. Dark dùng tông cinematic đen/vàng đồng bộ với trải nghiệm TaleX.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          role="switch"
          aria-checked={isDark}
          aria-label={isDark ? "Đang dùng giao diện tối" : "Đang dùng giao diện sáng"}
          className="backoffice-theme-switch relative inline-flex h-8 w-16 shrink-0 items-center rounded-full border transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/35"
        >
          <span
            className={`backoffice-theme-switch-knob inline-flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-200 ${isDark ? "translate-x-8" : "translate-x-1"
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
  );
}

function UnlockedSettingsPanel({
  tabId,
}: {
  tabId: Exclude<SettingTabId, "appearance" | "media">;
}) {
  const panel = unlockedPanels[tabId];

  return (
    <section className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-gray-900 backoffice-dark:text-white">
          {panel.title}
        </h3>
        <p className="mt-1 text-sm font-medium leading-6 text-gray-500 backoffice-dark:text-white/55">
          Mục này đã được mở trên giao diện settings. Các thao tác dữ liệu sẽ được nối theo API tương ứng khi backend cung cấp endpoint ổn định.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {panel.items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 backoffice-dark:border-white/10 backoffice-dark:bg-black/25"
          >
            <p className="text-sm font-bold text-slate-800 backoffice-dark:text-white">
              {item}
            </p>
            <p className="mt-2 text-xs font-medium leading-5 text-slate-500 backoffice-dark:text-white/50">
              Sẵn sàng cấu hình.
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
