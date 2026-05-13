import Papa from "papaparse";

export interface MwhRow {
  country: string;
  year: number;
  sex: "Male" | "Female";
  weekly_hours: number;
  source_label?: string;
  quality_obs_status_label?: string;
  quality_note_indicator_label?: string;
  quality_note_source_label?: string;
}

const CSV_PATH = "/data/clean_mean_weekly_hours.csv";

export async function loadWeeklyHours(): Promise<MwhRow[]> {
  const res = await fetch(CSV_PATH);
  const text = await res.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  return parsed.data
    .map((r) => ({
      country: (r.country ?? "").trim(),
      year: Number(r.year),
      sex: (r.sex ?? "").trim() as "Male" | "Female",
      weekly_hours: Number(r.value),
      source_label: r.source_label || undefined,
      quality_obs_status_label: r.quality_obs_status_label || undefined,
      quality_note_indicator_label: r.quality_note_indicator_label || undefined,
      quality_note_source_label: r.quality_note_source_label || undefined,
    }))
    .filter(
      (r) =>
        r.country &&
        Number.isFinite(r.year) &&
        Number.isFinite(r.weekly_hours) &&
        (r.sex === "Male" || r.sex === "Female"),
    );
}

export const EUROPEAN_COUNTRIES = new Set<string>([
  "Albania", "Andorra", "Armenia", "Austria", "Azerbaijan", "Belarus", "Belgium",
  "Bosnia and Herzegovina", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark",
  "Estonia", "Finland", "France", "Georgia", "Germany", "Greece", "Hungary",
  "Iceland", "Ireland", "Italy", "Kosovo", "Latvia", "Liechtenstein", "Lithuania",
  "Luxembourg", "Malta", "Moldova", "Republic of Moldova", "Monaco", "Montenegro",
  "Netherlands", "North Macedonia", "Norway", "Poland", "Portugal", "Romania",
  "Russian Federation", "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain",
  "Sweden", "Switzerland", "Türkiye", "Turkey", "Ukraine", "United Kingdom",
]);

export const isEuropean = (country: string) => EUROPEAN_COUNTRIES.has(country);

export type SexFilter = "all" | "Male" | "Female";

export const sexLabel = (s: SexFilter) =>
  s === "all" ? "All sexes" : s === "Male" ? "Male" : "Female";

/**
 * Aggregate rows to one value per country-year-sex (averaging across sources),
 * then optionally collapse sex by averaging Male+Female when sexFilter === 'all'.
 * Returns array of { country, year, value } where value depends on sex filter.
 */
export interface CountryYearValue {
  country: string;
  year: number;
  value: number;
}

export function aggregate(
  rows: MwhRow[],
  sexFilter: SexFilter,
): CountryYearValue[] {
  // Step 1: average across sources -> country/year/sex
  const sumByKey = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const k = `${r.country}|${r.year}|${r.sex}`;
    const cur = sumByKey.get(k) ?? { sum: 0, n: 0 };
    cur.sum += r.weekly_hours;
    cur.n += 1;
    sumByKey.set(k, cur);
  }
  const cys: { country: string; year: number; sex: "Male" | "Female"; value: number }[] = [];
  for (const [k, v] of sumByKey) {
    const [country, yearStr, sex] = k.split("|");
    cys.push({ country, year: Number(yearStr), sex: sex as "Male" | "Female", value: v.sum / v.n });
  }

  if (sexFilter !== "all") {
    return cys.filter((r) => r.sex === sexFilter).map((r) => ({ country: r.country, year: r.year, value: r.value }));
  }

  // sexFilter = all: average Male and Female per country-year
  const cyMap = new Map<string, { sum: number; n: number }>();
  for (const r of cys) {
    const k = `${r.country}|${r.year}`;
    const cur = cyMap.get(k) ?? { sum: 0, n: 0 };
    cur.sum += r.value;
    cur.n += 1;
    cyMap.set(k, cur);
  }
  const out: CountryYearValue[] = [];
  for (const [k, v] of cyMap) {
    const [country, yearStr] = k.split("|");
    out.push({ country, year: Number(yearStr), value: v.sum / v.n });
  }
  return out;
}

/** Country-year aggregated by sex separately, useful for sex gap and grouped chart */
export interface BySexRow {
  country: string;
  year: number;
  female?: number;
  male?: number;
}

export function aggregateBySex(rows: MwhRow[]): BySexRow[] {
  const sumByKey = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const k = `${r.country}|${r.year}|${r.sex}`;
    const cur = sumByKey.get(k) ?? { sum: 0, n: 0 };
    cur.sum += r.weekly_hours;
    cur.n += 1;
    sumByKey.set(k, cur);
  }
  const cy = new Map<string, BySexRow>();
  for (const [k, v] of sumByKey) {
    const [country, yearStr, sex] = k.split("|");
    const ck = `${country}|${yearStr}`;
    const row: BySexRow = cy.get(ck) ?? { country, year: Number(yearStr) };
    if (sex === "Male") row.male = v.sum / v.n;
    else row.female = v.sum / v.n;
    cy.set(ck, row);
  }
  return Array.from(cy.values());
}

export const fmtHours = (v: number | null | undefined, d = 1) =>
  v == null || !Number.isFinite(v) ? "—" : v.toFixed(d);

export const DEFAULT_TREND_COUNTRIES = ["Sweden", "Germany", "France", "Spain", "Poland"];
