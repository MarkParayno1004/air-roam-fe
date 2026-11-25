import type { Product } from "@air-roam/api";
import { TYPE_LABEL } from "@air-roam/ui";

/** Product types on sale, in the order the copy names them. */
export const soldTypes = (products: Product[]) => ["esim", "sim", "pocket_wifi"].filter((t) => products.some((p) => p.product_type === t));

/** The types sold as SIM/eSIM plans. */
export const planTypes = (types: string[]) => types.filter((t) => t !== "pocket_wifi");

// en-GB: no comma before the last one; fixed locale: pre-rendered HTML must match the browser
const and = new Intl.ListFormat("en-GB");
const or = new Intl.ListFormat("en-GB", { type: "disjunction" });
const labels = (types: string[]) => types.map((t) => TYPE_LABEL[t]);
export const allOf = (types: string[]) => and.format(labels(types));
export const anyOf = (types: string[]) => or.format(labels(types));
export const anyOne = (types: string[]) => or.format(types.map((t) => `${t === "esim" ? "an" : "a"} ${TYPE_LABEL[t]}`));

/** "eSIM installs before you fly; SIM and Pocket WiFi are delivered." */
export function howYouGetIt(types: string[]) {
  const delivered = types.filter((t) => t !== "esim");
  const parts = [];
  if (types.includes("esim")) parts.push("eSIM installs before you fly");
  if (delivered.length > 0) parts.push(`${allOf(delivered)} ${delivered.length > 1 ? "are" : "is"} delivered`);
  return parts.length > 0 ? `${parts.join("; ")}.` : "";
}
