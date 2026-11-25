import type { Destination } from "@air-roam/api";
import { popularCountries } from "../catalog/offers";
import { ButtonLink } from "../components/ButtonLink";

/** The main CTA, on a primary background: the country list, or Products when the list is hidden. */
export function ChooseCountry({ destinations }: { destinations: Destination[] }) {
  if (popularCountries(destinations).length === 0) return <ButtonLink to="/products" variant="accent" className="shrink-0">Choose your country</ButtonLink>;
  // the router scrolls; focus follows so the next Tab lands in the list
  return <ButtonLink to="#countries" variant="accent" className="shrink-0" onClick={() => document.getElementById("countries")?.focus({ preventScroll: true })}>Choose your country</ButtonLink>;
}
