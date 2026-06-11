import { create } from "zustand";
import { UserProfile, UserRole } from "../api/auth.dto";

// 1. Định nghĩa kiểu "User Bán Phần" (Chỉ chứa ID và Role lấy từ JWT)
// ĐÃ SỬA: id -> accountId, role -> roleName để khớp với Backend
export interface PartialUser {
  accountId: string;
  roleName: UserRole;
}

// Hàm Type Guard để kiểm tra xem user hiện tại đã là Full Profile hay chưa
export const isFullProfile = (
  user: UserProfile | PartialUser | null,
): user is UserProfile => {
  return user !== null && "email" in user && "status" in user;
};

interface AuthState {
  // 2. Chấp nhận 3 trạng thái: Chưa đăng nhập (null), Vừa đăng nhập (PartialUser), Đã load xong (UserProfile)
  user: UserProfile | PartialUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;

  // Actions
  setUser: (user: UserProfile | PartialUser | null) => void;

  // 3. Action mới: Đắp thêm dữ liệu từ API Profile vào state hiện tại
  updateUser: (profile: Partial<UserProfile>) => void;

  setInitialized: (status: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  updateUser: (profile) =>
    set((state) => {
      // Nếu chưa có user thì không làm gì cả
      if (!state.user) return state;

      // Merge (trộn) dữ liệu cũ (accountId, roleName) với dữ liệu mới từ API Profile
      return {
        user: {
          ...state.user,
          ...profile,
        } as UserProfile, // Ép kiểu an toàn vì lúc này ta tin chắc nó đã gộp đủ trường
      };
    }),

  setInitialized: (status) => set({ isInitialized: status }),

  clearAuth: () => set({ user: null, isAuthenticated: false }),
}));
