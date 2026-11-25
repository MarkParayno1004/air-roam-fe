import { Link } from "react-router";
import { Logo } from "./Logo";

const COLS = [
  ["Shop", [["/products", "One country"], ["/products/multi-country", "Multiple countries"]]],
  ["Help", [["/contact", "Contact us"], ["/refund-policy", "Refund policy"]]],
  ["Legal", [["/terms", "Terms of service"], ["/privacy", "Privacy policy"]]],
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-5 py-12 md:grid-cols-[2fr_1fr_1fr_1fr] md:px-10">
        <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
          <Logo />
          <p className="text-[13px] leading-5 text-muted">
            Roaming data for travelers — eSIM, SIM and Pocket WiFi rental.
            <br />
            Payments secured by Xendit · Prices in PHP
          </p>
        </div>
        {COLS.map(([title, links]) => (
          <div key={title} className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold">{title}</h2>
            {links.map(([to, label]) => (
              <Link key={to} to={to} className="flex min-h-11 items-center text-[13px] text-muted hover:text-primary md:min-h-8">{label}</Link>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}
