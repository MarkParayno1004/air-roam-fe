import type { ApiClient, User } from "@air-roam/api";
import { QueryClientContext } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api as defaultClient } from "../lib/api";

type Status = "loading" | "in" | "out";

export interface SignupData {
  first_name: string;
  last_name: string;
  email: string;
  contact_no?: string;
  password: string;
}

interface Auth {
  user: User | null;
  status: Status;
  client: ApiClient;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User) => void;
}

const AuthContext = createContext<Auth | null>(null);

/** Only same-site relative paths are allowed as a post-login redirect. */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}

export function AuthProvider({ children, client = defaultClient }: { children: ReactNode; client?: ApiClient }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const queryClient = useContext(QueryClientContext); // optional: cached account data must not outlive the session

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
      // Restore the session from the HttpOnly refresh cookie; failure just means "logged out".
      const ok = await client.refresh().catch(() => false);
      const me = ok ? await client.request<User>("me").catch(() => null) : null;
      if (!alive) return;
      setUser(me);
      setStatus(me ? "in" : "out");
    })();
    return () => {
      alive = false;
    };
  }, [client]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await client.request<{ access: string; user: User }>("auth/web/login", { method: "POST", json: { email, password }, skipRefresh: true });
      queryClient?.clear();
      client.setAccessToken(res.access);
      setUser(res.user);
      setStatus("in");
    },
    [client, queryClient],
  );

  const signup = useCallback(
    async (data: SignupData) => {
      await client.request("auth/register", { method: "POST", json: data, skipRefresh: true });
      await login(data.email, data.password);
    },
    [client, login],
  );

  const logout = useCallback(async () => {
    await client.postWithCsrf("auth/web/logout").catch(() => undefined);
    client.setAccessToken(null);
    queryClient?.clear();
    setUser(null);
    setStatus("out");
  }, [client, queryClient]);

  const value = useMemo(() => ({ user, status, client, login, signup, logout, setUser }), [user, status, client, login, signup, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Auth {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
