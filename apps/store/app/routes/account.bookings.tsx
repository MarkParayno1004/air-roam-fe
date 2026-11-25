import type { BookingDetail, Page } from "@air-roam/api";
import { Card, StatusBadge, formatDate } from "@air-roam/ui";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { useAuth } from "../auth/AuthProvider";
import { LockNote } from "../components/LockNote";

export default function MyBookings() {
  const { client } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["bookings"], queryFn: () => client.request<Page<BookingDetail>>("bookings?page_size=50") });
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-bold">My bookings</h1>
      {isLoading && <p className="text-muted">Loading…</p>}
      {data?.results.length === 0 && <p className="text-muted">No bookings yet. Pocket WiFi rentals appear here.</p>}
      {data?.results.map((b) => (
        <Card key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex flex-col gap-1">
            <p className="font-semibold">{b.product_name} · {b.variant_name}</p>
            <p className="text-xs text-muted">{formatDate(b.start_at)} – {formatDate(b.end_at)} · {b.destination_country_codes.join(", ")}</p>
            <LockNote>Rental dates can't be changed online. Contact support for changes.</LockNote>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={b.booking_status} />
            <Link to={`/account/orders/${b.order_id}`} className="text-sm font-semibold text-primary">View order</Link>
          </div>
        </Card>
      ))}
    </div>
  );
}
