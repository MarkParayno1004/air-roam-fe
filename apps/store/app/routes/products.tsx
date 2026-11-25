import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLoaderData, type ClientLoaderFunctionArgs } from "react-router";
import { CountryCombobox } from "../catalog/CountryCombobox";
import { PlanPicker } from "../catalog/PlanPicker";
import { ProductTabs } from "../catalog/ProductTabs";
import { useAddToCart } from "../catalog/useAddToCart";
import { fetchProductsPage as load } from "../lib/catalog";
import { liveOrPrerendered } from "../lib/loaders";
import { buildMeta } from "../seo/meta";

export const loader = () => load();
export const clientLoader = ({ serverLoader }: ClientLoaderFunctionArgs) => liveOrPrerendered(load, () => serverLoader<Awaited<ReturnType<typeof load>>>());

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
  const [country, setCountry] = useState("");
  const here = data.destinations.find((d) => d.country_code === country);
  return (
    <ProductTabs
      intro="Pick a country and see every way to stay connected there."
      field={<CountryCombobox destinations={data.destinations} value={country} onChange={setCountry} />}
      other={{ to: "/products/multi-country", icon: "globe", title: "Visiting more than one country?", text: "One eSIM or SIM can cover a whole region. Pocket WiFi is rented for one country." }}
    >
      {data.products.length > 0 ? <PlanPicker products={data.products} destination={here} onAdd={add} /> : <p className="text-muted">No products available right now.</p>}
    </ProductTabs>
  );
}
