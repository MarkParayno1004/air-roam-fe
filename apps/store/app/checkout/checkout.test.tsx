import { ApiError, type ApiClient } from "@air-roam/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { AuthProvider } from "../auth/AuthProvider";
import { CART_KEY, CartProvider, type CartLine } from "../cart/store";
import { CheckoutView } from "./CheckoutView";
import { PaymentResultView } from "./PaymentResultView";

const esim: CartLine = {
  id: "l1", product: { id: "pe", product_name: "Air Roam eSIM", product_type: "esim" }, country_code: "JP", quantity: 1,
  plan: { id: "plan1", label: "10GB · 7 days", data_mb: 10240, validity_days: 7, price: "749.00" },
};
const user = { id: "u1", first_name: "Alex", last_name: "Santos", email: "alex@example.com", contact_no: "+639170000000" };
const order = (over = {}) => ({ id: "o1", order_status: "pending_payment", total_amount: "749.00", delivery_fee: "0.00", lines: [], ...over });

function client(orders: (path: string, opts?: unknown) => unknown) {
  return {
    refresh: vi.fn().mockResolvedValue(true),
    request: vi.fn((path: string, opts?: unknown) => (path === "me" ? Promise.resolve(user) : orders(path, opts))),
    setAccessToken: vi.fn(), getAccessToken: () => "t", ensureCsrf: vi.fn(), postWithCsrf: vi.fn(),
  } as unknown as ApiClient;
}

function wrap(c: ApiClient, ui: ReactNode, lines: CartLine[] = [esim]) {
  localStorage.setItem(CART_KEY, JSON.stringify(lines));
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <AuthProvider client={c}>
          <CartProvider>{ui}</CartProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const pay = async () => userEvent.click(await screen.findByRole("button", { name: "Pay with Xendit" }));

test("no change → straight to Xendit, cart cleared", async () => {
  const onRedirect = vi.fn();
  const c = client(() => Promise.resolve({ order: order(), invoice_url: "https://x/inv", price_updates: [], removed_lines: [] }));
  wrap(c, <CheckoutView onRedirect={onRedirect} />);
  await pay();
  await waitFor(() => expect(onRedirect).toHaveBeenCalledWith("https://x/inv"));
  expect(JSON.parse(localStorage.getItem(CART_KEY)!)).toEqual([]);
  expect(c.request).toHaveBeenCalledWith("orders", expect.objectContaining({
    method: "POST", json: { client: "web", lines: [{ product_id: "pe", country_code: "JP", region_plan_id: "plan1", quantity: 1, expected_unit_price: "749.00" }] },
  }));
});

test("price change → notice and Continue to pay, no redirect until clicked", async () => {
  const onRedirect = vi.fn();
  const c = client(() => Promise.resolve({
    order: order({ total_amount: "799.00" }), invoice_url: "https://x/inv",
    price_updates: [{ name: "Japan 10GB · 7 days", old_unit_price: "749.00", new_unit_price: "799.00" }], removed_lines: [],
  }));
  wrap(c, <CheckoutView onRedirect={onRedirect} />);
  await pay();
  expect(await screen.findByText(/We've updated your order to the latest prices\. Your new total is ₱799 — please review before paying\./)).toBeInTheDocument();
  expect(screen.getByText("₱749")).toHaveClass("line-through");
  expect(onRedirect).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Continue to pay" }));
  expect(onRedirect).toHaveBeenCalledWith("https://x/inv");
});

test("a different server total with no notices is shown before paying", async () => {
  const onRedirect = vi.fn();
  const c = client(() => Promise.resolve({ order: order({ total_amount: "949.00", delivery_fee: "200.00" }), invoice_url: "https://x/inv", price_updates: [], removed_lines: [] }));
  wrap(c, <CheckoutView onRedirect={onRedirect} />);
  await pay();
  expect(await screen.findByText(/Your new total is ₱949/)).toBeInTheDocument();
  expect(screen.getByText("Delivery fee").parentElement).toHaveTextContent("₱200");
  expect(onRedirect).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Continue to pay" }));
  expect(onRedirect).toHaveBeenCalledWith("https://x/inv");
});

test("cents don't cause a false price-change screen", async () => {
  const onRedirect = vi.fn();
  const wifi: CartLine = { id: "w", product: { id: "pw", product_name: "WiFi", product_type: "pocket_wifi" }, country_code: "JP", plan: { id: "wp", name: "Unlimited", label: "Unlimited", data_mb: null, price: "33.33" }, quantity: 1, start_date: "2099-12-12", end_date: "2099-12-15" };
  const c = client(() => Promise.resolve({ order: order({ total_amount: "299.99", delivery_fee: "200.00" }), invoice_url: "https://x/inv", price_updates: [], removed_lines: [] }));
  wrap(c, <CheckoutView onRedirect={onRedirect} />, [wifi]);
  await pay();
  await waitFor(() => expect(onRedirect).toHaveBeenCalled());
});

test("removed line copy", async () => {
  const c = client(() => Promise.resolve({ order: order(), invoice_url: "u", price_updates: [], removed_lines: [{ name: "Japan Pocket WiFi" }, { name: "" }] }));
  wrap(c, <CheckoutView onRedirect={vi.fn()} />);
  await pay();
  expect(await screen.findByText("Heads up: Japan Pocket WiFi is no longer available, so we've removed it from your order.")).toBeInTheDocument();
  expect(screen.getByText(/^Heads up: A plan is no longer/)).toBeInTheDocument();
});

test("nothing_to_buy copy", async () => {
  const c = client(() => Promise.reject(new ApiError(409, {}, "nothing_to_buy", "gone")));
  wrap(c, <CheckoutView onRedirect={vi.fn()} />);
  await pay();
  expect(await screen.findByText("The plans in your cart are no longer available.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Browse current plans" })).toBeInTheDocument();
  await waitFor(() => expect(JSON.parse(localStorage.getItem(CART_KEY)!)).toEqual([])); // no loop back to dead lines
});

test("double submit creates one order", async () => {
  let resolve: (v: unknown) => void = () => {};
  const c = client(() => new Promise((r) => (resolve = r)));
  wrap(c, <CheckoutView onRedirect={vi.fn()} />);
  const button = await screen.findByRole("button", { name: "Pay with Xendit" });
  await userEvent.dblClick(button);
  expect(await screen.findByText("Updating to the latest prices, please hold on…")).toBeInTheDocument();
  resolve({ order: order(), invoice_url: "u", price_updates: [], removed_lines: [] });
  expect((c.request as ReturnType<typeof vi.fn>).mock.calls.filter(([p]) => p === "orders")).toHaveLength(1);
});

test("payment result polls until paid", async () => {
  const statuses = ["pending_payment", "paid"];
  const c = client(() => Promise.resolve(order({ order_status: statuses.shift() ?? "paid", lines: [{ id: "l1", variant_name_snapshot: "Japan 10GB · 7 days", product_type_snapshot: "esim", pricing_unit_snapshot: "per_plan", booking: null, countries_snapshot: ["JP"] }] })));
  wrap(c, <PaymentResultView orderId="o1" intervalMs={10} />);
  expect(await screen.findByText("Payment confirmed")).toBeInTheDocument();
  expect(screen.getByText("Starts when you activate")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Choose travel dates" })).not.toBeInTheDocument();
});

test("payment result gives up after the time limit", async () => {
  const c = client(() => Promise.resolve(order()));
  wrap(c, <PaymentResultView orderId="o1" intervalMs={5} maxWaitMs={30} />);
  expect(await screen.findByText(/Still processing/)).toBeInTheDocument();
});
