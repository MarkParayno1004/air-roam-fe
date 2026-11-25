import { expect, test } from "@playwright/test";

/**
 * Real store + real Django API (catalog, sign-up, cookie login with CSRF, guarded checkout).
 * Only POST /orders is mocked, because creating a real Xendit invoice needs a test key.
 */
test("guest adds a Japan eSIM, signs up at checkout and is sent to Xendit", async ({ page }) => {
  const INVOICE = "https://checkout-staging.xendit.co/e2e-mock-invoice";
  let orderBody: unknown = null;
  await page.route("**/api/v1/orders", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    orderBody = route.request().postDataJSON();
    await route.fulfill({ json: { order: { id: "o-e2e", order_status: "pending_payment", total_amount: "399.00", delivery_fee: "0.00", lines: [] }, invoice_url: INVOICE, price_updates: [], removed_lines: [] } });
  });
  await page.route(INVOICE, (route) => route.fulfill({ contentType: "text/html", body: "<h1>Xendit mock invoice</h1>" }));

  await page.goto("/products?country=japan");
  const choose = (name: string) => page.locator("label", { has: page.getByRole("radio", { name, exact: true }) }).click(); // the radio is visually hidden in its card
  await choose("Air Roam eSIM");
  await choose("5GB · 7 days");
  await page.getByRole("button", { name: "Add to cart" }).click();

  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole("heading", { name: "Your cart" })).toBeVisible();
  await page.getByRole("link", { name: "Log in to checkout" }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fcheckout|\/login\?next=\/checkout/);

  await page.getByRole("link", { name: "Create an account" }).click();
  const email = `e2e-${Date.now()}@example.com`;
  await page.getByLabel("First name").fill("E2E");
  await page.getByLabel("Last name").fill("Traveler");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("long-enough-pass");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByText(email)).toBeVisible();
  await page.getByRole("button", { name: "Pay with Xendit" }).click();

  await expect(page.getByRole("heading", { name: "Xendit mock invoice" })).toBeVisible();
  expect(orderBody).toMatchObject({ client: "web", lines: [{ country_code: "JP", quantity: 1, expected_unit_price: "399.00" }] });
});

test("session survives a reload via the HttpOnly refresh cookie", async ({ page }) => {
  const email = `e2e-reload-${Date.now()}@example.com`;
  await page.goto("/signup");
  await page.getByLabel("First name").fill("Re");
  await page.getByLabel("Last name").fill("Load");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("long-enough-pass");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("link", { name: "My account" }).first()).toBeVisible();

  await page.goto("/account/profile");
  await expect(page.getByLabel("Email")).toHaveValue(email);
  await page.reload();
  await expect(page.getByLabel("Email")).toHaveValue(email); // restored from the cookie, not storage
  expect(await page.evaluate(() => JSON.stringify(localStorage) + JSON.stringify(sessionStorage))).not.toMatch(/eyJ/); // no JWT in JS storage
});
