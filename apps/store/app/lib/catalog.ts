import type { Destination, Page, Product } from "@air-roam/api";
import { API_URL } from "./config";

/** Public catalog reads. Used by build-time loaders (pre-render) and live client loaders/queries. */
async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${API_URL}/${path}`);
  if (!r.ok) throw new Response("Catalog unavailable", { status: r.status });
  return (await r.json()) as T;
}

export const fetchDestinations = () => get<Destination[]>("destinations");
export const fetchProducts = async () => (await get<Page<Product>>("products?page_size=100")).results;

export async function fetchProductsPage() {
  const [destinations, products] = await Promise.all([fetchDestinations(), fetchProducts()]);
  return { destinations, products };
}
