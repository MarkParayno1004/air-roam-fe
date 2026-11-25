import type { Destination, Product } from "@air-roam/api";
import { Card, formatPHP } from "@air-roam/ui";
import { useState } from "react";
import { Link } from "react-router";
import type { NewLine } from "../cart/store";
import { Chips } from "./Chips";
import { ProductCard } from "./ProductCard";

type Tab = "all" | "esim" | "sim" | "pocket_wifi";
const TABS: Array<[Tab, string]> = [["all", "All products"], ["esim", "eSIM"], ["sim", "SIM"], ["pocket_wifi", "Pocket WiFi"]];

export function DestinationView({ destination: d, destinations, products, onAdd }: {
  destination: Destination;
  destinations: Destination[];
  products: Product[];
  onAdd: (l: NewLine) => void;
}) {
  const [tab, setTab] = useState<Tab>("all");
  const visible = products.filter((p) => tab === "all" || p.product_type === tab);

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

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => <ProductCard key={`${d.country_code}-${p.id}`} product={p} destinations={destinations} initialCountry={d.country_code} onAdd={onAdd} />)}
      </div>
      {visible.length === 0 && <p className="text-muted">No {tab === "all" ? "products" : TABS.find(([k]) => k === tab)?.[1]} for {d.country_name} yet.</p>}

      <Card className="p-6">
        <h2 className="font-semibold">Good to know</h2>
        <p className="mt-1 text-[13px] text-muted">
          Pocket WiFi dates are final once ordered. eSIM and SIM days start when you activate.
        </p>
      </Card>
    </div>
  );
}
