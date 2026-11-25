import { cn } from "@air-roam/ui";
import { Link, type LinkProps } from "react-router";

const VARIANTS = {
  primary: "bg-primary text-on-primary hover:bg-primary/90",
  secondary: "border border-border bg-surface text-ink hover:border-primary hover:text-primary",
  // on a primary background
  accent: "bg-accent text-on-accent hover:bg-accent/90 focus-visible:outline-on-primary",
  outline: "border border-on-primary/50 text-on-primary hover:bg-on-primary/10 focus-visible:outline-on-primary",
};
const SIZES = { md: "min-h-11 px-5 text-sm", lg: "min-h-12 px-6 text-base" };

/** A link drawn as a button. */
export function ButtonLink({ variant = "primary", size = "lg", className, ...props }: LinkProps & { variant?: keyof typeof VARIANTS; size?: keyof typeof SIZES }) {
  return (
    <Link
      className={cn("inline-flex items-center justify-center gap-2 rounded-button py-2 text-center font-semibold transition-colors motion-reduce:transition-none", VARIANTS[variant], SIZES[size], className)}
      {...props}
    />
  );
}
