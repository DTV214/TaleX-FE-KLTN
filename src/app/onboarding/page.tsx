import { Suspense } from "react";
import { OnboardingLandingPage } from "@/features/onboarding/components/onboarding-landing-page";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </main>
      }
    >
      <OnboardingLandingPage />
    </Suspense>
  );
}
