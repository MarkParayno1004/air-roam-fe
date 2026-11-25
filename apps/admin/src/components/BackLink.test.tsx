import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { fakeClient, renderAdmin, staff } from "../test-utils";
import { BackLink } from "./BackLink";

function Where() {
  const l = useLocation();
  return <output>{l.pathname + l.search}</output>;
}
const at = (entries: string[]) => render(<MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}><BackLink to="/products" /><Where /></MemoryRouter>);
afterEach(() => window.history.replaceState(null, ""));

test("returns to the exact page you came from, keeping its filters", async () => {
  window.history.replaceState({ idx: 1 }, "");
  at(["/products?search=esim&page=2", "/products/p1"]);
  await userEvent.click(screen.getByRole("link", { name: "Back" }));
  expect(screen.getByRole("status")).toHaveTextContent("/products?search=esim&page=2");
});

test("goes to the list when the page was opened directly", async () => {
  window.history.replaceState({ idx: 0 }, "");
  at(["/products/p1"]);
  await userEvent.click(screen.getByRole("link", { name: "Back" }));
  expect(screen.getByRole("status")).toHaveTextContent(/^\/products$/);
});

test.each([["/products/p1", "/products"], ["/products/new", "/products"], ["/regions/r1", "/regions"], ["/orders/o1", "/orders"], ["/users/u1", "/users"]])("%s has a back arrow", async (path, list) => {
  const record = { id: "x1234567890", countries: [], plans: [], lines: [], permissions: [], order_status: "paid", user: {}, product_name: "", total_amount: "0", delivery_fee: "0", created_at: "2026-11-25T00:00:00Z" };
  renderAdmin(path, fakeClient(staff(["admin"]), () => Promise.resolve(record)));
  expect(await screen.findByRole("link", { name: "Back" })).toHaveAttribute("href", list);
});
