import { Button } from "@air-roam/ui";

/** Inline confirmation for destructive actions (all deletes are soft deletes on the server). */
export function ConfirmDialog({ title, message, confirmLabel = "Delete", onConfirm, onCancel }: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div role="alertdialog" aria-label={title} className="flex flex-col gap-3 rounded-input border border-danger/30 bg-danger-soft p-4">
      <p className="text-sm font-semibold text-danger">{title}</p>
      <p className="text-sm">{message}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
        <Button size="sm" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
