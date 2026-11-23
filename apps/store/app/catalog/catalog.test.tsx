import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import type { CatalogVariant } from "@air-roam/ui";
import { DestinationView } from "./DestinationView";
import { PopularDestinations } from "./PopularDestinations";
import { buildMeta, destinationTitle } from "../seo/meta";

const v = (over: Partial<CatalogVariant>): CatalogVariant => ({
  id: Math.random().toString(), name: "Japan 3GB · 5 days", countries: ["JP"], scope: "single", region: "asia", tag: null,
  data_mb: 3072, validity_days: 5, price: "449.00", pricing_unit: "per_plan", product_type: "esim", ...over,
});
const japan = { country_code: "JP", country_name: "Japan", slug: "japan", region: "asia", from_price: "449.00", multi_country_pack_count: 1 };

test("destination page splits country-only plans and packs", () => {
  render(
    <MemoryRouter>
      <DestinationView destination={japan} variants={[v({}), v({ name: "Asia 8", countries: ["JP", "KR"], scope: "multi", price: "1299.00" })]} />
    </MemoryRouter>,
  );
  const only = screen.getByRole("region", { name: "Japan-only plans" });
  expect(within(only).getByText("Japan 3GB · 5 days")).toBeInTheDocument();
  const packs = screen.getByRole("region", { name: "Multi-country packs that include Japan" });
  expect(within(packs).getByText("Asia 8")).toBeInTheDocument();
});

test("destination page hides the country-only section when there are none", () => {
  render(
    <MemoryRouter>
      <DestinationView destination={{ ...japan, country_code: "MY", country_name: "Malaysia", slug: "malaysia" }} variants={[v({ name: "Asia 8", countries: ["JP", "MY"], scope: "multi" })]} />
    </MemoryRouter>,
  );
  expect(screen.queryByRole("region", { name: "Malaysia-only plans" })).not.toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Multi-country packs that include Malaysia" })).toBeInTheDocument();
});

test("product type tabs filter plans", async () => {
  render(
    <MemoryRouter>
      <DestinationView destination={japan} variants={[v({}), v({ name: "Japan Pocket WiFi", product_type: "pocket_wifi", pricing_unit: "per_day" })]} />
    </MemoryRouter>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Pocket WiFi" }));
  expect(screen.queryByText("Japan 3GB · 5 days")).not.toBeInTheDocument();
  expect(screen.getByText("Japan Pocket WiFi")).toBeInTheDocument();
});

test("popular destinations filter by region chip", async () => {
  const fr = { ...japan, country_code: "FR", country_name: "France", slug: "france", region: "europe" };
  render(
    <MemoryRouter>
      <PopularDestinations destinations={[japan, fr]} />
    </MemoryRouter>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Europe" }));
  expect(screen.getByText("France")).toBeInTheDocument();
  expect(screen.queryByText("Japan")).not.toBeInTheDocument();
});

test("meta title format", () => {
  expect(destinationTitle("Japan", "449.00")).toBe("Japan eSIM, SIM & Pocket WiFi — from ₱449 · Air Roam");
  const meta = buildMeta({ title: "T", description: "D", path: "/destinations/japan" });
  expect(meta).toContainEqual({ title: "T" });
  expect(meta).toContainEqual({ property: "og:title", content: "T" });
  expect(meta).toContainEqual({ tagName: "link", rel: "canonical", href: "http://localhost:5173/destinations/japan" });
});
