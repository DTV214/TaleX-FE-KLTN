"use client";

import { create } from "zustand";

type PublicSidebarState = {
  isSidebarOpen: boolean;
  isMobileSidebarOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
};

export const usePublicSidebarStore = create<PublicSidebarState>((set) => ({
  isSidebarOpen: true,
  isMobileSidebarOpen: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleMobileSidebar: () =>
    set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
  closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
}));
