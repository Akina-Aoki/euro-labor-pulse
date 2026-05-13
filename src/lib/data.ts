import Papa from "papaparse";

export type Sex = "Females" | "Males" | "Total" | "Male" | "Female";

export interface Row {
  country: string;
  year: number;
  sex?: Sex | string;
  value: number;
  [key: string]: unknown;
}

export const DATASETS = {
  employment_rate: "/data/clean_employment_rate.csv",
  gender_pay_gap: "/data/clean_gender_pay_gap.csv",
  in_work_poverty: "/data/clean_in_work_poverty.csv",
  job_tenure: "/data/clean_job_tenure.csv",
  mean_weekly_hours: "/data/clean_mean_weekly_hours.csv",
} as const;

export type DatasetKey = keyof typeof DATASETS;

export async function loadDataset(key: DatasetKey): Promise<Row[]> {
  const res = await fetch(DATASETS[key]);
  const text = await res.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  return parsed.data
    .map((r) => ({
      ...r,
      country: r.country,
      year: Number(r.year),
      sex: r.sex,
      value: Number(r.value),
    }))
    .filter((r) => r.country && Number.isFinite(r.year) && Number.isFinite(r.value));
}

export const filterByYear = (rows: Row[], year: number) => rows.filter((r) => r.year === year);
export const filterByCountry = (rows: Row[], country: string) =>
  rows.filter((r) => r.country === country);
export const filterBySex = (rows: Row[], sex: string) => rows.filter((r) => r.sex === sex);

export const uniqueCountries = (rows: Row[]) =>
  Array.from(new Set(rows.map((r) => r.country))).sort();
export const uniqueYears = (rows: Row[]) =>
  Array.from(new Set(rows.map((r) => r.year))).sort((a, b) => a - b);
export const uniqueSex = (rows: Row[]) =>
  Array.from(new Set(rows.map((r) => r.sex).filter(Boolean))) as string[];

export const safeAvg = (rows: Row[]) => {
  const vals = rows.map((r) => r.value).filter(Number.isFinite);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
};
export const safeMax = (rows: Row[]) =>
  rows.length ? rows.reduce((a, b) => (a.value > b.value ? a : b)) : null;
export const safeMin = (rows: Row[]) =>
  rows.length ? rows.reduce((a, b) => (a.value < b.value ? a : b)) : null;
export const countryCount = (rows: Row[]) => new Set(rows.map((r) => r.country)).size;

export const fmtPct = (v: number | null | undefined, digits = 1) =>
  v == null || !Number.isFinite(v) ? "—" : `${v.toFixed(digits)}%`;
export const fmtNum = (v: number | null | undefined, digits = 1) =>
  v == null || !Number.isFinite(v) ? "—" : v.toFixed(digits);
