import { buildRobots, buildSitemap, pathsFromFiles } from "./sitemap";
import { productJsonLd } from "./jsonld";

test("sitemap lists every path with the origin", () => {
  const xml = buildSitemap("https://airroam.ph", ["/", "/destinations/japan"]);
  expect(xml).toContain("<loc>https://airroam.ph/</loc>");
  expect(xml).toContain("<loc>https://airroam.ph/destinations/japan</loc>");
  expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
});

test("robots disallows private pages and points to the sitemap", () => {
  const txt = buildRobots("https://airroam.ph");
  for (const p of ["/cart", "/checkout", "/account", "/payment-result"]) expect(txt).toContain(`Disallow: ${p}`);
  expect(txt).toContain("Sitemap: https://airroam.ph/sitemap.xml");
});

test("paths come from pre-rendered index.html files", () => {
  expect(pathsFromFiles(["index.html", "destinations/japan/index.html", "assets/x.js", "terms/index.html"])).toEqual(["/", "/destinations/japan", "/terms"]);
});

test("json-ld offer range in PHP covers plans and the WiFi day rate", () => {
  const ld = productJsonLd({
    country_code: "JP", country_name: "Japan", slug: "japan", from_price: "100.00", pocket_wifi_daily_rate: "100.00",
    plans: [{ price: "449.00" }, { price: "1299.00" }] as never,
  });
  expect(ld.offers).toMatchObject({ priceCurrency: "PHP", lowPrice: "100.00", highPrice: "1299.00", offerCount: 3 });
});
