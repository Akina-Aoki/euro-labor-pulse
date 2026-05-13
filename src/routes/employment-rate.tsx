import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Globe,
  Info,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  UsersRound,
  Users,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SourceNote } from "@/components/dashboard/SourceNote";
import { EuropeTileMap } from "@/components/dashboard/EuropeTileMap";
import { TrendCountryPicker } from "@/components/dashboard/TrendCountryPicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  loadEmploymentRate,
  isEuropean,
  aggregate,
  aggregateBySex,
  sexLabel,
  fmtPct,
  DEFAULT_TREND_COUNTRIES,
  type EmpRow,
  type SexFilter,
} from "@/lib/employment-rate";

export const Route = createFileRoute("/employment-rate")({
  head: () => ({
    meta: [
      { title: "Employment Rate by Sex — ELMS" },
      {
        name: "description",
        content:
          "Explore how employment participation across European countries differs by sex and over time.",
      },
    ],
  }),
  component: EmploymentRatePage,
});

const TREND_COLORS = ["#5F3475", "#213885", "#C9347B", "#E58A2B", "#3FA796", "#1E6091", "#A14D8E"];
type SortDir = "desc" | "asc";
type TopN = 10 | 15 | 20 | 0;
type Coverage = "europe" | "all";

function EmploymentRatePage() {
  const [rows, setRows] = useState<EmpRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEmploymentRate().then(setRows).catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <DashboardLayout>
        <PageHeader title="Employment Rate by Sex" description="Failed to load dataset." />
        <EmptyState title="Error" message={error} />
      </DashboardLayout>
    );
  }
  if (!rows) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Employment Rate by Sex"
          description="Loading data…"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-card/60 animate-pulse" />
          ))}
        </div>
      </DashboardLayout>
    );
  }
  return <Dashboard rows={rows} />;
}

