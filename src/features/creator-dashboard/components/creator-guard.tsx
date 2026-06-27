"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import {
  creatorOnboardingKeys,
  getOwnCreator,
  isCreatorNotFoundError,
  shouldRetryOwnCreatorQuery,
} from "@/features/creator-dashboard/api/creator-onboarding-api";
import { TermsAcceptanceModal } from "@/features/creator-dashboard/components/terms-acceptance-modal";

type CreatorGuardProps = {
  children: ReactNode;
};

function CreatorGuardLoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 shadow-[0_0_70px_rgba(212,175,55,0.16)]">
          <div className="absolute inset-0 rounded-full border border-[#D4AF37]/15 animate-ping" />
          <Sparkles className="h-10 w-10 animate-pulse text-[#D4AF37]" />
        </div>
        <p className="font-heading text-3xl font-black tracking-tight text-[#D4AF37]">
          TaleX
        </p>
        <p className="mt-3 text-sm font-bold text-[#D1D1D1]">
          Đang xác thực thông tin...
        </p>
        <div className="mt-8 h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[#D4AF37]" />
        </div>
      </div>
    </main>
  );
}

function LockedCreatorBackdrop() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.16),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(124,118,107,0.18),transparent_30%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-8 blur-sm brightness-50 lg:px-10">
        <aside className="h-20 rounded-2xl border border-white/10 bg-[#121214]/90" />
        <section className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="hidden min-h-[620px] rounded-3xl border border-white/10 bg-[#121214]/80 lg:block" />
          <div className="space-y-6">
            <div className="h-36 rounded-3xl border border-white/10 bg-[#121214]/80" />
            <div className="grid gap-5 md:grid-cols-3">
              <div className="h-28 rounded-2xl border border-white/10 bg-[#121214]/80" />
              <div className="h-28 rounded-2xl border border-white/10 bg-[#121214]/80" />
              <div className="h-28 rounded-2xl border border-white/10 bg-[#121214]/80" />
            </div>
            <div className="h-[420px] rounded-3xl border border-white/10 bg-[#121214]/80" />
          </div>
        </section>
      </div>
    </main>
  );
}

function CreatorGuardErrorScreen({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="max-w-md rounded-2xl border border-red-500/20 bg-[#121214] p-7 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-300">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="font-heading text-2xl font-black text-[#D4AF37]">
          Không thể xác thực Creator
        </h1>
        <p className="mt-3 text-sm font-medium leading-6 text-gray-400">
          {message}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 text-sm font-black text-black transition hover:bg-[#E7C85A]"
        >
          <RefreshCw className="h-4 w-4" />
          Thử lại
        </button>
      </div>
    </main>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Phiên xác thực không hợp lệ hoặc BE chưa sẵn sàng.";
}

export function CreatorGuard({ children }: CreatorGuardProps) {
  const ownCreatorQuery = useQuery({
    queryKey: creatorOnboardingKeys.ownCreator(),
    queryFn: getOwnCreator,
    retry: shouldRetryOwnCreatorQuery,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  if (ownCreatorQuery.isPending) {
    return <CreatorGuardLoadingScreen />;
  }

  if (
    ownCreatorQuery.isError &&
    isCreatorNotFoundError(ownCreatorQuery.error)
  ) {
    return (
      <>
        <LockedCreatorBackdrop />
        <TermsAcceptanceModal mode="register" />
      </>
    );
  }

  if (ownCreatorQuery.isError) {
    return (
      <CreatorGuardErrorScreen
        message={getErrorMessage(ownCreatorQuery.error)}
        onRetry={() => void ownCreatorQuery.refetch()}
      />
    );
  }

  if (
    ownCreatorQuery.isSuccess &&
    ownCreatorQuery.data.isAcceptedLatestTerms === false
  ) {
    return (
      <>
        <LockedCreatorBackdrop />
        <TermsAcceptanceModal
          mode="update"
          termsData={ownCreatorQuery.data.termsVersion}
        />
      </>
    );
  }

  if (
    ownCreatorQuery.isSuccess &&
    ownCreatorQuery.data.isAcceptedLatestTerms === true
  ) {
    return <>{children}</>;
  }

  return (
    <CreatorGuardErrorScreen
      message="Trạng thái Creator không hợp lệ. Vui lòng thử lại."
      onRetry={() => void ownCreatorQuery.refetch()}
    />
  );
}
