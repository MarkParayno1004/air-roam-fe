import { allCountries, countryName } from "@air-roam/ui";
import { useId, useState } from "react";

/** Searchable multi-select: one country = single-country plan, two or more = multi-country pack. */
export function CountryMultiSelect({ value, onChange, error }: { value: string[]; onChange: (codes: string[]) => void; error?: string }) {
  const [q, setQ] = useState("");
  const id = useId();
  const query = q.trim().toLowerCase();
  const matches = query
    ? allCountries().filter((c) => !value.includes(c.code) && (c.name.toLowerCase().includes(query) || c.code.toLowerCase() === query)).slice(0, 8)
    : [];
  const add = (code: string) => {
    onChange([...value, code].sort());
    setQ("");
  };
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Countries {value.length > 1 && <span className="text-muted">· multi-country pack ({value.length})</span>}</span>
      <ul aria-label="Selected countries" className="flex flex-wrap gap-1.5">
        {value.map((c) => (
          <li key={c} className="flex items-center gap-1 rounded-full bg-primary-soft py-1 pr-1 pl-3 text-xs font-semibold text-primary">
            {countryName(c)} ({c})
            <button type="button" aria-label={`Remove ${countryName(c)}`} onClick={() => onChange(value.filter((x) => x !== c))} className="flex size-5 cursor-pointer items-center justify-center rounded-full hover:bg-primary/15">×</button>
          </li>
        ))}
        {value.length === 0 && <li className="text-xs text-muted">No countries yet</li>}
      </ul>
      <label htmlFor={id} className="sr-only">Add a country</label>
      <input
        id={id}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && matches[0]) {
            e.preventDefault();
            add(matches[0].code);
          }
        }}
        placeholder="Add a country — type to search"
        aria-label="Add a country"
        aria-controls={`${id}-list`}
        className="h-10 rounded-input border border-border bg-surface px-4 text-sm outline-none focus:border-primary"
      />
      {matches.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className="max-h-56 overflow-auto rounded-input border border-border bg-surface p-1">
          {matches.map((c) => (
            <li key={c.code} role="option" aria-selected={false} onClick={() => add(c.code)} className="cursor-pointer rounded-button px-3 py-2 text-sm hover:bg-primary-soft">
              {c.name} ({c.code})
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
