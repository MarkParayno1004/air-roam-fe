import type { Destination } from "@air-roam/api";
import { useMemo, useState } from "react";
import { REGIONS } from "../lib/catalog";
import { Chips } from "./Chips";
import { DestinationCard } from "./DestinationCard";

export function PopularDestinations({ destinations, limit = 8, query = "" }: { destinations: Destination[]; limit?: number; query?: string }) {
  const regions = useMemo(() => REGIONS.filter(([k]) => destinations.some((d) => d.region === k)), [destinations]);
  const [region, setRegion] = useState("popular");
  const q = query.trim().toLowerCase();
  const shown = destinations
    .filter((d) => region === "popular" || d.region === region)
    .filter((d) => !q || d.country_name.toLowerCase().includes(q) || d.country_code.toLowerCase() === q);
  return (
    <div className="flex flex-col gap-5">
      <Chips label="Filter by region" options={[["popular", "Popular"], ...regions]} value={region} onChange={setRegion} />
      {shown.length === 0 ? (
        <p className="text-sm text-muted">No destinations match. Try another region or search.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {shown.slice(0, region === "popular" && !q ? limit : undefined).map((d) => (
            <DestinationCard key={d.country_code} d={d} />
          ))}
        </div>
      )}
    </div>
  );
}
