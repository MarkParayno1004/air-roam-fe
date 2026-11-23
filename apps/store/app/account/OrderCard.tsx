import { ApiError, type Order, type OrderLine } from "@air-roam/api";
import { Button, Card, StatusBadge, formatDate, formatPHP } from "@air-roam/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/AuthProvider";
import { LockNote } from "../components/LockNote";

const PAID = ["paid", "fulfilled"];

export function OrderCard({ order }: { order: Order }) {
  const { client } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setBusy(true);
    setError(null);
    try {
      await client.request(`orders/${order.id}/cancel`, { method: "POST" });
      await Promise.all([qc.invalidateQueries({ queryKey: ["orders"] }), qc.invalidateQueries({ queryKey: ["order", order.id] })]);
    } catch (e) {
      setError(e instanceof ApiError && e.detail ? e.detail : "We couldn't cancel this order. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-semibold">Order {order.id.slice(0, 8)}</h2>
          <p className="text-[13px] text-muted">{formatDate(order.created_at)} · {formatPHP(order.total_amount)} PHP</p>
        </div>
        <StatusBadge status={order.order_status} />
      </div>
      <ul className="flex flex-col gap-3">
        {order.lines.map((l) => <LineRow key={l.id} order={order} line={l} />)}
      </ul>
      {order.order_status === "pending_payment" && (
        <div className="flex flex-wrap gap-3">
          {order.xendit_invoice_url && (
            <a href={order.xendit_invoice_url} className="inline-flex h-10 items-center rounded-button bg-primary px-5 text-sm font-semibold text-on-primary">Pay now</a>
          )}
          <Button variant="secondary" onClick={cancel} disabled={busy}>Cancel order</Button>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </Card>
  );
}

function LineRow({ order, line: l }: { order: Order; line: OrderLine }) {
  const b = l.booking;
  const rental = l.pricing_unit_snapshot === "per_day";
  const editable = !rental && b && new Date(b.start_at) > new Date() && !["cancelled", "completed"].includes(b.booking_status);
  const needsDates = !rental && !b && PAID.includes(order.order_status);
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-input bg-background p-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">{l.variant_name_snapshot}{l.rental_days ? ` · ${l.rental_days} days` : ""}</p>
        {b && <p className="text-xs text-muted">{formatDate(b.start_at)} – {formatDate(b.end_at)} · {b.destination_country_codes.join(", ")}</p>}
        {rental && <LockNote>Rental dates can't be changed online. Contact support for changes.</LockNote>}
        {!b && !rental && !needsDates && <p className="text-xs text-muted">Travel dates: choose after payment</p>}
      </div>
      <div className="flex items-center gap-3">
        {b && <StatusBadge status={b.booking_status} />}
        {editable && <Link to={`/account/orders/${order.id}?line=${l.id}`} className="inline-flex h-9 items-center rounded-button border border-border bg-surface px-4 text-sm font-semibold">Edit dates</Link>}
        {needsDates && <Link to={`/account/orders/${order.id}?line=${l.id}`} className="inline-flex h-9 items-center rounded-button bg-primary px-4 text-sm font-semibold text-on-primary">Choose travel dates</Link>}
      </div>
    </li>
  );
}
