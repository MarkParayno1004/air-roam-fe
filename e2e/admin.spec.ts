import { expect, test } from "@playwright/test";

/**
 * Admin dashboard against the live backend. Needs a staff admin:
 *   manage.py create_staff --email e2e-admin@example.com --password "e2e-admin-pass-123" --admin
 * Override with E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD.
 */
const EMAIL = process.env.E2E_ADMIN_EMAIL ?? "e2e-admin@example.com";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "e2e-admin-pass-123";
const ADMIN = "http://localhost:5174";

test("admin signs in, sees the overview and a region's plans", async ({ page }) => {
  await page.goto(ADMIN);
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Admin" })).toContainText("Users");
  await page.screenshot({ path: "test-results/admin-overview.png", fullPage: true });

  await page.getByRole("link", { name: "Regions & prices" }).click();
  await page.getByRole("link", { name: "Asia 1" }).click();
  await expect(page.getByRole("heading", { name: "SIM/eSIM plans" })).toBeVisible();
  await expect(page.getByText("5GB · 7 days")).toBeVisible();
  await page.screenshot({ path: "test-results/admin-region-editor.png", fullPage: true });

  await page.reload(); // staff session restored from the HttpOnly staff cookie
  await expect(page.getByRole("heading", { name: "Edit region" })).toBeVisible();
});
