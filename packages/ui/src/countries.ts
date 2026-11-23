const names = new Intl.DisplayNames(["en"], { type: "region" });

/** "JP" → "Japan" (falls back to the code). */
export function countryName(code: string): string {
  try {
    return names.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

// Region names Intl knows that are not countries (the backend validates against ISO-3166 anyway).
const NOT_COUNTRIES = new Set(["EU", "EZ", "UN", "QO", "XA", "XB", "ZZ", "AC", "CP", "DG", "EA", "IC", "TA", "XK"]);

let cache: Array<{ code: string; name: string }> | null = null;

/** Every ISO-3166 alpha-2 country, sorted by name. */
export function allCountries(): Array<{ code: string; name: string }> {
  if (!cache) {
    const out: Array<{ code: string; name: string }> = [];
    for (let a = 65; a <= 90; a++) {
      for (let b = 65; b <= 90; b++) {
        const code = String.fromCharCode(a, b);
        const name = countryName(code);
        if (name !== code && !NOT_COUNTRIES.has(code)) out.push({ code, name });
      }
    }
    cache = out.sort((x, y) => x.name.localeCompare(y.name));
  }
  return cache;
}
