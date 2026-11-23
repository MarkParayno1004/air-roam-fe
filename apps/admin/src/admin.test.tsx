import { ApiError } from "@air-roam/api";
import { QueryClient } from "@tanstack/react-query";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeClient, renderAdmin, staff } from "./test-utils";

test("signed-out staff see the login portal", async () => {
  renderAdmin("/orders", fakeClient(null));
  expect(await screen.findByRole("heading", { name: "Air Roam Admin" })).toBeInTheDocument();
});

test("traveler account is refused at login", async () => {
  const client = fakeClient(null, (p) => (p === "staff/auth/login" ? Promise.reject(new ApiError(403, {}, undefined, "This account has no staff access.")) : Promise.resolve({})));
  renderAdmin("/", client);
  await userEvent.type(await screen.findByLabelText("Email"), "traveler@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "long-enough-pass");
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByText("This account has no staff access.")).toBeInTheDocument();
});

test("a restored session with no staff role is treated as signed out", async () => {
  renderAdmin("/", fakeClient(staff([])));
  expect(await screen.findByRole("heading", { name: "Air Roam Admin" })).toBeInTheDocument();
});

test("marketing sidebar has no Users", async () => {
  renderAdmin("/", fakeClient(staff(["marketing"])));
  const nav = await screen.findByRole("navigation", { name: "Admin" });
  expect(nav).toHaveTextContent("Products (CMS)");
  expect(nav).not.toHaveTextContent("Users");
});

test("/users as marketing shows No access", async () => {
  renderAdmin("/users", fakeClient(staff(["marketing"])));
  expect(await screen.findByText("No access")).toBeInTheDocument();
});

test("an expired staff session returns to the login portal", async () => {
  const client = fakeClient(staff(["admin"]));
  renderAdmin("/", client);
  expect(await screen.findByRole("heading", { name: "Overview" })).toBeInTheDocument();
  act(() => (client as unknown as { loseSession: () => void }).loseSession());
  expect(await screen.findByRole("heading", { name: "Air Roam Admin" })).toBeInTheDocument();
});

test("signing out clears cached staff data", async () => {
  const qc = new QueryClient();
  qc.setQueryData(["staff-orders", "x"], { results: [] });
  renderAdmin("/", fakeClient(staff(["admin"])), qc);
  await userEvent.click(await screen.findByRole("button", { name: "Sign out" }));
  await waitFor(() => expect(qc.getQueryData(["staff-orders", "x"])).toBeUndefined());
});

test("overview shows counts", async () => {
  const client = fakeClient(staff(["admin"]), (p) => {
    if (p.includes("order_status=pending_payment")) return Promise.resolve({ count: 4, results: [] });
    if (p.includes("needs_attention=true")) return Promise.resolve({ count: 1, results: [] });
    if (p.startsWith("staff/bookings")) return Promise.resolve({ count: 2, results: [] });
    return Promise.resolve({ count: 0, results: [] });
  });
  renderAdmin("/", client);
  await waitFor(() => expect(screen.getByLabelText("Pending payment orders")).toHaveTextContent("4"));
  await waitFor(() => expect(screen.getByLabelText("Bookings starting today")).toHaveTextContent("2"));
  await waitFor(() => expect(screen.getByLabelText("Payments to review")).toHaveTextContent("1"));
});
