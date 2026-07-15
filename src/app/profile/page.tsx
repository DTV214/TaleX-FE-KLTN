import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
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
        <div className="mb-6 rounded-2xl border border-white/10 bg-[#121214]/78 p-5 shadow-[0_18px_54px_rgba(0,0,0,0.26)]">
          <Badge variant="premium" className="mb-3 px-3 py-1 text-xs font-medium">
            TaleX Account
          </Badge>
          <h1 className="text-2xl font-semibold tracking-normal text-white/90 md:text-3xl">
            Hồ sơ cá nhân
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Quản lý thông tin tài khoản, bảo mật và số dư coin trong một không gian gọn gàng hơn.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-6">
            <ProfileView />
          </div>

          <div className="space-y-6">
            <UpdateProfileForm />
            <CoinBalanceSummary />
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
