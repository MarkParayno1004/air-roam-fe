import { VariantCard } from "@air-roam/ui";
import type { VariantFormValues } from "./VariantForm";

/** Live preview of how the plan appears to travelers (same card components as the web store). */
export function AppPreview({ values: v, productType }: { values: VariantFormValues; productType: string }) {
  return (
    <aside aria-label="Store preview" className="flex flex-col gap-3 rounded-card bg-background p-4">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">Store preview</p>
      <VariantCard
        variant={{
          id: "preview",
          name: v.name || "Plan name",
          countries: v.countries.length ? v.countries : ["JP"],
          scope: v.countries.length > 1 ? "multi" : "single",
          region: v.region,
          tag: v.tag || null,
          data_mb: v.data_gb ? Number(v.data_gb) * 1024 : null,
          validity_days: v.validity_days ? Number(v.validity_days) : null,
          price: v.price || "0",
          pricing_unit: v.pricing_unit,
          product_type: productType,
        }}
        onAdd={() => {}}
      />
      {!v.is_active && <p className="text-xs text-danger">Inactive — travelers won't see this plan.</p>}
    </aside>
  );
}
