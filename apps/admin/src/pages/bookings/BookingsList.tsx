import type { Page, StaffBooking } from "@air-roam/api";
import { Button, Card, StatusBadge, formatDate, statusLabel } from "@air-roam/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { Link } from "react-router";
import { useStaff } from "../../auth/StaffProvider";
import { FilterInput, FilterSelect, Pager, useFilters } from "../../components/Filters";
import { BOOKING_STATUSES } from "../../lib/options";
import { BookingEdit } from "./BookingEdit";

const KEYS = ["booking_status", "start_from", "start_to", "country"];
const PAGE = 20;

export function BookingsList() {
  const { client, isAdmin } = useStaff();
  const qc = useQueryClient();
  const f = useFilters();
  const page = Number(f.get("page") || 1);
  const qs = new URLSearchParams([...KEYS.filter((k) => f.get(k)).map((k) => [k, f.get(k)]), ["page", String(page)], ["page_size", String(PAGE)]]).toString();
  const { data, isLoading } = useQuery({ queryKey: ["staff-bookings", qs], queryFn: () => client.request<Page<StaffBooking>>(`staff/bookings?${qs}`) });
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">Bookings</h1>
      <Card className="grid gap-3 p-4 sm:grid-cols-4">
        <FilterSelect label="Status" value={f.get("booking_status")} onChange={(v) => f.set("booking_status", v)} options={BOOKING_STATUSES.map((s) => [s, statusLabel(s)])} />
        <FilterInput label="Starts from" type="date" value={f.get("start_from")} onChange={(v) => f.set("start_from", v)} />
        <FilterInput label="Starts to" type="date" value={f.get("start_to")} onChange={(v) => f.set("start_to", v)} />
        <FilterInput label="Country code" value={f.get("country")} onChange={(v) => f.set("country", v.toUpperCase().slice(0, 2))} placeholder="JP" />
      </Card>
      <Card className="overflow-x-auto p-2">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="p-3 font-medium">Plan</th>
              <th className="p-3 font-medium">Customer</th>
              <th className="p-3 font-medium">Dates</th>
              <th className="p-3 font-medium">Countries</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="p-6 text-center text-muted">Loading…</td></tr>}
            {data?.results.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted">No bookings match these filters.</td></tr>}
            {data?.results.map((b) => (
              <Fragment key={b.id}>
                <tr className="border-b border-border last:border-0">
                  <td className="p-3 font-medium">{b.product_name} · {b.variant_name}</td>
                  <td className="p-3"><Link to={`/orders/${b.order_id}`} className="hover:text-primary">{b.customer_email}</Link></td>
                  <td className="p-3">{formatDate(b.start_at)} – {formatDate(b.end_at)}</td>
                  <td className="p-3">{b.destination_country_codes.join(", ")}</td>
                  <td className="p-3"><StatusBadge status={b.booking_status} /></td>
                  <td className="p-3 text-right">
                    {isAdmin && editing !== b.id && (
                      <Button size="sm" variant="ghost" aria-label={`Edit booking for ${b.customer_email}`} onClick={() => setEditing(b.id)}>Edit</Button>
                    )}
                  </td>
                </tr>
                {editing === b.id && (
                  <tr>
                    <td colSpan={6} className="p-3">
                      <BookingEdit
                        booking={b}
                        onSaved={() => void qc.invalidateQueries({ queryKey: ["staff-bookings"] })}
                        onClose={() => setEditing(null)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </Card>
      {data && <Pager count={data.count} page={page} pageSize={PAGE} onPage={(p) => f.set("page", String(p))} />}
    </div>
  );
}
