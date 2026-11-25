import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import type { Destination } from "@air-roam/api";
import { CountryList } from "./CountryList";

const plan = (gb: number, days: number, price: string) => ({ id: price, label: `${gb}GB · ${days} days`, data_mb: gb * 1024, validity_days: days, price });
const wifi = (price: string) => ({ id: price, name: "Regular", label: "Regular · 1GB/day", data_mb: 1024, price });
const country = (code: string, name: string, over: Partial<Destination> = {}): Destination => ({
  region: { id: "r", name: "Asia" }, country_code: code, country_name: name, slug: name.toLowerCase(), from_price: "490.00", wifi_plans: [wifi("550.00"), wifi("490.00")], is_popular: true, plans: [plan(10, 14, "900.00"), plan(5, 7, "500.00")], ...over,
});
const show = (destinations: Destination[]) => render(<MemoryRouter><CountryList destinations={destinations} /></MemoryRouter>);
const france = country("FR", "France", { is_popular: false });

test("only popular countries, alphabetical; each links to Products with the country", () => {
  show([country("TH", "Thailand"), france, country("JP", "Japan"), country("KR", "Korea")]);
  expect(screen.getByRole("region", { name: "Where are you headed?" })).toHaveAttribute("id", "countries");
  const links = screen.getAllByRole("listitem").map((li) => li.querySelector("a")!);
  expect(links.map((l) => l.textContent)).toEqual(["JPJapan5GB · 7 daysfrom ₱500", "KRKorea5GB · 7 daysfrom ₱500", "THThailand5GB · 7 daysfrom ₱500"]);
  expect(links.map((l) => l.getAttribute("href"))).toEqual(["/products?country=japan", "/products?country=korea", "/products?country=thailand"]);
});

test("only Pocket WiFi: its lowest rate, per day", () => {
  show([country("JP", "Japan", { plans: [] })]);
  expect(screen.getByRole("link", { name: /Japan/ })).toHaveTextContent(/JapanFrom ₱490\/day$/);
});

test("links to the rest of the countries, counting all of them, only when some are not listed", () => {
  const { unmount } = show([country("JP", "Japan"), france]);
  expect(screen.getByRole("link", { name: "See all 2 countries" })).toHaveAttribute("href", "/products");
  unmount();
  show([country("JP", "Japan")]);
  expect(screen.queryByRole("link", { name: /See all/ })).not.toBeInTheDocument();
});

test.each([[[]], [[france]]])("hidden when no country is popular %#", (destinations) => {
  expect(show(destinations).container).toBeEmptyDOMElement();
});
