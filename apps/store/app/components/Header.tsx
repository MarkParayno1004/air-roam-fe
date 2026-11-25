import { cn } from "@air-roam/ui";
import { useEffect, useRef, useState } from "react";
import { Link, matchPath, useLocation } from "react-router";
import { useAuth } from "../auth/AuthProvider";
import { useCart } from "../cart/store";
import { ButtonLink } from "./ButtonLink";
import { Icon } from "./icons";
import { Logo } from "./Logo";

const NAV = [
  ["/products", "One country"],
  ["/products/multi-country", "Multiple countries"],
  ["/contact", "Help"],
] as const;

export function Header() {
  const { count } = useCart();
  const signedIn = useAuth().status === "in";
  const { key, pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [key]); // every navigation, also back and the same page
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      menuButton.current?.focus();
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  const account = signedIn ? (["/account", "My account"] as const) : (["/login", "Log in"] as const);
  const links = (className: string) =>
    NAV.map(([to, label]) => {
      const active = matchPath(to, pathname); // not NavLink: "/products/" (static hosts) must match too, or hydration breaks
      return (
        <Link key={to} to={to} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 items-center hover:text-primary", className, active ? "font-semibold" : "font-medium")}>
          <span className={cn("border-y-2 border-transparent py-0.5", active && "border-b-primary")}>{label}</span>
        </Link>
      );
    });

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 md:px-10">
        <Logo />
        <nav aria-label="Main" className="ml-4 hidden flex-1 gap-7 lg:flex">{links("text-sm")}</nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link to={account[0]} className="hidden min-h-11 items-center px-3 text-sm font-semibold hover:text-primary lg:flex">{account[1]}</Link>
          <Link to="/cart" aria-label={count > 0 ? `Cart (${count})` : "Cart"} className="relative flex size-11 items-center justify-center rounded-button hover:text-primary">
            <Icon name="cart" className="size-6" />
            {count > 0 && (
              <span aria-hidden className="absolute top-0.5 right-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-on-accent ring-2 ring-surface">{count}</span>
            )}
          </Link>
          <ButtonLink to="/products" size="md" className="ml-1 max-sm:hidden">Get connected</ButtonLink>
          <button
            ref={menuButton}
            type="button"
            className="-mr-2.5 flex size-11 cursor-pointer items-center justify-center rounded-button hover:text-primary lg:hidden"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="menu"
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? "close" : "menu"} className="size-6" />
          </button>
        </div>
      </div>
      <nav id="menu" aria-label="Menu" hidden={!open} className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-y border-border bg-surface px-5 pt-2 pb-6 shadow-lg md:px-10 lg:hidden">
        <div className="flex flex-col divide-y divide-border">{links("min-h-13 text-base")}</div>
        <ButtonLink to="/products" className="mt-4 w-full sm:hidden">Get connected</ButtonLink>
        <div className="mt-3 flex gap-3 sm:mt-4">
          <ButtonLink to={account[0]} variant="secondary" className="flex-1">{account[1]}</ButtonLink>
          {!signedIn && <ButtonLink to="/signup" variant="secondary" className="flex-1">Sign up</ButtonLink>}
        </div>
      </nav>
    </header>
  );
}
