/**
 * Client loaders try the live API first (fresh prices on navigation) and fall back to the
 * pre-rendered build data if the API can't be reached — a pre-rendered page should never break.
 */
export async function liveOrPrerendered<T>(live: () => Promise<T>, prerendered: () => Promise<T>): Promise<T> {
  try {
    return await live();
  } catch (e) {
    if (e instanceof Response && e.status === 404) throw e;
    return prerendered();
  }
}
