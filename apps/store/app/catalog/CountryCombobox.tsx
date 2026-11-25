import type { Destination } from "@air-roam/api";
import { cn } from "@air-roam/ui";
import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { Icon } from "../components/icons";
import { useMounted } from "../lib/useMounted";
import { searchDestinations } from "./DestinationGrid";

/** WAI-ARIA combobox with a listbox: type to filter, or open it to see every country. */
export function CountryCombobox({ destinations, value, onChange }: {
  destinations: Destination[];
  value: string;
  onChange: (code: string) => void;
}) {
  const id = useId();
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const mounted = useMounted();

  const chosen = destinations.find((d) => d.country_code === value);
  const shown = searchDestinations(destinations, text === chosen?.country_name ? "" : text);
  const expanded = open && shown.length > 0;
  const popular = destinations.filter((d) => d.is_popular);
  const optionId = (d: Destination) => `${id}-${d.country_code}`;
  const activeId = expanded && shown[active] ? optionId(shown[active]) : undefined;
  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView?.({ block: "nearest" });
  }, [activeId]);

  function show() {
    setOpen(true);
    setActive(-1);
  }
  function pick(d: Destination) {
    onChange(d.country_code);
    setText(d.country_name);
    setOpen(false);
    setActive(-1);
  }
  function leave() {
    const typed = destinations.find((d) => d.country_name.toLowerCase() === text.trim().toLowerCase());
    if (typed) return pick(typed); // a full name counts as picked: phone keyboards can close without Enter
    setOpen(false);
    if (!text.trim() || !chosen) onChange("");
    setText(text.trim() ? (chosen?.country_name ?? "") : "");
  }
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "Enter" && activeId) pick(shown[active]);
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      setOpen(true);
      const from = open ? active : -1;
      const next = e.key === "ArrowDown" ? from + 1 : from < 0 ? shown.length - 1 : from - 1 + shown.length;
      setActive(next % shown.length);
    } else return;
    e.preventDefault();
  }

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">Destination country</label>
      <div className="relative">
        <Icon name="pin" className="pointer-events-none absolute top-[1.125rem] left-5 text-primary" />
        <input
          id={id}
          role="combobox"
          aria-expanded={expanded}
          aria-controls={expanded ? `${id}-list` : undefined}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          autoComplete="off"
          placeholder="Type a country..."
          disabled={!mounted}
          value={text}
          onFocus={show}
          onClick={() => setOpen(true)}
          onBlur={leave}
          onKeyDown={onKeyDown}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setActive(e.target.value.trim() ? 0 : -1); // Enter picks the first match
          }}
          className="h-14 w-full rounded-input border border-border bg-surface pr-5 pl-13 text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {expanded && (
          // keep focus in the field while the mouse picks, or leaving it would undo the typing first
          <ul id={`${id}-list`} role="listbox" aria-label="Destination country" onMouseDown={(e) => e.preventDefault()} className="absolute z-10 mt-2 max-h-72 w-full overflow-y-auto rounded-input border border-border bg-surface py-2 shadow-lg">
            {shown.map((d, i) => (
              <li
                key={d.country_code}
                id={optionId(d)}
                role="option"
                aria-selected={d.country_code === value}
                onClick={() => pick(d)}
                className={cn("flex min-h-11 cursor-pointer items-center px-5 hover:bg-primary-soft", i === active && "bg-primary-soft", d.country_code === value && "font-semibold text-primary")}
              >
                {d.country_name}
              </li>
            ))}
          </ul>
        )}
        <div role="status">
          {open && shown.length === 0 && <p className="absolute z-10 mt-2 w-full rounded-input border border-border bg-surface px-5 py-4 text-sm text-muted shadow-lg">No country found</p>}
        </div>
      </div>
      {popular.length > 0 && (
        <div role="group" aria-label="Popular countries" className="mt-4 flex flex-wrap items-center gap-2">
          <span aria-hidden className="mr-1 w-full text-sm text-muted sm:w-auto">Popular</span>
          {popular.map((d) => (
            <button
              key={d.country_code}
              type="button"
              disabled={!mounted}
              aria-pressed={d.country_code === value}
              onClick={() => pick(d)}
              className="min-h-11 cursor-pointer rounded-full border border-border bg-surface px-4 text-sm font-medium transition-colors duration-150 hover:border-primary aria-pressed:border-primary aria-pressed:text-primary motion-reduce:transition-none"
            >
              {d.country_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
