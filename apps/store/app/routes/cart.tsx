import { useAuth } from "../auth/AuthProvider";
import { CartView } from "../cart/CartView";
import { todayISO } from "../cart/rental";

export const meta = () => [{ title: "Your cart · Air Roam" }, { name: "robots", content: "noindex" }];

export default function Cart() {
  const { status } = useAuth();
  return <CartView signedIn={status === "in"} today={todayISO()} />;
}
