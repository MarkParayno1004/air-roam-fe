import type { Destination, Plan, Product, WifiPlan } from "@air-roam/api";
import { Card, Pill, cn, formatDate, formatPHP } from "@air-roam/ui";
import { useEffect, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { DateField } from "../cart/CartView";
import { DELIVERY_FEE, DELIVERY_FEE_MAX_DAYS, lineProblem, rentalDays, todayISO } from "../cart/rental";
import type { NewLine } from "../cart/store";
import { Icon, type IconName } from "../components/icons";
import { LockNote } from "../components/LockNote";
import { TripTicket } from "./TripTicket";

const ORDER = ["pocket_wifi", "esim", "sim"];
const isWifi = (p: Product) => p.product_type === "pocket_wifi";
const gb = (mb: number) => `${Number((mb / 1024).toFixed(2))}GB`;
const dayCount = (n: number) => `${n} day${n === 1 ? "" : "s"}`;
const perDay = (price: number | string) => `${formatPHP(price)}/day`;

/** Choose a product, its plan and (Pocket WiFi) dates for one country, or for a whole region; the ticket sums it up. */
export function PlanPicker({ products, destination: here, region, onAdd, children }: {
  products: Product[];
  destination?: Destination; // with `region`: any of its countries, they share the plans
  region?: Destination["region"];
  onAdd: (l: NewLine) => void;
  children?: ReactNode;
}) {
  const id = useId();
  const [chosenId, setChosenId] = useState("");
  const [planIds, setPlanIds] = useState<Record<string, string>>({}); // by product id
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [today, setToday] = useState(""); // set after mount: pre-rendered HTML must not freeze the build date
  useEffect(() => setToday(todayISO()), []);
  const placeId = region?.id ?? here?.country_code;
  const [pricedFor, setPricedFor] = useState(placeId);
  if (placeId !== pricedFor) {
    setPricedFor(placeId);
    setPlanIds({});
  }

  const sorted = [...products].sort((a, b) => ORDER.indexOf(a.product_type) - ORDER.indexOf(b.product_type));
  if (!here) return <Explainers products={sorted} />;

  const place = region?.name ?? here.country_name;
  const plansOf = (p: Product): Array<Plan | WifiPlan> => (isWifi(p) ? here.wifi_plans : here.plans);
  const sold = (p: Product) => plansOf(p).length > 0;
  const selected = sorted.find((p) => p.id === chosenId && sold(p)) ?? sorted.find(sold);
  const wifi = !!selected && isWifi(selected);
  const pickedId = selected && planIds[selected.id];
  const plan = selected && (pickedId ? plansOf(selected).find((x) => x.id === pickedId) : plansOf(selected)[0]); // a picked plan that was withdrawn is not swapped for another
  const days = wifi && start && end ? Math.max(0, rentalDays(start, end)) : 0;

  const line = selected && plan && {
    product: { id: selected.id, product_name: selected.product_name, product_type: selected.product_type },
    ...(region ? { country_code: "", region } : { country_code: here.country_code }),
    plan,
    ...(wifi && { start_date: start, end_date: end }),
  };
  const reason = !selected ? `Nothing available in ${place} right now.` : !line ? "That plan is no longer available. Choose another." : lineProblem({ ...line, quantity: 1 }, today);

  const rows: Array<[string, string]> = [];
  if (selected) rows.push(["Product", selected.product_name]);
  if (plan) rows.push(["Plan", plan.label]);
  if (wifi) rows.push(["Dates", days ? `${formatDate(start)} – ${formatDate(end)}` : "Not chosen yet"]);
  else if (selected) rows.push(["Starts", "When you activate"]);
  if (wifi && plan && days) rows.push([`${formatPHP(plan.price)} × ${dayCount(days)}`, formatPHP(Number(plan.price) * days)]);

  return (
    // pre-rendered: a choice made before hydration would show as picked but be lost
    <fieldset disabled={!today} className="flex min-w-0 flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_23rem]">
      <div className="flex min-w-0 flex-col gap-10">
        {children}
        <Step n={1} title="How do you want to connect?">
          <div className={cn("grid gap-3 md:gap-4", sorted.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3")}>
            {sorted.map((p) => {
              const available = sold(p);
              const about = `${id}-${p.id}`;
              return (
                <Choice
                  key={p.id}
                  name={`${id}-product`}
                  value={p.id}
                  aria-label={p.product_name}
                  aria-describedby={about}
                  checked={p.id === selected?.id}
                  disabled={!available}
                  onChange={() => setChosenId(p.id)}
                  className="gap-4 p-5 md:flex-col"
                >
                  <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-button", available ? "bg-primary-soft text-primary" : "bg-neutral-soft text-muted")}>
                    <Icon name={p.product_type as IconName} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                    <span className="text-[17px] leading-snug font-semibold">{p.product_name}</span>
                    <span id={about} className="flex flex-1 flex-col items-start gap-2">
                      {p.product_type === "esim" && <Pill className="absolute top-5 right-5">Data only</Pill>}{" "}
                      <span className="text-[13px] leading-5 text-muted">{p.product_description}</span>{" "}
                      {available ? (
                        <span className="mt-auto pr-8 text-sm text-muted">
                          from <span className="font-semibold text-ink">{formatPHP(Math.min(...plansOf(p).map((x) => Number(x.price))))}</span>{isWifi(p) && "/day"}
                        </span>
                      ) : <span className="mt-auto text-sm font-medium text-muted">Not available in {place}</span>}
                    </span>
                  </span>
                </Choice>
              );
            })}
          </div>
        </Step>

        {selected && (
          <Step n={2} title="Choose a plan">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] md:gap-4">
              {plansOf(selected).map((x) => {
                const about = `${id}-${x.id}`;
                return (
                  <Choice
                    key={x.id}
                    name={`${id}-plan`}
                    value={x.id}
                    aria-label={x.label}
                    aria-describedby={about}
                    checked={x.id === plan?.id}
                    onChange={() => setPlanIds({ ...planIds, [selected.id]: x.id })}
                    className="flex-col p-4"
                  >
                    {"validity_days" in x ? (
                      <>
                        <span className="text-2xl font-bold tracking-tight">{x.data_mb ? gb(x.data_mb) : "Unlimited"}</span>
                        <span className="text-sm text-muted">{dayCount(x.validity_days)}</span>
                        <span id={about} className="mt-5 flex flex-col">
                          <span className="text-lg font-semibold">{formatPHP(x.price)}</span>{" "}
                          <span className="text-xs text-muted">{perDay(Math.round(Number(x.price) / x.validity_days))}</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl font-bold tracking-tight break-words">{x.name}</span>
                        <span className="text-sm text-muted">{x.data_mb ? `${gb(x.data_mb)}/day` : "Unlimited data"}</span>
                        <span id={about} className="mt-5 text-lg font-semibold">{formatPHP(x.price)}<span className="text-xs font-normal text-muted">/day</span></span>
                      </>
                    )}
                  </Choice>
                );
              })}
            </div>
          </Step>
        )}

        {wifi && (
          <Step n={3} title="When do you need it?">
            <Card className="flex flex-col gap-5 p-5 md:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <DateField label="Start date" value={start} min={today} onChange={setStart} />
                <DateField label="End date" value={end} min={start || today} onChange={setEnd} />
              </div>
              <LockNote>Rental dates are final once ordered.</LockNote>
            </Card>
          </Step>
        )}
      </div>

      <TripTicket
        code={region ? undefined : here.country_code}
        name={place}
        rows={rows}
        hint={wifi ? `${formatPHP(DELIVERY_FEE)} delivery for ${DELIVERY_FEE_MAX_DAYS} days or fewer, free above.` : undefined}
        totalLabel={!wifi ? "Total" : days ? "Total before delivery" : "Price per day"}
        total={plan && formatPHP(Number(plan.price) * (days || 1))}
        cta={wifi ? "Rent device" : "Add to cart"}
        reason={reason}
        onBuy={() => line && onAdd(line)}
      />
    </fieldset>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-5">
        <h2 className="flex items-center gap-3 text-xl font-semibold tracking-tight">
          <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">{n}</span>
          {title}
        </h2>
      </legend>
      {children}
    </fieldset>
  );
}

/** A radio button drawn as a card. */
function Choice({ className, children, ...input }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label
      className={cn(
        "relative flex min-w-0 rounded-card border border-border transition-colors duration-150 motion-reduce:transition-none",
        "has-checked:border-primary has-checked:ring-1 has-checked:ring-primary has-checked:ring-inset has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary",
        input.disabled ? "cursor-not-allowed bg-background" : "cursor-pointer bg-surface hover:border-primary",
        className,
      )}
    >
      {/* scroll margins: keyboard focus must not end up under the sticky header or the bottom bar */}
      <input type="radio" className="peer sr-only scroll-mt-24 scroll-mb-64" {...input} />
      {children}
      {!input.disabled && (
        <span aria-hidden className="absolute right-4 bottom-4 flex size-5 items-center justify-center rounded-full border border-muted/60 text-transparent peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary">
          <Icon name="check" className="size-3" />
        </span>
      )}
    </label>
  );
}

/** Before a country is chosen there is nothing to price: say what each product is. */
function Explainers({ products }: { products: Product[] }) {
  return (
    <section aria-labelledby="ways" className="flex flex-col gap-8">
      <div>
        <h2 id="ways" className="text-2xl font-bold tracking-tight">Ways to stay connected</h2>
        <p className="mt-2 text-muted">Choose a country above to see its plans and prices.</p>
      </div>
      <ul className="grid gap-8 md:grid-cols-3">
        {products.map((p) => (
          <li key={p.id} className="flex gap-4 md:flex-col">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-button bg-primary-soft text-primary"><Icon name={p.product_type as IconName} className="size-6" /></span>
            <div>
              <h3 className="text-[17px] font-semibold">{p.product_name}</h3>
              <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted">{p.product_description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
