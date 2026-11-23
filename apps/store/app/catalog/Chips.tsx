import { cn } from "@air-roam/ui";

/** Single-select chip row (region / product type filters). */
export function Chips<T extends string>({ options, value, onChange, label }: {
  options: Array<[T, string]>;
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-2 overflow-x-auto pb-1">
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={cn(
            "h-9 shrink-0 cursor-pointer rounded-full px-4 text-[13px] font-medium transition-colors",
            value === key ? "bg-primary text-on-primary" : "border border-border bg-surface hover:border-primary",
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
