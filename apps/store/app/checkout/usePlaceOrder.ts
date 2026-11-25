import type { CheckoutResponse } from "@air-roam/api";
import { useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { cartTotals, isRental, toApiDate } from "../cart/rental";
import { useCart, type CartLine } from "../cart/store";

/** `rate` is the cart's highest Pocket WiFi rate: the price the customer was shown for every rental line. */
export function toApiLine(l: CartLine, rate: number) {
  const line = { product_id: l.product.id, country_code: l.country_code, quantity: l.quantity };
  if (!isRental(l)) return { ...line, region_plan_id: l.plan!.id, expected_unit_price: l.plan!.price };
  return { ...line, expected_unit_price: rate.toFixed(2), start_at: toApiDate(l.start_date!), end_at: toApiDate(l.end_date!) };
}

/** POST /orders exactly once per click burst; clears the cart once the order exists. */
export function usePlaceOrder() {
  const { client } = useAuth();
  const { lines, clear } = useCart();
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);

  async function place(): Promise<CheckoutResponse | null> {
    if (inFlight.current) return null;
    inFlight.current = true;
    setPending(true);
    const { rate } = cartTotals(lines);
    try {
      const res = await client.request<CheckoutResponse>("orders", { method: "POST", json: { client: "web", lines: lines.map((l) => toApiLine(l, rate)) } });
      clear(); // the order now holds these items, priced by the server
      return res;
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return { place, pending };
}
