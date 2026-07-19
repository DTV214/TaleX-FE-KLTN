"use server";

import { cookies } from "next/headers";
import {
  AuthErrorCode,
  AuthTokens,
  CompleteProfileRequest,
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
  ResendOtpRequest,
  ResetPasswordRequest,
  UserRole,
  VerifyOtpRequest,
} from "./auth.dto";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type AuthErrorPayload = {
  errorCode?: AuthErrorCode;
  details?: string;
};

type ActionError = {
  success?: false;
  message?: string;
  data?: AuthErrorPayload;
};

type ActionResult<T> = Promise<
  { success: true; data: T } | { success: false; error: ActionError }
>;

type EmptyActionResult = Promise<
  { success: true } | { success: false; error: ActionError }
>;

type BackendResponse<T = unknown> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type PartialAuthUser = {
  accountId: string;
  roleName: UserRole;
};

type AuthSuccessData = {
  tokens: AuthTokens;
  user: PartialAuthUser;
};

type VerificationTokenPayload = {
  verificationToken: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toBackendResponse<T = unknown>(value: unknown): BackendResponse<T> {
  return isRecord(value) ? (value as BackendResponse<T>) : {};
}

function toActionError(value: unknown, fallbackMessage: string): ActionError {
  const response = toBackendResponse(value);
  const errorData = isRecord(response.data)
    ? {
        errorCode:
          typeof response.data.errorCode === "number"
            ? (response.data.errorCode as AuthErrorCode)
            : undefined,
        details:
          typeof response.data.details === "string"
            ? response.data.details
            : undefined,
      }
    : undefined;

  return {
    success: false,
    message: response.message || fallbackMessage,
    data: errorData,
  };
}

function internalError(message = "Internal Server Error"): ActionError {
  return { success: false, message };
}

function isAuthTokens(value: unknown): value is AuthTokens {
  return (
    isRecord(value) &&
    typeof value.accessToken === "string" &&
    typeof value.refreshToken === "string"
  );
}

function extractVerificationToken(data: unknown) {
  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }

  if (
    isRecord(data) &&
    typeof data.verificationToken === "string" &&
    data.verificationToken.trim()
  ) {
    return data.verificationToken.trim();
  }

  return "";
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    const parsedPayload = JSON.parse(jsonPayload);
    return isRecord(parsedPayload) ? parsedPayload : {};
  } catch {
    return {};
  }
}

function getPartialUser(tokens: AuthTokens): PartialAuthUser {
  const payload = decodeJwtPayload(tokens.accessToken);
  return {
    accountId: typeof payload.sub === "string" ? payload.sub : "",
    roleName: (typeof payload.role === "string"
      ? payload.role
      : "VIEWER") as UserRole,
  };
}

async function setAuthCookies(tokens: AuthTokens) {
  const cookieStore = await cookies();
  const useSecure = process.env.COOKIE_SECURE === "true";

  // Phải khớp với jwt.access-token-expiration bên BE (150 phút) — nếu cookie hết hạn
  // sớm hơn JWT thật, browser tự xóa cookie dù access token vẫn còn hợp lệ, gây refresh
  // dư thừa (và tăng rủi ro race condition với refresh token rotation).
  cookieStore.set("accessToken", tokens.accessToken, {
    httpOnly: true,
    secure: useSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 150 * 60,
  });

  cookieStore.set("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: useSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
}

export async function getRefreshToken() {
  const cookieStore = await cookies();
  return cookieStore.get("refreshToken")?.value;
}

export async function loginAction(
  data: LoginRequest,
): ActionResult<AuthSuccessData> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const responseData = toBackendResponse(await res.json());

    if (!res.ok || !responseData.success) {
      return {
        success: false,
        error: toActionError(responseData, "Login failed."),
      };
    }

    if (!isAuthTokens(responseData.data)) {
      return {
        success: false,
        error: {
          success: false,
          message: "Backend did not return auth tokens.",
        },
      };
    }

    const tokens = responseData.data;
    await setAuthCookies(tokens);

    return {
      success: true,
      data: {
        tokens,
        user: getPartialUser(tokens),
      } satisfies AuthSuccessData,
    };
  } catch {
    return {
      success: false,
      error: internalError(),
    };
  }
}

export async function registerAction(data: RegisterRequest): ActionResult<string> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const responseData = toBackendResponse(await res.json());

    if (!res.ok || !responseData.success) {
      return {
        success: false,
        error: toActionError(responseData, "Register failed."),
      };
    }

    const verificationToken = extractVerificationToken(responseData.data);

    if (!verificationToken) {
      return {
        success: false,
        error: {
          success: false,
          message: "Backend did not return a verification token.",
        },
      };
    }

    return { success: true, data: verificationToken };
  } catch {
    return {
      success: false,
      error: internalError(),
    };
  }
}

