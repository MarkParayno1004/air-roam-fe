import type { Order } from "@air-roam/api";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { OrderCard } from "../account/OrderCard";
import { useAuth } from "../auth/AuthProvider";

export default function OrderDetail() {
  const { id = "" } = useParams();
  const { client } = useAuth();
  const { data: order, isError } = useQuery({ queryKey: ["order", id], queryFn: () => client.request<Order>(`orders/${id}`) });

  if (isError) return <p className="text-muted">Order not found. <Link to="/account/orders" className="text-primary">Back to My orders</Link></p>;
  if (!order) return <p className="text-muted">Loading…</p>;

  return (
    <div className="flex flex-col gap-5">
      <Link to="/account/orders" className="text-[13px] text-muted hover:text-primary">My orders / Order {order.id.slice(0, 8)}</Link>
      <OrderCard order={order} />
    </div>
  );
}
