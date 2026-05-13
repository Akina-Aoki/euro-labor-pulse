import Papa from "papaparse";

export interface EmpRow {
  country: string;
  year: number;
  sex: "Male" | "Female";
  value: number;
  quality_obs_flag?: string;
}

const CSV_PATH = "/data/clean_employment_rate.csv";

export async function loadEmploymentRate(): Promise<EmpRow[]> {
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
        value: Number(r.value),
        quality_obs_flag: r.quality_obs_flag || undefined,
      };
    })
    .filter(
      (r) =>
        r.country &&
        Number.isFinite(r.year) &&
        Number.isFinite(r.value),
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
  s === "all" ? "All sexes" : s === "Male" ? "Male" : "Female";

export interface CountryYearValue {
  country: string;
  year: number;
  value: number;
}

export function aggregate(rows: EmpRow[], sexFilter: SexFilter): CountryYearValue[] {
  if (sexFilter !== "all") {
    return rows
      .filter((r) => r.sex === sexFilter)
      .map((r) => ({ country: r.country, year: r.year, value: r.value }));
  }
  const cyMap = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
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

export interface BySexRow {
  country: string;
  year: number;
  female?: number;
  male?: number;
}

export function aggregateBySex(rows: EmpRow[]): BySexRow[] {
  const cy = new Map<string, BySexRow>();
  for (const r of rows) {
    const ck = `${r.country}|${r.year}`;
    const row: BySexRow = cy.get(ck) ?? { country: r.country, year: r.year };
    if (r.sex === "Male") row.male = r.value;
    else row.female = r.value;
    cy.set(ck, row);
  }
  return Array.from(cy.values());
}

export const fmtPct = (v: number | null | undefined, d = 1) =>
  v == null || !Number.isFinite(v) ? "—" : v.toFixed(d);

export const DEFAULT_TREND_COUNTRIES = ["Sweden", "Germany", "Netherlands", "Italy", "Türkiye"];
