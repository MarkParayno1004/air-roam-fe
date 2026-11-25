import type { Destination } from "@air-roam/api";
import { DestinationCard } from "./DestinationCard";

export function PopularDestinations({ destinations, limit = 8, query = "" }: { destinations: Destination[]; limit?: number; query?: string }) {
  const q = query.trim().toLowerCase();
  const shown = destinations.filter((d) => !q || d.country_name.toLowerCase().includes(q) || d.country_code.toLowerCase() === q);
  if (shown.length === 0) return <p className="text-sm text-muted">No destinations match. Try another search.</p>;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {shown.slice(0, q ? undefined : limit).map((d) => <DestinationCard key={d.country_code} d={d} />)}
    </div>
  );
}
