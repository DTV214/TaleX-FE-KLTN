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

// ==========================================
// USER PROFILE DTO
// ==========================================

export type UserRole = "VIEWER" | "CREATOR" | "ADMIN" | "STAFF";

export type UserProfile = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  status: string; // VD: "ACTIVE", "BANNED"...
  dateOfBirth?: string;
  phone?: string;
};
// ==========================================
// RESPONSE DTOs (Dữ liệu nhận từ BE)
// ==========================================

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

// Backend đôi khi trả về String (verificationToken) thay vì object Tokens
export type GoogleLoginResponseData = AuthTokens | string;

// ==========================================
// ERROR CODES (Mã lỗi nghiệp vụ từ BE TaleX)
// ==========================================

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 4010, // Sai email hoặc mật khẩu
  EMAIL_NOT_VERIFIED = 4011, // Tài khoản chưa xác minh email
  ACCOUNT_BANNED = 4012, // Tài khoản bị cấm
  ACCOUNT_DELETED = 4013, // Tài khoản đã xóa
  INVALID_VERIFICATION_TOKEN = 4014, // Verification token không hợp lệ/hết hạn
  INVALID_GOOGLE_TOKEN = 4015, // Google token không hợp lệ
  SESSION_EXPIRED = 4016, // Phiên hết hạn (Refresh token hết hạn)
  TOKEN_REUSE_DETECTED = 4017, // Phát hiện reuse refresh token (Bị hack)
  INVALID_OTP = 4018, // OTP sai
  OTP_COOLDOWN = 4019, // Gửi OTP quá nhanh
  PROFILE_INCOMPLETE = 4020, // Profile chưa hoàn tất (Google ONBOARDING)
  EMAIL_ALREADY_EXISTS = 4090, // Email đã tồn tại
  USERNAME_ALREADY_EXISTS = 4091, // Username đã tồn tại
}

export type AuthErrorDetails = {
  errorCode: AuthErrorCode;
  details?: string;
};
