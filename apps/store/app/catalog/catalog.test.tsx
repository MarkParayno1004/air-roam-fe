import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import type { Destination, Product } from "@air-roam/api";
import { DestinationCard } from "./DestinationCard";
import { DestinationView } from "./DestinationView";
import { PopularDestinations } from "./PopularDestinations";
import { ProductCard } from "./ProductCard";
import { buildMeta, destinationTitle } from "../seo/meta";

const five = { id: "a5", label: "5GB · 7 days", data_mb: 5120, validity_days: 7, price: "399.00" };
const ten = { id: "a10", label: "10GB · 14 days", data_mb: 10240, validity_days: 14, price: "699.00" };
const japan: Destination = { country_code: "JP", country_name: "Japan", slug: "japan", from_price: "100.00", pocket_wifi_daily_rate: "100.00", plans: [five, ten] };
const usa: Destination = { country_code: "US", country_name: "United States", slug: "united-states", from_price: "50.00", pocket_wifi_daily_rate: "50.00", plans: [] };
const france: Destination = { country_code: "FR", country_name: "France", slug: "france", from_price: "399.00", pocket_wifi_daily_rate: null, plans: [five] };
const all = [japan, usa, france];
const esim: Product = { id: "pe", product_name: "Air Roam eSIM", product_type: "esim", product_thumbnail_img: null, product_description: "Instant eSIM data." };
const wifi: Product = { ...esim, id: "pw", product_name: "Air Roam Pocket WiFi", product_type: "pocket_wifi" };

const card = (product: Product, over: { initialCountry?: string; onAdd?: () => void } = {}) =>
  render(<ProductCard product={product} destinations={all} onAdd={vi.fn()} {...over} />);
const options = () => within(screen.getByLabelText("Country")).getAllByRole("option").map((o) => o.textContent);

test("eSIM: picking a country and plan shows its price and adds it", async () => {
  const onAdd = vi.fn();
  card(esim, { onAdd });
  expect(screen.getByRole("button", { name: "Add to cart" })).toBeDisabled();
  await userEvent.selectOptions(screen.getByLabelText("Country"), "JP");
  expect(screen.queryByText("₱699")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("radio", { name: "10GB · 14 days" }));
  expect(screen.getByText("₱699")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Add to cart" }));
  expect(onAdd).toHaveBeenCalledWith({ product: { id: "pe", product_name: "Air Roam eSIM", product_type: "esim" }, country_code: "JP", plan: ten });
});

test("changing country clears the chosen plan", async () => {
  card(esim, { initialCountry: "JP" });
  await userEvent.click(screen.getByRole("radio", { name: "5GB · 7 days" }));
  await userEvent.selectOptions(screen.getByLabelText("Country"), "FR");
  expect(screen.getByRole("radio", { name: "5GB · 7 days" })).not.toBeChecked();
  expect(screen.getByRole("button", { name: "Add to cart" })).toBeDisabled();
});

test("WiFi: the country decides the daily rate and total, and dates are added", async () => {
  const onAdd = vi.fn();
  card(wifi, { initialCountry: "JP", onAdd });
  expect(screen.getByText("₱100")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Rent device" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2099-12-12" } });
  fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2099-12-14" } });
  expect(screen.getByText("2 days · ₱200")).toBeInTheDocument();
  await userEvent.selectOptions(screen.getByLabelText("Country"), "US");
  expect(screen.getByText("2 days · ₱100")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Rent device" }));
  expect(onAdd).toHaveBeenCalledWith({
    product: { id: "pw", product_name: "Air Roam Pocket WiFi", product_type: "pocket_wifi" },
    country_code: "US", daily_rate: "50.00", start_date: "2099-12-12", end_date: "2099-12-14",
  });
});

test("WiFi: invalid dates keep Rent device disabled and say why", () => {
  card(wifi, { initialCountry: "JP" });
  fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2099-12-12" } });
  fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2099-12-12" } });
  expect(screen.getByRole("button", { name: "Rent device" })).toBeDisabled();
  expect(screen.getByText("The end date must be after the start date.")).toBeInTheDocument();
});

test("only countries that sell the product are offered", () => {
  const { unmount } = card(wifi);
  expect(options()).toEqual(["Choose a country", "Japan", "United States"]);
  unmount();
  card(esim);
  expect(options()).toEqual(["Choose a country", "Japan", "France"]);
});

test("a page country that does not sell the product starts unselected", () => {
  card(wifi, { initialCountry: "FR" });
  expect(screen.getByLabelText("Country")).toHaveValue("");
});

test("destination page preselects its country; type tabs filter products", async () => {
  render(<MemoryRouter><DestinationView destination={japan} destinations={all} products={[esim, wifi]} onAdd={vi.fn()} /></MemoryRouter>);
  for (const s of screen.getAllByLabelText("Country")) expect(s).toHaveValue("JP");
  await userEvent.click(screen.getByRole("button", { name: "Pocket WiFi" }));
  expect(screen.queryByText("Air Roam eSIM")).not.toBeInTheDocument();
  expect(screen.getByText("Air Roam Pocket WiFi")).toBeInTheDocument();
});

test("destination card shows country and price only", () => {
  render(<MemoryRouter><DestinationCard d={japan} /></MemoryRouter>);
  expect(screen.getByRole("link")).toHaveTextContent(/^JPJapanFrom ₱100$/);
});

test("popular destinations filter by query and limit", () => {
  const { rerender } = render(<MemoryRouter><PopularDestinations destinations={all} query="fran" /></MemoryRouter>);
  expect(screen.getAllByRole("link")).toHaveLength(1);
  rerender(<MemoryRouter><PopularDestinations destinations={all} limit={2} /></MemoryRouter>);
  expect(screen.getAllByRole("link")).toHaveLength(2);
});

test("meta title format", () => {
  expect(destinationTitle("Japan", "449.00")).toBe("Japan eSIM, SIM & Pocket WiFi — from ₱449 · Air Roam");
  const meta = buildMeta({ title: "T", description: "D", path: "/destinations/japan" });
  expect(meta).toContainEqual({ title: "T" });
  expect(meta).toContainEqual({ property: "og:title", content: "T" });
  expect(meta).toContainEqual({ tagName: "link", rel: "canonical", href: "http://localhost:5173/destinations/japan" });
});
