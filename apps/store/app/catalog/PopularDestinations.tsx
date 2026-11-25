import type { Destination } from "@air-roam/api";
import { Link } from "react-router";
import { DestinationGrid } from "./DestinationGrid";

/** Home page section: only countries staff tagged as popular; hidden when there are none. */
export function PopularDestinations({ destinations }: { destinations: Destination[] }) {
  const popular = destinations.filter((d) => d.is_popular);
  if (popular.length === 0) return null;
  return (
    <section aria-labelledby="popular" className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <h2 id="popular" className="text-2xl font-bold">Popular destinations</h2>
        <Link to="/destinations" className="text-sm font-semibold text-primary">View all destinations</Link>
      </div>
      <DestinationGrid destinations={popular} />
    </section>
  );
}
