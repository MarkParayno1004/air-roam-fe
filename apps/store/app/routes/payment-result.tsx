import { Link, useSearchParams } from "react-router";
import { RequireAuth } from "../auth/RequireAuth";
import { PaymentResultView } from "../checkout/PaymentResultView";

export const meta = () => [{ title: "Payment · Air Roam" }, { name: "robots", content: "noindex" }];

export default function PaymentResult() {
  const orderId = useSearchParams()[0].get("order_id");
  return (
    <RequireAuth>
      {orderId ? (
        <PaymentResultView orderId={orderId} />
      ) : (
        <p className="p-10 text-center text-muted">Missing order. <Link to="/account/orders" className="text-primary">Go to My orders</Link></p>
      )}
    </RequireAuth>
  );
}
