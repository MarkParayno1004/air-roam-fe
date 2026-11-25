import type { Destination } from "@air-roam/api";
import { DestinationCard } from "./DestinationCard";

/** Countries whose name contains the query or whose code is the query; all of them when it is empty. */
export function searchDestinations(destinations: Destination[], query: string) {
  const q = query.trim().toLowerCase();
  return destinations.filter((d) => !q || d.country_name.toLowerCase().includes(q) || d.country_code.toLowerCase() === q);
}

export function DestinationGrid({ destinations, query = "" }: { destinations: Destination[]; query?: string }) {
  const shown = searchDestinations(destinations, query);
  if (shown.length === 0) return <p className="text-sm text-muted">No destinations match. Try another search.</p>;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {shown.map((d) => <DestinationCard key={d.country_code} d={d} />)}
    </div>
  );
}
