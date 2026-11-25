import type { Destination } from "@air-roam/api";
import { Card } from "@air-roam/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLoaderData, type ClientLoaderFunctionArgs } from "react-router";
import { PlanPicker } from "../catalog/PlanPicker";
import { ProductTabs } from "../catalog/ProductTabs";
import { useAddToCart } from "../catalog/useAddToCart";
import { Icon } from "../components/icons";
import { fetchProductsPage as load } from "../lib/catalog";
import { liveOrPrerendered } from "../lib/loaders";
import { useMounted } from "../lib/useMounted";
import { buildMeta } from "../seo/meta";

export const loader = () => load();
export const clientLoader = ({ serverLoader }: ClientLoaderFunctionArgs) => liveOrPrerendered(load, () => serverLoader<Awaited<ReturnType<typeof load>>>());

export const meta = () =>
  buildMeta({
    title: "Multi-country eSIM & SIM plans · Air Roam",
    description: "One eSIM or SIM for several countries: pick a region, see the countries it covers and the price in PHP.",
    path: "/products/multi-country",
  });

/** Regions with plans, by name; grouped by id because two regions may share a name. */
function regionsOf(destinations: Destination[]) {
  const byId = new Map<string, Destination["region"] & { countries: Destination[] }>();
  for (const d of destinations.filter((d) => d.plans.length > 0)) {
    const region = byId.get(d.region.id) ?? { ...d.region, countries: [] };
    region.countries.push(d);
    byId.set(region.id, region);
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export default function MultiCountry() {
  const initial = useLoaderData<typeof load>();
  const { data } = useQuery({ queryKey: ["products"], queryFn: load, initialData: initial });
  const add = useAddToCart();
  const mounted = useMounted();
  const [regionId, setRegionId] = useState("");
  const regions = regionsOf(data.destinations);
  const chosen = regionId ? regions.find((r) => r.id === regionId) : regions[0]; // a withdrawn region is not swapped for another
  return (
    <ProductTabs
      intro="Pick a region and use one eSIM or SIM in all of its countries."
      field={regions.length > 0 && (
        <>
          <label htmlFor="region" className="mb-2 block text-sm font-medium">Region</label>
          <div className="relative">
            <Icon name="globe" className="pointer-events-none absolute top-[1.125rem] left-5 text-primary" />
            <select
              id="region"
              disabled={!mounted}
              value={chosen?.id ?? ""}
              onChange={(e) => setRegionId(e.target.value)}
              className="h-14 w-full cursor-pointer appearance-none rounded-input border border-border bg-surface pr-13 pl-13 text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {!chosen && <option value="">Choose a region</option>}
              {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <Icon name="down" className="pointer-events-none absolute top-[1.125rem] right-5 text-muted" />
          </div>
        </>
      )}
      other={{ to: "/products", icon: "pin", title: "Visiting only one country?", text: "See its eSIM and SIM plans, plus Pocket WiFi rental." }}
    >
      {chosen ? (
        <PlanPicker
          products={data.products.filter((p) => p.product_type !== "pocket_wifi")}
          destination={chosen.countries[0]}
          region={chosen.countries[0].region}
          onAdd={add}
        >
          <section aria-labelledby="covers">
            <Card className="p-5 md:p-6">
              <h2 id="covers" className="text-[17px] font-semibold">One plan works in {chosen.countries.length} {chosen.countries.length === 1 ? "country" : "countries"}</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {chosen.countries.map((d) => <li key={d.country_code} className="rounded-full bg-neutral-soft px-3 py-1 text-[13px]">{d.country_name}</li>)}
              </ul>
            </Card>
          </section>
        </PlanPicker>
      ) : <p className="text-muted">{regions.length > 0 ? "That region is no longer available. Choose another." : "No multi-country plans available right now."}</p>}
    </ProductTabs>
  );
}
