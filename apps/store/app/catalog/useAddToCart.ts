import { useNavigate } from "react-router";
import { useCart, type NewLine } from "../cart/store";

/** Add a product and open the cart. */
export function useAddToCart(): (l: NewLine) => void {
  const { add } = useCart();
  const navigate = useNavigate();
  return (l) => {
    add(l);
    navigate("/cart");
  };
}
