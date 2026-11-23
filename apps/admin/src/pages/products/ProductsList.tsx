import type { Page, StaffProduct } from "@air-roam/api";
import { Card, Pill, TYPE_LABEL } from "@air-roam/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { useStaff } from "../../auth/StaffProvider";
import { FilterInput, FilterSelect, Pager, useFilters } from "../../components/Filters";
import { PRODUCT_TYPES, REGIONS } from "../../lib/options";

const KEYS = ["product_type", "is_active", "country", "scope", "region", "search"];
const PAGE = 20;

export function ProductsList() {
  const { client } = useStaff();
  const navigate = useNavigate();
  const f = useFilters();
  const page = Number(f.get("page") || 1);
  const qs = new URLSearchParams([...KEYS.filter((k) => f.get(k)).map((k) => [k, f.get(k)]), ["page", String(page)], ["page_size", String(PAGE)]]).toString();
  const { data, isLoading } = useQuery({ queryKey: ["staff-products", qs], queryFn: () => client.request<Page<StaffProduct>>(`staff/products?${qs}`) });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Products (CMS)</h1>
        <Link to="/products/new" className="inline-flex h-10 items-center rounded-button bg-primary px-5 text-sm font-semibold text-on-primary">New product</Link>
      </div>
      <Card className="grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6">
        <FilterInput label="Search" value={f.get("search")} onChange={(v) => f.set("search", v)} placeholder="Name or plan" />
        <FilterSelect label="Type" value={f.get("product_type")} onChange={(v) => f.set("product_type", v)} options={PRODUCT_TYPES} />
        <FilterSelect label="Status" value={f.get("is_active")} onChange={(v) => f.set("is_active", v)} options={[["true", "Active"], ["false", "Inactive"]]} />
        <FilterInput label="Country code" value={f.get("country")} onChange={(v) => f.set("country", v.toUpperCase().slice(0, 2))} placeholder="JP" />
        <FilterSelect label="Coverage" value={f.get("scope")} onChange={(v) => f.set("scope", v)} options={[["single", "Single country"], ["multi", "Multi-country"]]} />
        <FilterSelect label="Region" value={f.get("region")} onChange={(v) => f.set("region", v)} options={REGIONS} />
      </Card>
      <Card className="overflow-x-auto p-2">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="p-3 font-medium">Product</th>
              <th className="p-3 font-medium">Type</th>
              <th className="p-3 font-medium">Plans</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="p-6 text-center text-muted">Loading…</td></tr>}
            {data?.results.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted">No products match these filters.</td></tr>}
            {data?.results.map((p) => (
              <tr key={p.id} className="cursor-pointer border-b border-border last:border-0 hover:bg-background" onClick={() => navigate(`/products/${p.id}`)}>
                <td className="p-3 font-medium"><Link to={`/products/${p.id}`} onClick={(e) => e.stopPropagation()}>{p.product_name}</Link></td>
                <td className="p-3">{TYPE_LABEL[p.product_type] ?? p.product_type}</td>
                <td className="p-3">{p.variants.length} ({p.variants.filter((v) => v.countries.length > 1).length} multi-country)</td>
                <td className="p-3"><Pill tone={p.is_active ? "teal" : "grey"}>{p.is_active ? "Active" : "Inactive"}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {data && <Pager count={data.count} page={page} pageSize={PAGE} onPage={(p) => f.set("page", String(p))} />}
    </div>
  );
}
