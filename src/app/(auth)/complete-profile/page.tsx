import { CompleteProfileForm } from "@/features/auth/components/complete-profile-form";

export const metadata = {
  title: "Hoàn tất hồ sơ — TaleX",
};

export default function CompleteProfilePage() {
  return (
    <div className="w-full max-w-md mx-auto">
      <CompleteProfileForm />
    </div>
  );
}
