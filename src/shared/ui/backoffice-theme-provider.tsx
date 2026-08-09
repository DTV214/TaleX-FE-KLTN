"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { cn } from "@/shared/utils/utils";

type BackofficeTheme = "light" | "dark";

type BackofficeThemeContextValue = {
  theme: BackofficeTheme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: BackofficeTheme) => void;
};

const STORAGE_KEY = "talex-backoffice-theme";

const BackofficeThemeContext = createContext<BackofficeThemeContextValue>({
  theme: "light",
  isDark: false,
  toggleTheme: () => undefined,
  setTheme: () => undefined,
});

function getInitialTheme(): BackofficeTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  return storedTheme === "dark" ? "dark" : "light";
}

export function BackofficeThemeProvider({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [theme, setThemeState] = useState<BackofficeTheme>(getInitialTheme);

  const setTheme = useCallback((nextTheme: BackofficeTheme) => {
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) =>
      currentTheme === "dark" ? "light" : "dark",
    );
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme,
      setTheme,
    }),
    [setTheme, theme, toggleTheme],
  );

  return (
    <BackofficeThemeContext.Provider value={value}>
      <div
        data-backoffice-theme={theme}
        className={cn(
          "backoffice-shell",
          theme === "dark"
            ? "backoffice-theme-dark"
            : "backoffice-theme-light",
          className,
        )}
      >
        {children}
      </div>
    </BackofficeThemeContext.Provider>
  );
}

export function useBackofficeTheme() {
  return useContext(BackofficeThemeContext);
}
