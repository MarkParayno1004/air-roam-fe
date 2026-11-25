import { Button } from "@air-roam/ui";
import { useId } from "react";
import { Perforation, TicketHead } from "./Ticket";

/** The chosen trip as a travel ticket. Below lg its stub (total and button) is a bar that sticks to the bottom of the screen. */
export function TripTicket({ code, name, rows, hint, totalLabel, total, cta, reason, onBuy }: {
  code?: string; // none for a whole region
  name: string;
  rows: Array<[string, string]>;
  hint?: string;
  totalLabel: string;
  total?: string;
  cta: string;
  reason: string | null; // why it can't be bought yet
  onBuy: () => void;
}) {
  const reasonId = useId();
  return (
    // contents: the sticky stub then sticks within the whole picker, not only within the ticket
    <aside aria-label="Your trip" className="contents lg:sticky lg:top-24 lg:block">
      <div className="rounded-card border border-border bg-surface lg:rounded-b-none lg:border-b-0">
        <TicketHead label="Your trip" code={code} name={name} className="-mx-px -mt-px bg-primary text-on-primary" />
        <Perforation />
        <dl className="flex flex-col gap-3 px-6 pt-5 pb-6 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-6">
              <dt className="shrink-0 text-muted">{label}</dt>
              <dd className="min-w-0 text-right font-medium break-words">{value}</dd>
            </div>
          ))}
        </dl>
        {hint && <p className="px-6 pb-6 text-xs text-muted">{hint}</p>}
        <div className="hidden lg:block"><Perforation /></div>
      </div>
      <div className="sticky bottom-0 -mx-5 border-y border-border bg-surface px-5 py-3 md:-mx-10 md:px-10 lg:static lg:mx-0 lg:rounded-b-card lg:border lg:border-t-0 lg:px-6 lg:pt-4 lg:pb-6">
        <div className="flex items-center justify-between gap-4 lg:flex-col lg:items-stretch">
          {total && (
            <p aria-live="polite" className="lg:flex lg:items-baseline lg:justify-between">
              <span className="block text-xs text-muted lg:text-sm">{totalLabel}</span>{" "}
              <span className="text-2xl font-bold lg:text-3xl">{total}</span>
            </p>
          )}
          <Button size="lg" className="ml-auto lg:ml-0" disabled={reason !== null} aria-describedby={reasonId} onClick={onBuy}>{cta}</Button>
        </div>
        <p id={reasonId} role="status" className="text-sm text-muted not-empty:mt-2 lg:text-center">{reason}</p>
      </div>
    </aside>
  );
}
