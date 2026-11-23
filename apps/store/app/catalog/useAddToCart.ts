import type { CatalogVariant } from "@air-roam/ui";
import { useNavigate } from "react-router";
import { useCart } from "../cart/store";

/** Add a plan and open the cart (Pocket WiFi needs dates there anyway). */
export function useAddToCart(): (v: CatalogVariant) => void {
  const { add } = useCart();
  const navigate = useNavigate();
  return (v) => {
    add(v);
    navigate("/cart");
  };
}
