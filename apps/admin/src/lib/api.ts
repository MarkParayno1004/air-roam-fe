import { createClient } from "@air-roam/api";

export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

/** Staff API client: access token in memory, refresh token in the HttpOnly `ar_staff_refresh` cookie. */
export const api = createClient({ baseUrl: API_URL, refreshPath: "staff/auth/refresh" });

export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
}
