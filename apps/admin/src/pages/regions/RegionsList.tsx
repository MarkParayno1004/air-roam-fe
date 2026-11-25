import type { Page, StaffRegion } from "@air-roam/api";
import { Card, Pill, countryName, formatPHP } from "@air-roam/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { useStaff } from "../../auth/StaffProvider";
import { FilterInput, Pager, useFilters } from "../../components/Filters";

const PAGE = 20;

export function countriesLabel(codes: string[]): string {
  return codes.length === 1 ? countryName(codes[0]) : `${codes.length} countries`;
}

export function RegionsList() {
  const { client } = useStaff();
  const navigate = useNavigate();
  const f = useFilters();
  const page = Number(f.get("page") || 1);
  const qs = new URLSearchParams([["search", f.get("search")], ["page", String(page)], ["page_size", String(PAGE)]]).toString();
  const { data, isLoading } = useQuery({ queryKey: ["staff-regions", qs], queryFn: () => client.request<Page<StaffRegion>>(`staff/regions?${qs}`) });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Regions & prices</h1>
        <Link to="/regions/new" className="inline-flex h-10 items-center rounded-button bg-primary px-5 text-sm font-semibold text-on-primary">New region</Link>
      </div>
      <Card className="grid gap-3 p-4 sm:grid-cols-3">
        <FilterInput label="Search" value={f.get("search")} onChange={(v) => f.set("search", v)} placeholder="Region name" />
      </Card>
      <Card className="overflow-x-auto p-2">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="p-3 font-medium">Region</th>
              <th className="p-3 font-medium">Countries</th>
              <th className="p-3 font-medium">Pocket WiFi / day</th>
              <th className="p-3 font-medium">Plans</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-6 text-center text-muted">Loading…</td></tr>}
            {data?.results.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted">No regions yet.</td></tr>}
            {data?.results.map((r) => (
              <tr key={r.id} className="cursor-pointer border-b border-border last:border-0 hover:bg-background" onClick={() => navigate(`/regions/${r.id}`)}>
                <td className="p-3 font-medium"><Link to={`/regions/${r.id}`} onClick={(e) => e.stopPropagation()}>{r.name}</Link></td>
                <td className="p-3"><span title={r.countries.map(countryName).join(", ")}>{countriesLabel(r.countries)}</span></td>
                <td className="p-3">{r.pocket_wifi_daily_rate ? formatPHP(r.pocket_wifi_daily_rate) : "—"}</td>
                <td className="p-3">{r.plans.length}</td>
                <td className="p-3"><Pill tone={r.is_active ? "teal" : "grey"}>{r.is_active ? "Active" : "Inactive"}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {data && <Pager count={data.count} page={page} pageSize={PAGE} onPage={(p) => f.set("page", String(p))} />}
    </div>
  );
}
