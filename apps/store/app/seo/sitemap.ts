// Pure helpers, also run by scripts/write-seo-files.ts under plain Node (no Vite imports here).

const PRIVATE = ["/cart", "/checkout", "/account", "/payment-result", "/login", "/signup"];

export function buildSitemap(origin: string, paths: string[]): string {
  const urls = paths.map((p) => `  <url><loc>${origin}${p}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function buildRobots(origin: string): string {
  return ["User-agent: *", ...PRIVATE.map((p) => `Disallow: ${p}`), "", `Sitemap: ${origin}/sitemap.xml`, ""].join("\n");
}

/** Relative file paths under build/client → public URL paths of pre-rendered pages. */
export function pathsFromFiles(files: string[]): string[] {
  return files
    .map((f) => f.replace(/\\/g, "/"))
    .filter((f) => f === "index.html" || f.endsWith("/index.html"))
    .map((f) => "/" + f.replace(/\/?index\.html$/, ""))
    .sort((a, b) => (a === "/" ? -1 : b === "/" ? 1 : a.localeCompare(b)));
}
