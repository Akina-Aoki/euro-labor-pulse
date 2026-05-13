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
  Clock,
  Globe,
  Info,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SourceNote } from "@/components/dashboard/SourceNote";
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
  loadWeeklyHours,
  isEuropean,
  aggregate,
  aggregateBySex,
  sexLabel,
  fmtHours,
  DEFAULT_TREND_COUNTRIES,
  type MwhRow,
  type SexFilter,
} from "@/lib/weekly-hours";

export const Route = createFileRoute("/weekly-hours")({
  head: () => ({
    meta: [
      { title: "Mean Weekly Hours Worked per Employee by Sex — ELMS" },
      {
        name: "description",
        content:
          "Explore how average weekly working hours differ across countries, between women and men, and over time.",
      },
    ],
  }),
  component: WeeklyHoursPage,
});

const TREND_COLORS = ["#213885", "#5F3475", "#893172", "#3FA796", "#C9A84C", "#1E6091", "#A14D8E"];
type SortDir = "desc" | "asc";
type TopN = 10 | 15 | 20 | 0;
type Coverage = "europe" | "all";

function WeeklyHoursPage() {
  const [rows, setRows] = useState<MwhRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWeeklyHours().then(setRows).catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <DashboardLayout>
        <PageHeader title="Mean Weekly Hours Worked per Employee by Sex" description="Failed to load dataset." />
        <EmptyState title="Error" message={error} />
      </DashboardLayout>
    );
  }
  if (!rows) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Mean Weekly Hours Worked per Employee by Sex"
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

