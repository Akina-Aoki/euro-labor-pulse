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
import { Globe, Scale, TrendingDown, TrendingUp, RotateCcw, Info } from "lucide-react";

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
  loadGenderPayGap,
  uniqueYears,
  uniqueCountries,
  filterByYear,
  avgGap,
  maxRow,
  minRow,
  calcChangeSinceFirstYear,
  classifyPayGapLevel,
  PAY_GAP_LEVEL_ORDER,
  PAY_GAP_LEVEL_COLORS,
  fmtPct,
  fmtPp,
  DEFAULT_TREND_COUNTRIES,
  type GpgRow,
} from "@/lib/gender-pay-gap";

export const Route = createFileRoute("/gender-pay-gap")({
  head: () => ({
    meta: [
      { title: "Gender Pay Gap — ELMS" },
      {
        name: "description",
        content:
          "Unadjusted gender pay gap across European countries — country ranking, trends, and change over time.",
      },
    ],
  }),
  component: GenderPayGapPage,
});

const TREND_COLORS = ["#5F3475", "#213885", "#893172", "#3FA796", "#C9A84C", "#1E6091", "#A14D8E"];

type SortDir = "desc" | "asc";
type TopN = 10 | 15 | 20 | 0; // 0 = all

function GenderPayGapPage() {
  const [rows, setRows] = useState<GpgRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGenderPayGap()
      .then(setRows)
      .catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <DashboardLayout>
        <PageHeader title="Gender Pay Gap" description="Failed to load dataset." />
        <EmptyState title="Error" message={error} />
      </DashboardLayout>
    );
  }
  if (!rows) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Gender Pay Gap"
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

