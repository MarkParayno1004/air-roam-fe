import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, Field } from "@air-roam/ui";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router";
import { z } from "zod";
import { safeNext, useAuth } from "./AuthProvider";
import { authMessage } from "./errors";

const schema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});
type Values = z.infer<typeof schema>;

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      await login(v.email, v.password);
      navigate(next, { replace: true });
    } catch (e) {
      setError(authMessage(e));
    }
  });

  return (
    <Card className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-bold">Log in</h1>
      <p className="mt-1 text-sm text-muted">Welcome back — your cart is saved.</p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <Field label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={formState.errors.email?.message} {...register("email")} />
        <Field label="Password" type="password" autoComplete="current-password" error={formState.errors.password?.message} {...register("password")} />
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <Button type="submit" size="lg" disabled={formState.isSubmitting}>{formState.isSubmitting ? "Logging in…" : "Log in"}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        New to Air Roam? <Link to={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-primary">Create an account</Link>
      </p>
    </Card>
  );
}
