import type { Destination } from "@air-roam/api";
import { Card, PackCard, PlanCard, formatPHP, type CatalogVariant } from "@air-roam/ui";
import { useState } from "react";
import { Link } from "react-router";
import { Chips } from "./Chips";

type Tab = "all" | "esim" | "sim" | "pocket_wifi";
const TABS: Array<[Tab, string]> = [["all", "All plans"], ["esim", "eSIM"], ["sim", "SIM"], ["pocket_wifi", "Pocket WiFi"]];

export function DestinationView({ destination: d, variants, onAdd }: {
  destination: Destination;
  variants: CatalogVariant[];
  onAdd?: (v: CatalogVariant) => void;
}) {
  const [tab, setTab] = useState<Tab>("all");
  const visible = variants.filter((v) => tab === "all" || v.product_type === tab);
  const single = visible.filter((v) => v.countries.length === 1);
  const packs = visible.filter((v) => v.countries.length > 1);
  const onlyTitle = `${d.country_name}-only plans`;
  const packsTitle = `Multi-country packs that include ${d.country_name}`;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-8 md:px-10">
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
        <Link to="/" className="hover:text-primary">Home</Link> / <Link to="/destinations" className="hover:text-primary">Destinations</Link> / {d.country_name}
      </nav>
      <header className="flex items-center gap-5">
        <div className="flex size-20 shrink-0 items-center justify-center rounded-card bg-primary-soft text-3xl font-bold text-primary md:size-24">{d.country_code}</div>
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">{d.country_name}</h1>
          <p className="mt-1 text-muted">eSIM, SIM & Pocket WiFi rental · from {formatPHP(d.from_price)}</p>
        </div>
      </header>
      <Chips label="Product type" options={TABS} value={tab} onChange={setTab} />

      {single.length > 0 && (
        <section aria-label={onlyTitle} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">{onlyTitle}</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {single.map((v) => <PlanCard key={v.id} variant={v} onAdd={onAdd} />)}
          </div>
        </section>
      )}
      {packs.length > 0 && (
        <section aria-label={packsTitle} className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-bold">{packsTitle}</h2>
            <p className="text-[13px] text-muted">Visiting more than one country? One plan covers them all.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {packs.map((v) => <PackCard key={v.id} variant={v} onAdd={onAdd} />)}
          </div>
        </section>
      )}
      {visible.length === 0 && <p className="text-muted">No {TABS.find(([k]) => k === tab)?.[1]} plans for {d.country_name} yet.</p>}

      <Card className="p-6">
        <h2 className="font-semibold">Good to know</h2>
        <p className="mt-1 text-[13px] text-muted">
          Pocket WiFi rental dates are chosen in your cart and are final once ordered. eSIM/SIM travel dates are picked after payment.
        </p>
      </Card>
    </div>
  );
}
