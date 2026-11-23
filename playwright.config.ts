import { defineConfig, devices } from "@playwright/test";

// Requires the Django backend on :8000 (see ../air-roam-be/README.md) with the demo catalog (manage.py seed_demo).
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  use: { baseURL: "http://localhost:5173", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    { command: "npm run dev -w apps/store", url: "http://localhost:5173", reuseExistingServer: true, timeout: 120_000 },
    { command: "npm run dev -w apps/admin", url: "http://localhost:5174", reuseExistingServer: true, timeout: 120_000 },
  ],
});
