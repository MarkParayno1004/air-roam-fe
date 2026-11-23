import { ApiError } from "@air-roam/api";

/** DRF 400 body → { field: first message }; other errors → { form: message }. */
export function toFieldErrors(e: unknown): { fields: Record<string, string> } {
  if (e instanceof ApiError && e.status === 400 && e.body && typeof e.body === "object" && !("code" in e.body)) {
    return { fields: Object.fromEntries(Object.entries(e.body as Record<string, unknown>).map(([k, v]) => [k === "non_field_errors" ? "form" : k, Array.isArray(v) ? String(v[0]) : String(v)])) };
  }
  return { fields: { form: errorMessage(e) } };
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.detail) return e.detail;
    if (e.status === 403) return "You don't have permission to do that.";
  }
  return "Something went wrong. Please try again.";
}
