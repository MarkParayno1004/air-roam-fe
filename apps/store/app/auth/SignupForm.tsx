import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, Field } from "@air-roam/ui";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router";
import { z } from "zod";
import { safeNext, useAuth } from "./AuthProvider";
import { authMessage, fieldErrors } from "./errors";

const schema = z.object({
  first_name: z.string().trim().min(1, "Enter your first name."),
  last_name: z.string().trim().min(1, "Enter your last name."),
  email: z.string().email("Enter a valid email."),
  contact_no: z.string().trim().max(12, "Use at most 12 characters.").optional(),
  password: z.string().min(10, "Use at least 10 characters."),
});
type Values = z.infer<typeof schema>;

export function SignupForm() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState, setError: setFieldError } = useForm<Values>({ resolver: zodResolver(schema) });
  const err = (k: keyof Values) => formState.errors[k]?.message;

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      await signup(v);
      navigate(next, { replace: true });
    } catch (e) {
      const fields = fieldErrors(e);
      const known = Object.entries(fields).filter(([k]) => k in schema.shape);
      known.forEach(([k, m]) => setFieldError(k as keyof Values, { message: m }));
      if (!known.length) setError(authMessage(e));
    }
  });

  return (
    <Card className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-bold">Create an account</h1>
      <p className="mt-1 text-sm text-muted">Required to buy — track orders and bookings.</p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" autoComplete="given-name" error={err("first_name")} {...register("first_name")} />
          <Field label="Last name" autoComplete="family-name" error={err("last_name")} {...register("last_name")} />
        </div>
        <Field label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={err("email")} {...register("email")} />
        <Field label="Contact no." type="tel" autoComplete="tel" maxLength={12} placeholder="+09*********" error={err("contact_no")} {...register("contact_no")} />
        <Field label="Password" type="password" autoComplete="new-password" hint="At least 10 characters" error={err("password")} {...register("password")} />
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <Button type="submit" size="lg" disabled={formState.isSubmitting}>{formState.isSubmitting ? "Creating account…" : "Create account"}</Button>
        <p className="text-center text-xs text-muted">
          By signing up you agree to the <Link to="/terms" className="text-primary">Terms</Link> and <Link to="/privacy" className="text-primary">Privacy policy</Link>. Address can be added later in your account.
        </p>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account? <Link to={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-primary">Log in</Link>
      </p>
    </Card>
  );
}
