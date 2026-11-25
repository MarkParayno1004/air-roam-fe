// Used by react-router.config.ts at build time (plain Node; no Vite-only imports here).

export const STATIC_PATHS = ["/", "/products", "/products/multi-country", "/terms", "/privacy", "/refund-policy", "/contact"];

type Env = Record<string, string | undefined>;

/**
 * Paths to pre-render. Locally a missing API only warns here (dev runs this too); CI/production builds
 * (CI or STRICT_BUILD set) must have real URLs and a reachable API (the pages bake in its data),
 * so we never ship localhost canonicals or pages without data.
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
  } catch (e) {
    if (strict) throw new Error(`[prerender] could not load destinations from ${api}: ${String(e)}`);
    console.warn(`[prerender] could not load destinations from ${api}; the pages that load the catalog will not build`, e);
  }
  return STATIC_PATHS;
}
