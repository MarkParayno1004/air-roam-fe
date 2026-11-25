import { useQuery } from "@tanstack/react-query";
import { useLoaderData, useSearchParams, type ClientLoaderFunctionArgs } from "react-router";
import { liveOrPrerendered } from "../lib/loaders";
import { PopularDestinations } from "../catalog/PopularDestinations";
import { fetchDestinations } from "../lib/catalog";
import { buildMeta } from "../seo/meta";

const load = () => fetchDestinations();
export const loader = load;
export const clientLoader = ({ serverLoader }: ClientLoaderFunctionArgs) => liveOrPrerendered(load, () => serverLoader<Awaited<ReturnType<typeof load>>>());

export const meta = () =>
  buildMeta({
    title: "All destinations — eSIM, SIM & Pocket WiFi · Air Roam",
    description: "Browse every country Air Roam covers with eSIM, SIM and Pocket WiFi rental plans, priced in PHP.",
    path: "/destinations",
  });

export default function Destinations() {
  const initial = useLoaderData<typeof load>();
  const { data } = useQuery({ queryKey: ["destinations"], queryFn: load, initialData: initial });
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 md:px-10">
      <div>
        <h1 className="text-3xl font-bold md:text-4xl">Destinations</h1>
        <p className="mt-2 text-muted">{data.length} countries covered by eSIM, SIM and Pocket WiFi.</p>
      </div>
      <label htmlFor="dest-search" className="sr-only">Search destinations</label>
      <input
        id="dest-search"
        value={q}
        onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
        placeholder="Search a country"
        className="h-12 max-w-md rounded-input border border-border bg-surface px-4 text-sm outline-none focus:border-primary"
      />
      <PopularDestinations destinations={data} limit={Infinity} query={q} />
    </div>
  );
}
