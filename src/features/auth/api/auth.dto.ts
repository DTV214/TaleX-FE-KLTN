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

// --- BỔ SUNG CÁC DTO CÒN THIẾU TỪ BACKEND ---

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
  username?: string;
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

// ==========================================
// USER PROFILE DTO
// ==========================================

export type UserRole = "VIEWER" | "CREATOR" | "ADMIN" | "STAFF";

export type UserProfile = {
  accountId: string;  // Đổi từ 'id' thành 'accountId'
  email: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  roleName: UserRole; // Đổi từ 'role' thành 'roleName'
  status: string; 
  dateOfBirth?: string;
  phone?: string;
  hasPassword?: boolean; 
  googleLinked?: boolean;
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
// Đã đồng bộ chính xác 100% với Backend
// ==========================================

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 4010, // Sai email hoặc mật khẩu
  ACCOUNT_NOT_VERIFIED = 4011, // Đã đổi từ EMAIL_NOT_VERIFIED
  ACCOUNT_BANNED = 4012, // Tài khoản bị cấm
  ACCOUNT_DELETED = 4013, // Tài khoản đã xóa
  INVALID_VERIFICATION_TOKEN = 4014, // Verification token không hợp lệ/hết hạn
  INVALID_GOOGLE_TOKEN = 4015, // Google token không hợp lệ
  SESSION_EXPIRED = 4016, // Phiên hết hạn (Refresh token hết hạn)
  TOKEN_REUSE_DETECTED = 4017, // Phát hiện reuse refresh token (Bị hack)
  INVALID_OTP = 4018, // OTP sai
  OTP_RATE_LIMITED = 4019, // Đã đổi từ OTP_COOLDOWN
  PROFILE_INCOMPLETE = 4020, // Profile chưa hoàn tất (Google ONBOARDING)

  // --- BỔ SUNG CÁC MÃ LỖI CÒN THIẾU ---
  ACCOUNT_NOT_ACTIVE = 4021, // Tài khoản không ở trạng thái hoạt động
  CURRENT_PASSWORD_REQUIRED = 4022, // Vui lòng nhập mật khẩu hiện tại
  CURRENT_PASSWORD_INCORRECT = 4023, // Mật khẩu hiện tại không đúng
  PASSWORD_SAME_AS_OLD = 4024, // Mật khẩu mới không được trùng cũ
  PASSWORD_CONFIRMATION_MISMATCH = 4025, // Mật khẩu xác nhận không khớp
  MULTIPLE_ACCOUNTS_FOUND = 4026, // Nhiều tài khoản cùng email, cần username

  EMAIL_ALREADY_EXISTS = 4090, // Email đã tồn tại
  USERNAME_ALREADY_EXISTS = 4091, // Username đã tồn tại
  ROLE_NOT_FOUND = 5001, // Không tìm thấy role
  EMAIL_SERVICE_UNAVAILABLE = 5030, // Dịch vụ email không khả dụng
}

export type AuthErrorDetails = {
  errorCode: AuthErrorCode;
  details?: string;
};
