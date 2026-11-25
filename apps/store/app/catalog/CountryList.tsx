import type { Destination } from "@air-roam/api";
import { cn, formatPHP } from "@air-roam/ui";
import { Link } from "react-router";
import { Icon } from "../components/icons";
import { cheapest, fromPrice, popularCountries } from "./offers";

/** Home page: the popular countries; each links to Products with it chosen. */
export function CountryList({ destinations }: { destinations: Destination[] }) {
  const popular = popularCountries(destinations);
  if (popular.length === 0) return null;
  return (
    // focusable: the "Choose your country" links move the keyboard here too
    <section
      id="countries"
      tabIndex={-1}
      aria-labelledby="countries-title"
      className="flex scroll-mt-24 flex-col gap-7 outline-none"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <div>
          <h2
            id="countries-title"
            className="text-2xl font-bold tracking-tight md:text-3xl"
          >
            Where are you headed?
          </h2>
          <p className="mt-2 text-muted">
            Pick a country to see its plans and prices.
          </p>
        </div>
        {popular.length < destinations.length && (
          <Link
            to="/products"
            className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary hover:underline"
          >
            See all {destinations.length} countries
            <Icon name="right" className="size-4" />
          </Link>
        )}
      </div>
      <ul
        className={cn(
          "grid gap-3 md:gap-4",
          popular.length > 1 && "grid-cols-2",
          popular.length > 2 && "md:grid-cols-3",
          popular.length > 3 && "lg:grid-cols-4",
        )}
      >
        {popular.map((d) => (
          <li key={d.country_code}>
            <Link
              to={`/products?country=${d.slug}`}
              className="flex h-full flex-col rounded-card border border-border bg-surface p-4 transition hover:border-primary hover:shadow-md motion-reduce:transition-none md:p-5"
            >
              <span
                aria-hidden
                className="flex items-center gap-2 text-primary md:gap-3"
              >
                <span className="text-3xl leading-none font-bold tracking-tight">
                  {d.country_code}
                </span>
                <span className="h-0 flex-1 border-t-2 border-dashed border-accent" />
                <Icon name="plane" className="size-4 rotate-45 text-accent" />
              </span>
              <span className="mt-4 text-[17px] leading-snug font-semibold break-words">
                {d.country_name}
              </span>
              <From country={d} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Its lowest SIM/eSIM plan; a Pocket WiFi rate is per day, so it only stands in when there is none. */
function From({ country }: { country: Destination }) {
  const plan = cheapest([country])?.plan;
  const rate = fromPrice(country.wifi_plans);
  const price = plan?.price ?? rate;
  if (price === null) return null;
  return (
    <span className="mt-1 flex flex-col text-sm text-muted">
      {plan && <span>{plan.label}</span>}
      <span>
        {plan ? "from" : "From"}{" "}
        <span className="text-lg font-bold text-ink">{formatPHP(price)}</span>
        {!plan && "/day"}
      </span>
    </span>
  );
}
