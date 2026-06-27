"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Checkbox, Dialog, ScrollArea } from "radix-ui";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils/utils";
import {
  acceptNewTerms,
  creatorOnboardingKeys,
  getActiveCreatorTerms,
  registerCreator,
  type CreatorTermsVersion,
} from "@/features/creator-dashboard/api/creator-onboarding-api";
import {
  isFullProfile,
  useAuthStore,
} from "@/features/auth/store/auth.store";

type TermsAcceptanceModalProps = {
  mode: "register" | "update";
  termsData?: CreatorTermsVersion | null;
};

function DialogContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md" />
      <Dialog.Content
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-1rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[#7C766B]/20 bg-[#121214] shadow-[0_28px_90px_rgba(0,0,0,0.68)] outline-none sm:w-[calc(100vw-2rem)]",
          className,
        )}
      >
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

function DialogHeader({ children }: { children: ReactNode }) {
  return (
    <div className="shrink-0 border-b border-white/10 px-4 py-4 sm:px-8 sm:py-5">
      {children}
    </div>
  );
}

function DialogTitle({ children }: { children: ReactNode }) {
  return (
    <Dialog.Title className="font-heading text-xl font-black tracking-tight text-[#D4AF37] sm:text-3xl">
      {children}
    </Dialog.Title>
  );
}

function DialogDescription({ children }: { children: ReactNode }) {
  return (
    <Dialog.Description className="mt-2 text-sm font-medium leading-6 text-[#D1D1D1]">
      {children}
    </Dialog.Description>
  );
}

function readErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Không thể xử lý điều khoản. Vui lòng thử lại.";
}

export function TermsAcceptanceModal({
  mode,
  termsData,
}: TermsAcceptanceModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [agreed, setAgreed] = useState(false);
  const creatorName = isFullProfile(user) ? user.fullName : undefined;

  const termsQuery = useQuery({
    queryKey: creatorOnboardingKeys.activeCreatorTerms(),
    queryFn: getActiveCreatorTerms,
    enabled: mode === "register",
    staleTime: 60 * 1000,
    retry: 1,
  });

  const activeTerms =
    mode === "register" ? termsQuery.data : (termsData ?? undefined);
  const canSubmit = Boolean(activeTerms?.id) && agreed;

  const registerMutation = useMutation({
    mutationFn: registerCreator,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: creatorOnboardingKeys.ownCreator(),
      });
    },
  });

  const acceptTermsMutation = useMutation({
    mutationFn: acceptNewTerms,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: creatorOnboardingKeys.ownCreator(),
      });
    },
  });

  const isSubmitting =
    registerMutation.isPending || acceptTermsMutation.isPending;
  const actionError = registerMutation.error ?? acceptTermsMutation.error;
  const titleSuffix = mode === "register" ? "đăng ký" : "cập nhật";

  const description = useMemo(() => {
    if (mode === "register") {
      return creatorName
        ? `${creatorName}, vui lòng đọc và chấp nhận điều khoản trước khi vào Creator Studio.`
        : "Vui lòng đọc và chấp nhận điều khoản trước khi vào Creator Studio.";
    }

    return "TaleX vừa cập nhật điều khoản cho nhà sáng tạo. Bạn cần chấp nhận phiên bản mới để tiếp tục quản lý nội dung.";
  }, [creatorName, mode]);

  function handleSubmit() {
    if (!activeTerms?.id || !agreed || isSubmitting) {
      return;
    }

    if (mode === "register") {
      registerMutation.mutate(activeTerms.id);
      return;
    }

    acceptTermsMutation.mutate(activeTerms.id);
  }

  return (
    <Dialog.Root open>
      <DialogContent>
        <DialogHeader>
          <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 sm:grid-cols-[52px_minmax(0,1fr)] sm:gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_24px_rgba(212,175,55,0.12)] sm:h-12 sm:w-12">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div className="min-w-0">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#7C766B] sm:text-xs sm:tracking-[0.24em]">
                TaleX Creator Program
              </p>
              <DialogTitle>Điều khoản Nhà Sáng Tạo TaleX</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-8 sm:py-5">
          <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3 text-xs font-bold text-[#7C766B]">
            <span>
              Phiên bản:{" "}
              <span className="text-[#D4AF37]">
                {activeTerms?.version ?? "đang tải"}
              </span>
            </span>
            <span>{titleSuffix}</span>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">
            {mode === "register" && termsQuery.isLoading ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-[#D1D1D1]">
                <Loader2 className="h-7 w-7 animate-spin text-[#D4AF37]" />
                <p className="text-sm font-bold">Đang tải điều khoản...</p>
              </div>
            ) : termsQuery.isError ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <p className="font-heading text-lg font-black text-[#D4AF37]">
                  Không thể tải điều khoản
                </p>
                <p className="mt-2 text-sm font-medium text-gray-400">
                  {readErrorMessage(termsQuery.error)}
                </p>
              </div>
            ) : !activeTerms?.content ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <p className="font-heading text-lg font-black text-[#D4AF37]">
                  Chưa có nội dung điều khoản
                </p>
                <p className="mt-2 text-sm font-medium text-gray-400">
                  BE chưa trả về termsVersion hợp lệ cho luồng này.
                </p>
              </div>
            ) : (
              <ScrollArea.Root className="h-full w-full">
                <ScrollArea.Viewport className="h-full w-full">
                  <div
                    className="space-y-4 px-4 py-4 text-sm font-medium leading-7 text-gray-300 sm:px-5 sm:py-5 [&_a]:text-[#D4AF37] [&_h1]:font-heading [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-white [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-white [&_h3]:font-heading [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-6"
                    dangerouslySetInnerHTML={{ __html: activeTerms.content }}
                  />
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar
                  orientation="vertical"
                  className="flex w-2.5 touch-none select-none bg-white/5 p-0.5"
                >
                  <ScrollArea.Thumb className="relative flex-1 rounded-full bg-[#7C766B]/60" />
                </ScrollArea.Scrollbar>
              </ScrollArea.Root>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/10 px-4 py-4 sm:px-8 sm:py-5">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl px-1 py-2 text-sm font-semibold leading-6 text-gray-300 sm:px-0">
            <Checkbox.Root
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[#7C766B]/60 bg-black/40 text-black outline-none transition data-[state=checked]:border-[#D4AF37] data-[state=checked]:bg-[#D4AF37] focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
            >
              <Checkbox.Indicator>
                <Check className="h-4 w-4 stroke-[3]" />
              </Checkbox.Indicator>
            </Checkbox.Root>
            <span>
              Tôi đã đọc và đồng ý với các điều khoản dành cho Nhà Sáng Tạo
              TaleX.
            </span>
          </label>

          {actionError && (
            <div className="mt-3 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
              {readErrorMessage(actionError)}
            </div>
          )}

          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
              disabled={isSubmitting}
              className="h-12 border-[#7C766B]/50 bg-transparent px-5 text-base font-black text-[#7C766B] hover:border-[#D4AF37]/50 hover:bg-white/[0.03] hover:text-[#D4AF37] sm:h-14"
            >
              Từ chối / Quay lại trang chủ
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="h-12 bg-[#D4AF37] px-6 text-base font-black text-black shadow-[0_0_28px_rgba(212,175,55,0.22)] hover:bg-[#E7C85A] hover:shadow-[0_0_38px_rgba(212,175,55,0.34)] disabled:bg-[#7C766B] disabled:text-black disabled:opacity-45 sm:h-14"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Chấp nhận
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog.Root>
  );
}
