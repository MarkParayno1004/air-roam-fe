import { formatPHP } from "./format";
import { Button, Card, Pill } from "./primitives";

export type ProductType = "sim" | "esim" | "pocket_wifi";

/** A plan (product variant) as the public API returns it, plus its product type. */
export interface CatalogVariant {
  id: string;
  name: string;
  countries: string[];
  scope: "single" | "multi" | string;
  region: string;
  tag?: string | null;
  is_featured?: boolean;
  data_mb?: number | null;
  validity_days?: number | null;
  price: string;
  pricing_unit: "per_plan" | "per_day" | string;
  product_type: ProductType | string;
}

export const TYPE_LABEL: Record<string, string> = { esim: "eSIM", sim: "SIM", pocket_wifi: "Pocket WiFi" };

export function planMeta(v: CatalogVariant): string {
  const parts = [v.data_mb ? `${Math.round(v.data_mb / 1024)} GB data` : "Unlimited data"];
  if (v.validity_days) parts.push(`valid ${v.validity_days} days`);
  if (v.product_type === "pocket_wifi") parts.push("up to 5 devices");
  return parts.join(" · ");
}

interface CardProps {
  variant: CatalogVariant;
  onAdd?: (v: CatalogVariant) => void;
  ctaLabel?: string;
}

function Price({ v }: { v: CatalogVariant }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold">{formatPHP(v.price)}</span>
      <span className="text-xs text-muted">{v.pricing_unit === "per_day" ? "per day" : "per plan"}</span>
    </div>
  );
}

function cta(v: CatalogVariant, label?: string) {
  return label ?? (v.pricing_unit === "per_day" ? "Rent device" : "Add to cart");
}

export function PlanCard({ variant: v, onAdd, ctaLabel }: CardProps) {
  return (
    <Card role="article" aria-label={v.name} className="flex flex-col gap-3 p-5">
      <div className="flex flex-wrap gap-2">
        <Pill>{TYPE_LABEL[v.product_type] ?? v.product_type}</Pill>
        {v.tag && <Pill tone="solid">{v.tag}</Pill>}
      </div>
      <div>
        <h3 className="text-[17px] font-semibold">{v.name}</h3>
        <p className="mt-1 text-[13px] text-muted">{planMeta(v)}</p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 pt-2">
        <Price v={v} />
        {onAdd && <Button onClick={() => onAdd(v)}>{cta(v, ctaLabel)}</Button>}
      </div>
    </Card>
  );
}

const MAX_CODES = 7;

export function PackCard({ variant: v, onAdd, ctaLabel }: CardProps) {
  const extra = v.countries.length - MAX_CODES;
  return (
    <Card role="article" aria-label={v.name} className="flex flex-col gap-3 p-5">
      <div className="flex flex-wrap gap-2">
        <Pill>{TYPE_LABEL[v.product_type] ?? v.product_type}</Pill>
        <Pill tone="grey">{`${v.countries.length} countries`}</Pill>
        {v.tag && <Pill tone="solid">{v.tag}</Pill>}
      </div>
      <div>
        <h3 className="text-[17px] font-semibold">{v.name}</h3>
        <p className="mt-1 text-[13px] text-muted">{planMeta(v)}</p>
      </div>
      <ul className="flex flex-wrap gap-1.5" aria-label="Countries covered">
        {v.countries.slice(0, MAX_CODES).map((c) => (
          <li key={c}><Pill tone="plain">{c}</Pill></li>
        ))}
        {extra > 0 && <li><Pill tone="plain">{`+${extra}`}</Pill></li>}
      </ul>
      <div className="mt-auto flex items-center justify-between gap-3 pt-2">
        <Price v={v} />
        {onAdd && <Button onClick={() => onAdd(v)}>{cta(v, ctaLabel)}</Button>}
      </div>
    </Card>
  );
}

export function VariantCard(props: CardProps) {
  return props.variant.countries.length > 1 ? <PackCard {...props} /> : <PlanCard {...props} />;
}
