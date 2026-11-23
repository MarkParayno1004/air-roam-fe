import type { ReactNode } from "react";

export function LockNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-xs text-muted">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
      {children}
    </p>
  );
}
