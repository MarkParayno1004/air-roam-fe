import { ApiError } from "@air-roam/api";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { nextStatuses } from "../../lib/transitions";
import { fakeClient, page, renderAdmin, staff } from "../../test-utils";

const order = {
  id: "7f3c2a91-0000-0000-0000-000000000000", order_status: "paid", client: "web", currency: "PHP", total_amount: "2899.00",
  xendit_invoice_url: "https://checkout.xendit.co/inv_1", xendit_invoice_id: "inv_1", paid_at: "2026-11-23T10:00:00+08:00",
  created_at: "2026-11-23T09:00:00+08:00", updated_at: "2026-11-23T10:00:00+08:00", needs_attention: false, attention_note: "",
  user: { id: "u1", email: "traveler@example.com", first_name: "Alex", last_name: "Santos", contact_no: "+63917" },
  lines: [{ id: "l1", product_name_snapshot: "Air Roam Pocket WiFi", variant_name_snapshot: "Japan", product_type_snapshot: "pocket_wifi", pricing_unit_snapshot: "per_day", countries_snapshot: ["JP"], quantity: 1, unit_price: "350.00", rental_days: 6, line_total: "2100.00", booking: { id: "b1", booking_status: "confirmed", start_at: "2026-12-12T00:00:00+08:00", end_at: "2026-12-18T00:00:00+08:00", destination_country_codes: ["JP"] } }],
};

const wifiBooking = {
  id: "b1", booking_status: "confirmed", start_at: "2026-12-12T00:00:00+08:00", end_at: "2026-12-18T00:00:00+08:00", destination_country_codes: ["JP"],
  order_id: order.id, order_line_id: "l1", product_name: "Air Roam Pocket WiFi", variant_name: "Japan", product_type: "pocket_wifi", pricing_unit: "per_day", countries: ["JP"], customer_email: "traveler@example.com", rental_days: 6,
};

test.each([
  ["pending_payment", ["cancelled"]],
  ["paid", ["fulfilled", "refunded", "cancelled"]],
  ["fulfilled", []], ["expired", []], ["cancelled", []], ["refunded", []],
])("next statuses from %s", (s, expected) => expect(nextStatuses(s)).toEqual(expected));

test("marketing sees order details without action buttons", async () => {
  renderAdmin(`/orders/${order.id}`, fakeClient(staff(["marketing"]), () => Promise.resolve(order)));
  expect(await screen.findByText("traveler@example.com")).toBeInTheDocument();
  expect(screen.getByText("inv_1")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Change status" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Delete order" })).not.toBeInTheDocument();
});

test("admin status change error is shown", async () => {
  const client = fakeClient(staff(["admin"]), (p, o) =>
    (o as { method?: string } | undefined)?.method === "PATCH"
      ? Promise.reject(new ApiError(400, {}, "invalid_transition", "An order can't go from paid to fulfilled."))
      : Promise.resolve(order),
  );
  renderAdmin(`/orders/${order.id}`, client);
  await userEvent.click(await screen.findByRole("button", { name: "Change status" }));
  await userEvent.selectOptions(screen.getByLabelText("New status"), "fulfilled");
  await userEvent.click(screen.getByRole("button", { name: "Apply" }));
  expect(await screen.findByText("An order can't go from paid to fulfilled.")).toBeInTheDocument();
});

test("orders list shows rows and filters by status", async () => {
  const client = fakeClient(staff(["admin"]), () => page([order]));
  renderAdmin("/orders?order_status=paid", client);
  expect(await screen.findByText("traveler@example.com")).toBeInTheDocument();
  await waitFor(() => expect(client.request).toHaveBeenCalledWith(expect.stringContaining("order_status=paid")));
});

test("pocket wifi day change warning", async () => {
  const client = fakeClient(staff(["admin"]), (p, o) =>
    (o as { method?: string } | undefined)?.method === "PATCH" ? Promise.resolve({ ...wifiBooking, rental_days_changed: true }) : page([wifiBooking]),
  );
  renderAdmin("/bookings", client);
  await userEvent.click(await screen.findByRole("button", { name: "Edit booking for traveler@example.com" }));
  const end = screen.getByLabelText("End date");
  await userEvent.clear(end);
  await userEvent.type(end, "2026-12-20");
  expect(screen.getByText("The number of rental days changed — settle the price difference with the traveler manually.")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Save booking" }));
  await waitFor(() => expect(client.request).toHaveBeenCalledWith("staff/bookings/b1", expect.objectContaining({ method: "PATCH" })));
});

test("server rental-days warning stays visible after saving", async () => {
  const client = fakeClient(staff(["admin"]), (p, o) =>
    (o as { method?: string } | undefined)?.method === "PATCH" ? Promise.resolve({ ...wifiBooking, rental_days_changed: true }) : page([wifiBooking]),
  );
  renderAdmin("/bookings", client);
  await userEvent.click(await screen.findByRole("button", { name: "Edit booking for traveler@example.com" }));
  const form = screen.getByRole("form", { name: "Edit booking Air Roam Pocket WiFi · Japan" });
  await userEvent.selectOptions(within(form).getByLabelText("Status"), "active"); // dates unchanged on screen
  await userEvent.click(screen.getByRole("button", { name: "Save booking" }));
  expect(await screen.findByText("The number of rental days changed — settle the price difference with the traveler manually.")).toBeInTheDocument();
  expect(screen.getByText("Saved.")).toBeInTheDocument();
});

test("marketing cannot edit bookings", async () => {
  renderAdmin("/bookings", fakeClient(staff(["marketing"]), () => page([wifiBooking])));
  expect(await screen.findByText("traveler@example.com")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Edit booking/ })).not.toBeInTheDocument();
});
