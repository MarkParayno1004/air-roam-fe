import type { CheckoutResponse } from "@air-roam/api";
import { useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { isRental, toApiDate } from "../cart/rental";
import { useCart, type CartLine } from "../cart/store";

export function toApiLine(l: CartLine) {
  const line = {
    product_id: l.product.id, ...(!l.region && { country_code: l.country_code }), region_plan_id: l.plan.id,
    quantity: l.quantity, expected_unit_price: l.plan.price,
  };
  return isRental(l) ? { ...line, start_at: toApiDate(l.start_date!), end_at: toApiDate(l.end_date!) } : line;
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
    try {
      const res = await client.request<CheckoutResponse>("orders", { method: "POST", json: { client: "web", lines: lines.map(toApiLine) } });
      clear(); // the order now holds these items, priced by the server
      return res;
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return { place, pending };
}
