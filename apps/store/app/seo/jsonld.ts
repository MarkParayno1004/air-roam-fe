import type { Destination } from "@air-roam/api";

/** schema.org Product with an AggregateOffer in PHP for a destination page. */
export function productJsonLd(d: Destination) {
  const prices = [...d.plans, ...d.wifi_plans].map((p) => Number(p.price));
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${d.country_name} roaming data — eSIM, SIM & Pocket WiFi`,
    brand: { "@type": "Brand", name: "Air Roam" },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "PHP",
      lowPrice: Math.min(...prices).toFixed(2), // the API only lists countries with something to sell
      highPrice: Math.max(...prices).toFixed(2),
      offerCount: prices.length,
    },
  };
}
