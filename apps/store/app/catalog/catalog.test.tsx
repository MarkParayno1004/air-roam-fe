import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import type { Destination, Product } from "@air-roam/api";
import { DestinationCard } from "./DestinationCard";
import { DestinationGrid } from "./DestinationGrid";
import { DestinationView } from "./DestinationView";
import { PopularDestinations } from "./PopularDestinations";
import { buildMeta, destinationTitle } from "../seo/meta";

const five = { id: "a5", label: "5GB · 7 days", data_mb: 5120, validity_days: 7, price: "399.00" };
const ten = { id: "a10", label: "10GB · 14 days", data_mb: 10240, validity_days: 14, price: "699.00" };
const unlimited = (price: string) => [{ id: `w${price}`, name: "Unlimited", label: "Unlimited", data_mb: null, price }];
const japan: Destination = { region: { id: "r-asia", name: "Asia" }, country_code: "JP", country_name: "Japan", slug: "japan", from_price: "100.00", wifi_plans: unlimited("100.00"), is_popular: false, plans: [five, ten] };
const usa: Destination = { region: { id: "r-us", name: "Americas" }, country_code: "US", country_name: "United States", slug: "united-states", from_price: "50.00", wifi_plans: unlimited("50.00"), is_popular: false, plans: [] };
const france: Destination = { region: { id: "r-eu", name: "Europe" }, country_code: "FR", country_name: "France", slug: "france", from_price: "399.00", wifi_plans: [], is_popular: false, plans: [five] };
const all = [japan, usa, france];
const esim: Product = { id: "pe", product_name: "Air Roam eSIM", product_type: "esim", product_thumbnail_img: null, product_description: "Instant eSIM data." };
const wifi: Product = { ...esim, id: "pw", product_name: "Air Roam Pocket WiFi", product_type: "pocket_wifi" };

test("country page: the country is fixed and its products can be bought straight away", async () => {
  const onAdd = vi.fn();
  render(<MemoryRouter><DestinationView destination={japan} products={[esim, wifi]} onAdd={onAdd} /></MemoryRouter>);
  expect(screen.getByRole("heading", { level: 1, name: "Japan" })).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toHaveTextContent("Home / Destinations / Japan");
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("radio", { name: "Air Roam eSIM" }));
  await userEvent.click(screen.getByRole("radio", { name: "10GB · 14 days" }));
  await userEvent.click(screen.getByRole("button", { name: "Add to cart" }));
  expect(onAdd).toHaveBeenCalledWith({ product: { id: "pe", product_name: "Air Roam eSIM", product_type: "esim" }, country_code: "JP", plan: ten });
});

test("destination card shows country and price only", () => {
  render(<MemoryRouter><DestinationCard d={japan} /></MemoryRouter>);
  expect(screen.getByRole("link")).toHaveTextContent(/^JPJapanFrom ₱100$/);
});

test("popular destinations shows only countries staff tagged as popular", () => {
  render(<MemoryRouter><PopularDestinations destinations={[japan, { ...usa, is_popular: true }, { ...france, is_popular: true }]} /></MemoryRouter>);
  expect(screen.getByRole("region", { name: "Popular destinations" })).toBeInTheDocument();
  expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["United States", "France"]);
});

test("popular destinations is hidden when no country is tagged", () => {
  render(<MemoryRouter><PopularDestinations destinations={all} /></MemoryRouter>);
  expect(screen.queryByText("Popular destinations")).not.toBeInTheDocument();
});

test("destination grid shows every country and filters by query", () => {
  const { rerender } = render(<MemoryRouter><DestinationGrid destinations={all} /></MemoryRouter>);
  expect(screen.getAllByRole("link")).toHaveLength(3);
  rerender(<MemoryRouter><DestinationGrid destinations={all} query="fran" /></MemoryRouter>);
  expect(screen.getAllByRole("link")).toHaveLength(1);
  rerender(<MemoryRouter><DestinationGrid destinations={all} query="zzz" /></MemoryRouter>);
  expect(screen.getByText("No destinations match. Try another search.")).toBeInTheDocument();
});

test("meta title format", () => {
  expect(destinationTitle("Japan", "449.00")).toBe("Japan eSIM, SIM & Pocket WiFi — from ₱449 · Air Roam");
  const meta = buildMeta({ title: "T", description: "D", path: "/destinations/japan" });
  expect(meta).toContainEqual({ title: "T" });
  expect(meta).toContainEqual({ property: "og:title", content: "T" });
  expect(meta).toContainEqual({ tagName: "link", rel: "canonical", href: "http://localhost:5173/destinations/japan" });
});
