import { useSearchParams } from "react-router";

/** URL-backed filter state so lists are linkable (e.g. from the overview tiles). */
export function useFilters() {
  const [params, setParams] = useSearchParams();
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setParams(next, { replace: true });
  };
  return { params, get: (k: string) => params.get(k) ?? "", set };
}

export function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: Array<[string, string]> }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-input border border-border bg-surface px-3 text-sm text-ink outline-none focus:border-primary">
        <option value="">All</option>
        {options.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
      </select>
    </label>
  );
}

export function FilterInput({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted">
      {label}
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-input border border-border bg-surface px-3 text-sm text-ink outline-none focus:border-primary" />
    </label>
  );
}

export function Pager({ count, page, pageSize, onPage }: { count: number; page: number; pageSize: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(count / pageSize));
  if (pages === 1) return null;
  return (
    <div className="flex items-center justify-end gap-3 text-sm">
      <button type="button" className="cursor-pointer disabled:opacity-40" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
      <span className="text-muted">Page {page} of {pages}</span>
      <button type="button" className="cursor-pointer disabled:opacity-40" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  );
}
