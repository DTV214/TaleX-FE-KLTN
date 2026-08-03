import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { VerifyOtpForm } from "@/features/auth/components/verify-otp-form";

export const metadata = {
  title: "Xác thực OTP — TaleX",
};

function VerifyOtpFallback() {
  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] p-8 shadow-2xl backdrop-blur-xl sm:p-10">
      <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Suspense fallback={<VerifyOtpFallback />}>
        <VerifyOtpForm />
      </Suspense>
    </div>
  );
}
