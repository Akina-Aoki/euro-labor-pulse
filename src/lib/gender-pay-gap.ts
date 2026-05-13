import Papa from "papaparse";

export interface GpgRow {
  country: string;
  year: number;
  gender_pay_gap: number;
  quality_obs_flag?: string;
  last_update?: string;
}

const CSV_PATH = "/data/clean_gender_pay_gap.csv";

export async function loadGenderPayGap(): Promise<GpgRow[]> {
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
      gender_pay_gap: Number(r.value),
      quality_obs_flag: r.quality_obs_flag || undefined,
      last_update: r.last_update || undefined,
    }))
    .filter(
      (r) => r.country && Number.isFinite(r.year) && Number.isFinite(r.gender_pay_gap),
    );
}

export const PAY_GAP_LEVEL_ORDER = [
  "Very low gap",
  "Low gap",
  "Medium gap",
  "High gap",
  "Very high gap",
] as const;

export type PayGapLevel = (typeof PAY_GAP_LEVEL_ORDER)[number] | "No data";

export const PAY_GAP_LEVEL_COLORS: Record<PayGapLevel, string> = {
  "Very low gap": "#3FA796",
  "Low gap": "#7BC0A4",
  "Medium gap": "#C9A84C",
  "High gap": "#893172",
  "Very high gap": "#5F3475",
  "No data": "#CCCACC",
};

export function classifyPayGapLevel(v: number | null | undefined): PayGapLevel {
  if (v == null || !Number.isFinite(v)) return "No data";
  if (v >= 20) return "Very high gap";
  if (v >= 15) return "High gap";
  if (v >= 10) return "Medium gap";
  if (v >= 5) return "Low gap";
  return "Very low gap";
}

export const uniqueYears = (rows: GpgRow[]) =>
  Array.from(new Set(rows.map((r) => r.year))).sort((a, b) => a - b);

export const uniqueCountries = (rows: GpgRow[]) =>
  Array.from(new Set(rows.map((r) => r.country))).sort();

export const filterByYear = (rows: GpgRow[], year: number) =>
  rows.filter((r) => r.year === year);

export const avgGap = (rows: GpgRow[]) => {
  if (!rows.length) return null;
  return rows.reduce((s, r) => s + r.gender_pay_gap, 0) / rows.length;
};

export const maxRow = (rows: GpgRow[]) =>
  rows.length ? rows.reduce((a, b) => (a.gender_pay_gap > b.gender_pay_gap ? a : b)) : null;

export const minRow = (rows: GpgRow[]) =>
  rows.length ? rows.reduce((a, b) => (a.gender_pay_gap < b.gender_pay_gap ? a : b)) : null;

/**
 * For each country, compute change = value(selectedYear) - value(firstAvailableYear).
 * Excludes countries missing either endpoint.
 */
export function calcChangeSinceFirstYear(rows: GpgRow[], selectedYear: number) {
  const byCountry = new Map<string, GpgRow[]>();
  for (const r of rows) {
    if (!byCountry.has(r.country)) byCountry.set(r.country, []);
    byCountry.get(r.country)!.push(r);
  }
  const out: { country: string; change: number; firstYear: number; latest: number }[] = [];
  for (const [country, list] of byCountry) {
    const sorted = [...list].sort((a, b) => a.year - b.year);
    const first = sorted[0];
    const sel = sorted.find((r) => r.year === selectedYear);
    if (!first || !sel || first.year === selectedYear) continue;
    out.push({
      country,
      change: +(sel.gender_pay_gap - first.gender_pay_gap).toFixed(2),
      firstYear: first.year,
      latest: sel.gender_pay_gap,
    });
  }
  return out.sort((a, b) => a.change - b.change);
}

export const fmtPct = (v: number | null | undefined, d = 1) =>
  v == null || !Number.isFinite(v) ? "—" : `${v.toFixed(d)}%`;

export const fmtPp = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)} pp`;

export const DEFAULT_TREND_COUNTRIES = ["Sweden", "Germany", "Estonia", "Luxembourg", "Spain"];
