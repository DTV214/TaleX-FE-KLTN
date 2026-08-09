"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  ScrollText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Dialog, ScrollArea } from "radix-ui";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils/utils";
import { renderTermsContent } from "@/shared/utils/terms-content";
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
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/65 backdrop-blur-lg" />
      <Dialog.Content
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex h-[84vh] max-h-[720px] w-[calc(100vw-1.5rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[1.65rem] border border-[#D4AF37]/25 bg-[#101012]/95 p-0 shadow-[0_30px_100px_rgba(0,0,0,0.78),0_0_48px_rgba(212,175,55,0.1)] outline-none",
          className,
        )}
      >
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#F0D36B]/80 to-transparent" />
        <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-10 h-64 w-64 rounded-full bg-[#5F8DF7]/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(212,175,55,0.12),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.055),transparent_42%)]" />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col p-5 sm:p-7">
          {children}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

function DialogTitle({
  children,
  eyebrow,
}: {
  children: ReactNode;
  eyebrow: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#D4AF37]/12 text-[#F3D96E] shadow-[0_0_28px_rgba(212,175,55,0.14)]">
        <ScrollText className="h-7 w-7" />
      </div>
      <div className="min-w-0 text-left">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.28em] text-[#D4AF37]">
          <Sparkles className="h-3.5 w-3.5" />
          {eyebrow}
        </div>
        <Dialog.Title className="font-heading text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
          {children}
        </Dialog.Title>
      </div>
    </div>
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
  const renderedTermsContent = useMemo(
    () => renderTermsContent(activeTerms?.content ?? ""),
    [activeTerms?.content],
  );
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

  const title =
    mode === "register"
      ? "Điều khoản Creator TaleX"
      : "Điều khoản Creator đã cập nhật";
  const description =
    mode === "register"
      ? "Đọc kỹ các cam kết dành cho nhà sáng tạo trước khi bước vào Creator Studio."
      : "TaleX có phiên bản điều khoản mới. Vui lòng xác nhận để tiếp tục sử dụng Creator Studio.";

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
        <div className="mb-6 shrink-0">
          <DialogTitle eyebrow="TaleX Creator">{title}</DialogTitle>
          <p className="mt-3 max-w-2xl text-left text-sm font-semibold leading-6 text-white/58">
            {description}
          </p>
          {mode === "update" && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-xs font-bold text-[#F2D76B]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Phiên bản điều khoản mới cần xác nhận lại
            </p>
          )}
        </div>

        <div className="mb-5 flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
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
          ) : !renderedTermsContent ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <p className="font-heading text-base font-black text-[#D4AF37]">
                Chưa có nội dung điều khoản
              </p>
            </div>
          ) : (
            <ScrollArea.Root className="flex-1 h-full w-full overflow-hidden">
              <ScrollArea.Viewport className="h-full w-full [&>div]:!block">
                <div
                  className="max-w-none px-5 py-5 text-[15px] font-semibold leading-8 text-white/76 sm:px-7 [&_*]:max-w-full [&_.term-callout]:my-4 [&_.term-callout]:rounded-2xl [&_.term-callout]:border [&_.term-callout]:border-[#D4AF37]/25 [&_.term-callout]:bg-[#D4AF37]/10 [&_.term-callout]:p-4 [&_.term-grid]:my-5 [&_.term-grid]:grid [&_.term-grid]:gap-3 [&_.term-grid]:sm:grid-cols-2 [&_.term-note]:rounded-2xl [&_.term-note]:border [&_.term-note]:border-white/10 [&_.term-note]:bg-white/[0.055] [&_.term-note]:p-4 [&_a]:font-bold [&_a]:text-[#F2D76B] [&_blockquote]:my-5 [&_blockquote]:rounded-2xl [&_blockquote]:border-l-4 [&_blockquote]:border-[#D4AF37] [&_blockquote]:bg-[#D4AF37]/10 [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:font-bold [&_blockquote]:text-white/85 [&_h1]:mb-4 [&_h1]:font-heading [&_h1]:text-2xl [&_h1]:font-black [&_h1]:leading-tight [&_h1]:text-white [&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-black [&_h2]:leading-tight [&_h2]:text-white [&_h2]:before:inline-flex [&_h2]:before:h-7 [&_h2]:before:w-7 [&_h2]:before:shrink-0 [&_h2]:before:items-center [&_h2]:before:justify-center [&_h2]:before:rounded-lg [&_h2]:before:border [&_h2]:before:border-[#D4AF37]/30 [&_h2]:before:bg-[#D4AF37]/15 [&_h2]:before:text-[#F2D76B] [&_h2]:before:content-['✦'] [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:font-heading [&_h3]:text-base [&_h3]:font-black [&_h3]:uppercase [&_h3]:tracking-[0.14em] [&_h3]:text-[#F2D76B] [&_li]:my-2 [&_ol]:my-4 [&_ol]:space-y-2 [&_ol]:pl-6 [&_ol_li]:pl-2 [&_ol_li::marker]:font-black [&_ol_li::marker]:text-[#F2D76B] [&_p]:my-3 [&_p]:text-white/74 [&_p]:[text-wrap:pretty] [&_p:first-child]:rounded-2xl [&_p:first-child]:border [&_p:first-child]:border-white/10 [&_p:first-child]:bg-white/[0.045] [&_p:first-child]:p-4 [&_p:first-child]:text-base [&_p:first-child]:font-bold [&_p:first-child]:leading-8 [&_p:first-child]:text-white/82 [&_strong]:font-black [&_strong]:text-white [&_ul]:my-4 [&_ul]:space-y-3 [&_ul]:pl-0 [&_ul_li]:relative [&_ul_li]:list-none [&_ul_li]:rounded-2xl [&_ul_li]:border [&_ul_li]:border-white/10 [&_ul_li]:bg-white/[0.045] [&_ul_li]:py-3 [&_ul_li]:pl-12 [&_ul_li]:pr-4 [&_ul_li]:text-white/78 [&_ul_li]:shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] [&_ul_li]:before:absolute [&_ul_li]:before:left-4 [&_ul_li]:before:top-4 [&_ul_li]:before:h-3 [&_ul_li]:before:w-3 [&_ul_li]:before:rounded-full [&_ul_li]:before:bg-[#D4AF37] [&_ul_li]:before:shadow-[0_0_16px_rgba(212,175,55,0.45)]"
                  dangerouslySetInnerHTML={{ __html: renderedTermsContent }}
                />
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar
                orientation="vertical"
                className="flex w-2.5 touch-none select-none bg-white/5 p-0.5"
              >
                <ScrollArea.Thumb className="relative flex-1 rounded-full bg-[#D4AF37]/45" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          )}
        </div>

        <div className="flex w-full shrink-0 flex-col">
          {actionError && (
            <div className="mb-4 w-full rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2 text-center text-xs font-bold text-red-200">
              {readErrorMessage(actionError)}
            </div>
          )}

          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-[#D4AF37]/18 bg-[#D4AF37]/8 px-4 py-3 text-sm font-semibold leading-6 text-white/72">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#F2D76B]" />
            <span>
              Khi bấm đồng ý, bạn xác nhận đã đọc điều khoản và cam kết tuân thủ
              tiêu chuẩn nội dung của TaleX Creator.
            </span>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
              disabled={isSubmitting}
              className="h-11 rounded-xl border-white/12 bg-white/[0.03] px-8 text-sm font-bold text-white/62 transition-all duration-200 hover:border-white/35 hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50 sm:w-36"
            >
              Quay lại
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="h-11 rounded-xl bg-[#D4AF37] px-8 text-sm font-black text-black shadow-[0_0_28px_rgba(212,175,55,0.24)] transition-all duration-200 hover:bg-[#F0D36B] hover:shadow-[0_0_36px_rgba(212,175,55,0.36)] active:scale-95 disabled:bg-[#7C766B] disabled:text-black disabled:opacity-45 sm:w-40"
            >
              {isSubmitting && (
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              )}
              Đồng ý
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog.Root>
  );
}