function Dashboard({ rows }: { rows: MwhRow[] }) {
  // Coverage + Source filters drive the entire dataset slice
  const [coverage, setCoverage] = useState<Coverage>("europe");
  const allSources = useMemo(
    () => Array.from(new Set(rows.map((r) => r.source_label).filter(Boolean) as string[])).sort(),
    [rows],
  );
  const [source, setSource] = useState<string>("all");

  const baseRows = useMemo(() => {
    let r = rows;
    if (coverage === "europe") r = r.filter((x) => isEuropean(x.country));
    if (source !== "all") r = r.filter((x) => x.source_label === source);
    return r;
  }, [rows, coverage, source]);

  const allYears = useMemo(
    () => Array.from(new Set(baseRows.map((r) => r.year))).sort((a, b) => a - b),
    [baseRows],
  );
  const allCountries = useMemo(
    () => Array.from(new Set(baseRows.map((r) => r.country))).sort(),
    [baseRows],
  );
  const latestYear = allYears[allYears.length - 1] ?? 2024;

  const defaultTrend = useMemo(() => {
    const present = DEFAULT_TREND_COUNTRIES.filter((c) => allCountries.includes(c));
    return present.length ? present : allCountries.slice(0, 5);
  }, [allCountries]);

  const [year, setYear] = useState<number>(latestYear);
  const [sex, setSex] = useState<SexFilter>("all");
  const [trendCountries, setTrendCountries] = useState<string[]>(defaultTrend);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [topN, setTopN] = useState<TopN>(15);

  // Refresh defaults when coverage changes (so trend countries are valid)
  useEffect(() => {
    setTrendCountries((cur) => {
      const valid = cur.filter((c) => allCountries.includes(c));
      return valid.length ? valid : defaultTrend;
    });
    if (!allYears.includes(year)) setYear(latestYear);
  }, [coverage, source]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetFilters = () => {
    setCoverage("europe");
    setSource("all");
    setYear(latestYear);
    setSex("all");
    setTrendCountries(defaultTrend);
    setSortDir("desc");
    setTopN(15);
  };

  const sLabel = sexLabel(sex);

  // Aggregate values per (country, year) by current sex filter
  const aggAll = useMemo(() => aggregate(baseRows, sex), [baseRows, sex]);
  const yearAgg = useMemo(() => aggAll.filter((r) => r.year === year), [aggAll, year]);

  // KPIs
  const kpiAvg = yearAgg.length ? yearAgg.reduce((s, r) => s + r.value, 0) / yearAgg.length : null;
  const kpiMax = yearAgg.length ? yearAgg.reduce((a, b) => (a.value > b.value ? a : b)) : null;
  const kpiMin = yearAgg.length ? yearAgg.reduce((a, b) => (a.value < b.value ? a : b)) : null;
  const kpiCount = yearAgg.length;

  // Sex gap — always Male - Female regardless of sex filter
  const bySexAll = useMemo(() => aggregateBySex(baseRows), [baseRows]);
  const bySexYear = useMemo(
    () =>
      bySexAll
        .filter((r) => r.year === year && r.male != null && r.female != null)
        .map((r) => ({ country: r.country, female: r.female!, male: r.male!, gap: r.male! - r.female! })),
    [bySexAll, year],
  );
  const kpiSexGap = bySexYear.length
    ? bySexYear.reduce((s, r) => s + r.gap, 0) / bySexYear.length
    : null;

  // Chart 1: ranking
  const ranking = useMemo(() => {
    const sorted = [...yearAgg].sort((a, b) =>
      sortDir === "desc" ? b.value - a.value : a.value - b.value,
    );
    return topN === 0 ? sorted : sorted.slice(0, topN);
  }, [yearAgg, sortDir, topN]);

  // Chart 2: trend
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

  // Chart 3 + 4: limited to ranking countries (so chart isn't overwhelmed)
  const compareCountries = useMemo(() => ranking.map((r) => r.country), [ranking]);
  const groupedData = useMemo(
    () =>
      compareCountries
        .map((c) => bySexYear.find((r) => r.country === c))
        .filter((x): x is { country: string; female: number; male: number; gap: number } => !!x)
        .map((r) => ({ country: r.country, Female: +r.female.toFixed(2), Male: +r.male.toFixed(2) })),
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

  // Chart 5: change since first year (per current sex filter)
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
    // Show extremes — 8 biggest decreases + 8 biggest increases
    const decreases = out.slice(0, 8);
    const increases = out.slice(-8).filter((x) => x.change > 0);
    return [...decreases, ...increases].sort((a, b) => a.change - b.change);
  }, [aggAll]);

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Dataset · clean_mean_weekly_hours.csv"
        title="Mean Weekly Hours Worked per Employee by Sex"
        description="Explore how average weekly working hours differ across countries, between women and men, and over time."
      />

      {/* Info box */}
      <div className="rounded-xl border border-border bg-[var(--elms-canvas)]/70 p-4 md:p-5 flex gap-3 mb-6">
        <div className="size-9 shrink-0 rounded-lg grid place-items-center bg-[var(--elms-plum)] text-white">
          <Info className="size-4" />
        </div>
        <div className="text-sm leading-relaxed text-foreground/85 space-y-1">
          <p>
            This dataset shows the mean number of weekly hours usually worked by employees, split
            by country, year, sex, and source.
          </p>
          <p>
            Longer working hours are not automatically better — they can reflect labour intensity,
            part-time work differences, or work-life balance patterns.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Filters
        years={allYears}
        year={year}
        setYear={setYear}
        countries={allCountries}
        trendCountries={trendCountries}
        setTrendCountries={setTrendCountries}
        sex={sex}
        setSex={setSex}
        sortDir={sortDir}
        setSortDir={setSortDir}
        topN={topN}
        setTopN={setTopN}
        coverage={coverage}
        setCoverage={setCoverage}
        sources={allSources}
        source={source}
        setSource={setSource}
        onReset={resetFilters}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <KpiDark
          label={`Average Weekly Hours (${year})`}
          value={fmtHours(kpiAvg)}
          unit="hours"
          hint={`Across ${kpiCount} countries · ${sLabel}`}
          icon={Clock}
        />
        <KpiDark
          label={`Highest Weekly Hours (${year})`}
          value={fmtHours(kpiMax?.value)}
          unit="hours"
          hint={kpiMax?.country ?? "—"}
          icon={TrendingUp}
        />
        <KpiDark
          label={`Lowest Weekly Hours (${year})`}
          value={fmtHours(kpiMin?.value)}
          unit="hours"
          hint={kpiMin?.country ?? "—"}
          icon={TrendingDown}
        />
        <KpiDark
          label={`Average Sex Gap (${year})`}
          value={fmtHours(kpiSexGap)}
          unit="hours"
          hint="Male − Female"
          icon={UsersRound}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <ChartCard
          title={`Mean Weekly Hours by Country (${year}, ${sLabel})`}
          description={`Sorted ${sortDir === "desc" ? "high to low" : "low to high"} · ${topN === 0 ? "all" : `top ${topN}`} countries`}
        >
          {ranking.length === 0 ? (
            <EmptyState message="No weekly hours data is available for the selected filters." />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(280, ranking.length * 26)}>
              <BarChart data={ranking} layout="vertical" margin={{ top: 8, right: 48, left: 8, bottom: 24 }}>
                <CartesianGrid horizontal={false} stroke="rgba(33,56,133,0.1)" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#4a4b6b" }}
                  label={{ value: "Hours per week", position: "insideBottom", offset: -2, fontSize: 11, fill: "#4a4b6b" }}
                />
                <YAxis type="category" dataKey="country" width={130} tick={{ fontSize: 11, fill: "#070836" }} />
                <Tooltip
                  cursor={{ fill: "rgba(95,52,117,0.06)" }}
                  formatter={(v: number) => [`${v.toFixed(1)} h`, "Weekly hours"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid rgba(33,56,133,0.18)" }}
                />
                <Bar dataKey="value" fill="#5F3475" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title={`Weekly Hours Over Time (${allYears[0] ?? ""}–${allYears[allYears.length - 1] ?? ""}, ${sLabel})`}
          description={`Trend for ${trendCountries.length} selected ${trendCountries.length === 1 ? "country" : "countries"}`}
        >
          {trendCountries.length === 0 ? (
            <EmptyState message="No trend data is available for the selected countries." />
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="rgba(33,56,133,0.1)" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#4a4b6b" }} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#4a4b6b" }}
                  label={{ value: "Hours per week", angle: -90, position: "insideLeft", fontSize: 11, fill: "#4a4b6b" }}
                />
                <Tooltip
                  formatter={(v: number) => `${v.toFixed(1)} h`}
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
          title={`Female vs Male Weekly Hours by Country (${year})`}
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
                  label={{ value: "Hours per week", angle: -90, position: "insideLeft", fontSize: 11, fill: "#4a4b6b" }}
                />
                <Tooltip
                  formatter={(v: number) => `${v.toFixed(1)} h`}
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
          title={`Sex Gap in Weekly Hours by Country (${year}, Male − Female)`}
          description="Positive values indicate higher male weekly hours."
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
                  label={{ value: "Hours", position: "insideBottom", offset: -2, fontSize: 11, fill: "#4a4b6b" }}
                />
                <YAxis type="category" dataKey="country" width={130} tick={{ fontSize: 11, fill: "#070836" }} />
                <Tooltip
                  formatter={(v: number) => [`${v > 0 ? "+" : ""}${v.toFixed(1)} h`, "Male − Female"]}
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
          title={`Change in Weekly Hours Since First Available Year (${sLabel})`}
          description="Negative = working hours decreased. Positive = working hours increased."
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
                  label={{ value: "Change (hours)", angle: -90, position: "insideLeft", fontSize: 11, fill: "#4a4b6b" }}
                />
                <Tooltip
                  formatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(2)} h`}
                  contentStyle={{ borderRadius: 8, border: "1px solid rgba(33,56,133,0.18)" }}
                />
                <Bar dataKey="change" radius={[4, 4, 0, 0]}>
                  {changeData.map((d, i) => (
                    <Cell key={i} fill={d.change < 0 ? "#3FA796" : "#893172"} />
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
            Some observations include quality notes such as breaks in series, methodology
            revisions, source differences, working-time concept differences, and survey coverage
            notes. Values are kept in the dashboard but should be interpreted with caution,
            especially when comparing countries that may use different data sources or survey
            definitions.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            Longer weekly hours are not automatically better. They may reflect more full-time work,
            sector composition, or weaker work-life balance. Lower hours may reflect more part-time
            work or different labour market conditions.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="font-display text-base text-[var(--elms-ink)] mb-2 flex items-center gap-2">
            <Globe className="size-4 text-[var(--elms-plum)]" /> Source
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li><span className="text-foreground/70 font-medium">Source:</span> ILOSTAT — Labour force and household survey sources</li>
            <li><span className="text-foreground/70 font-medium">Dataset:</span> Mean weekly hours usually worked per employee by sex, country and source</li>
            <li><span className="text-foreground/70 font-medium">Code:</span> LFSI_HRW_SEX_A</li>
            <li><span className="text-foreground/70 font-medium">Unit:</span> Hours per week</li>
            <li><span className="text-foreground/70 font-medium">Frequency:</span> Annual</li>
            <li><span className="text-foreground/70 font-medium">Coverage:</span> {coverage === "europe" ? "Europe only" : "All available countries"}</li>
          </ul>
          <SourceNote>ILOSTAT — LFSI_HRW_SEX_A</SourceNote>
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
  sources: string[];
  source: string;
  setSource: (s: string) => void;
  onReset: () => void;
}) {
  const {
    years, year, setYear, countries, trendCountries, setTrendCountries,
    sex, setSex, sortDir, setSortDir, topN, setTopN,
    coverage, setCoverage, sources, source, setSource, onReset,
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

        {sources.length > 1 && (
          <div className="lg:col-span-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {sources.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex justify-end mt-3">
        <Button variant="ghost" size="sm" onClick={onReset} className="text-xs">
          <RotateCcw className="size-3.5" /> Reset filters
        </Button>
      </div>
    </div>
  );
}
