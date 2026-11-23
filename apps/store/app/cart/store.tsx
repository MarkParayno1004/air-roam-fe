import type { PriceUpdate, RemovedLine } from "@air-roam/api";
import type { CatalogVariant } from "@air-roam/ui";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const CART_KEY = "air-roam-cart"; // no secrets: plans, quantities and dates only

export interface CartLine {
  id: string;
  variant: CatalogVariant;
  quantity: number;
  start_date?: string; // YYYY-MM-DD, Pocket WiFi only
  end_date?: string;
  destination_country_codes?: string[];
}

function isLine(x: unknown): x is CartLine {
  const l = x as CartLine;
  return !!l && typeof l.id === "string" && typeof l.quantity === "number" && !!l.variant && typeof l.variant.id === "string" && typeof l.variant.price === "string" && Array.isArray(l.variant.countries);
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
  add: (v: CatalogVariant) => void;
  update: (id: string, patch: Partial<CartLine>) => void;
  remove: (id: string) => void;
  clear: () => void;
  applyServerChanges: (updates: PriceUpdate[], removed: RemovedLine[]) => void;
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

  const add = useCallback((v: CatalogVariant) => {
    setLines((ls) => {
      const existing = v.pricing_unit === "per_plan" && ls.find((l) => l.variant.id === v.id);
      if (existing) return ls.map((l) => (l === existing ? { ...l, quantity: Math.min(10, l.quantity + 1) } : l));
      const line: CartLine = { id: crypto.randomUUID(), variant: v, quantity: 1 };
      if (v.pricing_unit === "per_day") line.destination_country_codes = [...v.countries];
      return [...ls, line];
    });
  }, []);
  const update = useCallback((id: string, patch: Partial<CartLine>) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l))), []);
  const remove = useCallback((id: string) => setLines((ls) => ls.filter((l) => l.id !== id)), []);
  const clear = useCallback(() => setLines([]), []);
  const applyServerChanges = useCallback((updates: PriceUpdate[], removed: RemovedLine[]) => {
    const gone = new Set(removed.map((r) => r.variant_id));
    const prices = new Map(updates.map((u) => [u.variant_id, u.new_unit_price]));
    setLines((ls) =>
      ls.filter((l) => !gone.has(l.variant.id)).map((l) => (prices.has(l.variant.id) ? { ...l, variant: { ...l.variant, price: prices.get(l.variant.id)! } } : l)),
    );
  }, []);

  const value = useMemo(
    () => ({ lines, count: lines.reduce((n, l) => n + l.quantity, 0), add, update, remove, clear, applyServerChanges }),
    [lines, add, update, remove, clear, applyServerChanges],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
