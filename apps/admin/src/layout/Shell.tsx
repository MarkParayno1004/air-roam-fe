import { cn } from "@air-roam/ui";
import { NavLink, Outlet } from "react-router";
import { useStaff } from "../auth/StaffProvider";

export function Shell() {
  const { user, isAdmin, logout } = useStaff();
  const items: Array<[string, string]> = [
    ["/", "Overview"],
    ["/orders", "Orders"],
    ["/bookings", "Bookings"],
    ["/products", "Products (CMS)"],
    ["/regions", "Regions & prices"],
    ["/countries", "Countries"],
    ...(isAdmin ? ([["/users", "Users"]] as Array<[string, string]>) : []),
  ];
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex flex-col gap-6 border-b border-border bg-surface p-5 md:w-60 md:border-r md:border-b-0">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-[10px] bg-primary text-sm font-bold text-on-primary">AR</span>
          <div>
            <p className="font-bold leading-tight">Air Roam</p>
            <p className="text-xs text-muted">Admin</p>
          </div>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto md:flex-col">
          {items.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => cn("shrink-0 rounded-button px-4 py-2.5 text-sm font-medium", isActive ? "bg-primary text-on-primary" : "text-ink hover:bg-background")}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto hidden flex-col gap-2 border-t border-border pt-4 text-sm md:flex">
          <p className="font-medium">{user?.first_name} {user?.last_name}</p>
          <p className="text-xs text-muted">{(user?.permissions ?? []).join(" · ")}</p>
          <button type="button" className="cursor-pointer self-start text-sm font-semibold text-danger" onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 bg-background p-5 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
