import { ApiError } from "@air-roam/api";

/** Human message for a failed auth call. */
export function authMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 401) return "Wrong email or password.";
    if (e.status === 429) return "Too many attempts. Please wait a minute and try again.";
    if (e.status === 403) return e.detail ?? "This account can't sign in here.";
  }
  return "Something went wrong. Please try again.";
}

/** DRF field errors {"email": ["..."]} → first message per field. */
export function fieldErrors(e: unknown): Record<string, string> {
  if (!(e instanceof ApiError) || e.status !== 400 || !e.body || typeof e.body !== "object") return {};
  return Object.fromEntries(
    Object.entries(e.body as Record<string, unknown>).map(([k, v]) => [k, Array.isArray(v) ? String(v[0]) : String(v)]),
  );
}
