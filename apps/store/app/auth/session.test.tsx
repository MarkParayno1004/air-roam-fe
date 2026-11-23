import type { ApiClient } from "@air-roam/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { AuthProvider, useAuth } from "./AuthProvider";
import { RequireAuth } from "./RequireAuth";

const user = { id: "u1", first_name: "Alex", last_name: "S", email: "alex@example.com", permissions: [] };

function client() {
  const listeners = new Set<() => void>();
  return {
    lose: () => listeners.forEach((f) => f()),
    api: {
      refresh: vi.fn().mockResolvedValue(true),
      request: vi.fn().mockResolvedValue(user),
      setAccessToken: vi.fn(), getAccessToken: () => "t", ensureCsrf: vi.fn(), postWithCsrf: vi.fn().mockResolvedValue(undefined),
      onSessionLost: (f: () => void) => (listeners.add(f), () => listeners.delete(f)),
    } as unknown as ApiClient,
  };
}

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

function LogoutButton() {
  const { logout } = useAuth();
  return <button onClick={logout}>Log out</button>;
}

test("an expired session mid-use signs the traveler out", async () => {
  const c = client();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={["/account"]}>
        <AuthProvider client={c.api}>
          <Routes>
            <Route path="/account" element={<RequireAuth><p>Account page</p></RequireAuth>} />
            <Route path="/login" element={<Where />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  expect(await screen.findByText("Account page")).toBeInTheDocument();
  act(() => c.lose());
  expect(await screen.findByTestId("where")).toHaveTextContent("/login");
});

test("logging out clears cached account data", async () => {
  const qc = new QueryClient();
  qc.setQueryData(["orders"], { results: [{ id: "someone-elses-order" }] });
  const c = client();
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AuthProvider client={c.api}>
          <LogoutButton />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Log out" }));
  await waitFor(() => expect(qc.getQueryData(["orders"])).toBeUndefined());
});
