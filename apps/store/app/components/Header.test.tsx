import type { ApiClient } from "@air-roam/api";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { AuthProvider } from "../auth/AuthProvider";
import { CART_KEY, CartProvider } from "../cart/store";
import { Header } from "./Header";

const api = (signedIn = false) => ({ refresh: async () => signedIn, request: async () => ({ id: "u" }) }) as unknown as ApiClient;

async function show(path = "/", signedIn = false) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider client={api(signedIn)}><CartProvider><Header /></CartProvider></AuthProvider>
    </MemoryRouter>,
  );
  await screen.findAllByRole("link", { name: signedIn ? "My account" : "Log in" });
}
const menuButton = () => screen.getByRole("button", { name: "Menu" });
const menu = () => document.getElementById(menuButton().getAttribute("aria-controls")!)!;

test.each([
  ["/products", "One country"],
  ["/products/", "One country"], // some static hosts add the slash
  ["/products/multi-country", "Multiple countries"],
  ["/contact", "Help"],
])("%s marks only its own link as current", async (path, label) => {
  await show(path);
  const links = within(screen.getByRole("navigation", { name: "Main" })).getAllByRole("link");
  expect(links.filter((l) => l.getAttribute("aria-current") === "page").map((l) => l.textContent)).toEqual([label]);
});

test("the cart link says how many items it holds", async () => {
  const line = (id: string, quantity: number) => ({ id, quantity, country_code: "JP", product: { id: "p" }, plan: { id: "x", price: "1.00" } });
  localStorage.setItem(CART_KEY, JSON.stringify([line("a", 1), line("b", 1)]));
  await show();
  expect(screen.getByRole("link", { name: "Cart (2)" })).toHaveAttribute("href", "/cart");
});

test("an empty cart has no count", async () => {
  await show();
  expect(screen.getByRole("link", { name: "Cart" })).toBeInTheDocument();
});

test("the mobile menu has everything and Escape closes it, back to its button", async () => {
  await show();
  expect(menuButton()).toHaveAttribute("aria-expanded", "false");
  expect(menu()).not.toBeVisible();
  await userEvent.click(menuButton());
  expect(menuButton()).toHaveAttribute("aria-expanded", "true");
  expect(within(menu()).getAllByRole("link").map((l) => [l.textContent, l.getAttribute("href")])).toEqual([
    ["One country", "/products"],
    ["Multiple countries", "/products/multi-country"],
    ["Help", "/contact"],
    ["Get connected", "/products"],
    ["Log in", "/login"],
    ["Sign up", "/signup"],
  ]);
  await userEvent.tab();
  await userEvent.keyboard("{Escape}");
  expect(menu()).not.toBeVisible();
  expect(menuButton()).toHaveFocus();
});

test("the mobile menu closes on navigation, also to the page already open", async () => {
  await show("/contact");
  await userEvent.click(menuButton());
  await userEvent.click(within(menu()).getByRole("link", { name: "Help" }));
  expect(menu()).not.toBeVisible();
});

test("signed in: the account replaces Log in and Sign up", async () => {
  await show("/", true);
  await userEvent.click(menuButton());
  expect(within(menu()).getByRole("link", { name: "My account" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /Log in|Sign up/ })).not.toBeInTheDocument();
});
