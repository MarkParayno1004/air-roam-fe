import type { Order, Page } from "@air-roam/api";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { OrderCard } from "../account/OrderCard";
import { useAuth } from "../auth/AuthProvider";

export default function MyOrders() {
  const { client } = useAuth();
  const { data, isLoading, isError } = useQuery({ queryKey: ["orders"], queryFn: () => client.request<Page<Order>>("orders?page_size=50") });
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-bold">My orders</h1>
      {isLoading && <p className="text-muted">Loading your orders…</p>}
      {isError && <p role="alert" className="text-danger">We couldn't load your orders. Please refresh.</p>}
      {data?.results.length === 0 && (
        <p className="text-muted">No orders yet. <Link to="/products" className="font-semibold text-primary">Find a plan</Link></p>
      )}
      {data?.results.map((o) => <OrderCard key={o.id} order={o} />)}
    </div>
  );
}
