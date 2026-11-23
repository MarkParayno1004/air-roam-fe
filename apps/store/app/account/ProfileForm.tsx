import type { User } from "@air-roam/api";
import { Button, Card, Field } from "@air-roam/ui";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../auth/AuthProvider";

const EDITABLE = ["first_name", "last_name", "contact_no", "address"] as const;
type Form = Record<(typeof EDITABLE)[number], string>;

export function ProfileForm() {
  const { user, client, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>({ first_name: "", last_name: "", contact_no: "", address: "" });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (user) setForm({ first_name: user.first_name ?? "", last_name: user.last_name ?? "", contact_no: user.contact_no ?? "", address: user.address ?? "" });
  }, [user]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(null);
    try {
      setUser(await client.request<User>("me", { method: "PATCH", json: form }));
      setSaved(true);
    } catch {
      setError("We couldn't save your details. Please try again.");
    }
  }

  async function deleteAccount() {
    await client.request("me", { method: "DELETE" });
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <form onSubmit={save} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" value={form.first_name} onChange={set("first_name")} autoComplete="given-name" />
            <Field label="Last name" value={form.last_name} onChange={set("last_name")} autoComplete="family-name" />
          </div>
          <Field label="Email" value={user?.email ?? ""} disabled hint="Contact support to change your email." />
          <Field label="Contact no." type="tel" value={form.contact_no} onChange={set("contact_no")} autoComplete="tel" />
          <Field label="Address" value={form.address} onChange={set("address")} autoComplete="street-address" hint="Used for physical SIM delivery. Pin-point location comes with the mobile app." />
          {saved && <p role="status" className="text-sm text-success">Saved.</p>}
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="self-start">Save changes</Button>
        </form>
      </Card>
      <Card className="flex flex-col gap-3 p-6">
        <h2 className="font-semibold">Delete account</h2>
        <p className="text-sm text-muted">Your orders stay on record, but you won't be able to log in again with this email.</p>
        {confirmDelete ? (
          <div className="flex gap-3">
            <Button variant="danger" onClick={deleteAccount}>Yes, delete my account</Button>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Keep my account</Button>
          </div>
        ) : (
          <Button variant="secondary" className="self-start text-danger" onClick={() => setConfirmDelete(true)}>Delete account</Button>
        )}
      </Card>
    </div>
  );
}
