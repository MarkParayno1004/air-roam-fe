import { Card, Pill, TYPE_LABEL, cn, formatPHP } from "@air-roam/ui";
import { useId } from "react";
import { Link } from "react-router";
import { CountryPicker } from "../components/CountryPicker";
import { LockNote } from "../components/LockNote";
import { isRental, lineProblem, lineTotal, rentalDays } from "./rental";
import { useCart, type CartLine } from "./store";

export function CartView({ signedIn, today }: { signedIn: boolean; today: string }) {
  const { lines } = useCart();
  const problems = lines.map((l) => lineProblem(l, today));
  const ready = lines.length > 0 && problems.every((p) => p === null);
  const total = lines.reduce((s, l) => s + lineTotal(l), 0);
  const cta = signedIn ? { label: "Checkout", to: "/checkout" } : { label: "Log in to checkout", to: "/login?next=/checkout" };

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-3 text-muted">Find a plan for your next trip.</p>
        <Link to="/destinations" className="mt-6 inline-flex h-11 items-center rounded-button bg-primary px-6 font-semibold text-on-primary">Browse destinations</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 md:px-10 lg:grid-cols-[1fr_400px]">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your cart</h1>
          <p className="mt-1 text-sm text-muted">{lines.length} item{lines.length > 1 ? "s" : ""} · Prices in PHP</p>
        </div>
        {lines.map((l, i) => (
          <CartItem key={l.id} line={l} problem={problems[i]} today={today} />
        ))}
      </div>
      <aside className="lg:pt-[72px]">
        <Card className="flex flex-col gap-4 p-6 lg:sticky lg:top-24">
          <h2 className="text-[17px] font-semibold">Order summary</h2>
          {lines.map((l) => (
            <div key={l.id} className="flex justify-between gap-3 text-sm">
              <span className="text-muted">{l.variant.name}{isRental(l) && l.start_date && l.end_date ? ` · ${rentalDays(l.start_date, l.end_date)} days` : ""}</span>
              <span className="font-medium">{formatPHP(lineTotal(l))}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="font-semibold">Total (PHP)</span>
            <span className="text-2xl font-bold">{formatPHP(total)}</span>
          </div>
          <Link
            to={ready ? cta.to : "#"}
            aria-disabled={ready ? undefined : "true"}
            onClick={(e) => !ready && e.preventDefault()}
            className={cn("flex h-12 items-center justify-center rounded-button bg-primary font-semibold text-on-primary", !ready && "pointer-events-none opacity-50")}
          >
            {cta.label}
          </Link>
          {!signedIn && (
            <p className="text-center text-xs text-muted">
              New here? <Link to="/signup?next=/checkout" className="font-semibold text-primary">Create an account</Link> — required to buy
            </p>
          )}
        </Card>
      </aside>
    </div>
  );
}

function CartItem({ line: l, problem, today }: { line: CartLine; problem: string | null; today: string }) {
  const { update, remove } = useCart();
  const rental = isRental(l);
  const days = l.start_date && l.end_date ? rentalDays(l.start_date, l.end_date) : 0;
  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Pill>{TYPE_LABEL[l.variant.product_type] ?? l.variant.product_type}</Pill>
            {l.variant.countries.length > 1 && <Pill tone="grey">{`${l.variant.countries.length} countries`}</Pill>}
          </div>
          <h2 className="text-[17px] font-semibold">{l.variant.name}</h2>
          <p className="text-[13px] text-muted">{rental ? `${formatPHP(l.variant.price)} per day · ${l.quantity} device${l.quantity > 1 ? "s" : ""}` : "Choose your travel dates after payment"}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-lg font-bold">{formatPHP(lineTotal(l))}</span>
          <button type="button" className="cursor-pointer text-[13px] font-medium text-danger" onClick={() => remove(l.id)}>Remove</button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <button type="button" aria-label="Decrease quantity" disabled={l.quantity <= 1} onClick={() => update(l.id, { quantity: l.quantity - 1 })} className="size-8 cursor-pointer rounded-full border border-border disabled:opacity-40">−</button>
        <span className="font-medium">Qty {l.quantity}</span>
        <button type="button" aria-label="Increase quantity" disabled={l.quantity >= 10} onClick={() => update(l.id, { quantity: l.quantity + 1 })} className="size-8 cursor-pointer rounded-full border border-border disabled:opacity-40">+</button>
      </div>

      {rental && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <DateField label="Start date" value={l.start_date} min={today} onChange={(v) => update(l.id, { start_date: v })} />
            <DateField label="End date" value={l.end_date} min={l.start_date ?? today} onChange={(v) => update(l.id, { end_date: v })} />
          </div>
          {days > 0 && <p className="text-[13px] font-medium">{days} rental days × {formatPHP(l.variant.price)} × {l.quantity} device{l.quantity > 1 ? "s" : ""}</p>}
          {l.variant.countries.length > 1 && (
            <CountryPicker countries={l.variant.countries} value={l.destination_country_codes ?? l.variant.countries} onChange={(c) => update(l.id, { destination_country_codes: c })} />
          )}
          <LockNote>Rental dates are final once ordered — contact support to change them.</LockNote>
        </div>
      )}
      {problem && <p role="alert" className="text-sm text-danger">{problem}</p>}
    </Card>
  );
}

function DateField({ label, value, min, onChange }: { label: string; value?: string; min: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <input id={id} type="date" min={min} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-input border border-border bg-surface px-4 text-sm outline-none focus:border-primary" />
    </div>
  );
}
