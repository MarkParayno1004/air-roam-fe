import type { CheckoutResponse } from "@air-roam/api";
import { useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { isRental, toApiDate } from "../cart/rental";
import { useCart, type CartLine } from "../cart/store";

export function toApiLine(l: CartLine) {
  const line: Record<string, unknown> = { variant_id: l.variant.id, quantity: l.quantity, expected_unit_price: l.variant.price };
  if (isRental(l)) {
    line.start_at = toApiDate(l.start_date!);
    line.end_at = toApiDate(l.end_date!);
    line.destination_country_codes = l.destination_country_codes;
  }
  return line;
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
