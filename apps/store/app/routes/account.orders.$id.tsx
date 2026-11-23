import type { Order } from "@air-roam/api";
import { Card, Pill, TYPE_LABEL } from "@air-roam/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { BookingForm } from "../account/BookingForm";
import { OrderCard } from "../account/OrderCard";
import { useAuth } from "../auth/AuthProvider";

export default function OrderDetail() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const lineId = params.get("line");
  const { client } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: order, isError } = useQuery({ queryKey: ["order", id], queryFn: () => client.request<Order>(`orders/${id}`) });
  const line = order?.lines.find((l) => l.id === lineId);

  if (isError) return <p className="text-muted">Order not found. <Link to="/account/orders" className="text-primary">Back to My orders</Link></p>;
  if (!order) return <p className="text-muted">Loading…</p>;

  return (
    <div className="flex flex-col gap-5">
      <Link to="/account/orders" className="text-[13px] text-muted hover:text-primary">My orders / Order {order.id.slice(0, 8)}</Link>
      {line && line.pricing_unit_snapshot === "per_plan" ? (
        <Card className="flex flex-col gap-5 p-8">
          <div>
            <h1 className="text-2xl font-bold">{line.booking ? "Edit your travel dates" : "Choose your travel dates"}</h1>
            <div className="mt-2 flex items-center gap-2">
              <Pill>{TYPE_LABEL[line.product_type_snapshot] ?? line.product_type_snapshot}</Pill>
              <span className="text-sm font-semibold">{line.variant_name_snapshot}</span>
            </div>
          </div>
          <BookingForm
            line={line}
            onDone={async () => {
              await Promise.all([qc.invalidateQueries({ queryKey: ["order", id] }), qc.invalidateQueries({ queryKey: ["orders"] }), qc.invalidateQueries({ queryKey: ["bookings"] })]);
              navigate(`/account/orders/${id}`, { replace: true });
            }}
          />
        </Card>
      ) : (
        <OrderCard order={order} />
      )}
    </div>
  );
}
