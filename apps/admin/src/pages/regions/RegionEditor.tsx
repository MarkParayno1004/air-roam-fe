import type { StaffPlan, StaffRegion } from "@air-roam/api";
import { Button, Card, Field } from "@air-roam/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useStaff } from "../../auth/StaffProvider";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { CountryMultiSelect } from "../../components/CountryMultiSelect";
import { errorMessage, toFieldErrors } from "../../lib/errors";
import { PlanForm, type PlanPayload } from "./PlanForm";
import { PlanTable } from "./PlanTable";

type Draft = { name: string; countries: string[]; pocket_wifi_daily_rate: string; is_active: boolean };

export function RegionEditor() {
  const { id } = useParams();
  const isNew = !id;
  const { client } = useStaff();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: region } = useQuery({ queryKey: ["staff-region", id], queryFn: () => client.request<StaffRegion>(`staff/regions/${id}`), enabled: !isNew });
  const [draft, setDraft] = useState<Draft>({ name: "", countries: [], pocket_wifi_daily_rate: "", is_active: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<StaffPlan | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (region) setDraft({ name: region.name, countries: region.countries, pocket_wifi_daily_rate: region.pocket_wifi_daily_rate ?? "", is_active: region.is_active ?? true });
  }, [region]);

  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["staff-region", id] }), qc.invalidateQueries({ queryKey: ["staff-regions"] })]);

  async function saveRegion(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSaved(false);
    const json = { ...draft, name: draft.name.trim(), pocket_wifi_daily_rate: draft.pocket_wifi_daily_rate.trim() || null };
    try {
      if (isNew) {
        const created = await client.request<StaffRegion>("staff/regions", { method: "POST", json });
        await qc.invalidateQueries({ queryKey: ["staff-regions"] });
        navigate(`/regions/${created.id}`, { replace: true });
      } else {
        await client.request(`staff/regions/${id}`, { method: "PATCH", json });
        await refresh();
        setSaved(true);
      }
    } catch (err) {
      setErrors(toFieldErrors(err).fields);
    }
  }

  async function savePlan(json: PlanPayload) {
    try {
      if (editing === "new") await client.request(`staff/regions/${id}/plans`, { method: "POST", json });
      else if (editing) await client.request(`staff/regions/${id}/plans/${editing.id}`, { method: "PATCH", json });
    } catch (err) {
      throw toFieldErrors(err);
    }
    setEditing(null);
    await refresh();
  }

  async function run(action: () => Promise<unknown>) {
    setActionError(null);
    try {
      await action();
      await refresh();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Link to="/regions" className="text-[13px] text-muted hover:text-primary">Regions / {isNew ? "New region" : region?.name ?? "…"}</Link>
      <h1 className="text-2xl font-bold">{isNew ? "New region" : "Edit region"}</h1>
      {actionError && <p role="alert" className="text-sm text-danger">{actionError}</p>}

      <Card className="p-6">
        <form onSubmit={saveRegion} className="flex flex-col gap-4" noValidate>
          <p className="text-sm text-muted">Customers never see the region name. They pick a country and get this region's prices.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Region name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} error={errors.name} placeholder="e.g. Asia 1" />
            <Field label="Pocket WiFi rate per day (PHP)" inputMode="decimal" value={draft.pocket_wifi_daily_rate} onChange={(e) => setDraft({ ...draft, pocket_wifi_daily_rate: e.target.value })} hint="Empty = no Pocket WiFi in this region" error={errors.pocket_wifi_daily_rate} />
          </div>
          <CountryMultiSelect value={draft.countries} onChange={(countries) => setDraft({ ...draft, countries })} error={errors.countries} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} /> Active (sold to travelers)</label>
          {errors.form && <p role="alert" className="text-sm text-danger">{errors.form}</p>}
          {saved && <p role="status" className="text-sm text-success">Saved. The web store updates within a few minutes.</p>}
          <div className="flex gap-3">
            <Button type="submit">{isNew ? "Create region" : "Save region"}</Button>
            {!isNew && <Button variant="secondary" className="text-danger" onClick={() => setConfirmDelete(true)}>Delete region</Button>}
          </div>
          {confirmDelete && (
            <ConfirmDialog
              title={`Delete ${draft.name}?`}
              message="Its countries and plans disappear from the store. Past orders are kept."
              onConfirm={() => run(async () => { await client.request(`staff/regions/${id}`, { method: "DELETE" }); navigate("/regions"); })}
              onCancel={() => setConfirmDelete(false)}
            />
          )}
        </form>
      </Card>

      {!isNew && region && (
        <Card className="flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">SIM/eSIM plans</h2>
            {!editing && <Button size="sm" onClick={() => setEditing("new")}>Add plan</Button>}
          </div>
          {editing ? (
            <PlanForm key={editing === "new" ? "new" : editing.id} initial={editing === "new" ? null : editing} onSave={savePlan} onCancel={() => setEditing(null)} />
          ) : (
            <PlanTable plans={region.plans} onEdit={setEditing} onDelete={(pid) => run(() => client.request(`staff/regions/${id}/plans/${pid}`, { method: "DELETE" }))} />
          )}
        </Card>
      )}
    </div>
  );
}
