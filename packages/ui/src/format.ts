export type Tone = "grey" | "teal" | "green" | "red";

const whole = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });
const cents = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 });

/** ₱1,299 for whole pesos, ₱749.50 otherwise. */
export function formatPHP(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return Number.isInteger(n) ? whole.format(n) : cents.format(n);
}

const TONES: Record<string, Tone> = {
  pending_payment: "grey", pending: "grey", expired: "grey", refunded: "grey",
  paid: "teal", confirmed: "teal", active: "teal",
  fulfilled: "green", completed: "green",
  cancelled: "red",
};

export function statusTone(status: string): Tone {
  return TONES[status] ?? "grey";
}

export function statusLabel(status: string): string {
  const s = status.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Booking dates are Manila calendar days; show them as such wherever the traveler is. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric" });
}
