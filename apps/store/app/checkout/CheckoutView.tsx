import { ApiError, type CheckoutResponse } from "@air-roam/api";
import { Button, Card, Notice, formatDate, formatPHP } from "@air-roam/ui";
import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/AuthProvider";
import { TotalRows } from "../cart/CartView";
import { cartTotals, isRental, lineDays, lineIsValid, lineName, todayISO } from "../cart/rental";
import { useCart } from "../cart/store";
import { LockNote } from "../components/LockNote";
import { usePlaceOrder } from "./usePlaceOrder";

type Phase = { kind: "review" } | { kind: "changed"; res: CheckoutResponse } | { kind: "nothing" } | { kind: "error"; message: string };

export function CheckoutView({ onRedirect = (url: string) => window.location.assign(url) }: { onRedirect?: (url: string) => void }) {
  const { user } = useAuth();
  const { lines, clear } = useCart();
  const { place, pending } = usePlaceOrder();
  const [phase, setPhase] = useState<Phase>({ kind: "review" });
  const today = todayISO();
  const valid = lines.length > 0 && lines.every((l) => lineIsValid(l, today));
  const totals = cartTotals(lines);

  async function onPay() {
    try {
      const res = await place();
      if (!res) return;
      // Never send the traveler to pay an amount they weren't shown.
      const changed = res.price_updates.length || res.removed_lines.length || res.order.total_amount !== totals.total.toFixed(2);
      if (changed) setPhase({ kind: "changed", res });
      else onRedirect(res.invoice_url);
    } catch (e) {
      if (e instanceof ApiError && e.code === "nothing_to_buy") {
        clear(); // every plan in the cart is gone; don't send the traveler back to it
        setPhase({ kind: "nothing" });
      }
      else setPhase({ kind: "error", message: e instanceof ApiError && e.detail ? e.detail : "We couldn't place your order. Please try again." });
    }
  }

  if (phase.kind === "changed") return <ChangedView res={phase.res} onContinue={() => onRedirect(phase.res.invoice_url)} />;
  if (phase.kind === "nothing") {
    return (
      <Shell>
        <Notice tone="grey" title="The plans in your cart are no longer available.">
          <Link to="/products" className="font-semibold text-primary">Browse current plans</Link>
        </Notice>
      </Shell>
    );
  }
  if (lines.length === 0) {
    return (
      <Shell>
        <p className="text-muted">Your cart is empty. <Link to="/products" className="font-semibold text-primary">Browse products</Link></p>
      </Shell>
    );
  }

  return (
    <Shell>
      {pending && <Notice tone="teal" title="Updating to the latest prices, please hold on…" />}
      {phase.kind === "error" && <Notice tone="red" title={phase.message} />}
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-5">
          <Card className="p-6">
            <h2 className="text-[17px] font-semibold">Contact details</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted">Full name</dt><dd className="font-medium">{user ? `${user.first_name} ${user.last_name}` : "—"}</dd></div>
              <div><dt className="text-muted">Contact no.</dt><dd className="font-medium">{user?.contact_no || "—"}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-muted">Receipts go to {user?.email}. <Link to="/account/profile" className="text-primary">Edit details</Link></p>
          </Card>
          <Card className="flex flex-col gap-4 p-6">
            <h2 className="text-[17px] font-semibold">Review your order</h2>
            {lines.map((l) => (
              <div key={l.id} className="flex justify-between gap-4 text-sm">
                <div>
                  <p className="font-medium">{lineName(l)}{l.quantity > 1 ? ` × ${l.quantity}` : ""}</p>
                  <p className="text-xs text-muted">
                    {isRental(l) && l.start_date && l.end_date
                      ? `${formatDate(l.start_date)} – ${formatDate(l.end_date)} · ${formatPHP(l.plan.price)} × ${lineDays(l)} day${lineDays(l) > 1 ? "s" : ""}`
                      : "Starts when you activate"}
                  </p>
                  {isRental(l) && <div className="mt-1"><LockNote>Rental dates are final once ordered.</LockNote></div>}
                </div>
                <span className="font-semibold">{formatPHP(totals.lineTotal(l))}</span>
              </div>
            ))}
          </Card>
        </div>
        <Card className="flex h-fit flex-col gap-4 p-6">
          <h2 className="text-[17px] font-semibold">Payment</h2>
          <TotalRows totals={totals} />
          <Button size="lg" onClick={onPay} disabled={!valid || pending}>Pay with Xendit</Button>
          {!valid && <p className="text-sm text-danger">Some items need attention. <Link to="/cart" className="font-semibold">Back to cart</Link></p>}
          <p className="text-xs text-muted">You'll pay on Xendit's secure page — cards, GCash, Maya and more. Charged in PHP.</p>
          <p className="text-xs text-muted">By paying you agree to the <Link to="/terms" className="text-primary">Terms</Link> and <Link to="/refund-policy" className="text-primary">Refund policy</Link>.</p>
        </Card>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 md:px-10">
      <h1 className="text-3xl font-bold">Checkout</h1>
      {children}
    </div>
  );
}

function ChangedView({ res, onContinue }: { res: CheckoutResponse; onContinue: () => void }) {
  return (
    <Shell>
      <Notice tone="teal" title={`We've updated your order to the latest prices. Your new total is ${formatPHP(res.order.total_amount)} — please review before paying.`}>
        {res.price_updates.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1">
            {res.price_updates.map((u, i) => (
              <li key={i}>
                {u.name}: <span className="line-through">{formatPHP(u.old_unit_price)}</span> → <strong>{formatPHP(u.new_unit_price)}</strong>
              </li>
            ))}
          </ul>
        )}
      </Notice>
      {res.removed_lines.map((r, i) => (
        <Notice key={i} tone="grey" title={`Heads up: ${r.name || "A plan"} is no longer available, so we've removed it from your order.`} />
      ))}
      <Card className="flex flex-col gap-4 p-6 sm:max-w-md">
        {Number(res.order.delivery_fee) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted">Delivery fee</span>
            <span className="font-medium">{formatPHP(res.order.delivery_fee)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="font-semibold">Total (PHP)</span>
          <span className="text-2xl font-bold">{formatPHP(res.order.total_amount)}</span>
        </div>
        <Button size="lg" onClick={onContinue}>Continue to pay</Button>
        <Link to="/account/orders" className="text-center text-sm text-muted">Not now — view my orders</Link>
      </Card>
    </Shell>
  );
}
