import { cn } from "@air-roam/ui";
import { NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "../auth/AuthProvider";
import { RequireAuth } from "../auth/RequireAuth";

export const meta = () => [{ title: "My account · Air Roam" }, { name: "robots", content: "noindex" }];

const NAV = [
  ["/account/orders", "My orders"],
  ["/account/bookings", "My bookings"],
  ["/account/profile", "Profile & address"],
] as const;

export default function Account() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <RequireAuth>
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-[240px_1fr] md:px-10">
        <nav aria-label="Account" className="flex h-fit gap-1 overflow-x-auto rounded-card border border-border bg-surface p-3 md:flex-col">
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => cn("shrink-0 rounded-button px-4 py-3 text-sm font-medium", isActive ? "bg-accent-soft font-semibold text-ink" : "hover:bg-background")}>
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            className="shrink-0 cursor-pointer rounded-button px-4 py-3 text-left text-sm font-medium text-danger hover:bg-danger-soft"
            onClick={async () => {
              await logout();
              navigate("/", { replace: true });
            }}
          >
            Log out
          </button>
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </RequireAuth>
  );
}
