import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("destinations", "routes/destinations.tsx"),
  route("destinations/:slug", "routes/destination.tsx"),
  route("products", "routes/products.tsx"),
  route("terms", "routes/legal.tsx", { id: "terms" }),
  route("privacy", "routes/legal.tsx", { id: "privacy" }),
  route("refund-policy", "routes/legal.tsx", { id: "refund-policy" }),
  route("contact", "routes/legal.tsx", { id: "contact" }),
  route("cart", "routes/cart.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("checkout", "routes/checkout.tsx"),
  route("payment-result", "routes/payment-result.tsx"),
  route("account", "routes/account.tsx", [
    index("routes/account.index.tsx"),
    route("orders", "routes/account.orders.tsx"),
    route("orders/:id", "routes/account.orders.$id.tsx"),
    route("bookings", "routes/account.bookings.tsx"),
    route("profile", "routes/account.profile.tsx"),
  ]),
] satisfies RouteConfig;
