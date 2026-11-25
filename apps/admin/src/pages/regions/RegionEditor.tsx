import type { StaffPlan, StaffRegion } from "@air-roam/api";
import { Button, Card, Field } from "@air-roam/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useStaff } from "../../auth/StaffProvider";
import { BackLink } from "../../components/BackLink";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { CountryMultiSelect } from "../../components/CountryMultiSelect";
import { errorMessage, toFieldErrors } from "../../lib/errors";
import { PlanForm, type PlanPayload } from "./PlanForm";
import { PlanTable } from "./PlanTable";

type Draft = { name: string; countries: string[]; is_active: boolean };

export function RegionEditor() {
  const { id } = useParams();
  const isNew = !id;
  const { client } = useStaff();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: region } = useQuery({ queryKey: ["staff-region", id], queryFn: () => client.request<StaffRegion>(`staff/regions/${id}`), enabled: !isNew });
  const [draft, setDraft] = useState<Draft>({ name: "", countries: [], is_active: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<StaffPlan | "new" | null>(null);
  const [editingWifi, setEditingWifi] = useState<StaffPlan | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (region) setDraft({ name: region.name, countries: region.countries, is_active: region.is_active ?? true });
  }, [region?.id, region?.updated_at]); // not every refetch: adding a plan must not wipe unsaved edits

  const edit = (patch: Partial<Draft>) => {
    setSaved(false);
    setDraft((d) => ({ ...d, ...patch }));
  };
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["staff-region", id] }), qc.invalidateQueries({ queryKey: ["staff-regions"] }), qc.invalidateQueries({ queryKey: ["staff-countries"] })]);

  async function saveRegion(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSaved(false);
    const json = { ...draft, name: draft.name.trim() };
    try {
      if (isNew) {
        const created = await client.request<StaffRegion>("staff/regions", { method: "POST", json });
        await refresh();
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

  const savePlan = (target: StaffPlan | "new" | null, done: () => void) => async (json: PlanPayload) => {
    try {
      if (target === "new") await client.request(`staff/regions/${id}/plans`, { method: "POST", json });
      else if (target) await client.request(`staff/regions/${id}/plans/${target.id}`, { method: "PATCH", json });
    } catch (err) {
      throw toFieldErrors(err);
    }
    done();
    await refresh();
  };

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
      <BackLink to="/regions" />
      <h1 className="text-2xl font-bold">{isNew ? "New region" : "Edit region"}</h1>
      {actionError && <p role="alert" className="text-sm text-danger">{actionError}</p>}

      <Card className="p-6">
        <form onSubmit={saveRegion} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Region name" value={draft.name} onChange={(e) => edit({ name: e.target.value })} error={errors.name} placeholder="e.g. Asia 1" />
          </div>
          <CountryMultiSelect value={draft.countries} onChange={(countries) => edit({ countries })} error={errors.countries} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={draft.is_active} onChange={(e) => edit({ is_active: e.target.checked })} /> Active (sold to travelers)</label>
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
        <>
          {([false, true] as const).map((wifi) => {
            const state = wifi ? editingWifi : editing;
            const setState = wifi ? setEditingWifi : setEditing;
            return (
              <Card key={String(wifi)} className="flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{wifi ? "Pocket WiFi plans" : "SIM/eSIM plans"}</h2>
                  {!state && <Button size="sm" onClick={() => setState("new")}>{wifi ? "Add Pocket WiFi plan" : "Add plan"}</Button>}
                </div>
                {state ? (
                  <PlanForm key={state === "new" ? "new" : state.id} wifi={wifi} initial={state === "new" ? null : state} onSave={savePlan(state, () => setState(null))} onCancel={() => setState(null)} />
                ) : (
                  <PlanTable wifi={wifi} plans={region.plans.filter((p) => !!p.for_wifi === wifi)} onEdit={setState} onDelete={(pid) => run(() => client.request(`staff/regions/${id}/plans/${pid}`, { method: "DELETE" }))} />
                )}
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}
