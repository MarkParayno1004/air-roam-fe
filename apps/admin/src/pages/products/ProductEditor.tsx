import type { StaffProduct } from "@air-roam/api";
import { Button, Card, Field } from "@air-roam/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useStaff } from "../../auth/StaffProvider";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { errorMessage, toFieldErrors } from "../../lib/errors";
import { PRODUCT_TYPES } from "../../lib/options";
import { ThumbnailUpload } from "./ThumbnailUpload";

type Draft = { product_name: string; product_type: string; product_description: string; is_active: boolean };

export function ProductEditor() {
  const { id } = useParams();
  const isNew = !id;
  const { client } = useStaff();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: product } = useQuery({ queryKey: ["staff-product", id], queryFn: () => client.request<StaffProduct>(`staff/products/${id}`), enabled: !isNew });
  const [draft, setDraft] = useState<Draft>({ product_name: "", product_type: "esim", product_description: "", is_active: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (product) setDraft({ product_name: product.product_name, product_type: product.product_type, product_description: product.product_description ?? "", is_active: product.is_active ?? true });
  }, [product]);

  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["staff-product", id] }), qc.invalidateQueries({ queryKey: ["staff-products"] })]);

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSaved(false);
    try {
      if (isNew) {
        const created = await client.request<StaffProduct>("staff/products", { method: "POST", json: draft });
        await qc.invalidateQueries({ queryKey: ["staff-products"] });
        navigate(`/products/${created.id}`, { replace: true });
      } else {
        await client.request(`staff/products/${id}`, { method: "PATCH", json: draft });
        await refresh();
        setSaved(true);
      }
    } catch (err) {
      setErrors(toFieldErrors(err).fields);
    }
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
      <Link to="/products" className="text-[13px] text-muted hover:text-primary">Products / {isNew ? "New product" : product?.product_name ?? "…"}</Link>
      <h1 className="text-2xl font-bold">{isNew ? "New product" : "Edit product"}</h1>
      {actionError && <p role="alert" className="text-sm text-danger">{actionError}</p>}

      <Card className="p-6">
        <form onSubmit={saveProduct} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Field label="Product name" value={draft.product_name} onChange={(e) => setDraft({ ...draft, product_name: e.target.value })} error={errors.product_name} />
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Type
              <select value={draft.product_type} onChange={(e) => setDraft({ ...draft, product_type: e.target.value })} className="h-11 rounded-input border border-border bg-surface px-3 text-sm font-normal">
                {PRODUCT_TYPES.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Description
            <textarea rows={3} value={draft.product_description} onChange={(e) => setDraft({ ...draft, product_description: e.target.value })} className="rounded-input border border-border bg-surface p-4 text-sm font-normal outline-none focus:border-primary" />
          </label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} /> Active (visible to travelers)</label>
          {!isNew && <ThumbnailUpload current={product?.product_thumbnail_img ?? null} onUpload={(f) => run(() => { const body = new FormData(); body.append("file", f); return client.request(`staff/products/${id}/thumbnail`, { method: "POST", body }); })} />}
          {errors.form && <p role="alert" className="text-sm text-danger">{errors.form}</p>}
          {saved && <p role="status" className="text-sm text-success">Saved. The web store updates within a few minutes.</p>}
          <div className="flex gap-3">
            <Button type="submit">{isNew ? "Create product" : "Save product"}</Button>
            {!isNew && <Button variant="secondary" className="text-danger" onClick={() => setConfirmDelete(true)}>Delete product</Button>}
          </div>
          {confirmDelete && (
            <ConfirmDialog
              title={`Delete ${draft.product_name}?`}
              message="The product disappears from the store. Past orders are kept."
              onConfirm={() => run(async () => { await client.request(`staff/products/${id}`, { method: "DELETE" }); navigate("/products"); })}
              onCancel={() => setConfirmDelete(false)}
            />
          )}
        </form>
      </Card>

      <p className="text-sm text-muted">Prices, data and validity come from <Link to="/regions" className="font-semibold text-primary">Regions & prices</Link>.</p>
    </div>
  );
}
