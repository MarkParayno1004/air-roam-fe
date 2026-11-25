import { useQuery } from "@tanstack/react-query";
import { useLoaderData, useSearchParams, type ClientLoaderFunctionArgs } from "react-router";
import { CountryCombobox } from "../catalog/CountryCombobox";
import { PlanPicker } from "../catalog/PlanPicker";
import { ProductTabs } from "../catalog/ProductTabs";
import { useAddToCart } from "../catalog/useAddToCart";
import { fetchProductsPage as load } from "../lib/catalog";
import { liveOrPrerendered } from "../lib/loaders";
import { useMounted } from "../lib/useMounted";
import { buildMeta } from "../seo/meta";

export const loader = () => load();
export const clientLoader = ({ serverLoader }: ClientLoaderFunctionArgs) => liveOrPrerendered(load, () => serverLoader<Awaited<ReturnType<typeof load>>>());

export const shouldRevalidate = () => false; // choosing a country only changes ?country=, not the data

export const meta = () =>
  buildMeta({
    title: "eSIM, SIM & Pocket WiFi rental · Air Roam",
    description: "Choose an eSIM, SIM or Pocket WiFi, pick your country and see the price in PHP.",
    path: "/products",
  });

export default function Products() {
  const initial = useLoaderData<typeof load>();
  const { data } = useQuery({ queryKey: ["products"], queryFn: load, initialData: initial });
  const add = useAddToCart();
  const [params, setParams] = useSearchParams();
  const mounted = useMounted(); // the page is pre-rendered without a query: read it only once hydrated
  const preset = (name: string) => (mounted ? params.get(name) : null);
  const here = data.destinations.find((d) => d.slug === preset("country"));
  function choose(code: string) {
    const next = data.destinations.find((d) => d.country_code === code);
    if (next === here) return; // leaving the field reports its country again
    const query = new URLSearchParams(params); // keeps the rest, e.g. utm_source
    if (next) query.set("country", next.slug);
    else query.delete("country");
    query.delete("plan"); // it was offered for the other country
    setParams(query, { replace: true, preventScrollReset: true });
  }
  return (
    <ProductTabs
      intro="Pick a country and see every way to stay connected there."
      field={<CountryCombobox destinations={data.destinations} value={here?.country_code ?? ""} onChange={choose} />}
      other={{ to: "/products/multi-country", icon: "globe", title: "Visiting more than one country?", text: "One eSIM or SIM can cover a whole region. Pocket WiFi is rented for one country." }}
    >
      {data.products.length > 0 ? <PlanPicker products={data.products} destination={here} preferred={{ type: preset("type"), planId: preset("plan") }} onAdd={add} /> : <p className="text-muted">No products available right now.</p>}
    </ProductTabs>
  );
}
