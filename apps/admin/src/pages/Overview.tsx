import type { Page } from "@air-roam/api";
import { Card } from "@air-roam/ui";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { useStaff } from "../auth/StaffProvider";
import { todayISO } from "../lib/api";

function useCount(key: string, path: string) {
  const { client } = useStaff();
  return useQuery({ queryKey: ["count", key], queryFn: async () => (await client.request<Page<unknown>>(`${path}&page_size=1`)).count });
}

export function Overview() {
  const today = todayISO();
  const pending = useCount("pending", "staff/orders?order_status=pending_payment");
  const attention = useCount("attention", "staff/orders?needs_attention=true");
  const starting = useCount("starting", `staff/bookings?start_from=${today}&start_to=${today}`);
  const tiles = [
    { label: "Pending payment orders", value: pending.data, to: "/orders?order_status=pending_payment" },
    { label: "Bookings starting today", value: starting.data, to: `/bookings?start_from=${today}&start_to=${today}` },
    { label: "Payments to review", value: attention.data, to: "/orders?needs_attention=true" },
  ];
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Overview</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.label} to={t.to}>
            <Card className="p-6 transition-shadow hover:shadow-md">
              <p className="text-sm text-muted">{t.label}</p>
              <p aria-label={t.label} className="mt-2 text-3xl font-bold">{t.value ?? "–"}</p>
            </Card>
          </Link>
        ))}
      </div>
      <p className="text-xs text-muted">"Payments to review" are payments that arrived after an order was cancelled or expired — refund or reinstate them.</p>
    </div>
  );
}
