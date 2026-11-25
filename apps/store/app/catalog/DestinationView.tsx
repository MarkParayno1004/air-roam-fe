import type { Destination, Product } from "@air-roam/api";
import { Card, formatPHP } from "@air-roam/ui";
import { Link } from "react-router";
import type { NewLine } from "../cart/store";
import { PlanPicker } from "./PlanPicker";

export function DestinationView({ destination: d, products, onAdd }: {
  destination: Destination;
  products: Product[];
  onAdd: (l: NewLine) => void;
}) {
  return (
    <>
      <header className="bg-primary-soft">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 md:px-10 md:py-12">
          <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
            <Link to="/" className="hover:text-primary">Home</Link> / <Link to="/destinations" className="hover:text-primary">Destinations</Link> / {d.country_name}
          </nav>
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">{d.country_name}</h1>
            <p className="mt-3 text-muted md:text-lg">eSIM, SIM & Pocket WiFi rental · from {formatPHP(d.from_price)}</p>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-5 py-10 md:px-10 md:py-12">
        {products.length > 0 ? <PlanPicker products={products} destination={d} onAdd={onAdd} /> : <p className="text-muted">No products for {d.country_name} yet.</p>}
        <Card className="p-6">
          <h2 className="font-semibold">Good to know</h2>
          <p className="mt-1 text-[13px] text-muted">
            Pocket WiFi dates are final once ordered. eSIM and SIM days start when you activate.
          </p>
        </Card>
      </div>
    </>
  );
}
