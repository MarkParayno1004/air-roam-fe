import { act, render, renderHook, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import type { CatalogVariant } from "@air-roam/ui";
import { CartView } from "./CartView";
import { lineIsValid, lineTotal, rentalDays } from "./rental";
import { CART_KEY, CartProvider, loadCart, useCart, type CartLine } from "./store";

const esim: CatalogVariant = {
  id: "e1", name: "Japan 10GB · 7 days", countries: ["JP"], scope: "single", region: "asia", tag: null,
  data_mb: 10240, validity_days: 7, price: "799.00", pricing_unit: "per_plan", product_type: "esim",
};
const wifiPack: CatalogVariant = {
  ...esim, id: "w1", name: "Asia Pocket WiFi · 3 countries", countries: ["JP", "KR", "SG"], scope: "multi",
  price: "450.00", pricing_unit: "per_day", product_type: "pocket_wifi", data_mb: null, validity_days: null,
};
const TODAY = "2026-11-23";

const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>;

test("rental days between dates", () => {
  expect(rentalDays("2026-12-12", "2026-12-18")).toBe(6);
  expect(rentalDays("2026-12-12", "2026-12-12")).toBe(0);
});

test("rental days validation", () => {
  const base: CartLine = { id: "1", variant: wifiPack, quantity: 1, destination_country_codes: ["JP"] };
  expect(lineIsValid({ ...base }, TODAY)).toBe(false); // no dates
  expect(lineIsValid({ ...base, start_date: "2026-12-12", end_date: "2026-12-12" }, TODAY)).toBe(false);
  expect(lineIsValid({ ...base, start_date: "2026-12-12", end_date: "2026-12-10" }, TODAY)).toBe(false);
  expect(lineIsValid({ ...base, start_date: "2026-11-20", end_date: "2026-11-25" }, TODAY)).toBe(false); // past
  expect(lineIsValid({ ...base, start_date: TODAY, end_date: "2026-11-25" }, TODAY)).toBe(true);
  expect(lineIsValid({ ...base, start_date: TODAY, end_date: "2026-11-25", destination_country_codes: [] }, TODAY)).toBe(false);
  expect(lineTotal({ ...base, start_date: "2026-12-12", end_date: "2026-12-18" })).toBe(2700);
  expect(lineIsValid({ id: "2", variant: esim, quantity: 1 }, TODAY)).toBe(true);
});

test("corrupt cart storage resets", () => {
  localStorage.setItem(CART_KEY, "{oops");
  expect(loadCart()).toEqual([]);
  localStorage.setItem(CART_KEY, JSON.stringify([{ nope: true }]));
  expect(loadCart()).toEqual([]);
});

test("adding the same plan increments quantity; persisted", () => {
  const { result } = renderHook(() => useCart(), { wrapper });
  act(() => result.current.add(esim));
  act(() => result.current.add(esim));
  expect(result.current.lines).toHaveLength(1);
  expect(result.current.lines[0].quantity).toBe(2);
  expect(JSON.parse(localStorage.getItem(CART_KEY)!)[0].quantity).toBe(2);
});

test("server price changes and removals are applied", () => {
  const { result } = renderHook(() => useCart(), { wrapper });
  act(() => result.current.add(esim));
  act(() => result.current.add(wifiPack));
  act(() => result.current.applyServerChanges([{ variant_id: "e1", name: "", old_unit_price: "799.00", new_unit_price: "849.00" }], [{ variant_id: "w1", name: "" }]));
  expect(result.current.lines.map((l) => [l.variant.id, l.variant.price])).toEqual([["e1", "849.00"]]);
});

function renderCart(lines: CartLine[], signedIn = false) {
  localStorage.setItem(CART_KEY, JSON.stringify(lines));
  return render(
    <MemoryRouter>
      <CartProvider>
        <CartView signedIn={signedIn} today={TODAY} />
      </CartProvider>
    </MemoryRouter>,
  );
}

test("pocket wifi without dates blocks checkout", () => {
  renderCart([{ id: "1", variant: wifiPack, quantity: 1, destination_country_codes: ["JP", "KR", "SG"] }]);
  expect(screen.getByRole("link", { name: "Log in to checkout" })).toHaveAttribute("aria-disabled", "true");
  expect(screen.getByText("Choose your rental dates to continue.")).toBeInTheDocument();
});

test("valid cart enables checkout; guest goes to login with next", () => {
  renderCart([{ id: "1", variant: esim, quantity: 1 }]);
  const cta = screen.getByRole("link", { name: "Log in to checkout" });
  expect(cta).toHaveAttribute("href", "/login?next=/checkout");
  expect(cta).not.toHaveAttribute("aria-disabled");
});

test("signed-in cart goes straight to checkout", () => {
  renderCart([{ id: "1", variant: esim, quantity: 1 }], true);
  expect(screen.getByRole("link", { name: "Checkout" })).toHaveAttribute("href", "/checkout");
});

test("pack countries keep at least one ticked", async () => {
  renderCart([{ id: "1", variant: wifiPack, quantity: 1, start_date: "2026-12-12", end_date: "2026-12-18", destination_country_codes: ["JP", "KR"] }]);
  const picker = screen.getByRole("group", { name: "Where will you use it?" });
  await userEvent.click(within(picker).getByRole("checkbox", { name: /South Korea/ }));
  expect(within(picker).getByRole("checkbox", { name: /Japan/ })).toBeDisabled();
  expect(screen.getByText("6 rental days × ₱450 × 1 device")).toBeInTheDocument();
});

test("quantity is limited to 1-10", async () => {
  renderCart([{ id: "1", variant: esim, quantity: 10 }]);
  expect(screen.getByRole("button", { name: "Increase quantity" })).toBeDisabled();
  await userEvent.click(screen.getByRole("button", { name: "Decrease quantity" }));
  expect(screen.getByText("Qty 9")).toBeInTheDocument();
});
