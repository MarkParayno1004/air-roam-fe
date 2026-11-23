import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { ApiError, createClient } from "./client";

const BASE = "http://api.test/api/v1";
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function csrfHandler() {
  return http.get(`${BASE}/auth/csrf`, () => HttpResponse.json({ csrfToken: "csrf-1" }));
}

function make(onSessionLost = vi.fn()) {
  return createClient({ baseUrl: BASE, refreshPath: "auth/web/refresh", onSessionLost });
}

test("attaches bearer and sends JSON", async () => {
  let auth: string | null = null;
  let body: unknown = null;
  server.use(
    http.post(`${BASE}/things`, async ({ request }) => {
      auth = request.headers.get("authorization");
      body = await request.json();
      return HttpResponse.json({ ok: true });
    }),
  );
  const api = make();
  api.setAccessToken("tok");
  expect(await api.request("things", { method: "POST", json: { a: 1 } })).toEqual({ ok: true });
  expect(auth).toBe("Bearer tok");
  expect(body).toEqual({ a: 1 });
});

test("401 → refresh once → retry succeeds", async () => {
  server.use(
    csrfHandler(),
    http.get(`${BASE}/me`, ({ request }) =>
      request.headers.get("authorization") === "Bearer fresh" ? HttpResponse.json({ id: 1 }) : new HttpResponse(null, { status: 401 }),
    ),
    http.post(`${BASE}/auth/web/refresh`, () => HttpResponse.json({ access: "fresh" })),
  );
  const api = make();
  api.setAccessToken("stale");
  expect(await api.request("me")).toEqual({ id: 1 });
  expect(api.getAccessToken()).toBe("fresh");
});

test("concurrent 401s share one refresh", async () => {
  let refreshes = 0;
  server.use(
    csrfHandler(),
    http.get(`${BASE}/a`, ({ request }) => (request.headers.get("authorization") === "Bearer fresh" ? HttpResponse.json("a") : new HttpResponse(null, { status: 401 }))),
    http.get(`${BASE}/b`, ({ request }) => (request.headers.get("authorization") === "Bearer fresh" ? HttpResponse.json("b") : new HttpResponse(null, { status: 401 }))),
    http.post(`${BASE}/auth/web/refresh`, async () => {
      refreshes++;
      await new Promise((r) => setTimeout(r, 20));
      return HttpResponse.json({ access: "fresh" });
    }),
  );
  const api = make();
  api.setAccessToken("stale");
  expect(await Promise.all([api.request("a"), api.request("b")])).toEqual(["a", "b"]);
  expect(refreshes).toBe(1);
});

test("refresh failure clears session", async () => {
  const lost = vi.fn();
  server.use(
    csrfHandler(),
    http.get(`${BASE}/me`, () => new HttpResponse(null, { status: 401 })),
    http.post(`${BASE}/auth/web/refresh`, () => HttpResponse.json({ detail: "expired" }, { status: 401 })),
  );
  const api = make(lost);
  api.setAccessToken("stale");
  await expect(api.request("me")).rejects.toMatchObject({ status: 401 });
  expect(lost).toHaveBeenCalled();
  expect(api.getAccessToken()).toBeNull();
});

test("session-lost listeners are told when a refresh fails, and can unsubscribe", async () => {
  server.use(csrfHandler(), http.post(`${BASE}/auth/web/refresh`, () => new HttpResponse(null, { status: 401 })));
  const api = make();
  const a = vi.fn();
  const b = vi.fn();
  api.onSessionLost(a);
  const off = api.onSessionLost(b);
  off();
  expect(await api.refresh()).toBe(false);
  expect(a).toHaveBeenCalledTimes(1);
  expect(b).not.toHaveBeenCalled();
});

test("sends X-CSRFToken on refresh", async () => {
  let header: string | null = null;
  server.use(
    csrfHandler(),
    http.post(`${BASE}/auth/web/refresh`, ({ request }) => {
      header = request.headers.get("x-csrftoken");
      return HttpResponse.json({ access: "x" });
    }),
  );
  expect(await make().refresh()).toBe(true);
  expect(header).toBe("csrf-1");
});

test("ApiError carries code/detail", async () => {
  server.use(http.post(`${BASE}/orders`, () => HttpResponse.json({ code: "nothing_to_buy", detail: "gone" }, { status: 409 })));
  const err = await make().request("orders", { method: "POST", json: {} }).catch((e) => e);
  expect(err).toBeInstanceOf(ApiError);
  expect(err).toMatchObject({ status: 409, code: "nothing_to_buy", detail: "gone" });
});

test("204 resolves undefined", async () => {
  server.use(http.post(`${BASE}/auth/web/logout`, () => new HttpResponse(null, { status: 204 })));
  expect(await make().request("auth/web/logout", { method: "POST", skipRefresh: true })).toBeUndefined();
});
