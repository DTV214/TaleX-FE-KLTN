"use client";

import { create } from "zustand";

type PublicSidebarState = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
};

export const usePublicSidebarStore = create<PublicSidebarState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
