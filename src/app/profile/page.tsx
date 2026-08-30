import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { ProfilePreferencesForm } from "@/features/auth/components/profile-preferences-form";
import { ProfileView } from "@/features/auth/components/profile-view";
import { UpdateProfileForm } from "@/features/auth/components/update-profile-form";
import { CoinBalanceSummary } from "@/features/coin";
import { Badge } from "@/shared/ui/badge";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hồ sơ cá nhân | TaleX",
  description: "Quản lý thông tin cá nhân, liên hệ và tài khoản TaleX của bạn.",
};

export default function ProfilePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080808]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_6%,rgba(212,175,55,0.14),transparent_32%),radial-gradient(circle_at_90%_8%,rgba(125,211,252,0.08),transparent_30%),linear-gradient(135deg,#080808_0%,#111114_52%,#080808_100%)]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 lg:py-10">
        <h1 className="mb-6 text-2xl font-semibold tracking-normal text-white/90 md:text-3xl">
          Hồ sơ cá nhân
        </h1>
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-6">
            <ProfileView />
          </div>

          <div className="space-y-6">
            <UpdateProfileForm />
            <ProfilePreferencesForm />
            <CoinBalanceSummary />
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
