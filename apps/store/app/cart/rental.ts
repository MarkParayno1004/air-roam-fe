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

export const isRental = (l: CartLine) => l.variant.pricing_unit === "per_day";

export function lineProblem(l: CartLine, today: string): string | null {
  if (l.quantity < 1 || l.quantity > 10) return "Quantity must be between 1 and 10.";
  if (!isRental(l)) return null;
  if (!l.start_date || !l.end_date) return "Choose your rental dates to continue.";
  if (l.start_date < today) return "The start date can't be in the past.";
  if (rentalDays(l.start_date, l.end_date) < 1) return "The end date must be after the start date.";
  if (!l.destination_country_codes?.length) return "Choose at least one country.";
  return null;
}

export const lineIsValid = (l: CartLine, today: string) => lineProblem(l, today) === null;

/** Price shown in the cart; the server re-prices at checkout. */
export function lineTotal(l: CartLine): number {
  const base = Number(l.variant.price) * l.quantity;
  if (!isRental(l)) return base;
  const days = l.start_date && l.end_date ? rentalDays(l.start_date, l.end_date) : 0;
  return days > 0 ? base * days : 0;
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
