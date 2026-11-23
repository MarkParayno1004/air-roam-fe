import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cn, statusLabel, statusTone, type Tone } from "./format";

type Variant = "primary" | "secondary" | "danger" | "ghost";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary/90",
  secondary: "bg-background text-ink border border-border hover:bg-neutral-soft",
  danger: "bg-danger text-white hover:bg-danger/90",
  ghost: "text-primary hover:bg-primary-soft",
};

export function Button({
  variant = "primary", size = "md", className, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-9 px-4 text-sm", md: "h-10 px-5 text-sm", lg: "h-12 px-6 text-base" };
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-button font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANTS[variant], sizes[size], className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-surface border border-border rounded-card", className)} {...props} />;
}

const PILL: Record<Tone | "soft" | "solid" | "plain", string> = {
  grey: "bg-neutral-soft text-neutral",
  teal: "bg-primary-soft text-primary",
  green: "bg-success-soft text-success",
  red: "bg-danger-soft text-danger",
  soft: "bg-primary-soft text-primary",
  solid: "bg-primary text-on-primary",
  plain: "bg-background text-ink border border-border",
};

export function Pill({ tone = "soft", children, className }: { tone?: keyof typeof PILL; children: ReactNode; className?: string }) {
  return (
    <span data-tone={tone} className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", PILL[tone], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Pill tone={statusTone(status)}>{statusLabel(status)}</Pill>;
}

export function Field({ label, error, id, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const inputId = id ?? `f-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium">{label}</label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-err` : undefined}
        className={cn("h-11 rounded-input border bg-surface px-4 text-sm outline-none focus:border-primary", error ? "border-danger" : "border-border")}
        {...props}
      />
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p id={`${inputId}-err`} className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function Notice({ tone = "teal", title, children }: { tone?: Tone; title?: string; children?: ReactNode }) {
  return (
    <div role="status" className={cn("rounded-input px-5 py-4 text-sm", PILL[tone])}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? "mt-1" : ""}>{children}</div>}
    </div>
  );
}
