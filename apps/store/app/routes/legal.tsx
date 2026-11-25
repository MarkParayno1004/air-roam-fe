import { useLocation } from "react-router";
import { buildMeta } from "../seo/meta";

/** Placeholder legal/contact copy — replace with the reviewed text before PayMongo merchant approval. */
const PAGES: Record<string, { title: string; body: string[] }> = {
  "/terms": {
    title: "Terms of service",
    body: [
      "Air Roam sells roaming data plans (eSIM, SIM) and Pocket WiFi rentals to travelers. Prices are in Philippine pesos (PHP) and payments are processed by PayMongo (GCash, Maya, QR Ph or card).",
      "Pocket WiFi rental dates are final once ordered; contact support to change them. eSIM and SIM plan days start when the plan is activated. Pocket WiFi orders of 7 days or fewer in total have a ₱200 delivery fee.",
    ],
  },
  "/privacy": {
    title: "Privacy policy",
    body: [
      "We collect your name, email, contact number and address to create your account and fulfil your orders. Card and wallet details are entered on PayMongo's page and never stored by Air Roam.",
    ],
  },
  "/refund-policy": {
    title: "Refund policy",
    body: ["Unpaid orders can be cancelled at any time. For paid orders, contact support; refunds are handled case by case before the plan or rental starts."],
  },
  "/contact": {
    title: "Contact us",
    body: ["Need help with an order or want to change Pocket WiFi rental dates? Email support@airroam.ph with your order number."],
  },
};

const withoutSlash = (pathname: string) => pathname.replace(/\/$/, ""); // some static hosts add it
const pageAt = (pathname: string) => PAGES[withoutSlash(pathname)] ?? PAGES["/contact"];

export const meta = ({ location }: { location: { pathname: string } }) => {
  const page = pageAt(location.pathname);
  return buildMeta({ title: `${page.title} · Air Roam`, description: page.body[0].slice(0, 155), path: withoutSlash(location.pathname) });
};

export default function Legal() {
  const page = pageAt(useLocation().pathname);
  return (
    <article className="mx-auto max-w-3xl px-5 py-12 md:px-10">
      <h1 className="text-3xl font-bold">{page.title}</h1>
      {page.body.map((p) => (
        <p key={p} className="mt-4 leading-7 text-muted">{p}</p>
      ))}
    </article>
  );
}
