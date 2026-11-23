import type { Destination } from "@air-roam/api";
import { formatPHP } from "@air-roam/ui";
import { Link } from "react-router";
import { regionLabel } from "../lib/catalog";

export function DestinationCard({ d }: { d: Destination }) {
  return (
    <Link
      to={`/destinations/${d.slug}`}
      className="group overflow-hidden rounded-card border border-border bg-surface transition-shadow hover:shadow-md"
    >
      <div className="flex h-28 items-center justify-center bg-primary-soft sm:h-36" aria-hidden>
        <span className="text-4xl font-bold text-primary transition-transform group-hover:scale-105">{d.country_code}</span>
      </div>
      <div className="p-4">
        <h3 className="text-[17px] font-semibold">{d.country_name}</h3>
        <p className="mt-1 text-sm font-medium text-primary">From {formatPHP(d.from_price)}</p>
        <p className="mt-1 text-xs text-muted">
          {regionLabel(d.region)}
          {d.multi_country_pack_count > 0 && ` · ${d.multi_country_pack_count} multi-country pack${d.multi_country_pack_count > 1 ? "s" : ""}`}
        </p>
      </div>
    </Link>
  );
}
