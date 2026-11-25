import type { StaffCountry } from "@air-roam/api";
import { Button, Card } from "@air-roam/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";
import { useStaff } from "../../auth/StaffProvider";
import { FilterInput, FilterSelect, useFilters } from "../../components/Filters";
import { errorMessage } from "../../lib/errors";

const KEY = ["staff-countries"];

export function CountriesList() {
  const { client } = useStaff();
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: KEY, queryFn: () => client.request<StaffCountry[]>("staff/countries") });
  const [changes, setChanges] = useState<Record<string, boolean>>({}); // only ticks that differ from what is saved
  const f = useFilters();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = f.get("search").trim().toLowerCase();
  const regions = [...new Set((data ?? []).map((c) => c.region))].sort();
  // Popular filters on what is saved, so a row doesn't vanish the moment its box is clicked.
  const shown = (data ?? [])
    .filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q)
    .filter((c) => !f.get("region") || c.region === f.get("region"))
    .filter((c) => !f.get("popular") || String(c.is_popular) === f.get("popular"));
  const count = Object.keys(changes).length;
  const isPopular = (c: StaffCountry) => changes[c.code] ?? c.is_popular;

  function toggle(c: StaffCountry) {
    setSaved(false);
    const { [c.code]: changed, ...rest } = changes;
    setChanges(changed === undefined ? { ...rest, [c.code]: !c.is_popular } : rest);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const json = { countries: Object.entries(changes).map(([code, is_popular]) => ({ code, is_popular })) };
      qc.setQueryData(KEY, await client.request<StaffCountry[]>("staff/countries", { method: "PATCH", json }));
      setChanges({});
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Countries</h1>
        <p className="mt-1 text-sm text-muted">Tick the countries to show under Popular destinations on the store's home page.</p>
      </div>
      <Card className="grid gap-3 p-4 sm:grid-cols-3">
        <FilterInput label="Search" value={f.get("search")} onChange={(v) => f.set("search", v)} placeholder="Country" />
        <FilterSelect label="Popular" value={f.get("popular")} onChange={(v) => f.set("popular", v)} options={[["true", "Popular"], ["false", "Not popular"]]} />
        <FilterSelect label="Region" value={f.get("region")} onChange={(v) => f.set("region", v)} options={regions.map((r) => [r, r])} />
      </Card>
      <Card className="overflow-x-auto p-2">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="p-3 font-medium">Country</th>
              <th className="p-3 font-medium">Region</th>
              <th className="p-3 text-center font-medium">Popular</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={3} className="p-6 text-center text-muted">Loading…</td></tr>}
            {isError && <tr><td colSpan={3} className="p-6 text-center text-danger">Could not load countries.</td></tr>}
            {data?.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-muted">No countries yet. Add them in <Link to="/regions" className="font-semibold text-primary">Regions & prices</Link>.</td></tr>}
            {data && data.length > 0 && shown.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-muted">No countries match.</td></tr>}
            {shown.map((c) => (
              <tr key={c.code} className="border-b border-border last:border-0 hover:bg-background">
                <td className="px-3 font-medium">{c.name} <span className="text-muted">({c.code})</span></td>
                <td className="px-3">{c.region}</td>
                <td className="px-3 text-center">
                  <label className="inline-flex size-11 cursor-pointer items-center justify-center">
                    <input type="checkbox" aria-label={`Show ${c.name} as popular`} disabled={busy} className="size-5 scroll-mb-28 cursor-pointer accent-primary" checked={isPopular(c)} onChange={() => toggle(c)} />
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {/* sticky: the list is long and Save must stay in reach */}
      <Card className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 p-4 shadow-md">
        <div className="text-sm">
          {error && <p role="alert" className="text-danger">{error}</p>}
          <p role="status" className={saved ? "text-success" : "text-muted"}>
            {saved ? "Saved. The web store updates within a few minutes." : count > 0 ? `${count} unsaved change${count > 1 ? "s" : ""}` : `${(data ?? []).filter((c) => c.is_popular).length} popular`}
          </p>
        </div>
        <Button size="lg" onClick={save} disabled={busy || count === 0}>Save</Button>
      </Card>
    </div>
  );
}
