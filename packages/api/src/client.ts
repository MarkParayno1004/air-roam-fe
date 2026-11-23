/** Fetch client: access token in memory only, refresh via HttpOnly cookie + CSRF, 401 → refresh once → retry. */

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    public code?: string,
    public detail?: string,
  ) {
    super(detail ?? `Request failed (${status})`);
  }
}

export interface ClientOptions {
  baseUrl: string;
  /** e.g. "auth/web/refresh" (store) or "staff/auth/refresh" (admin) */
  refreshPath: string;
  onSessionLost?: () => void;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  json?: unknown;
  body?: BodyInit;
  /** don't attempt a token refresh on 401 (auth endpoints) */
  skipRefresh?: boolean;
}

export type ApiClient = ReturnType<typeof createClient>;

export function createClient({ baseUrl, refreshPath, onSessionLost }: ClientOptions) {
  let access: string | null = null;
  let csrf: string | null = null;
  let refreshing: Promise<boolean> | null = null;
  const lostListeners = new Set<() => void>();

  function send(path: string, opts: RequestOptions = {}, withAuth = true) {
    const { json, body, headers, skipRefresh: _skip, ...rest } = opts;
    const h = new Headers(headers);
    if (withAuth && access) h.set("Authorization", `Bearer ${access}`);
    if (json !== undefined) h.set("Content-Type", "application/json");
    return fetch(`${baseUrl}/${path}`, {
      ...rest,
      headers: h,
      body: json !== undefined ? JSON.stringify(json) : body,
      credentials: "include",
    });
  }

  async function ensureCsrf(): Promise<string> {
    if (!csrf) {
      const r = await send("auth/csrf", { method: "GET" }, false);
      csrf = ((await r.json()) as { csrfToken: string }).csrfToken;
    }
    return csrf;
  }

  function refresh(): Promise<boolean> {
    refreshing ??= (async () => {
      try {
        const token = await ensureCsrf();
        const r = await send(refreshPath, { method: "POST", headers: { "X-CSRFToken": token } }, false);
        if (!r.ok) throw new Error("refresh failed");
        access = ((await r.json()) as { access: string }).access;
        return true;
      } catch {
        access = null;
        onSessionLost?.();
        lostListeners.forEach((f) => f());
        return false;
      } finally {
        refreshing = null;
      }
    })();
    return refreshing;
  }

  async function toError(r: Response): Promise<ApiError> {
    let body: unknown = null;
    try {
      body = await r.json();
    } catch {
      /* empty or non-JSON body */
    }
    const b = (body ?? {}) as { code?: string; detail?: string };
    return new ApiError(r.status, body, b.code, typeof b.detail === "string" ? b.detail : undefined);
  }

  async function request<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
    let r = await send(path, opts);
    if (r.status === 401 && !opts.skipRefresh && (await refresh())) r = await send(path, opts);
    if (!r.ok) throw await toError(r);
    if (r.status === 204) return undefined as T;
    return (await r.json()) as T;
  }

  return {
    request,
    refresh,
    ensureCsrf,
    setAccessToken: (t: string | null) => void (access = t),
    getAccessToken: () => access,
    /** Called when the refresh cookie no longer works (expired, logged out elsewhere). Returns an unsubscribe. */
    onSessionLost(listener: () => void): () => void {
      lostListeners.add(listener);
      return () => void lostListeners.delete(listener);
    },
    /** POST with the CSRF header (cookie-authenticated endpoints such as logout). */
    async postWithCsrf<T = unknown>(path: string): Promise<T> {
      const token = await ensureCsrf();
      return request<T>(path, { method: "POST", headers: { "X-CSRFToken": token }, skipRefresh: true });
    },
  };
}
