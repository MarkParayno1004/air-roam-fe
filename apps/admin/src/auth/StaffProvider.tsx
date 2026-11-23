import type { ApiClient, User } from "@air-roam/api";
import { QueryClientContext } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api as defaultClient } from "../lib/api";

type Status = "loading" | "in" | "out";

interface Staff {
  user: User | null;
  status: Status;
  client: ApiClient;
  isAdmin: boolean;
  isMarketing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const StaffContext = createContext<Staff | null>(null);
const isStaff = (u: User | null) => !!u && (u.permissions ?? []).length > 0;

export function StaffProvider({ children, client = defaultClient }: { children: ReactNode; client?: ApiClient }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const queryClient = useContext(QueryClientContext); // cached staff data must not outlive the session

  useEffect(
    () =>
      client.onSessionLost?.(() => {
        setUser(null);
        setStatus("out");
        queryClient?.clear();
      }),
    [client, queryClient],
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      const ok = await client.refresh().catch(() => false);
      const me = ok ? await client.request<User>("me").catch(() => null) : null;
      if (!alive) return;
      const staff = isStaff(me) ? me : null; // the backend still enforces roles on every request
      setUser(staff);
      setStatus(staff ? "in" : "out");
    })();
    return () => {
      alive = false;
    };
  }, [client]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await client.request<{ access: string; user: User }>("staff/auth/login", { method: "POST", json: { email, password }, skipRefresh: true });
      queryClient?.clear();
      client.setAccessToken(res.access);
      setUser(res.user);
      setStatus("in");
    },
    [client, queryClient],
  );

  const logout = useCallback(async () => {
    await client.postWithCsrf("staff/auth/logout").catch(() => undefined);
    client.setAccessToken(null);
    queryClient?.clear();
    setUser(null);
    setStatus("out");
  }, [client, queryClient]);

  const value = useMemo(() => {
    const perms = user?.permissions ?? [];
    return { user, status, client, login, logout, isAdmin: perms.includes("admin"), isMarketing: perms.includes("marketing") };
  }, [user, status, client, login, logout]);
  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}

export function useStaff(): Staff {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error("useStaff must be used inside <StaffProvider>");
  return ctx;
}
