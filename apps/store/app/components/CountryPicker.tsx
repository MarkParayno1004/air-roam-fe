import { countryName } from "@air-roam/ui";

/** Checkbox list of a pack's countries; the last ticked one can't be unticked. */
export function CountryPicker({ countries, value, onChange, legend = "Where will you use it?" }: {
  countries: string[];
  value: string[];
  onChange: (codes: string[]) => void;
  legend?: string;
}) {
  const toggle = (code: string) => onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code].sort());
  return (
    <fieldset role="group" aria-label={legend} className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-semibold">{legend}</legend>
      <p className="text-xs text-muted">All {countries.length} countries are included. Untick the ones you won't visit — at least one must stay.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {countries.map((c) => {
          const checked = value.includes(c);
          return (
            <label key={c} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={checked}
                disabled={checked && value.length === 1}
                onChange={() => toggle(c)}
              />
              {countryName(c)} ({c})
            </label>
          );
        })}
      </div>
      <p className="text-xs font-medium">{value.length} of {countries.length} countries selected</p>
    </fieldset>
  );
}
