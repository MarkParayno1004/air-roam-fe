import type { Destination } from "@air-roam/api";
import { formatPHP } from "@air-roam/ui";

export const perDay = (price: number | string) => `${formatPHP(price)}/day`;

/** Lowest price, or null when nothing is sold. */
export const fromPrice = (plans: Array<{ price: string }>) => (plans.length > 0 ? Math.min(...plans.map((p) => Number(p.price))) : null);

const byName = (a: Destination, b: Destination) => a.country_name.localeCompare(b.country_name, "en"); // fixed locale: pre-rendered HTML must match the browser

export const popularCountries = (destinations: Destination[]) => destinations.filter((d) => d.is_popular).sort(byName);

/** The lowest SIM/eSIM plan of these countries. */
export const cheapest = (countries: Destination[]) =>
  countries.flatMap((country) => country.plans.map((plan) => ({ country, plan }))).sort((a, b) => Number(a.plan.price) - Number(b.plan.price)).at(0);

/** The lowest SIM/eSIM plan among the popular countries, else among all; the first country by name when prices tie. */
export const heroOffer = (destinations: Destination[]) => cheapest(popularCountries(destinations)) ?? cheapest([...destinations].sort(byName));
