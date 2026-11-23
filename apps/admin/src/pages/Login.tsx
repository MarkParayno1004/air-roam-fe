import { ApiError } from "@air-roam/api";
import { Button, Card, Field } from "@air-roam/ui";
import { useState } from "react";
import { useStaff } from "../auth/StaffProvider";

export function Login() {
  const { login } = useStaff();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setError("This account has no staff access.");
      else if (err instanceof ApiError && err.status === 429) setError("Too many attempts. Please wait a minute and try again.");
      else if (err instanceof ApiError && err.status === 401) setError("Wrong email or password.");
      else setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-5">
      <Card className="w-full max-w-sm p-8">
        <span className="flex size-11 items-center justify-center rounded-[12px] bg-primary font-bold text-on-primary">AR</span>
        <h1 className="mt-4 text-2xl font-bold">Air Roam Admin</h1>
        <p className="mt-1 text-sm text-muted">Staff sign-in</p>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4" noValidate>
          <Field label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <Button type="submit" size="lg" disabled={busy || !email || !password}>{busy ? "Signing in…" : "Sign in"}</Button>
        </form>
      </Card>
    </div>
  );
}
