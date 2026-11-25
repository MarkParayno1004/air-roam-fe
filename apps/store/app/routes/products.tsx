import { useQuery } from "@tanstack/react-query";
import { useLoaderData, type ClientLoaderFunctionArgs } from "react-router";
import { ProductCard } from "../catalog/ProductCard";
import { useAddToCart } from "../catalog/useAddToCart";
import { fetchDestinations, fetchProducts } from "../lib/catalog";
import { liveOrPrerendered } from "../lib/loaders";
import { buildMeta } from "../seo/meta";

async function load() {
  const [destinations, products] = await Promise.all([fetchDestinations(), fetchProducts()]);
  return { destinations, products };
}
export const loader = load;
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
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 md:px-10">
      <div>
        <h1 className="text-3xl font-bold md:text-4xl">Products</h1>
        <p className="mt-2 text-muted">Choose a product, then the country you're going to.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {data.products.map((p) => <ProductCard key={p.id} product={p} destinations={data.destinations} onAdd={add} />)}
      </div>
      {data.products.length === 0 && <p className="text-muted">No products available right now.</p>}
    </div>
  );
}
