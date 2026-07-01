"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

import { loginAction, googleLoginAction } from "@/features/auth/api/auth.actions";
import { AuthErrorCode } from "@/features/auth/api/auth.dto";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { getPostLoginPath } from "@/features/auth/lib/auth-routing";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export function  LoginForm() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const googleRendered = useRef(false);

  const getLoginDestination = useCallback(
    (roleName: Parameters<typeof getPostLoginPath>[0]) => {
      const callbackUrl = new URLSearchParams(window.location.search).get(
        "callbackUrl",
      );

      return getPostLoginPath(roleName, callbackUrl);
    },
    [],
  );

  const handleGoogleCallback = useCallback(
    async (response: { credential: string }) => {
      setIsGoogleLoading(true);
      setErrorMsg(null);

      const res = await googleLoginAction({ idToken: response.credential });

      if (!res.success) {
        const errorCode = res.error?.data?.errorCode;
        switch (errorCode) {
          case AuthErrorCode.ACCOUNT_BANNED:
            setErrorMsg("Tài khoản của bạn đã bị khóa.");
            break;
          case AuthErrorCode.ACCOUNT_DELETED:
            setErrorMsg("Tài khoản đã bị xóa.");
            break;
          default:
            setErrorMsg(
              res.error?.message || "Đăng nhập Google thất bại. Vui lòng thử lại.",
            );
        }
        setIsGoogleLoading(false);
        return;
      }

      const data = res.data;

      if (data.status === "ACTIVE") {
        setUser(data.user);
        router.replace(getLoginDestination(data.user.roleName));
        router.refresh();
      } else {
        router.push(
          `/complete-profile?token=${encodeURIComponent(data.verificationToken)}`,
        );
      }
    },
    [getLoginDestination, router, setUser],
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || googleRendered.current) return;

    const initGoogle = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
      });

      const container = document.getElementById("google-btn-container");
      if (container) {
        window.google?.accounts.id.renderButton(container, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          width: container.offsetWidth,
        });
        googleRendered.current = true;
      }
    };

    if (window.google?.accounts) {
      initGoogle();
      return;
    }

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", initGoogle);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
  }, [handleGoogleCallback]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const res = await loginAction({ email, password });

    if (!res.success) {
      const errorCode = res.error?.data?.errorCode;

      switch (errorCode) {
        case AuthErrorCode.INVALID_CREDENTIALS:
          setErrorMsg("Email hoặc mật khẩu không chính xác.");
          break;
        case AuthErrorCode.ACCOUNT_NOT_VERIFIED:
          setErrorMsg(
            "Tài khoản chưa xác thực. Vui lòng kiểm tra email để xác minh.",
          );
          break;
        case AuthErrorCode.ACCOUNT_BANNED:
          setErrorMsg("Tài khoản của bạn đã bị khóa.");
          break;
        case AuthErrorCode.LOGIN_RATE_LIMITED:
          setErrorMsg("Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.");
          break;
        default:
          setErrorMsg(
            res.error?.message || "Đăng nhập thất bại. Vui lòng thử lại.",
          );
      }

      setIsLoading(false);
      return;
    }

    if (res.data?.user) {
      setUser(res.data.user);
    }

    router.replace(getLoginDestination(res.data.user.roleName));
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative">
      <div className="mb-8 text-center">
        <h1 className="text-lg sm:text-xl font-medium text-gray-200 tracking-wide">
          Chào mừng trở lại
        </h1>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-[#E50914]/10 border border-[#E50914]/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#E50914] shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-[#E50914]">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs text-gray-400 font-medium">Email</label>
          <input
            type="email"
            name="email"
            required
            placeholder="email@example.com"
            className="w-full rounded-xl border border-white/10 bg-[#121214] p-3.5 text-sm text-white placeholder:text-gray-700 focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 transition-all shadow-inner"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 font-medium">
              Mật khẩu
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-[#D4AF37] hover:text-[#E5C158] transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-[#121214] p-3.5 pr-11 text-sm text-white placeholder:text-gray-700 focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 transition-all shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#D4AF37] transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="mt-8 flex w-full justify-center items-center gap-2 rounded-lg bg-[#E50914] py-3.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(229,9,20,0.3)] transition-all hover:bg-[#ff0a16] hover:shadow-[0_4px_25px_rgba(229,9,20,0.5)] active:scale-[0.98] tracking-widest uppercase disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            "Đăng Nhập"
          )}
        </button>
      </form>

      <div className="my-8 flex items-center">
        <div className="flex-grow border-t border-white/5"></div>
        <span className="mx-4 text-xs text-gray-500">Hoặc tiếp tục với</span>
        <div className="flex-grow border-t border-white/5"></div>
      </div>

      <div className="relative w-full">
        <div className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-[#121214] p-3.5 text-sm font-medium text-gray-300 pointer-events-none">
          {isGoogleLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang xử lý Google...
            </>
          ) : (
            <>
              <img src="/icons/google.svg" alt="Google" className="h-5 w-5" />
              Đăng nhập với Google
            </>
          )}
        </div>
        <div
          id="google-btn-container"
          className="absolute inset-0 overflow-hidden"
          style={{ opacity: 0.01, cursor: "pointer" }}
        />
      </div>

      <p className="mt-8 text-center text-xs sm:text-sm text-gray-400">
        Chưa có tài khoản?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#D4AF37] hover:text-[#E5C158] transition-colors"
        >
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
