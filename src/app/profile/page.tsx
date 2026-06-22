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
    <div className="container mx-auto px-4 py-12 md:py-20 flex-1 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-wide">
          Cài Đặt Tài Khoản
        </h1>
        <p className="text-gray-400 mt-2">
          Quản lý thông tin cá nhân và bảo mật của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 xl:col-span-4">
          <ProfileView />
        </div>

        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          <UpdateProfileForm />
          {/* 2. Gọi Component ChangePasswordForm ở đây */}
          <ChangePasswordForm />
          <CoinTransactionHistory />
        </div>
      </div>
    </div>
  );
}
