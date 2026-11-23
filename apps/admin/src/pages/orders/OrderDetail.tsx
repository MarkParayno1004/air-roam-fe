import type { StaffOrder } from "@air-roam/api";
import { Button, Card, Notice, StatusBadge, TYPE_LABEL, formatDate, formatPHP, statusLabel } from "@air-roam/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useStaff } from "../../auth/StaffProvider";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { errorMessage } from "../../lib/errors";
import { nextStatuses } from "../../lib/transitions";

export function OrderDetail() {
  const { id = "" } = useParams();
  const { client, isAdmin } = useStaff();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: o, isError } = useQuery({ queryKey: ["staff-order", id], queryFn: () => client.request<StaffOrder>(`staff/orders/${id}`) });
  const [changing, setChanging] = useState(false);
  const [next, setNext] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isError) return <p className="text-muted">Order not found. <Link to="/orders" className="text-primary">Back to orders</Link></p>;
  if (!o) return <p className="text-muted">Loading…</p>;
  const options = nextStatuses(o.order_status);

  async function apply() {
    setError(null);
    try {
      await client.request(`staff/orders/${id}`, { method: "PATCH", json: { order_status: next } });
      setChanging(false);
      await Promise.all([qc.invalidateQueries({ queryKey: ["staff-order", id] }), qc.invalidateQueries({ queryKey: ["staff-orders"] })]);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function remove() {
    try {
      await client.request(`staff/orders/${id}`, { method: "DELETE" });
      await qc.invalidateQueries({ queryKey: ["staff-orders"] });
      navigate("/orders");
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Link to="/orders" className="text-[13px] text-muted hover:text-primary">Orders / {o.id.slice(0, 8)}</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Order {o.id.slice(0, 8)}</h1>
          <StatusBadge status={o.order_status} />
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {options.length > 0 && <Button size="sm" onClick={() => { setChanging(true); setNext(options[0]); }}>Change status</Button>}
            <Button size="sm" variant="secondary" className="text-danger" onClick={() => setConfirmDelete(true)}>Delete order</Button>
          </div>
        )}
      </div>
      {o.needs_attention && <Notice tone="red" title="Payment needs review">{o.attention_note}</Notice>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {changing && (
        <Card className="flex flex-wrap items-end gap-3 p-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            New status
            <select value={next} onChange={(e) => setNext(e.target.value)} className="h-10 rounded-input border border-border bg-surface px-3 text-sm font-normal">
              {options.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
          </label>
          <Button onClick={apply}>Apply</Button>
          <Button variant="secondary" onClick={() => setChanging(false)}>Cancel</Button>
          {next === "cancelled" || next === "refunded" ? <p className="w-full text-xs text-muted">This also cancels the order's bookings. Refund the money in the Xendit dashboard.</p> : null}
        </Card>
      )}
      {confirmDelete && <ConfirmDialog title="Delete this order?" message="It disappears from lists (soft delete). The record stays in the database." onConfirm={remove} onCancel={() => setConfirmDelete(false)} />}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card className="flex flex-col gap-3 p-6">
          <h2 className="font-semibold">Lines</h2>
          {o.lines.map((l) => (
            <div key={l.id} className="flex flex-wrap items-start justify-between gap-3 rounded-input bg-background p-4 text-sm">
              <div>
                <p className="font-semibold">{TYPE_LABEL[l.product_type_snapshot] ?? l.product_type_snapshot} · {l.variant_name_snapshot}</p>
                <p className="text-xs text-muted">
                  {l.quantity} × {formatPHP(l.unit_price)}{l.rental_days ? ` × ${l.rental_days} days` : ""} · {l.countries_snapshot.join(", ")}
                </p>
                {l.booking ? (
                  <p className="mt-1 text-xs">Booking: {formatDate(l.booking.start_at)} – {formatDate(l.booking.end_at)} · {l.booking.destination_country_codes.join(", ")}</p>
                ) : (
                  <p className="mt-1 text-xs text-muted">No travel dates yet</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="font-semibold">{formatPHP(l.line_total)}</span>
                {l.booking && <StatusBadge status={l.booking.booking_status} />}
              </div>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-3 font-semibold"><span>Total</span><span>{formatPHP(o.total_amount)} PHP</span></div>
        </Card>
        <div className="flex flex-col gap-5">
          <Card className="flex flex-col gap-1 p-6 text-sm">
            <h2 className="mb-2 font-semibold">Customer</h2>
            <p>{o.user.first_name} {o.user.last_name}</p>
            <p>{o.user.email}</p>
            <p className="text-muted">{o.user.contact_no || "No contact number"}</p>
          </Card>
          <Card className="flex flex-col gap-1 p-6 text-sm">
            <h2 className="mb-2 font-semibold">Payment (Xendit)</h2>
            <p className="text-muted">Invoice</p>
            <p className="break-all">{o.xendit_invoice_id ?? "—"}</p>
            {o.xendit_invoice_url && <a href={o.xendit_invoice_url} target="_blank" rel="noreferrer" className="text-primary">Open invoice</a>}
            <p className="mt-2 text-muted">Paid at</p>
            <p>{o.paid_at ? formatDate(o.paid_at) : "Not paid"}</p>
            <p className="mt-2 text-muted">Created</p>
            <p>{formatDate(o.created_at)} · via {o.client}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
