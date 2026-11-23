import { ApiError, type ApiClient } from "@air-roam/api";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { AuthProvider, safeNext } from "./AuthProvider";
import { RequireAuth } from "./RequireAuth";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";

function fakeClient(overrides: Partial<Record<string, unknown>> = {}) {
  let token: string | null = null;
  return {
    refresh: vi.fn().mockResolvedValue(false),
    request: vi.fn(),
    setAccessToken: (t: string | null) => void (token = t),
    getAccessToken: () => token,
    ensureCsrf: vi.fn().mockResolvedValue("c"),
    postWithCsrf: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as ApiClient;
}

function Where() {
  const l = useLocation();
  return <p data-testid="where">{l.pathname + l.search}</p>;
}

function renderAt(path: string, client: ApiClient) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider client={client}>
        <Routes>
          <Route path="/" element={<p>Public home</p>} />
          <Route path="/checkout" element={<RequireAuth><p>Checkout page</p></RequireAuth>} />
          <Route path="/login" element={<><LoginForm /><Where /></>} />
          <Route path="/signup" element={<><SignupForm /><Where /></>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

test("public page stays when logged out", async () => {
  renderAt("/", fakeClient());
  expect(await screen.findByText("Public home")).toBeInTheDocument();
});

test("checkout redirects guest to login with next", async () => {
  renderAt("/checkout", fakeClient());
  expect(await screen.findByTestId("where")).toHaveTextContent("/login?next=%2Fcheckout");
});

test("restored session reaches checkout", async () => {
  const client = fakeClient({ refresh: vi.fn().mockResolvedValue(true), request: vi.fn().mockResolvedValue({ email: "alex@example.com", first_name: "A" }) });
  renderAt("/checkout", client);
  expect(await screen.findByText("Checkout page")).toBeInTheDocument();
});

test("next param rejects external urls", () => {
  expect(safeNext("https://evil.test")).toBe("/");
  expect(safeNext("//evil.test")).toBe("/");
  expect(safeNext("/\\evil.test")).toBe("/");
  expect(safeNext("/checkout")).toBe("/checkout");
  expect(safeNext(null)).toBe("/");
});

test("login sends credentials then follows next", async () => {
  const request = vi.fn().mockResolvedValue({ access: "tok", user: { email: "alex@example.com", first_name: "A" } });
  renderAt("/login?next=/checkout", fakeClient({ request }));
  await userEvent.type(await screen.findByLabelText("Email"), "alex@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "long-enough-pass");
  await userEvent.click(screen.getByRole("button", { name: "Log in" }));
  await waitFor(() => expect(screen.getByText("Checkout page")).toBeInTheDocument());
  expect(request).toHaveBeenCalledWith("auth/web/login", expect.objectContaining({ method: "POST", json: { email: "alex@example.com", password: "long-enough-pass" } }));
});

test("wrong password shows a message", async () => {
  const request = vi.fn().mockRejectedValue(new ApiError(401, {}, undefined, "No active account"));
  renderAt("/login", fakeClient({ request }));
  await userEvent.type(await screen.findByLabelText("Email"), "alex@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "wrong-password");
  await userEvent.click(screen.getByRole("button", { name: "Log in" }));
  expect(await screen.findByText("Wrong email or password.")).toBeInTheDocument();
});

test("password under 10 characters blocked client-side", async () => {
  const request = vi.fn();
  renderAt("/signup", fakeClient({ request }));
  await userEvent.type(await screen.findByLabelText("First name"), "Mia");
  await userEvent.type(screen.getByLabelText("Last name"), "Cruz");
  await userEvent.type(screen.getByLabelText("Email"), "mia@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "short1");
  await userEvent.click(screen.getByRole("button", { name: "Create account" }));
  expect(await screen.findByText("Use at least 10 characters.")).toBeInTheDocument();
  expect(request).not.toHaveBeenCalled();
});

test("signup shows backend field errors", async () => {
  const request = vi.fn().mockRejectedValue(new ApiError(400, { email: ["An account with this email already exists."] }));
  renderAt("/signup", fakeClient({ request }));
  await userEvent.type(await screen.findByLabelText("First name"), "Mia");
  await userEvent.type(screen.getByLabelText("Last name"), "Cruz");
  await userEvent.type(screen.getByLabelText("Email"), "mia@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "long-enough-pass");
  await userEvent.click(screen.getByRole("button", { name: "Create account" }));
  expect(await screen.findByText("An account with this email already exists.")).toBeInTheDocument();
});
