import type { Destination } from "@air-roam/api";
import { Card, Pill, TYPE_LABEL, cn, formatPHP } from "@air-roam/ui";
import { useId } from "react";
import { DELIVERY_FEE, DELIVERY_FEE_MAX_DAYS } from "../cart/rental";
import { fromPrice } from "../catalog/offers";
import { ButtonLink } from "../components/ButtonLink";
import { Icon, type IconName } from "../components/icons";

const TYPES: Array<{ type: IconName; bestFor: string; facts: string[] }> = [
  {
    type: "pocket_wifi",
    bestFor: "Best for families and groups",
    facts: ["Shared by up to 5 devices", "Priced per day, for your travel dates", `${formatPHP(DELIVERY_FEE)} delivery for ${DELIVERY_FEE_MAX_DAYS} days or fewer, free above`],
  },
  {
    type: "esim",
    bestFor: "Best for phones that support eSIM",
    facts: ["Install it before you fly", "Days start when you activate", "One plan can cover a whole region"],
  },
  {
    type: "sim",
    bestFor: "Best for phones that take a physical SIM",
    facts: ["Delivered to you in the Philippines", "Days start when you activate", "One plan can cover a whole region"],
  },
];

export function ProductChooser({ destinations, types }: { destinations: Destination[]; types: string[] }) {
  const id = useId();
  const plansFrom = fromPrice(destinations.flatMap((d) => d.plans));
  const wifiFrom = fromPrice(destinations.flatMap((d) => d.wifi_plans));
  if (types.length === 0) return null;
  return (
    <section aria-labelledby="which" className="flex flex-col gap-7">
      <div>
        <h2 id="which" className="text-2xl font-bold tracking-tight md:text-3xl">Which one is right for you?</h2>
        <p className="mt-2 text-muted">Match one to your group and your phone.</p>
      </div>
      <ul className={cn("grid gap-4", types.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3")}>
        {TYPES.filter(({ type }) => types.includes(type)).map(({ type, bestFor, facts }) => {
          const wifi = type === "pocket_wifi";
          const from = wifi ? wifiFrom : plansFrom;
          return (
            <li key={type} aria-labelledby={`${id}-${type}`}>
              <Card className="flex h-full flex-col p-6">
                <div className="flex items-start justify-between">
                  <span className="flex size-12 items-center justify-center rounded-button bg-primary-soft text-primary"><Icon name={type} className="size-6" /></span>
                  {type === "esim" && <Pill>Data only</Pill>}
                </div>
                <h3 id={`${id}-${type}`} className="mt-5 text-xl font-semibold tracking-tight">{TYPE_LABEL[type]}</h3>
                <p className="mt-1.5 leading-snug text-muted md:min-h-11 xl:min-h-0">{bestFor}</p>
                <ul className="mt-5 mb-6 flex flex-col gap-2.5 text-sm">
                  {facts.map((f) => <li key={f} className="flex gap-2.5"><Icon name="check" className="mt-0.5 size-4 text-primary" />{f}</li>)}
                </ul>
                <div className="mt-auto flex flex-col gap-4 border-t border-border pt-5">
                  {from !== null && (
                    <p className="text-sm text-muted">
                      from <span className="text-2xl font-bold tracking-tight text-ink">{formatPHP(from)}</span>{wifi && "/day"}
                    </p>
                  )}
                  <ButtonLink to={`/products?type=${type}`} variant="secondary" size="md" className="md:max-lg:px-2">See {TYPE_LABEL[type]} plans</ButtonLink>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
