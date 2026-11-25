import { SITE_ORIGIN } from "../lib/config";

/** React Router `meta` descriptors: title, description, canonical, Open Graph, Twitter card. */
export function buildMeta({ title, description, path }: { title: string; description: string; path: string }) {
  const url = `${SITE_ORIGIN}${path}`;
  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Air Roam" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { name: "twitter:card", content: "summary" },
  ];
}
