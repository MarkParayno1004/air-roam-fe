import type { StaffPlan } from "@air-roam/api";
import { Button, Pill, formatPHP } from "@air-roam/ui";
import { useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { toGb } from "./PlanForm";

export function PlanTable({ plans, wifi = false, onEdit, onDelete }: {
  plans: StaffPlan[];
  wifi?: boolean;
  onEdit: (p: StaffPlan) => void;
  onDelete: (id: string) => void;
}) {
  const [confirm, setConfirm] = useState<StaffPlan | null>(null);
  if (plans.length === 0) return <p className="text-sm text-muted">No plans yet. Add the first one.</p>;
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-2 pr-3 font-medium">Plan</th>
              <th className="py-2 pr-3 font-medium">{wifi ? "Price per day" : "Price"}</th>
              {wifi && <th className="py-2 pr-3 font-medium">GB per day</th>}
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 font-medium"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="py-3 pr-3 font-medium">{wifi ? p.name : p.label}</td>
                <td className="py-3 pr-3">{formatPHP(p.price)}</td>
                {wifi && <td className="py-3 pr-3">{p.data_mb ? `${toGb(p.data_mb)} GB` : "Unlimited"}</td>}
                <td className="py-3 pr-3"><Pill tone={p.is_active ? "teal" : "grey"}>{p.is_active ? "Active" : "Inactive"}</Pill></td>
                <td className="py-3 text-right whitespace-nowrap">
                  <Button size="sm" variant="ghost" onClick={() => onEdit(p)} aria-label={`Edit ${p.label}`}>Edit</Button>
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => setConfirm(p)} aria-label={`Delete ${p.label}`}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {confirm && (
        <ConfirmDialog
          title={`Delete ${confirm.label}?`}
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