function Dashboard({ rows }: { rows: EmpRow[] }) {
  const [coverage, setCoverage] = useState<Coverage>("europe");

  const baseRows = useMemo(() => {
    return coverage === "europe" ? rows.filter((x) => isEuropean(x.country)) : rows;
  }, [rows, coverage]);

  const allYears = useMemo(
    () => Array.from(new Set(baseRows.map((r) => r.year))).sort((a, b) => a - b),
    [baseRows],
  );
  const allCountries = useMemo(
    () => Array.from(new Set(baseRows.map((r) => r.country))).sort(),
    [baseRows],
  );
  const latestYear = allYears[allYears.length - 1] ?? 2025;

  const defaultTrend = useMemo(() => {
    const present = DEFAULT_TREND_COUNTRIES.filter((c) => allCountries.includes(c));
    return present.length ? present : allCountries.slice(0, 5);
  }, [allCountries]);

  const [year, setYear] = useState<number>(latestYear);
  const [sex, setSex] = useState<SexFilter>("all");
  const [trendCountries, setTrendCountries] = useState<string[]>(defaultTrend);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [topN, setTopN] = useState<TopN>(15);

  useEffect(() => {
    setTrendCountries((cur) => {
      const valid = cur.filter((c) => allCountries.includes(c));
      return valid.length ? valid : defaultTrend;
    });
    if (!allYears.includes(year)) setYear(latestYear);
  }, [coverage]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetFilters = () => {
    setCoverage("europe");
    setYear(latestYear);
    setSex("all");
    setTrendCountries(defaultTrend);
    setSortDir("desc");
    setTopN(15);
  };

  const sLabel = sexLabel(sex);

  const aggAll = useMemo(() => aggregate(baseRows, sex), [baseRows, sex]);
  const yearAgg = useMemo(() => aggAll.filter((r) => r.year === year), [aggAll, year]);

  const kpiAvg = yearAgg.length ? yearAgg.reduce((s, r) => s + r.value, 0) / yearAgg.length : null;
  const kpiMax = yearAgg.length ? yearAgg.reduce((a, b) => (a.value > b.value ? a : b)) : null;
  const kpiMin = yearAgg.length ? yearAgg.reduce((a, b) => (a.value < b.value ? a : b)) : null;
  const kpiCount = yearAgg.length;

  const bySexAll = useMemo(() => aggregateBySex(baseRows), [baseRows]);
  const bySexYear = useMemo(
    () =>
      bySexAll
        .filter((r) => r.year === year && r.male != null && r.female != null)
        .map((r) => ({
          country: r.country,
          female: r.female!,
          male: r.male!,
          gap: r.male! - r.female!,
        })),
    [bySexAll, year],
  );
  const kpiSexGap = bySexYear.length
    ? bySexYear.reduce((s, r) => s + r.gap, 0) / bySexYear.length
    : null;

  const ranking = useMemo(() => {
    const sorted = [...yearAgg].sort((a, b) =>
      sortDir === "desc" ? b.value - a.value : a.value - b.value,
    );
    return topN === 0 ? sorted : sorted.slice(0, topN);
  }, [yearAgg, sortDir, topN]);

  const trendData = useMemo(() => {
    return allYears.map((y) => {
      const point: Record<string, number | string> = { year: y };
      for (const c of trendCountries) {
        const found = aggAll.find((r) => r.country === c && r.year === y);
        if (found) point[c] = +found.value.toFixed(2);
      }
      return point;
    });
  }, [aggAll, allYears, trendCountries]);

  const compareCountries = useMemo(() => ranking.map((r) => r.country), [ranking]);
  const groupedData = useMemo(
    () =>
      compareCountries
        .map((c) => bySexYear.find((r) => r.country === c))
        .filter((x): x is { country: string; female: number; male: number; gap: number } => !!x)
        .map((r) => ({
          country: r.country,
          Female: +r.female.toFixed(2),
          Male: +r.male.toFixed(2),
        })),
    [compareCountries, bySexYear],
  );
  const sexGapData = useMemo(
    () =>
      compareCountries
        .map((c) => bySexYear.find((r) => r.country === c))
        .filter((x): x is { country: string; female: number; male: number; gap: number } => !!x)
        .map((r) => ({ country: r.country, gap: +r.gap.toFixed(2) }))
        .sort((a, b) => b.gap - a.gap),
    [compareCountries, bySexYear],
  );

  const changeData = useMemo(() => {
    const byCountry = new Map<string, { country: string; year: number; value: number }[]>();
    for (const r of aggAll) {
      if (!byCountry.has(r.country)) byCountry.set(r.country, []);
      byCountry.get(r.country)!.push(r);
    }
    const out: { country: string; change: number }[] = [];
    for (const [c, list] of byCountry) {
      const sorted = [...list].sort((a, b) => a.year - b.year);
      if (sorted.length < 2) continue;
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      out.push({ country: c, change: +(last.value - first.value).toFixed(2) });
    }
    out.sort((a, b) => a.change - b.change);
    const decreases = out.slice(0, 8);
    const increases = out.slice(-8).filter((x) => x.change > 0);
    return [...decreases, ...increases].sort((a, b) => a.change - b.change);
  }, [aggAll]);

  return (
    <DashboardLayout>
      <PageHeader
        title="Employment Rate by Sex"
        description="Explore how employment participation across European countries differs by sex."
      />

      {/* Info box */}
      <div className="rounded-xl border border-border bg-[var(--elms-canvas)]/70 p-4 md:p-5 flex gap-3 mb-6">
        <div className="size-9 shrink-0 rounded-lg grid place-items-center bg-[var(--elms-plum)] text-white">
          <Info className="size-4" />
        </div>
        <div className="text-sm leading-relaxed text-foreground/85 space-y-1">
          <p>
            The <strong>employment rate</strong> shows the percentage of people aged 20 to 64 who are{" "}
            <strong>employed</strong>.
          </p>
          <p>
            This dataset separates results by sex, making it possible to compare employment
            participation between women and men across countries and over time.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Filters
        years={allYears}
        year={year}
        setYear={setYear}
        sex={sex}
        setSex={setSex}
        sortDir={sortDir}
        setSortDir={setSortDir}
        topN={topN}
        setTopN={setTopN}
        coverage={coverage}
        setCoverage={setCoverage}
        onReset={resetFilters}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <KpiDark
          label={`Average Employment Rate (${year})`}
          value={fmtPct(kpiAvg)}
          unit="%"
          hint={`Across ${kpiCount} countries · ${sLabel}`}
          icon={Users}
        />
        <KpiDark
          label={`Highest Employment Rate (${year})`}
          value={fmtPct(kpiMax?.value)}
          unit="%"
          hint={kpiMax?.country ?? "—"}
          icon={TrendingUp}
        />
        <KpiDark
          label={`Lowest Employment Rate (${year})`}
          value={fmtPct(kpiMin?.value)}
          unit="%"
          hint={kpiMin?.country ?? "—"}
          icon={TrendingDown}
        />
        <KpiDark
          label={`Average Gender Employment Gap (${year})`}
          value={fmtPct(kpiSexGap)}
          unit="pp"
          hint="Male − Female"
          icon={UsersRound}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <ChartCard
          title={`Employment Rate in Europe (${year}, ${sLabel})`}
          description="Choropleth tile-grid map. Hover a country for its employment rate."
        >
          {yearAgg.length === 0 ? (
            <EmptyState message="No employment data is available for the selected filters." />
          ) : (
            <EuropeTileMap
              height={360}
              data={yearAgg.map((r) => ({ country: r.country, value: r.value }))}
              colorFor={empRateColor}
              tooltipLines={({ country, value }) =>
                value == null
                  ? [country, "No data"]
                  : [country, `Employment rate: ${value.toFixed(1)}%`]
              }
              legend={EMP_LEGEND}
            />
          )}
        </ChartCard>

        <ChartCard
          title={`Employment Rate Over Time (${allYears[0] ?? ""}–${allYears[allYears.length - 1] ?? ""}, ${sLabel})`}
          description="Percentage of people aged 20 to 64 who are employed"
        >
          <TrendCountryPicker
            countries={allCountries}
            selected={trendCountries}
            onChange={setTrendCountries}
            helperText="Choose countries to compare in the trend chart. This selection only affects the line chart."
          />
          {trendCountries.length === 0 ? (
            <EmptyState message="No trend data is available for the selected countries." />
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="rgba(33,56,133,0.1)" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#4a4b6b" }} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#4a4b6b" }}
                  label={{ value: "Employment Rate (%)", angle: -90, position: "insideLeft", fontSize: 11, fill: "#4a4b6b" }}
                />
                <Tooltip
                  formatter={(v: number) => `${v.toFixed(1)}%`}
                  contentStyle={{ borderRadius: 8, border: "1px solid rgba(33,56,133,0.18)" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {trendCountries.map((c, i) => (
                  <Line
                    key={c}
                    type="monotone"
                    dataKey={c}
                    stroke={TREND_COLORS[i % TREND_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <ChartCard
          title={`Female vs Male Employment Rate (${year})`}
          description="Side-by-side comparison for the top countries in the ranking."
        >
          {groupedData.length === 0 ? (
            <EmptyState message="No sex comparison is available because both Female and Male values are required." />
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={groupedData} margin={{ top: 8, right: 12, left: 0, bottom: 64 }}>
                <CartesianGrid vertical={false} stroke="rgba(33,56,133,0.1)" />
                <XAxis
                  dataKey="country"
                  interval={0}
                  angle={-40}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 10, fill: "#070836" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#4a4b6b" }}
                  domain={[0, 100]}
                  label={{ value: "Employment Rate (%)", angle: -90, position: "insideLeft", fontSize: 11, fill: "#4a4b6b" }}
                />
                <Tooltip
                  formatter={(v: number) => `${v.toFixed(1)}%`}
                  contentStyle={{ borderRadius: 8, border: "1px solid rgba(33,56,133,0.18)" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Female" fill="#893172" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Male" fill="#213885" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title={`Gender Employment Gap by Country (${year}, Male − Female)`}
          description="Percentage point (pp) gap. Positive values indicate higher male employment rates."
        >
          {sexGapData.length === 0 ? (
            <EmptyState message="No sex comparison is available because both Female and Male values are required." />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(280, sexGapData.length * 26)}>
              <BarChart data={sexGapData} layout="vertical" margin={{ top: 8, right: 40, left: 8, bottom: 24 }}>
                <CartesianGrid horizontal={false} stroke="rgba(33,56,133,0.1)" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#4a4b6b" }}
                  label={{ value: "Male minus Female (percentage points)", position: "insideBottom", offset: -2, fontSize: 11, fill: "#4a4b6b" }}
                />
                <YAxis type="category" dataKey="country" width={140} tick={{ fontSize: 11, fill: "#070836" }} />
                <Tooltip
                  formatter={(v: number) => [`${v > 0 ? "+" : ""}${v.toFixed(1)} pp`, "Male − Female"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid rgba(33,56,133,0.18)" }}
                />
                <Bar dataKey="gap" radius={[0, 4, 4, 0]}>
                  {sexGapData.map((d, i) => (
                    <Cell key={i} fill={d.gap >= 0 ? "#5F3475" : "#3FA796"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Chart row 3: change over time */}
      <div className="grid grid-cols-1 gap-5 mt-6">
        <ChartCard
          title={`Change in Employment Rate Since First Available Year (${sLabel})`}
          description="Negative = employment rate decreased. Positive = employment rate increased (percentage points)."
        >
          {changeData.length === 0 ? (
            <EmptyState message="No change calculation is available because earliest or latest values are missing." />
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={changeData} margin={{ top: 8, right: 12, left: 0, bottom: 64 }}>
                <CartesianGrid vertical={false} stroke="rgba(33,56,133,0.1)" />
                <XAxis
                  dataKey="country"
                  interval={0}
                  angle={-40}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 10, fill: "#070836" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#4a4b6b" }}
                  label={{ value: "Change (pp)", angle: -90, position: "insideLeft", fontSize: 11, fill: "#4a4b6b" }}
                />
                <Tooltip
                  formatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(2)} pp`}
                  contentStyle={{ borderRadius: 8, border: "1px solid rgba(33,56,133,0.18)" }}
                />
                <Bar dataKey="change" radius={[4, 4, 0, 0]}>
                  {changeData.map((d, i) => (
                    <Cell key={i} fill={d.change < 0 ? "#893172" : "#3FA796"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Quality + source */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="font-display text-base text-[var(--elms-ink)] mb-2">Data Quality Note</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Some values may include observation flags such as breaks in time series, provisional
            data, or differences in definitions across countries. These values are kept in the
            analysis but should be interpreted with caution, especially when comparing countries
            with different methodologies or coverage.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            Country coverage varies by year. Earlier years (2005–2008) may include fewer countries
            than recent years.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="font-display text-base text-[var(--elms-ink)] mb-2 flex items-center gap-2">
            <Globe className="size-4 text-[var(--elms-plum)]" /> Source
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li><span className="text-foreground/70 font-medium">Source:</span> Eurostat open data</li>
            <li><span className="text-foreground/70 font-medium">Dataset:</span> Employment rate by sex</li>
            <li><span className="text-foreground/70 font-medium">Code:</span> ESTAT:TESEM010</li>
            <li><span className="text-foreground/70 font-medium">Unit:</span> Percentage of total population</li>
            <li><span className="text-foreground/70 font-medium">Age:</span> From 20 to 64 years</li>
            <li><span className="text-foreground/70 font-medium">Frequency:</span> Annual</li>
            <li><span className="text-foreground/70 font-medium">Coverage:</span> {coverage === "europe" ? "Europe only" : "All available countries"}</li>
          </ul>
          <SourceNote>Eurostat — ESTAT:TESEM010</SourceNote>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ---------- Subcomponents ---------- */

function KpiDark({
  label,
  value,
  unit,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl p-5 shadow-sm text-white" style={{ background: "var(--elms-navy-deep)" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/70 font-medium leading-snug">
          {label}
        </div>
        <div className="size-9 rounded-lg grid place-items-center shrink-0" style={{ background: "rgba(95,52,117,0.85)" }}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        {unit && <div className="text-sm text-white/70">{unit}</div>}
      </div>
      {hint && <div className="mt-1 text-xs text-white/70">{hint}</div>}
    </div>
  );
}

function Filters(props: {
  years: number[];
  year: number;
  setYear: (y: number) => void;
  countries: string[];
  trendCountries: string[];
  setTrendCountries: (c: string[]) => void;
  sex: SexFilter;
  setSex: (s: SexFilter) => void;
  sortDir: SortDir;
  setSortDir: (d: SortDir) => void;
  topN: TopN;
  setTopN: (n: TopN) => void;
  coverage: Coverage;
  setCoverage: (c: Coverage) => void;
  onReset: () => void;
}) {
  const {
    years, year, setYear, countries, trendCountries, setTrendCountries,
    sex, setSex, sortDir, setSortDir, topN, setTopN,
    coverage, setCoverage, onReset,
  } = props;

  const toggleCountry = (c: string) => {
    setTrendCountries(
      trendCountries.includes(c) ? trendCountries.filter((x) => x !== c) : [...trendCountries, c],
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 items-end">
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Year</Label>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[...years].reverse().map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="lg:col-span-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Countries (trend chart)
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start font-normal h-9 text-left">
                {trendCountries.length === 0 ? "Select countries…" : `${trendCountries.length} selected`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <div className="max-h-72 overflow-auto p-2">
                {countries.map((c) => (
                  <label key={c} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/10 cursor-pointer text-sm">
                    <Checkbox
                      checked={trendCountries.includes(c)}
                      onCheckedChange={() => toggleCountry(c)}
                    />
                    {c}
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          {trendCountries.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {trendCountries.map((c) => (
                <span key={c} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[var(--elms-plum)]/10 text-[var(--elms-plum)]">
                  {c}
                  <button type="button" onClick={() => toggleCountry(c)} className="hover:opacity-70">
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Sex</Label>
          <Select value={sex} onValueChange={(v) => setSex(v as SexFilter)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sexes</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Sort by</Label>
          <Select value={sortDir} onValueChange={(v) => setSortDir(v as SortDir)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">High to Low</SelectItem>
              <SelectItem value="asc">Low to High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Show Top N</Label>
          <Select value={String(topN)} onValueChange={(v) => setTopN(Number(v) as TopN)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">Top 10</SelectItem>
              <SelectItem value="15">Top 15</SelectItem>
              <SelectItem value="20">Top 20</SelectItem>
              <SelectItem value="0">All Countries</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Coverage</Label>
          <Select value={coverage} onValueChange={(v) => setCoverage(v as Coverage)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="europe">Europe only</SelectItem>
              <SelectItem value="all">All available countries</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end mt-3">
        <Button variant="ghost" size="sm" onClick={onReset} className="text-xs">
          <RotateCcw className="size-3.5" /> Reset filters
        </Button>
      </div>
    </div>
  );
}