export async function verifyEmailAction(
  data: VerifyOtpRequest,
): ActionResult<AuthSuccessData> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const responseData = toBackendResponse(await res.json());

    if (!res.ok || !responseData.success) {
      return {
        success: false,
        error: toActionError(responseData, "Verify email failed."),
      };
    }

    if (!isAuthTokens(responseData.data)) {
      return {
        success: false,
        error: {
          success: false,
          message: "Backend did not return auth tokens.",
        },
      };
    }

    const tokens = responseData.data;
    await setAuthCookies(tokens);

    return {
      success: true,
      data: {
        tokens,
        user: getPartialUser(tokens),
      } satisfies AuthSuccessData,
    };
  } catch {
    return {
      success: false,
      error: internalError(),
    };
  }
}

export async function resendOtpAction(
  data: ResendOtpRequest,
): EmptyActionResult {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const responseData = toBackendResponse(await res.json());

    if (!res.ok || !responseData.success) {
      return {
        success: false,
        error: toActionError(responseData, "Resend OTP failed."),
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: internalError(),
    };
  }
}

export async function forgotPasswordAction(
  data: ForgotPasswordRequest,
): ActionResult<VerificationTokenPayload> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const responseData = toBackendResponse(await res.json());

    if (!res.ok || !responseData.success) {
      return {
        success: false,
        error: toActionError(responseData, "Forgot password failed."),
      };
    }

    const verificationToken = extractVerificationToken(responseData.data);

    if (!verificationToken) {
      return {
        success: false,
        error: {
          success: false,
          message: "Backend did not return a verification token.",
        },
      };
    }

    return {
      success: true,
      data: { verificationToken } satisfies VerificationTokenPayload,
    };
  } catch {
    return {
      success: false,
      error: internalError(),
    };
  }
}

export async function resetPasswordAction(
  data: ResetPasswordRequest,
): ActionResult<unknown> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const responseData = toBackendResponse(await res.json());

    if (!res.ok || !responseData.success) {
      return {
        success: false,
        error: toActionError(responseData, "Reset password failed."),
      };
    }

    return { success: true, data: responseData.data };
  } catch {
    return {
      success: false,
      error: internalError(),
    };
  }
}

export async function completeProfileAction(
  data: CompleteProfileRequest,
): ActionResult<AuthSuccessData> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/complete-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const responseData = toBackendResponse(await res.json());

    if (!res.ok || !responseData.success) {
      return {
        success: false,
        error: toActionError(responseData, "Complete profile failed."),
      };
    }

    if (!isAuthTokens(responseData.data)) {
      return {
        success: false,
        error: { success: false, message: "Backend did not return auth tokens." },
      };
    }

    const tokens = responseData.data;
    await setAuthCookies(tokens);

    return {
      success: true,
      data: { tokens, user: getPartialUser(tokens) },
    };
  } catch {
    return { success: false, error: internalError() };
  }
}

type GoogleLoginStatus = "ACTIVE" | "ONBOARDING" | "VERIFYING";

type GoogleLoginSuccessData =
  | { status: "ACTIVE"; user: PartialAuthUser }
  | { status: "ONBOARDING" | "VERIFYING"; verificationToken: string };

export async function googleLoginAction(
  data: GoogleLoginRequest,
): ActionResult<GoogleLoginSuccessData> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const responseData = toBackendResponse(await res.json());

    if (!res.ok || !responseData.success) {
      return {
        success: false,
        error: toActionError(responseData, "Google login failed."),
      };
    }

    const googleData = responseData.data as Record<string, unknown> | undefined;
    if (!googleData || typeof googleData.status !== "string") {
      return {
        success: false,
        error: { success: false, message: "Invalid Google login response." },
      };
    }

    const status = googleData.status as GoogleLoginStatus;

    if (status === "ACTIVE") {
      const tokens: AuthTokens = {
        accessToken: googleData.accessToken as string,
        refreshToken: googleData.refreshToken as string,
      };

      if (!tokens.accessToken || !tokens.refreshToken) {
        return {
          success: false,
          error: { success: false, message: "Missing tokens in Google login response." },
        };
      }

      await setAuthCookies(tokens);
      return {
        success: true,
        data: { status: "ACTIVE", user: getPartialUser(tokens) },
      };
    }

    // ONBOARDING or VERIFYING — return verification token
    const verificationToken = typeof googleData.verificationToken === "string"
      ? googleData.verificationToken
      : "";

    if (!verificationToken) {
      return {
        success: false,
        error: { success: false, message: "Missing verification token." },
      };
    }

    return {
      success: true,
      data: { status, verificationToken },
    };
  } catch {
    return {
      success: false,
      error: internalError(),
    };
  }
}

export async function logoutAction(): EmptyActionResult {
  try {
    const refreshToken = await getRefreshToken();

    if (refreshToken) {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    }

    await clearAuthCookies();
    return { success: true };
  } catch {
    await clearAuthCookies();
    return { success: false, error: internalError("Logout failed.") };
  }
}
