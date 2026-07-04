import { ProfileView } from "@/features/auth/components/profile-view";
import { UpdateProfileForm } from "@/features/auth/components/update-profile-form";
// 1. Thêm dòng import này:
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { CoinTransactionHistory } from "@/features/coin";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hồ sơ cá nhân | TaleX",
  description: "Quản lý thông tin cá nhân, liên hệ và tài khoản TaleX của bạn.",
};

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-white">
          Cài Đặt Tài Khoản
        </h1>
        <p className="mt-2 text-sm font-medium leading-relaxed text-white/55">
          Quản lý thông tin cá nhân và bảo mật của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <ProfileView />
        </div>

        <div className="space-y-8 lg:col-span-8">
          <UpdateProfileForm />
          {/* 2. Gọi Component ChangePasswordForm ở đây */}
          <ChangePasswordForm />
          <CoinTransactionHistory />
        </div>
      </div>
    </div>
  );
}
