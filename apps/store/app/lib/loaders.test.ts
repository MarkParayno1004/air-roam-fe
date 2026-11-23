import { liveOrPrerendered } from "./loaders";

test("network failure falls back to the pre-rendered data", async () => {
  const fallback = vi.fn().mockResolvedValue("static");
  await expect(liveOrPrerendered(() => Promise.reject(new TypeError("Failed to fetch")), fallback)).resolves.toBe("static");
  expect(fallback).toHaveBeenCalled();
});

test("live data wins when the API answers", async () => {
  const fallback = vi.fn();
  await expect(liveOrPrerendered(() => Promise.resolve("live"), fallback)).resolves.toBe("live");
  expect(fallback).not.toHaveBeenCalled();
});

test("a real 404 is not masked", async () => {
  const notFound = new Response("nope", { status: 404 });
  await expect(liveOrPrerendered(() => Promise.reject(notFound), vi.fn())).rejects.toBe(notFound);
});
