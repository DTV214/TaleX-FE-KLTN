import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { CompleteProfileForm } from "@/features/auth/components/complete-profile-form";

export const metadata = {
  title: "Hoàn tất hồ sơ — TaleX",
};

function CompleteProfileFallback() {
  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] p-8 shadow-2xl backdrop-blur-xl sm:p-10">
      <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Suspense fallback={<CompleteProfileFallback />}>
        <CompleteProfileForm />
      </Suspense>
    </div>
  );
}
