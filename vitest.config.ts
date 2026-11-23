import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// One test runner for every workspace (deps are hoisted by npm workspaces).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["packages/*/src/**/*.test.{ts,tsx}", "apps/*/app/**/*.test.{ts,tsx}", "apps/*/src/**/*.test.{ts,tsx}"],
    css: false,
    // Run as a traveler west of Manila so timezone bugs (dates shown a day early) surface in tests.
    env: { TZ: "America/Los_Angeles" },
  },
});
