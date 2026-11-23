// Post-build: write sitemap.xml and robots.txt from the pre-rendered pages. Run with plain Node (type stripping).
import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildRobots, buildSitemap, pathsFromFiles } from "../app/seo/sitemap.ts";

const out = join(import.meta.dirname, "..", "build", "client");
const origin = (process.env.SITE_ORIGIN ?? process.env.VITE_SITE_ORIGIN ?? "http://localhost:5173").replace(/\/$/, "");
const paths = pathsFromFiles(readdirSync(out, { recursive: true }).map(String));

writeFileSync(join(out, "sitemap.xml"), buildSitemap(origin, paths));
writeFileSync(join(out, "robots.txt"), buildRobots(origin));
console.log(`[seo] wrote sitemap.xml (${paths.length} pages) and robots.txt for ${origin}`);
