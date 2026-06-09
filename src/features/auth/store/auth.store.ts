import { create } from "zustand";
import { UserProfile } from "../api/auth.dto";

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isInitialized: boolean; // Dùng để check xem FE đã gọi API kiểm tra token lần đầu xong chưa

  // Các hàm (Actions) để thay đổi state
  setUser: (user: UserProfile | null) => void;
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
      isAuthenticated: !!user, // Nếu user có dữ liệu -> true, ngược lại -> false
    }),

  setInitialized: (status) => set({ isInitialized: status }),

  clearAuth: () => set({ user: null, isAuthenticated: false }),
}));
