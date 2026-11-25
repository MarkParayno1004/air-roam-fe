import { formatPHP } from "@air-roam/ui";
import { Link } from "react-router";
import { DELIVERY_FEE, DELIVERY_FEE_MAX_DAYS } from "../cart/rental";
import { Icon } from "../components/icons";
import { allOf, planTypes } from "./sold";

/** Only about what is sold; a question with nothing to say is left out. */
function faqs(types: string[]) {
  const plansAs = planTypes(types);
  const wifi = types.includes("pocket_wifi");
  const all: Array<[string, Array<string | false>]> = [
    ["When do my days start?", [plansAs.length > 0 && `${allOf(plansAs)} days start when you activate the plan, not when you buy it.`, wifi && "Pocket WiFi is rented for the dates you choose."]],
    ["How can I pay?", ["Pay through PayMongo with GCash, Maya, QR Ph or card. Every price is in Philippine pesos (PHP)."]],
    ["How do I get it?", [
      types.includes("esim") && "An eSIM is installed on your phone before you fly.",
      types.includes("sim") && "A SIM is delivered to you in the Philippines.",
      wifi && `Pocket WiFi delivery is ${formatPHP(DELIVERY_FEE)} for rentals of ${DELIVERY_FEE_MAX_DAYS} days or fewer in total, and free above that.`,
    ]],
    ["Do I need an account?", ["Only to check out. You can look at every country, plan and price without one."]],
    ["Can I change my Pocket WiFi dates?", [wifi && "Rental dates are final once ordered, so check them before you pay. To change them, contact support."]],
  ];
  return all.map(([q, parts]) => [q, parts.filter(Boolean).join(" ")]).filter(([, a]) => a);
}

export function Faq({ types }: { types: string[] }) {
  return (
    <section aria-labelledby="faq" className="grid gap-7 lg:grid-cols-[1fr_2fr] lg:gap-16">
      <div>
        <h2 id="faq" className="text-2xl font-bold tracking-tight md:text-3xl">Questions, answered</h2>
        <p className="mt-2 text-muted">Something else on your mind?</p>
        <Link to="/contact" className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary hover:underline">
          Contact us<Icon name="right" className="size-4" />
        </Link>
      </div>
      <div className="divide-y divide-border rounded-card border border-border bg-surface">
        {faqs(types).map(([q, a]) => (
          <details key={q} className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-card px-5 py-4 font-semibold hover:text-primary md:px-6 [&::-webkit-details-marker]:hidden">
              {q}
              <Icon name="down" className="text-primary transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none" />
            </summary>
            <p className="max-w-2xl px-5 pb-5 leading-7 text-muted md:px-6">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
