// ==========================================
// REQUEST DTOs (Dữ liệu gửi lên BE)
// ==========================================

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  fullName: string;
  dateOfBirth: string; // Format: YYYY-MM-DD
  phone: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type VerifyOtpRequest = {
  verificationToken: string;
  otpCode: string;
};

export type ResendOtpRequest = {
  verificationToken: string;
};

export type CompleteProfileRequest = {
  verificationToken: string;
  dateOfBirth: string; // Format: YYYY-MM-DD
  phone: string;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

// --- CÁC DTO MỚI ---

export type GoogleLoginRequest = {
  idToken: string;
};

export type UpdateProfileRequest = {
  username?: string;
  fullName?: string;
  phone?: string;
  dateOfBirth?: string; // Format: YYYY-MM-DD
  avatarUrl?: string;
};

export type ChangePasswordRequest = {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  verificationToken: string;
  otpCode: string;
  newPassword: string;
  confirmPassword: string;
};

// ==========================================
// USER PROFILE DTO
// ==========================================

export type UserRole = "VIEWER" | "CREATOR" | "ADMIN" | "STAFF";

export type UserProfile = {
  accountId: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  roleName: UserRole;
  status: string;
  dateOfBirth?: string;
  phone?: string;
  hasPassword?: boolean;
  googleLinked?: boolean;
  createdAt: string; // Đã bổ sung theo Swagger
};

// ==========================================
// RESPONSE DTOs (Dữ liệu nhận từ BE)
// ==========================================

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

// Cấu trúc response chuẩn của Backend
export type BaseResponse<T = unknown> = {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
};

export type GoogleLoginResponseData = {
  status: "ACTIVE" | "ONBOARDING" | "VERIFYING";
  accessToken?: string;
  refreshToken?: string;
  verificationToken?: string;
};

// ==========================================
// ERROR CODES (Mã lỗi nghiệp vụ từ BE TaleX)
// ==========================================

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 4010,
  ACCOUNT_NOT_VERIFIED = 4011,
  ACCOUNT_BANNED = 4012,
  ACCOUNT_DELETED = 4013,
  INVALID_VERIFICATION_TOKEN = 4014,
  INVALID_GOOGLE_TOKEN = 4015,
  SESSION_EXPIRED = 4016,
  TOKEN_REUSE_DETECTED = 4017,
  INVALID_OTP = 4018,
  OTP_RATE_LIMITED = 4019,
  PROFILE_INCOMPLETE = 4020,
  ACCOUNT_NOT_ACTIVE = 4021,
  CURRENT_PASSWORD_REQUIRED = 4022,
  CURRENT_PASSWORD_INCORRECT = 4023,
  PASSWORD_SAME_AS_OLD = 4024,
  PASSWORD_CONFIRMATION_MISMATCH = 4025,
  LOGIN_RATE_LIMITED = 4027,
  EMAIL_ALREADY_EXISTS = 4090,
  USERNAME_ALREADY_EXISTS = 4091,
  ROLE_NOT_FOUND = 5001,
  EMAIL_SERVICE_UNAVAILABLE = 5030,
}

export type AuthErrorDetails = {
  success: false;
  message: string;
  data: {
    errorCode: AuthErrorCode;
    details?: string;
  };
};
