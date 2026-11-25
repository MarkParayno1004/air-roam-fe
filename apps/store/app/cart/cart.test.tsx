import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { toApiLine } from "../checkout/usePlaceOrder";
import { CartView } from "./CartView";
import { addDays, cartTotals, lineIsValid, lineName, rentalDays } from "./rental";
import { CART_KEY, CartProvider, loadCart, useCart, type CartLine } from "./store";

const TODAY = "2026-11-23";
const esimProduct = { id: "pe", product_name: "Air Roam eSIM", product_type: "esim" };
const wifiProduct = { id: "pw", product_name: "Air Roam Pocket WiFi", product_type: "pocket_wifi" };
const plan = { id: "plan1", label: "5GB · 7 days", data_mb: 5120, validity_days: 7, price: "399.00" };
const esim = (over: Partial<CartLine> = {}): CartLine => ({ id: "e", product: esimProduct, country_code: "JP", plan, quantity: 1, ...over });
const wifi = (code: string, rate: number, days: number, over: Partial<CartLine> = {}): CartLine => ({
  id: `w-${code}`, product: wifiProduct, country_code: code, daily_rate: rate.toFixed(2), quantity: 1,
  start_date: "2026-12-12", end_date: addDays("2026-12-12", days), ...over,
});

const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>;

test("rental days between dates", () => {
  expect(rentalDays("2026-12-12", "2026-12-18")).toBe(6);
  expect(rentalDays("2026-12-12", "2026-12-12")).toBe(0);
});

test.each([
  [[wifi("JP", 100, 2), wifi("US", 50, 2), wifi("FR", 10, 2)], 100, 200, 800],
  [[wifi("JP", 100, 2), wifi("US", 50, 2), wifi("FR", 10, 3)], 100, 200, 900],
  [[wifi("JP", 100, 2), wifi("US", 50, 2), wifi("FR", 10, 4)], 100, 0, 800],
  [[wifi("FR", 10, 30), wifi("JP", 100, 2)], 100, 0, 3200],
  [[wifi("JP", 100, 4, { quantity: 2 })], 100, 200, 1000],
  [[esim()], 0, 0, 399],
  [[esim(), wifi("JP", 100, 2)], 100, 200, 799],
])("highest rate, delivery fee and total %#", (lines, rate, deliveryFee, total) => {
  expect(cartTotals(lines)).toMatchObject({ rate, deliveryFee, total });
});

test("no dates yet: no days and no fee", () => {
  expect(cartTotals([wifi("JP", 100, 2, { end_date: undefined })])).toMatchObject({ days: 0, deliveryFee: 0, total: 0 });
});

test("end before start never makes a negative total", () => {
  expect(cartTotals([wifi("JP", 100, -3), wifi("US", 50, 2)])).toMatchObject({ days: 2, total: 400 });
});

test("rental validation", () => {
  expect(lineIsValid(wifi("JP", 100, 2, { start_date: undefined }), TODAY)).toBe(false);
  expect(lineIsValid(wifi("JP", 100, 0), TODAY)).toBe(false);
  expect(lineIsValid(wifi("JP", 100, 2, { start_date: "2026-11-20" }), TODAY)).toBe(false);
  expect(lineIsValid(wifi("JP", 100, 2), TODAY)).toBe(true);
  expect(lineIsValid(esim(), TODAY)).toBe(true);
});

test("line names", () => {
  expect(lineName(esim())).toBe("Japan 5GB · 7 days");
  expect(lineName(wifi("JP", 100, 2))).toBe("Japan Pocket WiFi");
});

test("corrupt carts and carts saved before region pricing reset", () => {
  const old = { id: "1", quantity: 1, variant: { id: "v", name: "Japan", price: "799.00", countries: ["JP"], pricing_unit: "per_plan" } };
  for (const bad of ["{oops", JSON.stringify([{ nope: true }]), JSON.stringify([old]), JSON.stringify([{ ...esim(), plan: undefined }]), JSON.stringify([null])]) {
    localStorage.setItem(CART_KEY, bad);
    expect(loadCart()).toEqual([]);
  }
  localStorage.setItem(CART_KEY, JSON.stringify([esim(), wifi("JP", 100, 2)]));
  expect(loadCart()).toHaveLength(2);
});

