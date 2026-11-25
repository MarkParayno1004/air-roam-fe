import { countryName } from "@air-roam/ui";
import type { CartLine } from "./store";

const DAY = 86_400_000;

/** Calendar days between two YYYY-MM-DD dates (Dec 12 → Dec 18 = 6). */
export function rentalDays(start: string, end: string): number {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY);
}

/** Today in Manila (the backend counts rental days in Asia/Manila). */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
}

export const isRental = (l: Pick<CartLine, "product">) => l.product.product_type === "pocket_wifi";

/** Product, country (or region) and plan: two products can share a place and plan, so the product name must show. */
export function lineName(l: CartLine): string {
  return `${l.product.product_name} · ${l.region?.name ?? countryName(l.country_code)} ${l.plan.label}`;
}

export function lineProblem(l: Omit<CartLine, "id">, today: string): string | null {
  if (l.quantity < 1 || l.quantity > 10) return "Quantity must be between 1 and 10.";
  if (!isRental(l)) return null;
  if (!l.start_date || !l.end_date) return "Choose your rental dates to continue.";
  if (l.start_date < today) return "The start date can't be in the past.";
  // not "< 1": a typed 5-digit year gives NaN
  if (!(rentalDays(l.start_date, l.end_date) >= 1)) return "The end date must be after the start date.";
  return null;
}

export const lineIsValid = (l: CartLine, today: string) => lineProblem(l, today) === null;

// Mirrors orders/checkout.py; the server re-prices at checkout and its total is the one charged.
export const DELIVERY_FEE = 200;
export const DELIVERY_FEE_MAX_DAYS = 7;

export const lineDays = (l: CartLine) =>
  isRental(l) && l.start_date && l.end_date ? Math.max(0, rentalDays(l.start_date, l.end_date) || 0) : 0;

/** Each line pays its own plan's price; the delivery fee depends on all Pocket WiFi days together. */
export function cartTotals(lines: CartLine[]) {
  const days = lines.reduce((n, l) => n + lineDays(l), 0);
  const deliveryFee = days > 0 && days <= DELIVERY_FEE_MAX_DAYS ? DELIVERY_FEE : 0;
  const lineTotal = (l: CartLine) => l.quantity * Number(l.plan.price) * (isRental(l) ? lineDays(l) : 1);
  const total = lines.reduce((sum, l) => sum + lineTotal(l), deliveryFee);
  return { days, deliveryFee, total, lineTotal };
}

/** API datetime → YYYY-MM-DD in Manila. */
export function manilaDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date(iso));
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
}

/** Manila midnight ISO datetime for the API. */
export const toApiDate = (d: string) => `${d}T00:00:00+08:00`;
