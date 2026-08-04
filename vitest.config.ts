import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setupTests.ts"],
    css: true,
    passWithNoTests: true,
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/app/**",
        "src/**/*.d.ts",
        "src/**/types/**",
        "src/**/dto.ts",
        "src/**/schema.ts",
        "src/mocks/**",
        "src/test/**",
        "src/**/page.tsx",
        "src/**/layout.tsx",
      ],
    },
  },
});
