import { useEffect, useState } from "react";

/** False in pre-rendered HTML: a choice made before hydration would show as made but be lost. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
