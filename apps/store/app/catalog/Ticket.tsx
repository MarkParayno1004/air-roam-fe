import { cn } from "@air-roam/ui";
import { Icon } from "../components/icons";

/** Top of a travel ticket: where to. Colors come from the caller. */
export function TicketHead({ label, code, name, className }: { label: string; code?: string; name: string; className: string }) {
  return (
    <div className={cn("rounded-t-card px-6 pt-5 pb-7", className)}>
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium">{label}</p>
        <span aria-hidden className="h-0 flex-1 border-t-2 border-dashed border-accent" />
        <Icon name="plane" className="rotate-45 text-accent" />
      </div>
      {code ? (
        <>
          <p aria-hidden className="mt-4 text-6xl leading-none font-bold tracking-tight">{code}</p>
          <p className="mt-2 text-lg font-medium">{name}</p>
        </>
      ) : <p className="mt-4 text-4xl leading-tight font-bold tracking-tight break-words">{name}</p>}
    </div>
  );
}

/** Dashed tear line with a notch cut into each edge of the ticket; the notch shows what is behind the ticket. */
export function Perforation({ behind = "border-border bg-background" }: { behind?: string }) {
  const notch = cn("absolute top-1/2 size-5 -translate-y-1/2 rounded-full border", behind);
  return (
    <div aria-hidden className="relative">
      <div className="mx-5 border-t-2 border-dashed border-border" />
      <span className={`${notch} -left-2.5 [clip-path:inset(0_0_0_9px)]`} />
      <span className={`${notch} -right-2.5 [clip-path:inset(0_9px_0_0)]`} />
    </div>
  );
}
