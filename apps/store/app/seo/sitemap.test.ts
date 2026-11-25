import { buildRobots, buildSitemap, pathsFromFiles } from "./sitemap";

test("sitemap lists every path with the origin", () => {
  const xml = buildSitemap("https://airroam.ph", ["/", "/products/multi-country"]);
  expect(xml).toContain("<loc>https://airroam.ph/</loc>");
  expect(xml).toContain("<loc>https://airroam.ph/products/multi-country</loc>");
  expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
});

test("robots disallows private pages and points to the sitemap", () => {
  const txt = buildRobots("https://airroam.ph");
  for (const p of ["/cart", "/checkout", "/account", "/payment-result"]) expect(txt).toContain(`Disallow: ${p}`);
  expect(txt).toContain("Sitemap: https://airroam.ph/sitemap.xml");
});

test("paths come from pre-rendered index.html files", () => {
  expect(pathsFromFiles(["index.html", "products/multi-country/index.html", "assets/x.js", "terms/index.html"])).toEqual(["/", "/products/multi-country", "/terms"]);
});
