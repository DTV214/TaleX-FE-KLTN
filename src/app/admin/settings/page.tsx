"use client";

import { useState } from "react";
import {
  Settings as SettingsIcon,
  Shield,
  CreditCard,
  Mail,
  Key,
  Info,
  ToggleLeft,
  Image as ImageIcon,
  Moon,
  Sun,
} from "lucide-react";

import { MediaConfigTab } from "./components/media-config-tab";
import { useBackofficeTheme } from "@/shared/ui/backoffice-theme-provider";

export default function SettingsPage() {
  const { isDark, toggleTheme } = useBackofficeTheme();
  // Trạng thái cho các tab và toggles
  const [activeTab, setActiveTab] = useState("General");
  const [toggles, setToggles] = useState({
    maintenance: false,
    signups: true,
    socialLogin: true,
  });

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const tabs = [
    { name: "General", icon: SettingsIcon },
    { name: "Security", icon: Shield },
    { name: "Payment Gateways", icon: CreditCard },
    { name: "Email Templates", icon: Mail },
    { name: "API Keys", icon: Key },
    { name: "Media Config", icon: ImageIcon },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* 1. Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
          System Settings
        </h1>
        <p className="text-sm text-gray-500 font-medium">
          Configure global platform parameters and infrastructure preferences.
        </p>
      </div>

      {/* 2. Cấu trúc 2 cột: Menu Tab & Nội dung Form */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Settings Menu */}
        <div className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.name;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? "bg-[#00D1FF] text-white shadow-md shadow-[#00D1FF]/20"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Right Column: Form Cấu hình */}
        <div className="flex-1 w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {activeTab === "General" ? (
            <>
              {/* Section 1: Platform Identity */}
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6 text-[#007A8A]">
                  <Info className="w-5 h-5" />
                  <h3 className="text-lg font-bold">Platform Identity</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Input: Site Name */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-700 tracking-wide">
                      Site Name
                    </label>
                    <input
                      type="text"
                      defaultValue="TaleX Global"
                      className="w-full pb-2 text-sm text-gray-900 bg-transparent border-b border-gray-200 focus:border-[#00D1FF] focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Input: Support Email */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-700 tracking-wide">
                      Support Email
                    </label>
                    <input
                      type="email"
                      defaultValue="support@talex-global.io"
                      className="w-full pb-2 text-sm text-gray-900 bg-transparent border-b border-gray-200 focus:border-[#00D1FF] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Input: Platform URL */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-700 tracking-wide">
                    Platform URL
                  </label>
                  <input
                    type="text"
                    defaultValue="https://admin.talex-global.com"
                    className="w-full pb-2 text-sm text-gray-900 bg-transparent border-b border-gray-200 focus:border-[#00D1FF] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-gray-100 mb-10" />

              {/* Section 2: Backoffice Appearance */}
              <div className="mb-12">
                <div className="mb-6 flex items-center gap-2 text-[#007A8A]">
                  {isDark ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                  <h3 className="text-lg font-bold">Backoffice Appearance</h3>
                </div>

                <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50/80 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Giao diện Admin/Staff
                    </h4>
                    <p className="mt-1 text-xs font-medium leading-5 text-gray-500">
                      Light giữ tông quản trị hiện tại. Dark dùng tông cinematic
                      đen/vàng đồng bộ với trải nghiệm người dùng TaleX.
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
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-gray-100 mb-10" />

              {/* Section 2: Feature Management */}
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-8 text-[#007A8A]">
                  <ToggleLeft className="w-5 h-5" />
                  <h3 className="text-lg font-bold">Feature Management</h3>
                </div>

                <div className="flex flex-col gap-6">
                  {/* Toggle 1: Maintenance Mode */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        Maintenance Mode
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Disable public access to the platform for scheduled updates.
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle("maintenance")}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${toggles.maintenance ? "bg-[#007A8A]" : "bg-gray-200"}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${toggles.maintenance ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </button>
                  </div>

                  {/* Toggle 2: User Signups */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        Enable User Signups
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Allow new visitors to register accounts.
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle("signups")}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${toggles.signups ? "bg-[#007A8A]" : "bg-gray-200"}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${toggles.signups ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </button>
                  </div>

                  {/* Toggle 3: Social Login */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        Social Login
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Allow authentication via Google, Apple, and Discord.
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle("socialLogin")}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${toggles.socialLogin ? "bg-[#007A8A]" : "bg-gray-200"}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${toggles.socialLogin ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-gray-100 mb-8" />

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4">
                <button className="px-6 py-2.5 rounded-full border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                  Reset
                </button>
                {/* Nút Save Changes màu tím bám sát thiết kế */}
                <button className="px-6 py-2.5 rounded-full bg-[#7B42FF] text-sm font-bold text-white shadow-md hover:bg-[#6528F7] transition-all hover:shadow-lg active:scale-95">
                  Save Changes
                </button>
              </div>
            </>
          ) : activeTab === "Media Config" ? (
            <MediaConfigTab />
          ) : (
            <div className="p-8 text-center text-gray-500">
              Content for {activeTab} is not implemented yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
