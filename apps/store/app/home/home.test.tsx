import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import type { Destination, Product } from "@air-roam/api";
import Home from "../routes/home";

const plan = (gb: number, days: number, price: string) => ({ id: `${gb}-${price}`, label: `${gb}GB · ${days} days`, data_mb: gb * 1024, validity_days: days, price });
const wifi = (price: string) => ({ id: `w-${price}`, name: "Unlimited", label: "Unlimited", data_mb: null, price });
const country = (code: string, name: string, over: Partial<Destination> = {}): Destination => ({
  region: { id: "r", name: "Asia" }, country_code: code, country_name: name, slug: name.toLowerCase(), from_price: "300.00", wifi_plans: [wifi("300.00")], is_popular: false, plans: [plan(10, 14, "900.00"), plan(5, 7, "500.00")], ...over,
});
const austria = country("AT", "Austria", { plans: [plan(1, 7, "280.00")] });
const japan = country("JP", "Japan", { is_popular: true });
const thailand = country("TH", "Thailand", { is_popular: true, plans: [plan(5, 7, "350.00")], wifi_plans: [wifi("200.00")] });

const product = (product_type: string) => ({ id: product_type, product_name: product_type, product_type, product_thumbnail_img: null, product_description: "" }) as Product;
const sells = (...types: string[]) => types.map(product);

async function show(destinations: Destination[], products = sells("esim", "sim", "pocket_wifi")) {
  const Stub = createRoutesStub([{ path: "/", Component: Home, loader: () => ({ destinations, products }), HydrateFallback: () => null }]);
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  render(<QueryClientProvider client={client}><Stub /></QueryClientProvider>);
  await screen.findByRole("heading", { level: 1, name: "Land online. Skip the roaming surprise." });
}
const offer = () => screen.queryByRole("complementary", { name: "Example plan" });
const chooseLinks = () => screen.getAllByRole("link", { name: "Choose your country" }).map((l) => l.getAttribute("href"));

test("the hero offers the lowest plan among the popular countries", async () => {
  await show([thailand, austria, japan, country("CN", "China", { is_popular: true, plans: [plan(5, 7, "1200.00")] })]);
  expect(within(offer()!).getByText("Thailand")).toBeInTheDocument();
  expect(within(offer()!).getByRole("link", { name: "Get this plan" })).toHaveAttribute("href", "/products?country=thailand&type=esim&plan=5-350.00");
});

test("equal prices: the first country by name; the link names the plan", async () => {
  await show([country("KR", "Korea", { is_popular: true }), japan, austria]);
  const ticket = within(offer()!);
  expect(ticket.getByText("Japan")).toBeInTheDocument();
  expect(ticket.getByText("5GB · 7 days")).toBeInTheDocument();
  expect(ticket.getByText("₱500")).toBeInTheDocument();
  expect(ticket.getByText("₱71/day")).toBeInTheDocument();
  expect(ticket.getByRole("link", { name: "Get this plan" })).toHaveAttribute("href", "/products?country=japan&type=esim&plan=5-500.00");
});

test("without popular countries: the lowest plan of all is offered, the list is hidden and CTAs open Products", async () => {
  await show([country("AL", "Albania"), country("KR", "Korea"), austria]);
  expect(within(offer()!).getByText("Austria")).toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Where are you headed?" })).not.toBeInTheDocument();
  expect(new Set(chooseLinks())).toEqual(new Set(["/products"]));
});

test("popular countries with Pocket WiFi only: the lowest plan of all is offered", async () => {
  await show([{ ...japan, plans: [] }, austria]);
  expect(within(offer()!).getByText("Austria")).toBeInTheDocument();
});

test("no SIM/eSIM plans to offer: no ticket", async () => {
  await show([{ ...japan, plans: [] }]);
  expect(offer()).not.toBeInTheDocument();
});

test("no countries: no ticket, no list, no count", async () => {
  await show([]);
  expect(offer()).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Where are you headed?" })).not.toBeInTheDocument();
  expect(screen.getByText("Prices in PHP")).toBeInTheDocument();
  expect(new Set(chooseLinks())).toEqual(new Set(["/products"]));
  expect(screen.queryByText(/^from/)).not.toBeInTheDocument();
});

