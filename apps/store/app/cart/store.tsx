import type { Plan } from "@air-roam/api";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const CART_KEY = "air-roam-cart"; // no secrets: plans, quantities and dates only

export interface CartLine {
  id: string;
  product: { id: string; product_name: string; product_type: string };
  country_code: string;
  plan?: Plan; // SIM/eSIM
  daily_rate?: string; // Pocket WiFi: the chosen country's own rate
  quantity: number;
  start_date?: string; // YYYY-MM-DD, Pocket WiFi only
  end_date?: string;
}

export type NewLine = Omit<CartLine, "id" | "quantity">;

function isLine(x: unknown): x is CartLine {
  const l = x as CartLine;
  const priced = l?.product?.product_type === "pocket_wifi" ? typeof l.daily_rate === "string" : typeof l?.plan?.price === "string";
  return priced && typeof l.id === "string" && typeof l.quantity === "number" && typeof l.product.id === "string" && typeof l.country_code === "string";
}

/** Read the saved cart; anything malformed resets to an empty cart. */
export function loadCart(): CartLine[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
    return Array.isArray(data) && data.every(isLine) ? data : [];
  } catch {
    return [];
  }
}

interface CartApi {
  lines: CartLine[];
  count: number;
  add: (l: NewLine) => void;
  update: (id: string, patch: Partial<CartLine>) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  // Start empty (matches the pre-rendered HTML), then load the saved cart after hydration.
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLines(loadCart());
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(CART_KEY, JSON.stringify(lines));
  }, [lines, loaded]);

  const add = useCallback((n: NewLine) => {
    setLines((ls) => {
      const existing = n.plan && ls.find((l) => l.product.id === n.product.id && l.country_code === n.country_code && l.plan?.id === n.plan?.id);
      if (existing) return ls.map((l) => (l === existing ? { ...l, quantity: Math.min(10, l.quantity + 1) } : l));
      return [...ls, { ...n, id: crypto.randomUUID(), quantity: 1 }];
    });
  }, []);
  const update = useCallback((id: string, patch: Partial<CartLine>) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l))), []);
  const remove = useCallback((id: string) => setLines((ls) => ls.filter((l) => l.id !== id)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({ lines, count: lines.reduce((n, l) => n + l.quantity, 0), add, update, remove, clear }),
    [lines, add, update, remove, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
