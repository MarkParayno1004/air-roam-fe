import type { ReactNode } from "react";
import { NoAccess } from "../pages/NoAccess";
import { useStaff } from "./StaffProvider";

/** Hides admin-only screens. Cosmetic only — the staff API enforces roles. */
export function RequireRole({ role, children }: { role: "admin"; children: ReactNode }) {
  const { isAdmin } = useStaff();
  return role === "admin" && !isAdmin ? <NoAccess /> : <>{children}</>;
}
