import { cn } from "@air-roam/ui";

const PATHS = {
  pocket_wifi: "M2 9a15 15 0 0 1 20 0M5.5 12.7a10 10 0 0 1 13 0M9 16.4a5 5 0 0 1 6 0M12 20h.01",
  esim: "M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2",
  sim: "M6 4a2 2 0 0 1 2-2h6l4 4v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zM9 12h6v6H9zM9 15h6",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9s1.3-6.4 3.8-9z",
  pin: "M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  plane: "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z",
  check: "M5 12l5 5 9-10",
  down: "M6 9l6 6 6-6",
  right: "M9 6l6 6-6 6",
  cart: "M3 4h2l2.4 11h10.2L20 7H5.7M9 20h.01M17 20h.01",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
};

export type IconName = keyof typeof PATHS;

/** Decorative: always next to a text label. */
export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("shrink-0", !className?.includes("size-") && "size-5", className)}>
      <path d={PATHS[name]} />
    </svg>
  );
}