test("same plan and country increments; another country or WiFi is a new line", () => {
  const { result } = renderHook(() => useCart(), { wrapper });
  const { id: _, quantity: __, ...newEsim } = esim();
  const { id: ___, quantity: ____, ...newWifi } = wifi("JP", 100, 2);
  act(() => result.current.add(newEsim));
  act(() => result.current.add(newEsim));
  expect(result.current.lines.map((l) => l.quantity)).toEqual([2]);
  act(() => result.current.add({ ...newEsim, country_code: "KR" }));
  act(() => result.current.add(newWifi));
  act(() => result.current.add(newWifi));
  expect(result.current.lines.map((l) => l.quantity)).toEqual([2, 1, 1, 1]);
  expect(JSON.parse(localStorage.getItem(CART_KEY)!)).toHaveLength(4);
});

test("API lines", () => {
  expect(toApiLine(esim(), 100)).toEqual({ product_id: "pe", country_code: "JP", region_plan_id: "plan1", quantity: 1, expected_unit_price: "399.00" });
  // the EU line pays the cart's highest rate, so that is what the customer expects
  expect(toApiLine(wifi("FR", 10, 2), 100)).toEqual({
    product_id: "pw", country_code: "FR", quantity: 1, expected_unit_price: "100.00",
    start_at: "2026-12-12T00:00:00+08:00", end_at: "2026-12-14T00:00:00+08:00",
  });
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

const HIGHEST = "Pocket WiFi is charged at the highest daily rate in your cart.";

test("summary shows the highest-rate note, delivery fee and total", () => {
  renderCart([wifi("JP", 100, 2), wifi("US", 50, 2)]);
  const summary = screen.getByRole("complementary");
  expect(summary).toHaveTextContent(HIGHEST);
  expect(summary).toHaveTextContent("United States Pocket WiFi · ₱100 × 2 days₱200");
  expect(summary).toHaveTextContent("Delivery fee₱200");
  expect(summary).toHaveTextContent("Total (PHP)₱600");
});

test("8 days is free delivery; 7 days still pays", () => {
  const { unmount } = renderCart([wifi("JP", 100, 7)]);
  expect(screen.getByRole("complementary")).toHaveTextContent("Delivery fee₱200");
  unmount();
  renderCart([wifi("JP", 100, 8)]);
  expect(screen.getByRole("complementary")).toHaveTextContent("Delivery feeFree");
});

test("no note when WiFi rates match, no fee row without WiFi", () => {
  const { unmount } = renderCart([wifi("JP", 100, 2), wifi("KR", 100, 2)]);
  expect(screen.queryByText(HIGHEST)).not.toBeInTheDocument();
  unmount();
  renderCart([esim()]);
  expect(screen.queryByText("Delivery fee")).not.toBeInTheDocument();
  expect(screen.getByText("Starts when you activate")).toBeInTheDocument();
});

test("pocket wifi without dates blocks checkout", () => {
  renderCart([wifi("JP", 100, 2, { start_date: undefined, end_date: undefined })]);
  expect(screen.getByRole("link", { name: "Log in to checkout" })).toHaveAttribute("aria-disabled", "true");
  expect(screen.getByText("Choose your rental dates to continue.")).toBeInTheDocument();
});

test("valid cart enables checkout; guest goes to login with next", () => {
  renderCart([esim()]);
  const cta = screen.getByRole("link", { name: "Log in to checkout" });
  expect(cta).toHaveAttribute("href", "/login?next=/checkout");
  expect(cta).not.toHaveAttribute("aria-disabled");
});

test("signed-in cart goes straight to checkout", () => {
  renderCart([esim()], true);
  expect(screen.getByRole("link", { name: "Checkout" })).toHaveAttribute("href", "/checkout");
});

test("quantity is limited to 1-10", async () => {
  renderCart([esim({ quantity: 10 })]);
  expect(screen.getByRole("button", { name: "Increase quantity" })).toBeDisabled();
  await userEvent.click(screen.getByRole("button", { name: "Decrease quantity" }));
  expect(screen.getByText("Qty 9")).toBeInTheDocument();
});
