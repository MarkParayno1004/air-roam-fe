import { RequireAuth } from "../auth/RequireAuth";
import { CheckoutView } from "../checkout/CheckoutView";

export const meta = () => [{ title: "Checkout · Air Roam" }, { name: "robots", content: "noindex" }];

export default function Checkout() {
  return (
    <RequireAuth>
      <CheckoutView />
    </RequireAuth>
  );
}
