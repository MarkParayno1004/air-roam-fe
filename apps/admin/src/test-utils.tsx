import type { ApiClient } from "@air-roam/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { StaffProvider } from "./auth/StaffProvider";
import { AppRoutes } from "./routes";

export const staff = (permissions: string[]) => ({ id: "s1", first_name: "Sam", last_name: "Reyes", email: "sam@airroam.ph", permissions });

/** Fake API client: `me` (GET) returns the given user; everything else goes to `handler`. */
export function fakeClient(me: unknown, handler: (path: string, opts?: unknown) => unknown = () => Promise.resolve({ count: 0, results: [] })) {
  const lost = new Set<() => void>();
  return {
    /** test helper: simulate the refresh cookie expiring */
    loseSession: () => lost.forEach((f) => f()),
    onSessionLost: (f: () => void) => (lost.add(f), () => lost.delete(f)),
    refresh: vi.fn().mockResolvedValue(me !== null),
    request: vi.fn((p: string, o?: unknown) => (p === "me" && !o ? Promise.resolve(me) : handler(p, o))),
    setAccessToken: vi.fn(),
    getAccessToken: () => "t",
    ensureCsrf: vi.fn(),
    postWithCsrf: vi.fn().mockResolvedValue(undefined),
  } as unknown as ApiClient;
}

export function renderAdmin(path: string, client: ApiClient, queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <StaffProvider client={client}>
          <AppRoutes />
        </StaffProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

export const page = <T,>(results: T[]) => Promise.resolve({ count: results.length, next: null, previous: null, results });
