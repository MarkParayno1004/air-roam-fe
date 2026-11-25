import type { Order } from "@air-roam/api";
import { Card, StatusBadge, formatDate, formatPHP } from "@air-roam/ui";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/AuthProvider";

/** The Xendit redirect is not proof of payment: poll the order until the webhook has updated it. */
export function PaymentResultView({ orderId, intervalMs = 2000, maxWaitMs = 30_000 }: { orderId: string; intervalMs?: number; maxWaitMs?: number }) {
  const { client } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), maxWaitMs);
    return () => clearTimeout(t);
  }, [maxWaitMs]);

  const { data: order, isError } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => client.request<Order>(`orders/${orderId}`),
    refetchInterval: (q) => (q.state.data?.order_status === "pending_payment" && !timedOut ? intervalMs : false),
  });

  const status = order?.order_status;
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-5 py-14">
      {isError && <Notice404 />}
      {!isError && (!order || status === "pending_payment") && (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          {timedOut ? (
            <>
              <h1 className="text-xl font-semibold">Still processing</h1>
              <p className="text-sm text-muted">Your payment is taking longer than usual. We'll update your order as soon as Xendit confirms it.</p>
              <Link to="/account/orders" className="font-semibold text-primary">Check My orders</Link>
            </>
          ) : (
            <>
              <span className="size-12 animate-spin rounded-full border-4 border-border border-t-primary" aria-hidden />
              <h1 className="text-xl font-semibold">Confirming your payment…</h1>
              <p className="text-sm text-muted">This can take up to 30 seconds.</p>
              <StatusBadge status="pending_payment" />
            </>
          )}
        </Card>
      )}
      {order && (status === "paid" || status === "fulfilled") && <Paid order={order} />}
      {order && (status === "expired" || status === "cancelled") && (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <h1 className="text-xl font-semibold">Payment not completed</h1>
          <p className="text-sm text-muted">This order is {status}. Nothing was charged.</p>
          <Link to="/destinations" className="font-semibold text-primary">Browse plans</Link>
        </Card>
      )}
    </div>
  );
}

function Paid({ order }: { order: Order }) {
  return (
    <Card className="flex flex-col gap-5 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary" aria-hidden>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5 9-10" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        <h1 className="text-2xl font-bold">Payment confirmed</h1>
        <p className="text-sm text-muted">Order {order.id.slice(0, 8)} · {formatPHP(order.total_amount)} PHP</p>
        <StatusBadge status={order.order_status} />
      </div>
      <ul className="flex flex-col gap-3">
        {order.lines.map((l) => (
          <li key={l.id} className="flex items-center justify-between gap-3 rounded-input bg-background p-4">
            <div>
              <p className="text-sm font-semibold">{l.variant_name_snapshot}</p>
              <p className="text-xs text-muted">
                {l.booking ? `${formatDate(l.booking.start_at)} – ${formatDate(l.booking.end_at)} · ${l.booking.destination_country_codes.join(", ")}` : "Starts when you activate"}
              </p>
            </div>
            {l.booking && <StatusBadge status={l.booking.booking_status} />}
          </li>
        ))}
      </ul>
      <Link to="/account/orders" className="flex h-11 items-center justify-center rounded-button border border-border bg-background font-semibold">View my orders</Link>
    </Card>
  );
}

function Notice404() {
  return (
    <Card className="p-10 text-center">
      <h1 className="text-xl font-semibold">We couldn't find that order</h1>
      <Link to="/account/orders" className="mt-3 inline-block font-semibold text-primary">Go to My orders</Link>
    </Card>
  );
}
