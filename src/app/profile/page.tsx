import { ProfileView } from "@/features/auth/components/profile-view";
import { Metadata } from "next";

// Cấu hình thẻ meta (Tiêu đề tab trình duyệt) cho chuẩn SEO
export const metadata: Metadata = {
  title: "Hồ sơ cá nhân | TaleX",
  description: "Quản lý thông tin cá nhân, liên hệ và tài khoản TaleX của bạn.",
};

export default function ProfilePage() {
  return (
    // Container căn giữa màn hình, có padding trên dưới để không bị dính sát lề
    <div className="container mx-auto px-4 py-12 md:py-20 flex-1">
      <ProfileView />
    </div>
  );
}
