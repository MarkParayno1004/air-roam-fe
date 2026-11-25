// Used by react-router.config.ts at build time (plain Node; no Vite-only imports here).

export const STATIC_PATHS = ["/", "/destinations", "/products", "/terms", "/privacy", "/refund-policy", "/contact"];

type Env = Record<string, string | undefined>;

/**
 * Paths to pre-render. Local builds tolerate a missing API (static pages only);
 * CI/production builds (CI or STRICT_BUILD set) must have real URLs and the destination list,
 * so we never ship localhost canonicals or a store without destination pages.
 */
export async function prerenderPaths({ env, fetchImpl = fetch }: { env: Env; fetchImpl?: typeof fetch }): Promise<string[]> {
  const strict = !!(env.CI || env.STRICT_BUILD);
  if (strict && (!env.VITE_API_URL || !env.VITE_SITE_ORIGIN)) {
    throw new Error("[prerender] VITE_API_URL and VITE_SITE_ORIGIN must be set for CI/production builds");
  }
  const api = env.VITE_API_URL ?? "http://localhost:8000/api/v1";
  try {
    const res = await fetchImpl(`${api}/destinations`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const destinations = (await res.json()) as Array<{ slug: string }>;
    return [...STATIC_PATHS, ...destinations.map((d) => `/destinations/${d.slug}`)];
  } catch (e) {
    if (strict) throw new Error(`[prerender] could not load destinations from ${api}: ${String(e)}`);
    console.warn(`[prerender] could not load destinations from ${api}; building static pages only`, e);
    return STATIC_PATHS;
  }
}
