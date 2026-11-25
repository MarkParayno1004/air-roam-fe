import type { Destination, Product } from "@air-roam/api";
import { Button, Card, Pill, TYPE_LABEL, formatPHP } from "@air-roam/ui";
import { useEffect, useId, useState } from "react";
import { DateField } from "../cart/CartView";
import { lineProblem, rentalDays, todayISO } from "../cart/rental";
import type { NewLine } from "../cart/store";

/** One product: pick a country, then a plan (SIM/eSIM) or rental dates (Pocket WiFi). */
export function ProductCard({ product, destinations, initialCountry = "", onAdd }: {
  product: Product;
  destinations: Destination[];
  initialCountry?: string;
  onAdd: (l: NewLine) => void;
}) {
  const id = useId();
  const wifi = product.product_type === "pocket_wifi";
  const sold = destinations.filter((d) => (wifi ? d.pocket_wifi_daily_rate : d.plans.length > 0));
  const [country, setCountry] = useState(initialCountry);
  const [planId, setPlanId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [today, setToday] = useState(""); // set after mount: pre-rendered HTML must not freeze the build date
  useEffect(() => setToday(todayISO()), []);

  const here = sold.find((d) => d.country_code === country);
  const plan = here?.plans.find((p) => p.id === planId);
  const base = { product: { id: product.id, product_name: product.product_name, product_type: product.product_type }, country_code: here?.country_code ?? "" };
  const rental = wifi && here ? { ...base, daily_rate: here.pocket_wifi_daily_rate!, start_date: start, end_date: end } : null;
  const problem = rental && lineProblem({ ...rental, quantity: 1 }, today);
  const days = start && end ? rentalDays(start, end) : 0;

  return (
    <Card role="article" aria-label={product.product_name} className="flex flex-col gap-4 p-5">
      {product.product_thumbnail_img && <img src={product.product_thumbnail_img} alt="" loading="lazy" className="h-36 w-full rounded-tile object-cover" />}
      <div className="flex flex-col items-start gap-2">
        <Pill>{TYPE_LABEL[product.product_type] ?? product.product_type}</Pill>
        <h3 className="text-[17px] font-semibold">{product.product_name}</h3>
        {product.product_description && <p className="text-[13px] text-muted">{product.product_description}</p>}
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Country
        <select
          value={here ? country : ""}
          onChange={(e) => {
            setCountry(e.target.value);
            setPlanId("");
          }}
          className="h-11 rounded-input border border-border bg-surface px-3 text-sm font-normal outline-none focus:border-primary"
        >
          <option value="">Choose a country</option>
          {sold.map((d) => <option key={d.country_code} value={d.country_code}>{d.country_name}</option>)}
        </select>
      </label>

      {here && !wifi && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Plan</legend>
          <div className="flex flex-wrap gap-2">
            {here.plans.map((p) => (
              <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-input border border-border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary-soft">
                <input type="radio" name={`${id}-plan`} className="accent-primary" checked={p.id === planId} onChange={() => setPlanId(p.id)} />
                {p.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {here && wifi && (
        <div className="grid gap-4 sm:grid-cols-2">
          <DateField label="Start date" value={start} min={today} onChange={setStart} />
          <DateField label="End date" value={end} min={start || today} onChange={setEnd} />
        </div>
      )}
      {wifi && start && end && problem && <p role="alert" className="text-sm text-danger">{problem}</p>}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
        <div>
          {wifi && here && (
            <>
              <p><span className="text-2xl font-bold">{formatPHP(here.pocket_wifi_daily_rate!)}</span> <span className="text-xs text-muted">per day · Unlimited data</span></p>
              {days > 0 && <p className="text-sm font-medium">{`${days} day${days > 1 ? "s" : ""} · ${formatPHP(days * Number(here.pocket_wifi_daily_rate))}`}</p>}
            </>
          )}
          {plan && <span className="text-2xl font-bold">{formatPHP(plan.price)}</span>}
        </div>
        {wifi ? (
          <Button disabled={!rental || !today || problem !== null} onClick={() => rental && onAdd(rental)}>Rent device</Button>
        ) : (
          <Button disabled={!plan} onClick={() => plan && onAdd({ ...base, plan })}>Add to cart</Button>
        )}
      </div>
    </Card>
  );
}