function Dashboard({ rows }: { rows: GpgRow[] }) {
  const years = useMemo(() => uniqueYears(rows), [rows]);
  const countries = useMemo(() => uniqueCountries(rows), [rows]);
  const latestYear = years[years.length - 1] ?? 2024;

  const defaultTrend = useMemo(() => {
    const present = DEFAULT_TREND_COUNTRIES.filter((c) => countries.includes(c));
    return present.length ? present : countries.slice(0, 5);
  }, [countries]);

  const [year, setYear] = useState<number>(latestYear);
  const [trendCountries, setTrendCountries] = useState<string[]>(defaultTrend);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [topN, setTopN] = useState<TopN>(15);

  const resetFilters = () => {
    setYear(latestYear);
    setTrendCountries(defaultTrend);
    setSortDir("desc");
    setTopN(15);
  };

  // KPI: all countries available for selected year
  const yearRows = useMemo(() => filterByYear(rows, year), [rows, year]);
  const kpiAvg = avgGap(yearRows);
  const kpiMax = maxRow(yearRows);
  const kpiMin = minRow(yearRows);
  const kpiCount = yearRows.length;

  const lastUpdate = rows.find((r) => r.last_update)?.last_update;

  // Chart 1: ranking
  const rankingData = useMemo(() => {
    const sorted = [...yearRows].sort((a, b) =>
      sortDir === "desc"
        ? b.gender_pay_gap - a.gender_pay_gap
        : a.gender_pay_gap - b.gender_pay_gap,
    );
    const sliced = topN === 0 ? sorted : sorted.slice(0, topN);
    return sliced.map((r) => ({ country: r.country, value: r.gender_pay_gap }));
  }, [yearRows, sortDir, topN]);

  // Chart 2: trend
  const trendData = useMemo(() => {
    const yearsAll = uniqueYears(rows);
    return yearsAll.map((y) => {
      const point: Record<string, number | string> = { year: y };
      for (const c of trendCountries) {
        const found = rows.find((r) => r.country === c && r.year === y);
        if (found) point[c] = found.gender_pay_gap;
      }
      return point;
    });
  }, [rows, trendCountries]);

  // Chart 3: change since first year
  const changeData = useMemo(() => calcChangeSinceFirstYear(rows, year), [rows, year]);
  const topImprovers = useMemo(() => changeData.slice(0, 8), [changeData]);
  const topWorseners = useMemo(() => [...changeData].reverse().slice(0, 8), [changeData]);
  const changeChartData = [...topImprovers, ...topWorseners.filter((w) => w.change > 0)].sort(
    (a, b) => a.change - b.change,
  );

  // Chart 4 fallback: pay gap level summary (no country codes => use fallback per spec)
  const levelSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const lvl of PAY_GAP_LEVEL_ORDER) counts[lvl] = 0;
    for (const r of yearRows) {
      const lvl = classifyPayGapLevel(r.gender_pay_gap);
      if (lvl !== "No data") counts[lvl] = (counts[lvl] ?? 0) + 1;
    }
    return PAY_GAP_LEVEL_ORDER.map((level) => ({
      level,
      count: counts[level],
      color: PAY_GAP_LEVEL_COLORS[level],
    }));
  }, [yearRows]);

  return (
    <DashboardLayout>
      <PageHeader
        title="Gender Pay Gap"
        description="Explore how the unadjusted gender pay gap differs across European countries and how it has changed over time."
      />

      {/* Info box */}
      <div className="rounded-xl border border-border bg-[var(--elms-canvas)]/70 p-4 md:p-5 flex gap-3 mb-6">
        <div className="size-9 shrink-0 rounded-lg grid place-items-center bg-[var(--elms-plum)] text-white">
          <Info className="size-4" />
        </div>
        <p className="text-sm leading-relaxed text-foreground/85">
          The <strong>gender pay gap</strong> shows the difference between men&rsquo;s and
          women&rsquo;s average gross hourly earnings, shown as a percentage. A higher value means a
          larger pay gap. This dataset is <strong>unadjusted</strong>, meaning it does not control
          for factors such as job role, industry, education, age, or working hours.
        </p>
      </div>

      {/* Filters */}
      <Filters
        years={years}
        year={year}
        setYear={setYear}
        sortDir={sortDir}
        setSortDir={setSortDir}
        topN={topN}
        setTopN={setTopN}
        onReset={resetFilters}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <KpiCardDark
          label={`Average Gender Pay Gap (${year})`}
          value={fmtPct(kpiAvg)}
          hint={`Across ${kpiCount} countries`}
          icon={Scale}
        />
        <KpiCardDark
          label={`Highest Pay Gap (${year})`}
          value={fmtPct(kpiMax?.gender_pay_gap)}
          hint={kpiMax?.country ?? "—"}
          icon={TrendingUp}
        />
        <KpiCardDark
          label={`Lowest Pay Gap (${year})`}
          value={fmtPct(kpiMin?.gender_pay_gap)}
          hint={kpiMin?.country ?? "—"}
          icon={TrendingDown}
        />
        <KpiCardDark
          label={`Countries Covered (${year})`}
          value={String(kpiCount)}
          hint="Countries"
          icon={Globe}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <ChartCard
          title={`Gender Pay Gap by Country (${year})`}
          description={`Sorted ${sortDir === "desc" ? "high to low" : "low to high"} · ${topN === 0 ? "all" : `top ${topN}`} countries`}
        >
          {rankingData.length === 0 ? (
            <EmptyState message="No gender pay gap data is available for the selected filters." />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(280, rankingData.length * 26)}>
              <BarChart
                data={rankingData}
                layout="vertical"
                margin={{ top: 8, right: 40, left: 8, bottom: 8 }}
              >
                <CartesianGrid horizontal={false} stroke="rgba(33,56,133,0.1)" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#4a4b6b" }}
                  label={{
                    value: "Gender Pay Gap (%)",
                    position: "insideBottom",
                    offset: -2,
                    fontSize: 11,
                    fill: "#4a4b6b",
                  }}
                />
                <YAxis
                  type="category"
                  dataKey="country"
                  width={110}
                  tick={{ fontSize: 11, fill: "#070836" }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(95,52,117,0.06)" }}
                  formatter={(v: number) => [`${v.toFixed(1)}%`, "Pay gap"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid rgba(33,56,133,0.18)" }}
                />
                <Bar dataKey="value" fill="#5F3475" radius={[0, 4, 4, 0]}>
                  {rankingData.map((d, i) => (
                    <Cell key={i} fill={d.value >= 15 ? "#5F3475" : d.value >= 10 ? "#7c4a93" : "#a36ab8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Gender Pay Gap Over Time"
          description={`Trend for ${trendCountries.length} selected ${trendCountries.length === 1 ? "country" : "countries"}`}
        >
          <TrendCountryPicker
            countries={countries}
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
                  label={{
                    value: "Pay gap (%)",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 11,
                    fill: "#4a4b6b",
                  }}
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        <ChartCard
          className="lg:col-span-2"
          title={`Change in Gender Pay Gap (first available year → ${year})`}
          description="Negative = pay gap shrank (improvement). Positive = pay gap widened."
        >
          {changeChartData.length === 0 ? (
            <EmptyState message="No change calculation is available because first-year or selected-year values are missing." />
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={changeChartData} margin={{ top: 8, right: 12, left: 0, bottom: 56 }}>
                <CartesianGrid vertical={false} stroke="rgba(33,56,133,0.1)" />
                <XAxis
                  dataKey="country"
                  interval={0}
                  angle={-40}
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 10, fill: "#070836" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#4a4b6b" }}
                  label={{
                    value: "Change (pp)",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 11,
                    fill: "#4a4b6b",
                  }}
                />
                <Tooltip
                  formatter={(v: number) => fmtPp(v)}
                  contentStyle={{ borderRadius: 8, border: "1px solid rgba(33,56,133,0.18)" }}
                />
                <Bar dataKey="change" radius={[4, 4, 0, 0]}>
                  {changeChartData.map((d, i) => (
                    <Cell key={i} fill={d.change < 0 ? "#3FA796" : "#893172"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title={`Countries by Pay Gap Level (${year})`}
          description="Geographic map fallback — count of countries per pay gap band."
        >
          {yearRows.length === 0 ? (
            <EmptyState message="No pay gap level summary is available for the selected year." />
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart
                data={levelSummary}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
              >
                <CartesianGrid horizontal={false} stroke="rgba(33,56,133,0.1)" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#4a4b6b" }} />
                <YAxis
                  type="category"
                  dataKey="level"
                  width={110}
                  tick={{ fontSize: 11, fill: "#070836" }}
                />
                <Tooltip
                  formatter={(v: number) => [`${v} countries`, "Count"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid rgba(33,56,133,0.18)" }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {levelSummary.map((d, i) => (
                    <Cell key={i} fill={d.color} />
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
            Some observations may include Eurostat quality flags such as provisional values,
            estimated values, breaks in time series, or low reliability. Values with flags are kept
            in the dashboard but should be interpreted with caution. The dataset is{" "}
            <strong>unadjusted</strong>, meaning it does not control for job role, industry,
            education, age, seniority, or working hours.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="font-display text-base text-[var(--elms-ink)] mb-2">Source</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li><span className="text-foreground/70 font-medium">Source:</span> Eurostat open data</li>
            <li><span className="text-foreground/70 font-medium">Dataset:</span> Gender pay gap in unadjusted form</li>
            <li><span className="text-foreground/70 font-medium">Code:</span> ESTAT:TESEM180</li>
            <li><span className="text-foreground/70 font-medium">Unit:</span> Percentage (%)</li>
            <li><span className="text-foreground/70 font-medium">Frequency:</span> Annual</li>
            <li><span className="text-foreground/70 font-medium">Sector:</span> Industry, construction and services (except public administration, defence, compulsory social security)</li>
            {lastUpdate && (
              <li><span className="text-foreground/70 font-medium">Last update:</span> {lastUpdate.split(" ")[0]}</li>
            )}
          </ul>
          <SourceNote>Eurostat — ESTAT:TESEM180</SourceNote>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ---------- Subcomponents ---------- */

function KpiCardDark({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div
      className="rounded-xl p-5 shadow-sm text-white"
      style={{ background: "var(--elms-navy-deep)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/70 font-medium leading-snug">
          {label}
        </div>
        <div
          className="size-9 rounded-lg grid place-items-center shrink-0"
          style={{ background: "rgba(95,52,117,0.85)" }}
        >
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-white/70">{hint}</div>}
    </div>
  );
}

function Filters({
  years,
  year,
  setYear,
  sortDir,
  setSortDir,
  topN,
  setTopN,
  onReset,
}: {
  years: number[];
  year: number;
  setYear: (y: number) => void;
  sortDir: SortDir;
  setSortDir: (d: SortDir) => void;
  topN: TopN;
  setTopN: (n: TopN) => void;
  onReset: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
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
      </div>
      <div className="flex justify-end mt-3">
        <Button variant="ghost" size="sm" onClick={onReset} className="text-xs">
          <RotateCcw className="size-3.5" /> Reset filters
        </Button>
      </div>
    </div>
  );
}

