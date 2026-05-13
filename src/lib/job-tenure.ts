import Papa from "papaparse";

export const DURATIONS = [
  "From 0 to 11 months",
  "From 12 to 23 months",
  "From 24 to 59 months",
  "60 months or over",
  "No response",
] as const;
export type Duration = (typeof DURATIONS)[number];

export const SHORT_DUR_LABEL: Record<Duration, string> = {
  "From 0 to 11 months": "0–11 months",
  "From 12 to 23 months": "12–23 months",
  "From 24 to 59 months": "24–59 months",
  "60 months or over": "60+ months",
  "No response": "No response",
};

export interface JtRow {
  country: string;
  year: number;
  sex: "Male" | "Female";
  duration: Duration;
  value: number;
  quality_obs_flag?: string;
}

const CSV_PATH = "/data/clean_job_tenure.csv";

export async function loadJobTenure(): Promise<JtRow[]> {
  const res = await fetch(CSV_PATH);
  const text = await res.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  return parsed.data
    .map((r) => {
      const rawSex = (r.sex ?? "").trim();
      const sex: "Male" | "Female" =
        rawSex === "Males" || rawSex === "Male" ? "Male" : "Female";
      return {
        country: (r.country ?? "").trim(),
        year: Number(r.year),
        sex,
        duration: (r.duration ?? "").trim() as Duration,
        value: Number(r.value),
        quality_obs_flag: r.quality_obs_flag || undefined,
      };
    })
    .filter(
      (r) =>
        r.country &&
        Number.isFinite(r.year) &&
        Number.isFinite(r.value) &&
        (DURATIONS as readonly string[]).includes(r.duration),
    );
}

export const EUROPEAN_COUNTRIES = new Set<string>([
  "Albania", "Andorra", "Armenia", "Austria", "Azerbaijan", "Belarus", "Belgium",
  "Bosnia and Herzegovina", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Czech Republic",
  "Denmark", "Estonia", "Finland", "France", "Georgia", "Germany", "Greece", "Hungary",
  "Iceland", "Ireland", "Italy", "Kosovo", "Latvia", "Liechtenstein", "Lithuania",
  "Luxembourg", "Malta", "Moldova", "Republic of Moldova", "Monaco", "Montenegro",
  "Netherlands", "North Macedonia", "Norway", "Poland", "Portugal", "Romania",
  "Russian Federation", "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain",
  "Sweden", "Switzerland", "Türkiye", "Turkey", "Ukraine", "United Kingdom",
  "European Union", "Euro area",
]);
export const isEuropean = (country: string) => EUROPEAN_COUNTRIES.has(country);

export type SexFilter = "all" | "Male" | "Female";
export const sexLabel = (s: SexFilter) =>
  s === "all" ? "All Sexes" : s === "Male" ? "Male" : "Female";

/**
 * Aggregate to value per (country, year, duration) for selected sex.
 * If sex=all, average Male+Female per (country, year, duration).
 */
export interface CydValue {
  country: string;
  year: number;
  duration: Duration;
  value: number;
}
export function aggregateByDuration(rows: JtRow[], sex: SexFilter): CydValue[] {
  if (sex !== "all") {
    return rows
      .filter((r) => r.sex === sex)
      .map((r) => ({ country: r.country, year: r.year, duration: r.duration, value: r.value }));
  }
  const map = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const k = `${r.country}|${r.year}|${r.duration}`;
    const cur = map.get(k) ?? { sum: 0, n: 0 };
    cur.sum += r.value;
    cur.n += 1;
    map.set(k, cur);
  }
  const out: CydValue[] = [];
  for (const [k, v] of map) {
    const [country, yearStr, duration] = k.split("|");
    out.push({ country, year: Number(yearStr), duration: duration as Duration, value: v.sum / v.n });
  }
  return out;
}

/** Get value for (country, year, duration) from precomputed array */
export function findVal(arr: CydValue[], country: string, year: number, duration: Duration) {
  const f = arr.find((r) => r.country === country && r.year === year && r.duration === duration);
  return f ? f.value : null;
}

export const fmtPct = (v: number | null | undefined, d = 1) =>
  v == null || !Number.isFinite(v) ? "—" : v.toFixed(d);

export const DEFAULT_TREND_COUNTRIES = ["Sweden", "Germany", "Denmark", "Netherlands", "Romania"];
