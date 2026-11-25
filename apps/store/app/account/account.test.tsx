import { ApiError, type ApiClient, type Order } from "@air-roam/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { AuthProvider } from "../auth/AuthProvider";
import { OrderCard } from "./OrderCard";
import { ProfileForm } from "./ProfileForm";

const user = { id: "u1", first_name: "Alex", last_name: "Santos", email: "alex@example.com", contact_no: "+639170000000", address: "Makati", permissions: [] };
const future = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();

const line = (over: Record<string, unknown> = {}) => ({
  id: "l1", product: "p1", region_plan: "plan1", product_name_snapshot: "Air Roam eSIM", variant_name_snapshot: "Japan 10GB · 7 days",
  product_type_snapshot: "esim", pricing_unit_snapshot: "per_plan", countries_snapshot: ["JP"], quantity: 1,
  unit_price: "799.00", rental_days: null, line_total: "799.00", booking: null, ...over,
});
const order = (lines: unknown[], over: Record<string, unknown> = {}) =>
  ({ id: "7f3c2a91-aaaa", order_status: "paid", client: "web", currency: "PHP", total_amount: "2899.00", delivery_fee: "0.00", xendit_invoice_url: null, paid_at: future(-1), created_at: future(-1), updated_at: future(-1), lines, ...over }) as unknown as Order;

function client(request = vi.fn()) {
  return {
    refresh: vi.fn().mockResolvedValue(true),
    request: vi.fn((p: string, o?: unknown) => (p === "me" && !o ? Promise.resolve(user) : request(p, o))),
    setAccessToken: vi.fn(), getAccessToken: () => "t", ensureCsrf: vi.fn(), postWithCsrf: vi.fn().mockResolvedValue(undefined),
  } as unknown as ApiClient;
}

function wrap(c: ApiClient, ui: ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <AuthProvider client={c}>{ui}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

test("pocket wifi booking shows lock copy and no Edit button", () => {
  const wifi = line({ pricing_unit_snapshot: "per_day", product_type_snapshot: "pocket_wifi", variant_name_snapshot: "Japan Pocket WiFi", booking: { id: "b1", booking_status: "confirmed", start_at: future(3), end_at: future(9), destination_country_codes: ["JP"] } });
  wrap(client(), <OrderCard order={order([wifi])} />);
  expect(screen.getByText("Rental dates can't be changed online. Contact support for changes.")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Edit dates" })).not.toBeInTheDocument();
});

test("order card shows the delivery fee only when charged", () => {
  const { unmount } = wrap(client(), <OrderCard order={order([line()], { delivery_fee: "200.00" })} />);
  expect(screen.getByText(/delivery fee ₱200/)).toBeInTheDocument();
  unmount();
  wrap(client(), <OrderCard order={order([line()])} />);
  expect(screen.queryByText(/delivery fee/)).not.toBeInTheDocument();
});

test("paid eSIM line starts on activation with no date links; unpaid order offers Pay now", () => {
  const { unmount } = wrap(client(), <OrderCard order={order([line()])} />);
  expect(screen.getByText("Starts when you activate")).toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  unmount();
  wrap(client(), <OrderCard order={order([line()], { order_status: "pending_payment", xendit_invoice_url: "https://x/inv" })} />);
  expect(screen.getByRole("link", { name: "Pay now" })).toHaveAttribute("href", "https://x/inv");
});

test("cancelling refreshes this order and reports failures", async () => {
  const request = vi.fn().mockRejectedValueOnce(new ApiError(400, {}, "invalid_transition", "Only unpaid orders can be cancelled."));
  const qc = new QueryClient();
  const spy = vi.spyOn(qc, "invalidateQueries");
  const unpaid = order([line()], { order_status: "pending_payment", xendit_invoice_url: "https://x/inv" });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AuthProvider client={client(request)}><OrderCard order={unpaid} /></AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  await userEvent.click(await screen.findByRole("button", { name: "Cancel order" }));
  expect(await screen.findByText("Only unpaid orders can be cancelled.")).toBeInTheDocument();
  request.mockResolvedValueOnce({});
  await userEvent.click(screen.getByRole("button", { name: "Cancel order" }));
  await waitFor(() => expect(spy).toHaveBeenCalledWith({ queryKey: ["order", unpaid.id] }));
});

test("profile save sends only editable fields", async () => {
  const request = vi.fn().mockResolvedValue(user);
  wrap(client(request), <ProfileForm />);
  const address = await screen.findByDisplayValue("Makati"); // wait for the profile to load
  await userEvent.clear(address);
  await userEvent.type(address, "BGC, Taguig");
  await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(request).toHaveBeenCalled());
  const [, opts] = request.mock.calls[0];
  expect(Object.keys(opts.json).sort()).toEqual(["address", "contact_no", "first_name", "last_name"]);
  expect(opts.json.address).toBe("BGC, Taguig");
});
