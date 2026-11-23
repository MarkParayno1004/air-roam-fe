import { STATIC_PATHS, prerenderPaths } from "./prerender";

const ok = (data: unknown) => vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(data) });
const down = () => vi.fn().mockRejectedValue(new TypeError("fetch failed"));

test("adds a page per destination", async () => {
  const paths = await prerenderPaths({ env: {}, fetchImpl: ok([{ slug: "japan" }]) });
  expect(paths).toEqual([...STATIC_PATHS, "/destinations/japan"]);
});

test("local builds fall back to static pages when the API is down", async () => {
  await expect(prerenderPaths({ env: {}, fetchImpl: down() })).resolves.toEqual(STATIC_PATHS);
});

test("CI builds fail loudly when the API is unreachable", async () => {
  const env = { CI: "true", VITE_API_URL: "https://api.airroam.ph/api/v1", VITE_SITE_ORIGIN: "https://airroam.ph" };
  await expect(prerenderPaths({ env, fetchImpl: down() })).rejects.toThrow(/could not load destinations/);
});

test("CI builds require the production URLs", async () => {
  await expect(prerenderPaths({ env: { CI: "true" }, fetchImpl: ok([]) })).rejects.toThrow(/VITE_API_URL.*VITE_SITE_ORIGIN/);
});
