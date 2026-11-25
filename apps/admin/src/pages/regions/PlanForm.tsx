import type { StaffPlan } from "@air-roam/api";
import { Button, Field, cn } from "@air-roam/ui";
import { useId, useState } from "react";

const WIFI_PLANS = ["Unlimited", "Regular"];

export interface PlanFormValues {
  name?: string; // Pocket WiFi only
  data_gb: string; // empty = unlimited
  validity_days: string;
  price: string;
  is_active: boolean;
}

/** 307 MB → 0.3 (and back to 307). */
export const toGb = (mb: number) => Number((mb / 1024).toFixed(2));

export type PlanPayload = ReturnType<typeof toPlanPayload>;

export function toPlanPayload(v: PlanFormValues, wifi = false) {
  const data_mb = v.data_gb.trim() ? Math.round(Number(v.data_gb) * 1024) : null;
  const price = v.price.trim();
  if (wifi) return { name: (v.name ?? "").trim(), data_mb, price, is_active: v.is_active, for_wifi: true as const };
  return { data_mb, validity_days: Number(v.validity_days), price, is_active: v.is_active };
}

/** onSave may reject with { fields: { field: message } } to show server validation errors. */
export function PlanForm({ initial, wifi = false, onSave, onCancel }: {
  initial?: StaffPlan | null;
  wifi?: boolean;
  onSave: (p: PlanPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const selectId = useId();
  const savedGb = initial?.data_mb ? String(toGb(initial.data_mb)) : "";
  const [v, setV] = useState<PlanFormValues>({
    name: initial?.name ?? WIFI_PLANS[0],
    data_gb: savedGb,
    validity_days: initial?.validity_days ? String(initial.validity_days) : "",
    price: initial?.price ?? "",
    is_active: initial?.is_active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof PlanFormValues>(k: K, val: PlanFormValues[K]) => setV((s) => ({ ...s, [k]: val }));
  const gbFor = (name: string) => (name === initial?.name ? savedGb : name === "Regular" ? "1" : "");
  const setName = (name: string) => setV((s) => ({ ...s, name, data_gb: gbFor(name) }));
  const unlimited = wifi && v.name === "Unlimited" && !gbFor("Unlimited"); // one saved with a cap shows it, or an edit would drop it
  const nameError = errors.name ?? errors.for_wifi;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // JSON turns NaN into null, and a null data_mb means unlimited — never let a typo become that.
    if (wifi && v.name === "Regular" && !v.data_gb.trim()) return setErrors({ data_mb: "Enter the GB per day." });
    if (!unlimited && v.data_gb.trim() && !(Number(v.data_gb) > 0)) return setErrors({ data_mb: "Enter a number of GB, or leave it empty for unlimited." });
    setErrors({});
    setBusy(true);
    try {
      await onSave(toPlanPayload(unlimited ? { ...v, data_gb: "" } : v, wifi));
    } catch (err) {
      setErrors((err as { fields?: Record<string, string> }).fields ?? { form: "Could not save this plan." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {wifi ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Plan
              <select
                value={v.name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={nameError ? true : undefined}
                aria-describedby={nameError ? `${selectId}-err` : undefined}
                className={cn("h-11 rounded-input border bg-surface px-3 text-sm font-normal", nameError ? "border-danger" : "border-border")}
              >
                {/* a plan saved under another name keeps it until staff pick one of the two */}
                {[...new Set([...WIFI_PLANS, initial?.name ?? WIFI_PLANS[0]])].map((n) => <option key={n}>{n}</option>)}
              </select>
            </label>
            {nameError && <p id={`${selectId}-err`} role="alert" className="text-xs text-danger">{nameError}</p>}
          </div>
          <Field label="Price per day (PHP)" inputMode="decimal" value={v.price} onChange={(e) => set("price", e.target.value)} error={errors.price} />
          {unlimited ? (
            <div className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Data</span>
              <span className="flex h-11 items-center">Unlimited</span>
            </div>
          ) : (
            <Field label="GB per day" inputMode="decimal" value={v.data_gb} onChange={(e) => set("data_gb", e.target.value)} hint={v.name === "Regular" ? undefined : "Empty = unlimited"} error={errors.data_mb} />
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Data (GB)" inputMode="decimal" value={v.data_gb} onChange={(e) => set("data_gb", e.target.value)} hint="Empty = unlimited" error={errors.data_mb} />
          <Field label="Validity (days)" inputMode="numeric" value={v.validity_days} onChange={(e) => set("validity_days", e.target.value)} error={errors.validity_days} />
          <Field label="Price (PHP)" inputMode="decimal" value={v.price} onChange={(e) => set("price", e.target.value)} error={errors.price} />
        </div>
      )}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={v.is_active} onChange={(e) => set("is_active", e.target.checked)} /> Active (visible to travelers)</label>
      {errors.form && <p role="alert" className="text-sm text-danger">{errors.form}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={busy}>Save plan</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
