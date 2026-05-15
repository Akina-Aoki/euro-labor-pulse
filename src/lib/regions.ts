// Shared European region groupings used across all dashboards.
// Some countries appear in multiple groups intentionally — this is an
// exploratory comparison filter, not a strict political classification.

export const ALL_COUNTRIES_LABEL = "All countries";

export const EUROPEAN_REGIONS = {
  [ALL_COUNTRIES_LABEL]: [] as string[],
  "Northern Europe": [
    "Denmark", "Estonia", "Finland", "Iceland", "Ireland",
    "Latvia", "Lithuania", "Norway", "Sweden", "United Kingdom",
  ],
  "Southern Europe": [
    "Albania", "Andorra", "Bosnia and Herzegovina", "Croatia", "Cyprus",
    "Greece", "Italy", "Malta", "Montenegro", "North Macedonia",
    "Portugal", "Serbia", "Slovenia", "Spain", "Türkiye",
  ],
  "Eastern Europe": [
    "Belarus", "Bulgaria", "Czechia", "Hungary", "Moldova",
    "Poland", "Romania", "Russia", "Slovakia", "Ukraine",
  ],
  "Western Europe": [
    "Austria", "Belgium", "France", "Germany", "Liechtenstein",
    "Luxembourg", "Monaco", "Netherlands", "Switzerland",
  ],
  "Central Europe": [
    "Austria", "Czechia", "Germany", "Hungary", "Liechtenstein",
    "Poland", "Slovakia", "Slovenia", "Switzerland",
  ],
  "Baltics": ["Estonia", "Latvia", "Lithuania"],
  "Balkans": [
    "Albania", "Bosnia and Herzegovina", "Bulgaria", "Croatia", "Greece",
    "Montenegro", "North Macedonia", "Romania", "Serbia", "Slovenia",
  ],
  "British Isles": ["Ireland", "United Kingdom"],
  "Nordics": ["Denmark", "Finland", "Iceland", "Norway", "Sweden"],
} as const;

export type RegionName = keyof typeof EUROPEAN_REGIONS;

export const REGION_OPTIONS: RegionName[] = Object.keys(EUROPEAN_REGIONS) as RegionName[];

// Common alias map → canonical name used in this app's CSVs.
const ALIASES: Record<string, string> = {
  "turkey": "Türkiye",
  "türkiye": "Türkiye",
  "czech republic": "Czechia",
  "czechia": "Czechia",
  "uk": "United Kingdom",
  "u.k.": "United Kingdom",
  "united kingdom": "United Kingdom",
  "great britain": "United Kingdom",
  "bosnia & herzegovina": "Bosnia and Herzegovina",
  "bosnia and herzegovina": "Bosnia and Herzegovina",
  "macedonia": "North Macedonia",
  "north macedonia": "North Macedonia",
};

export function normalizeCountry(name: string): string {
  const k = name.trim().toLowerCase();
  return ALIASES[k] ?? name.trim();
}

/** Build a Set of allowed country names for a region (already normalized). */
export function regionCountrySet(region: RegionName): Set<string> {
  return new Set(EUROPEAN_REGIONS[region].map(normalizeCountry));
}

/** True if the region is "All countries" (no filtering). */
export function isAllCountries(region: RegionName): boolean {
  return region === ALL_COUNTRIES_LABEL;
}

/** Filter rows by region. If region is "All countries", returns rows unchanged. */
export function filterRowsByRegion<T extends { country: string }>(
  rows: T[],
  region: RegionName,
): T[] {
  if (isAllCountries(region)) return rows;
  const allowed = regionCountrySet(region);
  return rows.filter((r) => allowed.has(normalizeCountry(r.country)));
}
