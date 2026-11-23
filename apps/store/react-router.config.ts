import type { Config } from "@react-router/dev/config";
import { prerenderPaths } from "./app/seo/prerender";

export default {
  ssr: false, // static files only; SEO pages are pre-rendered at build time
  prerender: () => prerenderPaths({ env: process.env }),
} satisfies Config;
