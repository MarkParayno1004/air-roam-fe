import { Card, cn } from "@air-roam/ui";
import type { ReactNode } from "react";
import { Link, matchPath, useLocation } from "react-router";
import { Icon, type IconName } from "../components/icons";

const TABS = [
  ["/products", "One country"],
  ["/products/multi-country", "Multiple countries"],
] as const;

/** Frame shared by the two product pages: the destination band, the steps, and a link to the other page. */
export function ProductTabs({ intro, field, other, children }: {
  intro: string;
  field: ReactNode;
  other: { to: string; icon: IconName; title: string; text: string };
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  return (
    <>
      <section className="bg-primary-soft">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-10 md:px-10 md:py-14">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Where are you going?</h1>
              <p className="mt-3 text-muted md:text-lg">{intro}</p>
            </div>
            <nav aria-label="Trip type" className="flex rounded-full bg-primary/10 p-1 sm:w-fit">
              {TABS.map(([to, label]) => {
                const active = matchPath(to, pathname); // not NavLink: see Header
                return (
                  <Link
                    key={to}
                    to={to}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 flex-auto items-center justify-center gap-1.5 rounded-full px-2.5 text-sm whitespace-nowrap transition-colors duration-150 motion-reduce:transition-none sm:px-5",
                      active ? "bg-accent font-semibold text-on-accent shadow-sm" : "font-medium text-ink hover:text-primary",
                    )}
                  >
                    {active && <Icon name="check" className="size-4" />}
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="max-w-2xl">{field}</div>
        </div>
      </section>
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-5 py-10 md:px-10 md:py-12">
        {children}
        <Link to={other.to} className="group rounded-card">
          <Card className="flex items-center gap-4 p-5 transition-colors duration-150 group-hover:border-primary motion-reduce:transition-none md:px-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-button bg-primary-soft text-primary"><Icon name={other.icon} /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{other.title}</span>
              <span className="mt-0.5 block text-sm text-muted">{other.text}</span>
            </span>
            <Icon name="right" className="text-primary" />
          </Card>
        </Link>
      </div>
    </>
  );
}