test("CTAs move to the country list, also for the keyboard", async () => {
  await show([japan, austria]);
  expect(screen.getByText("2 countries · prices in PHP")).toBeInTheDocument();
  expect(new Set(chooseLinks())).toEqual(new Set(["/#countries"]));
  await userEvent.click(screen.getAllByRole("link", { name: "Choose your country" }).at(-1)!);
  expect(screen.getByRole("region", { name: "Where are you headed?" })).toHaveFocus();
});

test("each product shows its lowest price across all countries", async () => {
  await show([japan, thailand, austria]);
  const prices = ["Pocket WiFi", "eSIM", "SIM"].map((name) => within(screen.getByRole("listitem", { name })).getByText(/^from/).textContent);
  expect(prices).toEqual(["from ₱200/day", "from ₱280", "from ₱280"]);
  const hrefs = ["Pocket WiFi", "eSIM", "SIM"].map((name) => screen.getByRole("link", { name: `See ${name} plans` }).getAttribute("href"));
  expect(hrefs).toEqual(["/products?type=pocket_wifi", "/products?type=esim", "/products?type=sim"]);
});

const hero = () => screen.getByRole("heading", { level: 1 }).parentElement!;
const cards = () => within(screen.getByRole("region", { name: "Which one is right for you?" })).getAllByRole("heading", { level: 3 }).map((h) => h.textContent);

test("everything sold: all of it is named", async () => {
  await show([japan]);
  expect(hero()).toHaveTextContent("Get an eSIM, a SIM or a Pocket WiFi for your trip. You see the price in pesos first. eSIM installs before you fly; SIM and Pocket WiFi are delivered.");
  expect(within(hero()).getByRole("list")).toHaveTextContent("eSIM installs before you fly");
  expect(within(offer()!).getByText("eSIM or SIM")).toBeInTheDocument();
  expect(cards()).toEqual(["Pocket WiFi", "eSIM", "SIM"]);
});

test("no eSIM: nothing on the page says eSIM and the offer opens SIM", async () => {
  await show([japan], sells("sim", "pocket_wifi"));
  expect(hero()).toHaveTextContent("Get a SIM or a Pocket WiFi for your trip. You see the price in pesos first. SIM and Pocket WiFi are delivered.");
  expect(within(offer()!).getByText("SIM")).toBeInTheDocument();
  expect(within(offer()!).getByRole("link", { name: "Get this plan" })).toHaveAttribute("href", "/products?country=japan&type=sim&plan=5-500.00");
  expect(cards()).toEqual(["Pocket WiFi", "SIM"]);
  expect(document.body).not.toHaveTextContent(/eSIM/);
});

test("Pocket WiFi only: no offer, nothing about SIM", async () => {
  await show([japan], sells("pocket_wifi"));
  expect(hero()).toHaveTextContent("Get a Pocket WiFi for your trip. You see the price in pesos first. Pocket WiFi is delivered.");
  expect(offer()).not.toBeInTheDocument();
  expect(cards()).toEqual(["Pocket WiFi"]);
});

test("eSIM only: nothing about SIM cards or Pocket WiFi", async () => {
  await show([{ ...japan, wifi_plans: [] }], sells("esim"));
  expect(hero()).toHaveTextContent("Get an eSIM for your trip. You see the price in pesos first. eSIM installs before you fly.");
  expect(document.body).not.toHaveTextContent(/Pocket WiFi|\bSIM\b|deliver/);
});

test("no products: the hero still reads, no chooser", async () => {
  await show([], []);
  expect(hero()).toHaveTextContent(/surprise\.You see the price in pesos first\. ?Choose/);
  expect(screen.queryByRole("region", { name: "Which one is right for you?" })).not.toBeInTheDocument();
});

test("answers five questions", async () => {
  await show([]);
  const faq = screen.getByRole("region", { name: "Questions, answered" });
  expect(within(faq).getAllByRole("group")).toHaveLength(5); // <details>
  expect(within(faq).getByText(/₱200 for rentals of 7 days or fewer/)).toBeInTheDocument();
});
