import { formatPHP } from "@air-roam/ui";
import { SITE_ORIGIN } from "../lib/config";

export function destinationTitle(country: string, fromPrice: string) {
  return `${country} eSIM, SIM & Pocket WiFi — from ${formatPHP(fromPrice)} · Air Roam`;
}

/** React Router `meta` descriptors: title, description, canonical, Open Graph, Twitter card. */
export function buildMeta({ title, description, path, image }: { title: string; description: string; path: string; image?: string }) {
  const url = `${SITE_ORIGIN}${path}`;
  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Air Roam" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
  ];
  if (image) meta.push({ property: "og:image", content: image });
  return meta;
}
