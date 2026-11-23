import type { StaffUser } from "@air-roam/api";
import { Button, Field } from "@air-roam/ui";
import { useState } from "react";

export interface UserPayload {
  first_name: string;
  last_name: string;
  email: string;
  contact_no: string;
  permissions: string[];
  password?: string;
}

const ROLES: Array<[string, string, string]> = [
  ["admin", "Admin", "Users, orders, bookings, products"],
  ["marketing", "Marketing", "Products and plans; read-only orders and bookings"],
];

/** onSave may reject with { fields } for server errors. Password required only when creating. */
export function UserForm({ initial, onSave, onCancel }: { initial?: StaffUser | null; onSave: (p: UserPayload) => Promise<void> | void; onCancel: () => void }) {
  const creating = !initial;
  const [v, setV] = useState({
    first_name: initial?.first_name ?? "",
    last_name: initial?.last_name ?? "",
    email: initial?.email ?? "",
    contact_no: initial?.contact_no ?? "",
    password: "",
    permissions: (initial?.permissions as string[] | undefined) ?? [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!v.first_name.trim()) errs.first_name = "Required.";
    if (!v.last_name.trim()) errs.last_name = "Required.";
    if (!/^\S+@\S+\.\S+$/.test(v.email)) errs.email = "Enter a valid email.";
    if ((creating || v.password) && v.password.length < 10) errs.password = "Use at least 10 characters.";
    if (v.permissions.length === 0) errs.permissions = "Choose at least one role.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const { password, ...rest } = v;
    try {
      await onSave(password ? { ...rest, password } : rest);
    } catch (err) {
      setErrors((err as { fields?: Record<string, string> }).fields ?? { form: "Could not save this user." });
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" value={v.first_name} onChange={set("first_name")} error={errors.first_name} />
        <Field label="Last name" value={v.last_name} onChange={set("last_name")} error={errors.last_name} />
      </div>
      <Field label="Email" type="email" value={v.email} onChange={set("email")} error={errors.email} />
      <Field label="Contact no." type="tel" value={v.contact_no} onChange={set("contact_no")} />
      <Field label="Password" type="password" autoComplete="new-password" value={v.password} onChange={set("password")} error={errors.password} hint={creating ? "At least 10 characters" : "Leave empty to keep the current password"} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Roles</legend>
        {ROLES.map(([key, label, help]) => (
          <label key={key} className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-primary"
              checked={v.permissions.includes(key)}
              onChange={() => setV((s) => ({ ...s, permissions: s.permissions.includes(key) ? s.permissions.filter((p) => p !== key) : [...s.permissions, key].sort() }))}
            />
            <span><span className="font-medium">{label}</span> <span className="text-muted">— {help}</span></span>
          </label>
        ))}
        {errors.permissions && <p className="text-xs text-danger">{errors.permissions}</p>}
      </fieldset>
      {errors.form && <p role="alert" className="text-sm text-danger">{errors.form}</p>}
      <div className="flex gap-3">
        <Button type="submit">{creating ? "Create user" : "Save user"}</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
