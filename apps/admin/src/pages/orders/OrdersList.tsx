import type { Page, StaffOrder } from "@air-roam/api";
import { Card, Pill, StatusBadge, formatDate, formatPHP, statusLabel } from "@air-roam/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { useStaff } from "../../auth/StaffProvider";
import { FilterInput, FilterSelect, Pager, useFilters } from "../../components/Filters";
import { ORDER_STATUSES } from "../../lib/options";

const KEYS = ["order_status", "needs_attention", "created_from", "created_to", "email", "search"];
const PAGE = 20;

export function OrdersList() {
  const { client } = useStaff();
  const navigate = useNavigate();
  const f = useFilters();
  const page = Number(f.get("page") || 1);
  const qs = new URLSearchParams([...KEYS.filter((k) => f.get(k)).map((k) => [k, f.get(k)]), ["page", String(page)], ["page_size", String(PAGE)]]).toString();
  const { data, isLoading, isError } = useQuery({ queryKey: ["staff-orders", qs], queryFn: () => client.request<Page<StaffOrder>>(`staff/orders?${qs}`) });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">Orders</h1>
      <Card className="grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6">
        <FilterInput label="Search" value={f.get("search")} onChange={(v) => f.set("search", v)} placeholder="Email, name, plan" />
        <FilterSelect label="Status" value={f.get("order_status")} onChange={(v) => f.set("order_status", v)} options={ORDER_STATUSES.map((s) => [s, statusLabel(s)])} />
        <FilterSelect label="Needs attention" value={f.get("needs_attention")} onChange={(v) => f.set("needs_attention", v)} options={[["true", "Yes"], ["false", "No"]]} />
        <FilterInput label="From" type="date" value={f.get("created_from")} onChange={(v) => f.set("created_from", v)} />
        <FilterInput label="To" type="date" value={f.get("created_to")} onChange={(v) => f.set("created_to", v)} />
        <FilterInput label="Customer email" value={f.get("email")} onChange={(v) => f.set("email", v)} />
      </Card>
      <Card className="overflow-x-auto p-2">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="p-3 font-medium">Order</th>
              <th className="p-3 font-medium">Customer</th>
              <th className="p-3 font-medium">Date</th>
              <th className="p-3 font-medium">Total</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-6 text-center text-muted">Loading…</td></tr>}
            {isError && <tr><td colSpan={5} className="p-6 text-center text-danger">Could not load orders.</td></tr>}
            {data?.results.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted">No orders match these filters.</td></tr>}
            {data?.results.map((o) => (
              <tr key={o.id} className="cursor-pointer border-b border-border last:border-0 hover:bg-background" onClick={() => navigate(`/orders/${o.id}`)}>
                <td className="p-3 font-medium"><Link to={`/orders/${o.id}`} onClick={(e) => e.stopPropagation()}>{o.id.slice(0, 8)}</Link></td>
                <td className="p-3">{o.user.email}</td>
                <td className="p-3">{formatDate(o.created_at)}</td>
                <td className="p-3">{formatPHP(o.total_amount)}</td>
                <td className="p-3">
                  <div className="flex gap-2"><StatusBadge status={o.order_status} />{o.needs_attention && <Pill tone="red">Review payment</Pill>}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {data && <Pager count={data.count} page={page} pageSize={PAGE} onPage={(p) => f.set("page", String(p))} />}
    </div>
  );
}
