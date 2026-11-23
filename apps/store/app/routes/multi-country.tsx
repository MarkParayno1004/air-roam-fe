import { PackCard } from "@air-roam/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLoaderData, type ClientLoaderFunctionArgs } from "react-router";
import { liveOrPrerendered } from "../lib/loaders";
import { Chips } from "../catalog/Chips";
import { useAddToCart } from "../catalog/useAddToCart";
import { fetchPacks, packVariants, regionLabel } from "../lib/catalog";
import { buildMeta } from "../seo/meta";

const load = () => fetchPacks();
export const loader = load;
export const clientLoader = ({ serverLoader }: ClientLoaderFunctionArgs) => liveOrPrerendered(load, () => serverLoader<Awaited<ReturnType<typeof load>>>());

export const meta = () =>
  buildMeta({
    title: "Multi-country eSIM & Pocket WiFi packs · Air Roam",
    description: "One plan for trips across 2 or more countries — Asia, Europe and global packs, priced in PHP.",
    path: "/multi-country",
  });

export default function MultiCountry() {
  const initial = useLoaderData<typeof load>();
  const { data } = useQuery({ queryKey: ["packs"], queryFn: load, initialData: initial });
  const groups = packVariants(data);
  const [region, setRegion] = useState("all");
  const add = useAddToCart();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 md:px-10">
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
        <Link to="/" className="hover:text-primary">Home</Link> / Multi-country packs
      </nav>
      <div>
        <h1 className="text-3xl font-bold md:text-4xl">Multi-country packs</h1>
        <p className="mt-2 text-muted">One plan for trips across 2 or more countries — no SIM swaps at the border.</p>
      </div>
      <Chips label="Region" options={[["all", "All regions"], ...groups.map((g) => [g.region, regionLabel(g.region)] as [string, string])]} value={region} onChange={setRegion} />
      {groups
        .filter((g) => region === "all" || g.region === region)
        .map((g) => (
          <section key={g.region} aria-label={regionLabel(g.region)} className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">{regionLabel(g.region)}</h2>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {g.packs.map((v) => <PackCard key={v.id} variant={v} onAdd={add} />)}
            </div>
          </section>
        ))}
      {groups.length === 0 && <p className="text-muted">No multi-country packs available right now.</p>}
    </div>
  );
}
