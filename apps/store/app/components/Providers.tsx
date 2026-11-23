import type { ReactNode } from "react";
import { AuthProvider } from "../auth/AuthProvider";
import { CartProvider } from "../cart/store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );
}
