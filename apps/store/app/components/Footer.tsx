import { Link } from "react-router";
import { Logo } from "./Logo";

const COLS = [
  ["Shop", [["/destinations", "Destinations"], ["/multi-country", "Multi-country packs"]]],
  ["Help", [["/contact", "Contact us"], ["/refund-policy", "Refund policy"]]],
  ["Legal", [["/terms", "Terms of service"], ["/privacy", "Privacy policy"]]],
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[2fr_1fr_1fr_1fr] md:px-10">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="text-[13px] leading-5 text-muted">
            Roaming data for travelers — eSIM, SIM and Pocket WiFi rental.
            <br />
            Payments secured by Xendit · Prices in PHP
          </p>
        </div>
        {COLS.map(([title, links]) => (
          <div key={title} className="flex flex-col gap-2.5">
            <h2 className="text-sm font-semibold">{title}</h2>
            {links.map(([to, label]) => (
              <Link key={to} to={to} className="text-[13px] text-muted hover:text-primary">{label}</Link>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}
