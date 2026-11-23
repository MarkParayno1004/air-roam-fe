import { Link } from "react-router";
import { useAuth } from "../auth/AuthProvider";
import { useCart } from "../cart/store";

export function HeaderActions() {
  const { count } = useCart();
  const { status } = useAuth();
  return (
    <>
      <Link to="/cart" className="text-sm font-semibold">Cart{count > 0 ? ` (${count})` : ""}</Link>
      {status === "in" ? (
        <Link to="/account" className="text-sm font-semibold text-primary">My account</Link>
      ) : (
        <>
          <Link to="/login" className="inline-flex h-9 items-center rounded-button border border-border bg-background px-4 text-sm font-semibold">Log in</Link>
          <Link to="/signup" className="inline-flex h-9 items-center rounded-button bg-primary px-4 text-sm font-semibold text-on-primary">Sign up</Link>
        </>
      )}
    </>
  );
}
