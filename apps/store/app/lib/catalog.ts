import type { Destination, PackGroup, Page, Product } from "@air-roam/api";
import type { CatalogVariant } from "@air-roam/ui";
import { API_URL } from "./config";

/** Public catalog reads. Used by build-time loaders (pre-render) and live client loaders/queries. */
async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${API_URL}/${path}`);
  if (!r.ok) throw new Response("Catalog unavailable", { status: r.status });
  return (await r.json()) as T;
}

export const fetchDestinations = () => get<Destination[]>("destinations");
export const fetchPacks = () => get<PackGroup[]>("multi-country-packs");

export async function fetchVariants(params: Record<string, string> = {}): Promise<CatalogVariant[]> {
  const qs = new URLSearchParams({ page_size: "100", ...params }).toString();
  const page = await get<Page<Product>>(`products?${qs}`);
  return flattenProducts(page.results);
}

export function flattenProducts(products: Product[]): CatalogVariant[] {
  return products
    .flatMap((p) => p.variants.map((v) => ({ ...v, product_type: p.product_type }) as CatalogVariant))
    .sort((a, b) => Number(a.price) - Number(b.price));
}

export function packVariants(groups: PackGroup[]): Array<{ region: string; packs: CatalogVariant[] }> {
  return groups.map((g) => ({
    region: g.region,
    packs: g.packs.map((p) => ({ ...p, countries: p.countries.map((c) => c.code) }) as unknown as CatalogVariant),
  }));
}

export async function fetchDestinationPage(slug: string) {
  const destination = (await fetchDestinations()).find((d) => d.slug === slug);
  if (!destination) throw new Response("Destination not found", { status: 404 });
  return { destination, variants: await fetchVariants({ country: destination.country_code }) };
}

export const REGIONS: Array<[string, string]> = [
  ["asia", "Asia"], ["europe", "Europe"], ["north_america", "North America"], ["south_america", "South America"],
  ["oceania", "Oceania"], ["middle_east", "Middle East"], ["africa", "Africa"], ["local_ph", "Local PH"], ["global", "Global"],
];
export const regionLabel = (r: string) => REGIONS.find(([k]) => k === r)?.[1] ?? r;
