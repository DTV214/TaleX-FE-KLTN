"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Dialog, ScrollArea } from "radix-ui";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils/utils";
import {
  acceptNewTerms,
  creatorOnboardingKeys,
  getActiveCreatorTerms,
  registerCreator,
  type CreatorTermsVersion,
} from "@/features/creator-dashboard/api/creator-onboarding-api";

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
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md" />
      <Dialog.Content
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
        className={cn(
          /* Thay max-h thành h-[80vh] max-h-[620px] cố định để ép nội dung phải sinh ra thanh cuộn khi quá dài */
          "fixed left-1/2 top-1/2 z-50 flex h-[80vh] max-h-[620px] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[#7C766B]/20 bg-[#121214] p-5 sm:p-7 shadow-[0_28px_90px_rgba(0,0,0,0.68)] outline-none",
          className,
        )}
      >
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

function DialogTitle({ children }: { children: ReactNode }) {
  return (
    <Dialog.Title className="font-heading text-xl font-black tracking-tight text-[#D4AF37] sm:text-2xl">
      {children}
    </Dialog.Title>
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
  const [agreed] = useState(true);

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
        {/* Header cố định */}
        <div className="mb-5 text-center shrink-0">
          <DialogTitle>Điều Khoản và Điều Kiện</DialogTitle>
          {mode === "update" && (
            <p className="mt-1 text-xs text-amber-500/90 font-medium italic">
              * Điều khoản vừa được cập nhật phiên bản mới
            </p>
          )}
        </div>

        {/* Khung chứa điều khoản - Đã tối ưu Flexbox kết hợp ScrollArea */}
        <div className="flex-1 min-h-0 w-full overflow-hidden rounded-xl border border-white/10 bg-black/30 mb-5 flex flex-col">
          {mode === "register" && termsQuery.isLoading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-[#D1D1D1]">
              <Loader2 className="h-7 w-7 animate-spin text-[#D4AF37]" />
              <p className="text-sm font-bold">Đang tải điều khoản...</p>
            </div>
          ) : termsQuery.isError ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <p className="font-heading text-base font-black text-[#D4AF37]">
                Không thể tải điều khoản
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {readErrorMessage(termsQuery.error)}
              </p>
            </div>
          ) : !activeTerms?.content ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <p className="font-heading text-base font-black text-[#D4AF37]">
                Chưa có nội dung điều khoản
              </p>
            </div>
          ) : (
            /* Thêm [&>div]:!block để sửa lỗi tính toán layout display table mặc định của Radix UI */
            <ScrollArea.Root className="flex-1 h-full w-full overflow-hidden">
              <ScrollArea.Viewport className="h-full w-full [&>div]:!block">
                <div
                  className="space-y-4 px-4 py-4 text-xs font-medium leading-6 text-gray-400 sm:px-6 [&_a]:text-[#D4AF37] [&_h1]:font-heading [&_h1]:text-xl [&_h1]:font-black [&_h1]:text-white [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-black [&_h2]:text-white [&_h3]:font-heading [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-white [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-6"
                  dangerouslySetInnerHTML={{ __html: activeTerms.content }}
                />
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar
                orientation="vertical"
                className="flex w-2 touch-none select-none bg-white/5 p-0.5"
              >
                <ScrollArea.Thumb className="relative flex-1 rounded-full bg-[#7C766B]/40" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          )}
        </div>

        {/* Footer chứa cụm nút điều hướng */}
        <div className="flex flex-col shrink-0 w-full">
          {actionError && (
            <div className="w-full mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-200 text-center">
              {readErrorMessage(actionError)}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-center w-full">
            {/* Đổi hover sang màu trắng sáng rực rỡ và thêm active:scale-95 để tạo hiệu ứng đàn hồi khi bấm */}
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
              disabled={isSubmitting}
              className="h-10 border-[#7C766B]/50 bg-transparent px-8 text-xs font-bold text-[#7C766B] hover:border-white hover:bg-white/10 hover:text-white active:bg-white/20 active:scale-95 rounded-lg w-full sm:w-32 transition-all duration-200"
            >
              Quay lại
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="h-10 bg-[#D4AF37] px-8 text-xs font-black text-black shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:bg-[#E7C85A] active:scale-95 disabled:bg-[#7C766B] disabled:text-black disabled:opacity-45 rounded-lg w-full sm:w-32 uppercase tracking-wider transition-all duration-200"
            >
              {isSubmitting && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
              Đồng ý
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog.Root>
  );
}