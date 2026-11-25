import type { Destination } from "@air-roam/api";
import { cn, formatPHP } from "@air-roam/ui";
import { heroOffer, perDay } from "../catalog/offers";
import { Perforation, TicketHead } from "../catalog/Ticket";
import { ButtonLink } from "../components/ButtonLink";
import { Icon } from "../components/icons";
import { ChooseCountry } from "./ChooseCountry";
import { anyOf, anyOne, howYouGetIt, planTypes } from "./sold";

export function Hero({ destinations, types }: { destinations: Destination[]; types: string[] }) {
  const n = destinations.length;
  const plansAs = planTypes(types);
  const offer = plansAs.length > 0 ? heroOffer(destinations) : undefined;
  const facts = ["Pay with cards, GCash or Maya", ...(types.includes("esim") ? ["eSIM installs before you fly"] : []), "No account needed to browse"];
  return (
    <section className="relative overflow-hidden bg-primary text-on-primary">
      <Orbits className={!offer && "max-lg:hidden"} />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-5 py-14 md:px-10 md:py-20 lg:grid lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-center lg:gap-20">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Icon name="globe" />
            {n > 0 ? `${n} ${n === 1 ? "country" : "countries"} · prices in PHP` : "Prices in PHP"}
          </p>
          <h1 className="mt-5 text-[2.5rem] leading-[1.05] font-bold tracking-tight text-balance sm:text-6xl xl:text-[4.25rem]"><span className="text-accent">Land online.</span> <br className="hidden sm:block" />Skip the roaming surprise.</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed md:text-xl">{types.length > 0 && `Get ${anyOne(types)} for your trip. `}You see the price in pesos first. {howYouGetIt(types)}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ChooseCountry destinations={destinations} />
            <ButtonLink to="/products/multi-country" variant="outline">Going to several countries?</ButtonLink>
          </div>
          <ul className="mt-9 flex flex-col gap-x-6 gap-y-2.5 text-sm font-medium sm:flex-row sm:flex-wrap">
            {facts.map((f) => <li key={f} className="flex items-center gap-2"><Icon name="check" className="size-4" />{f}</li>)}
          </ul>
        </div>
        {offer && <OfferTicket {...offer} plansAs={plansAs} />}
      </div>
    </section>
  );
}

function OfferTicket({ country, plan, plansAs }: NonNullable<ReturnType<typeof heroOffer>> & { plansAs: string[] }) {
  const behind = "border-primary bg-primary";
  return (
    <aside aria-label="Example plan" className="w-full max-w-md rounded-card bg-surface text-ink shadow-2xl sm:mx-auto lg:max-w-none">
      <TicketHead label="Next stop" code={country.country_code} name={country.country_name} className="bg-primary-soft text-primary" />
      <Perforation behind={behind} />
      <dl className="flex flex-col gap-3 px-6 pt-5 pb-6 text-sm">
        {[["Plan", plan.label], ["Comes as", anyOf(plansAs)], ["Starts", "When you activate"]].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-6">
            <dt className="shrink-0 text-muted">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <Perforation behind={behind} />
      <div className="px-6 pt-5 pb-6">
        <p className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-muted">{perDay(Math.round(Number(plan.price) / plan.validity_days))}</span>{" "}
          <span className="text-4xl font-bold tracking-tight">{formatPHP(plan.price)}</span>
        </p>
        <ButtonLink to={`/products?country=${country.slug}&type=${plansAs[0]}&plan=${plan.id}`} className="mt-4 w-full">Get this plan</ButtonLink>
      </div>
    </aside>
  );
}

/** Decorative: the logo's signal rings and orbit, around the ticket. */
function Orbits({ className }: { className: string | false }) {
  return (
    <svg aria-hidden viewBox="-500 -500 1000 1000" fill="none" stroke="currentColor" strokeWidth="2" className={cn("pointer-events-none absolute bottom-[-6.5rem] left-1/2 w-[48rem] max-w-none -translate-x-1/2 md:bottom-[-5rem] lg:top-1/2 lg:bottom-auto xl:w-[62.5rem] lg:left-[min(calc(50%+26rem),calc(100%-14rem))] lg:-translate-y-1/2", className)}>
      <g className="opacity-15">
        <circle r="270" />
        <circle r="330" />
        <circle r="390" className="max-xl:hidden" />
      </g>
      <g transform="rotate(-24)" className="text-accent">
        <ellipse stroke="currentColor" rx="345" ry="120" strokeDasharray="10 12" />
        <svg x="-363" y="-18" width="36" height="36" className="overflow-visible"><Icon name="plane" className="size-9" /></svg>
      </g>
    </svg>
  );
}
