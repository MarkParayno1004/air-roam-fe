import type { StaffPlan } from "@air-roam/api";
import { Button, Field } from "@air-roam/ui";
import { useState } from "react";

export interface PlanFormValues {
  data_gb: string; // empty = unlimited
  validity_days: string;
  price: string;
  is_active: boolean;
}

export type PlanPayload = ReturnType<typeof toPlanPayload>;

export function toPlanPayload(v: PlanFormValues) {
  return {
    data_mb: v.data_gb.trim() ? Math.round(Number(v.data_gb) * 1024) : null,
    validity_days: Number(v.validity_days),
    price: v.price.trim(),
    is_active: v.is_active,
  };
}

/** onSave may reject with { fields: { field: message } } to show server validation errors. */
export function PlanForm({ initial, onSave, onCancel }: {
  initial?: StaffPlan | null;
  onSave: (p: PlanPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [v, setV] = useState<PlanFormValues>({
    data_gb: initial?.data_mb ? String(initial.data_mb / 1024) : "",
    validity_days: initial ? String(initial.validity_days) : "",
    price: initial?.price ?? "",
    is_active: initial?.is_active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof PlanFormValues>(k: K, val: PlanFormValues[K]) => setV((s) => ({ ...s, [k]: val }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // JSON turns NaN into null, and a null data_mb means unlimited — never let a typo become that.
    if (v.data_gb.trim() && !(Number(v.data_gb) > 0)) return setErrors({ data_mb: "Enter a number of GB, or leave it empty for unlimited." });
    setErrors({});
    setBusy(true);
    try {
      await onSave(toPlanPayload(v));
    } catch (err) {
      setErrors((err as { fields?: Record<string, string> }).fields ?? { form: "Could not save this plan." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Data (GB)" inputMode="decimal" value={v.data_gb} onChange={(e) => set("data_gb", e.target.value)} hint="Empty = unlimited" error={errors.data_mb} />
        <Field label="Validity (days)" inputMode="numeric" value={v.validity_days} onChange={(e) => set("validity_days", e.target.value)} error={errors.validity_days} />
        <Field label="Price (PHP)" inputMode="decimal" value={v.price} onChange={(e) => set("price", e.target.value)} error={errors.price} />
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={v.is_active} onChange={(e) => set("is_active", e.target.checked)} /> Active (visible to travelers)</label>
      {errors.form && <p role="alert" className="text-sm text-danger">{errors.form}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={busy}>Save plan</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
