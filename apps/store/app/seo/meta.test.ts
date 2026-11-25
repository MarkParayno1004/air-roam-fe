import { buildMeta } from "./meta";

test("meta has title, canonical and Open Graph", () => {
  const meta = buildMeta({ title: "T", description: "D", path: "/products" });
  expect(meta).toContainEqual({ title: "T" });
  expect(meta).toContainEqual({ property: "og:title", content: "T" });
  expect(meta).toContainEqual({ tagName: "link", rel: "canonical", href: "http://localhost:5173/products" });
});
