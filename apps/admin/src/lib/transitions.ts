/** Admin-reachable order transitions (backend §7). paid/expired come only from PayMongo. */
const NEXT: Record<string, string[]> = {
  pending_payment: ["cancelled"],
  paid: ["fulfilled", "refunded", "cancelled"],
};

export function nextStatuses(current: string): string[] {
  return NEXT[current] ?? [];
}
