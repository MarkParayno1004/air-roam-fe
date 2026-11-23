import type { Destination } from "@air-roam/api";
import type { CatalogVariant } from "@air-roam/ui";

/** schema.org Product with an AggregateOffer in PHP for a destination page. */
export function productJsonLd(d: Destination, variants: CatalogVariant[]) {
  const prices = variants.map((v) => Number(v.price));
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${d.country_name} roaming data — eSIM, SIM & Pocket WiFi`,
    brand: { "@type": "Brand", name: "Air Roam" },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "PHP",
      lowPrice: (prices.length ? Math.min(...prices) : Number(d.from_price)).toFixed(2),
      highPrice: (prices.length ? Math.max(...prices) : Number(d.from_price)).toFixed(2),
      offerCount: variants.length,
    },
  };
}
