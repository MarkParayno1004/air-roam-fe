import { cn } from "@air-roam/ui";
import { useState } from "react";
import { Link, NavLink } from "react-router";
import { HeaderActions } from "./HeaderActions";
import { Logo } from "./Logo";

const NAV = [
  ["/destinations", "Destinations"],
  ["/multi-country", "Multi-country"],
  ["/contact", "Help"],
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 md:px-10">
        <div className="flex items-center gap-10">
          <Logo />
          <nav aria-label="Main" className="hidden gap-7 md:flex">
            {NAV.map(([to, label]) => (
              <NavLink key={to} to={to} className={({ isActive }) => cn("text-sm font-medium hover:text-primary", isActive ? "text-primary" : "text-muted")}>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="hidden items-center gap-4 md:flex">
          <HeaderActions />
        </div>
        <button
          type="button"
          className="flex size-10 cursor-pointer items-center justify-center rounded-button border border-border md:hidden"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-4 border-t border-border px-5 py-4 md:hidden" onClick={() => setOpen(false)}>
          {NAV.map(([to, label]) => (
            <Link key={to} to={to} className="font-medium">{label}</Link>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <HeaderActions />
          </div>
        </div>
      )}
    </header>
  );
}
