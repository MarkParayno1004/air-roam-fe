import type { StaffVariant } from "@air-roam/api";
import { Button, Pill, countryName, formatPHP } from "@air-roam/ui";
import { useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { countriesLabel } from "./VariantForm";

export function VariantTable({ variants, onEdit, onDelete }: {
  variants: StaffVariant[];
  productType: string;
  onEdit: (v: StaffVariant) => void;
  onDelete: (id: string) => void;
}) {
  const [confirm, setConfirm] = useState<StaffVariant | null>(null);
  if (variants.length === 0) return <p className="text-sm text-muted">No plans yet. Add the first one.</p>;
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-2 pr-3 font-medium">Plan</th>
              <th className="py-2 pr-3 font-medium">Countries</th>
              <th className="py-2 pr-3 font-medium">Price</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 font-medium"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => (
              <tr key={v.id} className="border-b border-border last:border-0">
                <td className="py-3 pr-3 font-medium">{v.name}{v.tag && <Pill tone="solid" className="ml-2">{v.tag}</Pill>}</td>
                <td className="py-3 pr-3"><span title={v.countries.map(countryName).join(", ")}>{countriesLabel(v.countries)}</span></td>
                <td className="py-3 pr-3">{formatPHP(v.price)} <span className="text-xs text-muted">{v.pricing_unit === "per_day" ? "/ day" : "/ plan"}</span></td>
                <td className="py-3 pr-3"><Pill tone={v.is_active ? "teal" : "grey"}>{v.is_active ? "Active" : "Inactive"}</Pill></td>
                <td className="py-3 text-right whitespace-nowrap">
                  <Button size="sm" variant="ghost" onClick={() => onEdit(v)} aria-label={`Edit ${v.name}`}>Edit</Button>
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => setConfirm(v)} aria-label={`Delete ${v.name}`}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {confirm && (
        <ConfirmDialog
          title={`Delete ${confirm.name}?`}
          message="Travelers will no longer see this plan. Past orders keep their details."
          onConfirm={() => {
            onDelete(confirm.id);
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
