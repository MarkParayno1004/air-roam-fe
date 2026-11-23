import type { StaffVariant } from "@air-roam/api";
import { Button, Field, countryName } from "@air-roam/ui";
import { useState } from "react";
import { CountryMultiSelect } from "../../components/CountryMultiSelect";
import { REGIONS } from "../../lib/options";
import { AppPreview } from "./AppPreview";

export interface VariantFormValues {
  name: string;
  countries: string[];
  region: string;
  tag: string;
  is_featured: boolean;
  data_gb: string; // empty = unlimited
  validity_days: string;
  price: string;
  pricing_unit: string;
  is_active: boolean;
}

export type VariantPayload = ReturnType<typeof toPayload>;

export function countriesLabel(codes: string[]): string {
  return codes.length === 1 ? countryName(codes[0]) : `${codes.length} countries`;
}

export function toPayload(v: VariantFormValues) {
  return {
    name: v.name.trim(),
    countries: v.countries,
    region: v.region,
    tag: v.tag.trim() || null,
    is_featured: v.is_featured,
    data_mb: v.data_gb.trim() ? Math.round(Number(v.data_gb) * 1024) : null,
    validity_days: v.validity_days.trim() ? Number(v.validity_days) : null,
    price: v.price.trim(),
    pricing_unit: v.pricing_unit,
    is_active: v.is_active,
  };
}

function fromVariant(v?: StaffVariant | null, productType?: string): VariantFormValues {
  return {
    name: v?.name ?? "",
    countries: v?.countries ?? [],
    region: v?.region ?? "asia",
    tag: v?.tag ?? "",
    is_featured: v?.is_featured ?? false,
    data_gb: v?.data_mb ? String(v.data_mb / 1024) : "",
    validity_days: v?.validity_days ? String(v.validity_days) : "",
    price: v?.price ?? "",
    pricing_unit: v?.pricing_unit ?? (productType === "pocket_wifi" ? "per_day" : "per_plan"),
    is_active: v?.is_active ?? true,
  };
}

/** onSave may reject with { fields: { field: message } } to show server validation errors. */
export function VariantForm({ initial, productType, onSave, onCancel }: {
  initial?: StaffVariant | null;
  productType: string;
  onSave: (p: VariantPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [v, setV] = useState<VariantFormValues>(() => fromVariant(initial, productType));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof VariantFormValues>(k: K, val: VariantFormValues[K]) => setV((s) => ({ ...s, [k]: val }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setBusy(true);
    try {
      await onSave(toPayload(v));
    } catch (err) {
      setErrors((err as { fields?: Record<string, string> }).fields ?? { form: "Could not save this plan." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field label="Plan name" value={v.name} onChange={(e) => set("name", e.target.value)} error={errors.name} placeholder="e.g. Japan 10GB · 7 days" />
        <CountryMultiSelect value={v.countries} onChange={(c) => set("countries", c)} error={errors.countries} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Select label="Region" value={v.region} onChange={(x) => set("region", x)} options={REGIONS} />
          <Select label="Pricing" value={v.pricing_unit} onChange={(x) => set("pricing_unit", x)} options={[["per_plan", "Per plan"], ["per_day", "Per day (rental)"]]} />
          <Field label="Price (PHP)" inputMode="decimal" value={v.price} onChange={(e) => set("price", e.target.value)} error={errors.price} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Data (GB)" inputMode="decimal" value={v.data_gb} onChange={(e) => set("data_gb", e.target.value)} hint="Empty = unlimited" error={errors.data_mb} />
          <Field label="Validity (days)" inputMode="numeric" value={v.validity_days} onChange={(e) => set("validity_days", e.target.value)} hint="Empty for rentals" error={errors.validity_days} />
          <Field label="Tag" value={v.tag} onChange={(e) => set("tag", e.target.value)} hint="e.g. Best value" />
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-primary" checked={v.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> Featured on home</label>
          <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-primary" checked={v.is_active} onChange={(e) => set("is_active", e.target.checked)} /> Active (visible to travelers)</label>
        </div>
        {errors.form && <p role="alert" className="text-sm text-danger">{errors.form}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={busy}>Save plan</Button>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
      <AppPreview values={v} productType={productType} />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: Array<[string, string]> }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-input border border-border bg-surface px-3 text-sm font-normal outline-none focus:border-primary">
        {options.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
      </select>
    </label>
  );
}
