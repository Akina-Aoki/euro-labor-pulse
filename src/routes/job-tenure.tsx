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
  RefreshCcw,
  TrendingUp,
  Users,
  Shield,
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
  loadJobTenure,
  isEuropean,
  aggregateByDuration,
  sexLabel,
  fmtPct,
  DEFAULT_TREND_COUNTRIES,
  DURATIONS,
  SHORT_DUR_LABEL,
  type JtRow,
  type SexFilter,
  type Duration,
  type CydValue,
} from "@/lib/job-tenure";

export const Route = createFileRoute("/job-tenure")({
  head: () => ({
    meta: [
      { title: "Employed Persons by Job Tenure — ELMS" },
      {
        name: "description",
        content:
          "Explore how long employed people have stayed with their current employer across European countries, by year, sex, and tenure group.",
      },
    ],
  }),
  component: JobTenurePage,
});

const DURATION_COLORS: Record<Duration, string> = {
  "From 0 to 11 months": "#5F3475",
  "From 12 to 23 months": "#213885",
  "From 24 to 59 months": "#E58A2B",
  "60 months or over": "#3FA796",
  "No response": "#B7B7C2",
};
const TREND_COLORS = ["#5F3475", "#213885", "#C9347B", "#E58A2B", "#3FA796", "#1E6091", "#A14D8E"];

const FOCUS_DURATIONS: Duration[] = [
  "60 months or over",
  "From 0 to 11 months",
  "From 12 to 23 months",
  "From 24 to 59 months",
];
const COMPOSITION_DURATIONS: Duration[] = [
  "From 0 to 11 months",
  "From 12 to 23 months",
  "From 24 to 59 months",
  "60 months or over",
];

type SortDir = "desc" | "asc";
type TopN = 10 | 15 | 20 | 0;
type Coverage = "europe" | "all";

function JobTenurePage() {
  const [rows, setRows] = useState<JtRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJobTenure().then(setRows).catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <DashboardLayout>
        <PageHeader title="Employed Persons by Job Tenure" description="Failed to load dataset." />
        <EmptyState title="Error" message={error} />
      </DashboardLayout>
    );
  }
  if (!rows) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Employed Persons by Job Tenure"
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

function Dashboard({ rows }: { rows: JtRow[] }) {
  const [coverage, setCoverage] = useState<Coverage>("europe");

  const baseRows = useMemo(
    () => (coverage === "europe" ? rows.filter((x) => isEuropean(x.country)) : rows),
    [rows, coverage],
  );

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
  const [focusDuration, setFocusDuration] = useState<Duration>("60 months or over");
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
    setFocusDuration("60 months or over");
    setTrendCountries(defaultTrend);
    setSortDir("desc");
    setTopN(15);
  };

  const sLabel = sexLabel(sex);

  // Aggregations
  const aggAll = useMemo(() => aggregateByDuration(baseRows, sex), [baseRows, sex]);
  const aggMale = useMemo(() => aggregateByDuration(baseRows, "Male"), [baseRows]);
  const aggFemale = useMemo(() => aggregateByDuration(baseRows, "Female"), [baseRows]);

  // Focus-duration values per country in selected year
  const focusYearVals = useMemo(
    () =>
      aggAll
        .filter((r) => r.year === year && r.duration === focusDuration)
        .map((r) => ({ country: r.country, value: r.value })),
    [aggAll, year, focusDuration],
  );

  // Long-term (60+) values for KPIs and gender chart
  const longTermYearVals = useMemo(
    () =>
      aggAll
        .filter((r) => r.year === year && r.duration === "60 months or over")
        .map((r) => ({ country: r.country, value: r.value })),
    [aggAll, year],
  );

  // Labour mobility per country, selected year (sum of 0-11 + 12-23)
  const mobilityYearVals = useMemo(() => {
    const byCountry = new Map<string, { short: number | null; mid: number | null }>();
    for (const r of aggAll) {
      if (r.year !== year) continue;
      if (r.duration !== "From 0 to 11 months" && r.duration !== "From 12 to 23 months") continue;
      const cur = byCountry.get(r.country) ?? { short: null, mid: null };
      if (r.duration === "From 0 to 11 months") cur.short = r.value;
      else cur.mid = r.value;
      byCountry.set(r.country, cur);
    }
    const out: { country: string; value: number }[] = [];
    for (const [c, v] of byCountry) {
      if (v.short == null || v.mid == null) continue;
      out.push({ country: c, value: +(v.short + v.mid).toFixed(2) });
    }
    return out;
  }, [aggAll, year]);

  // KPIs
  const kpiAvgLT = longTermYearVals.length
    ? longTermYearVals.reduce((s, r) => s + r.value, 0) / longTermYearVals.length
    : null;
  const kpiMaxLT = longTermYearVals.length
    ? longTermYearVals.reduce((a, b) => (a.value > b.value ? a : b))
    : null;
  const kpiMaxMobility = mobilityYearVals.length
    ? mobilityYearVals.reduce((a, b) => (a.value > b.value ? a : b))
    : null;
  const kpiCountries = new Set(longTermYearVals.map((r) => r.country)).size;

  // Chart 1: ranking by focus duration
  const ranking = useMemo(() => {
    const sorted = [...focusYearVals].sort((a, b) =>
      sortDir === "desc" ? b.value - a.value : a.value - b.value,
    );
    return topN === 0 ? sorted : sorted.slice(0, topN);
  }, [focusYearVals, sortDir, topN]);

  // Chart 2: trend (focus duration over time)
  const trendData = useMemo(() => {
    return allYears.map((y) => {
      const point: Record<string, number | string> = { year: y };
      for (const c of trendCountries) {
        const f = aggAll.find((r) => r.country === c && r.year === y && r.duration === focusDuration);
        if (f) point[c] = +f.value.toFixed(2);
      }
      return point;
    });
  }, [aggAll, allYears, trendCountries, focusDuration]);

  // Chart 3: composition stacked (top countries by long-term)
  const compositionRows = useMemo(() => {
    const top = [...longTermYearVals]
      .sort((a, b) => b.value - a.value)
      .slice(0, topN === 0 ? longTermYearVals.length : Math.min(topN, 12))
      .map((r) => r.country);
    return top
      .map((c) => {
        const point: Record<string, string | number> = { country: c };
        for (const d of COMPOSITION_DURATIONS) {
          const f = aggAll.find((r) => r.country === c && r.year === year && r.duration === d);
          point[SHORT_DUR_LABEL[d]] = f ? +f.value.toFixed(2) : 0;
        }
        return point;
      });
  }, [longTermYearVals, aggAll, year, topN]);

  // Chart 4: change in long-term tenure since first available year (per country)
  const changeData = useMemo(() => {
    const longTerm = aggAll.filter((r) => r.duration === "60 months or over");
    const byCountry = new Map<string, CydValue[]>();
    for (const r of longTerm) {
      if (!byCountry.has(r.country)) byCountry.set(r.country, []);
      byCountry.get(r.country)!.push(r);
    }
    const out: { country: string; change: number }[] = [];
    for (const [c, list] of byCountry) {
      const sorted = [...list].sort((a, b) => a.year - b.year);
      if (sorted.length < 2) continue;
      out.push({ country: c, change: +(sorted[sorted.length - 1].value - sorted[0].value).toFixed(2) });
    }
    out.sort((a, b) => b.change - a.change);
    const increases = out.slice(0, 5);
    const decreases = out.slice(-5);
    return [...increases, ...decreases];
  }, [aggAll]);

  // Chart 6: gender difference in long-term tenure
  const genderDiffData = useMemo(() => {
    const map = new Map<string, { male?: number; female?: number }>();
    for (const r of aggMale) {
      if (r.year !== year || r.duration !== "60 months or over") continue;
      const cur = map.get(r.country) ?? {};
      cur.male = r.value;
      map.set(r.country, cur);
    }
    for (const r of aggFemale) {
      if (r.year !== year || r.duration !== "60 months or over") continue;
      const cur = map.get(r.country) ?? {};
      cur.female = r.value;
      map.set(r.country, cur);
    }
    const out: { country: string; diff: number }[] = [];
    for (const [c, v] of map) {
      if (v.male == null || v.female == null) continue;
      out.push({ country: c, diff: +(v.male - v.female).toFixed(2) });
    }
    out.sort((a, b) => b.diff - a.diff);
    return [...out.slice(0, 5), ...out.slice(-5)];
  }, [aggMale, aggFemale, year]);

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Dataset · clean_job_tenure.csv"
        title="Employed Persons by Job Tenure"
        description="Explore how long employed people have stayed with their current employer across European countries, by year, sex, and job tenure group."
      />

      {/* Info box */}
      <div className="rounded-xl border border-border bg-[var(--elms-canvas)]/70 p-4 md:p-5 flex gap-3 mb-6">
        <div className="size-9 shrink-0 rounded-lg grid place-items-center bg-[var(--elms-plum)] text-white">
          <Info className="size-4" />
        </div>
        <div className="text-sm leading-relaxed text-foreground/85 space-y-1">
          <p>
            This dataset shows the share of employed persons by how long they have been with their
            current employer or current job.
          </p>
          <p>
            A higher share of people with <strong>60 months or over</strong> can indicate stronger
            job stability, while a higher share of people with <strong>0–11 months</strong> or{" "}
            <strong>12–23 months</strong> can indicate higher labour mobility or more recent job
            changes.
          </p>
        </div>
      </div>

      <Filters
        years={allYears}
        year={year}
        setYear={setYear}
        countries={allCountries}
        trendCountries={trendCountries}
        setTrendCountries={setTrendCountries}
        sex={sex}
        setSex={setSex}
        focusDuration={focusDuration}
        setFocusDuration={setFocusDuration}
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
          label={`Average Long-Term Tenure (60+ months, ${year})`}
          value={fmtPct(kpiAvgLT)}
          unit="%"
          hint={`Across ${kpiCountries} countries`}
          icon={Users}
        />
        <KpiDark
          label={`Highest Long-Term Stability (${year})`}
          value={fmtPct(kpiMaxLT?.value)}
          unit="%"
          hint={kpiMaxLT?.country ?? "—"}
          icon={TrendingUp}
        />
        <KpiDark
          label={`Highest Short-Term Tenure (< 24 months, ${year})`}
          value={fmtPct(kpiMaxMobility?.value)}
          unit="%"
          hint={kpiMaxMobility?.country ?? "—"}
          icon={RefreshCcw}
        />
        <KpiDark
          label={`Countries Covered (${year})`}
          value={String(kpiCountries)}
          hint="Countries"
          icon={Globe}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-6">
        <ChartCard
          title={`${SHORT_DUR_LABEL[focusDuration]} by Country (${year}) | ${sLabel}`}
          description={`Sorted ${sortDir === "desc" ? "high to low" : "low to high"} · ${topN === 0 ? "all" : `top ${topN}`} countries`}
        >
          {ranking.length === 0 ? (
            <EmptyState message="No data available for the selected filters." />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(280, ranking.length * 26)}>
              <BarChart data={ranking} layout="vertical" margin={{ top: 8, right: 48, left: 8, bottom: 24 }}>
                <CartesianGrid horizontal={false} stroke="rgba(33,56,133,0.1)" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#4a4b6b" }}
                  label={{ value: "Share of employed persons (%)", position: "insideBottom", offset: -2, fontSize: 11, fill: "#4a4b6b" }}
                />
                <YAxis type="category" dataKey="country" width={140} tick={{ fontSize: 11, fill: "#070836" }} />
                <Tooltip
                  cursor={{ fill: "rgba(95,52,117,0.06)" }}
                  formatter={(v: number) => [`${v.toFixed(1)}%`, SHORT_DUR_LABEL[focusDuration]]}
                  contentStyle={{ borderRadius: 8, border: "1px solid rgba(33,56,133,0.18)" }}
                />
                <Bar dataKey="value" fill="#5F3475" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title={`Job Tenure Over Time (${SHORT_DUR_LABEL[focusDuration]}) | ${sLabel}`}
          description={`Trend ${allYears[0] ?? ""}–${allYears[allYears.length - 1] ?? ""} for selected countries.`}
        >
          {trendCountries.length === 0 ? (
            <EmptyState message="No trend data available." />
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="rgba(33,56,133,0.1)" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#4a4b6b" }} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#4a4b6b" }}
                  domain={[0, 100]}
                  label={{ value: "Share of employed persons (%)", angle: -90, position: "insideLeft", fontSize: 11, fill: "#4a4b6b" }}
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

      {/* Composition */}
      <div className="grid grid-cols-1 gap-5 mt-6">
        <ChartCard
          title={`Job Tenure Composition by Country (${year}) | ${sLabel}`}
          description="Share of employed persons by tenure category. 'No response' is excluded."
        >
          {compositionRows.length === 0 ? (
            <EmptyState message="No composition data available." />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(280, compositionRows.length * 30)}>
              <BarChart data={compositionRows} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 24 }} stackOffset="expand">
                <CartesianGrid horizontal={false} stroke="rgba(33,56,133,0.1)" />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
                  tick={{ fontSize: 11, fill: "#4a4b6b" }}
                  label={{ value: "Share of employed persons (%)", position: "insideBottom", offset: -2, fontSize: 11, fill: "#4a4b6b" }}
                />
                <YAxis type="category" dataKey="country" width={150} tick={{ fontSize: 11, fill: "#070836" }} />
                <Tooltip
                  formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]}
                  contentStyle={{ borderRadius: 8, border: "1px solid rgba(33,56,133,0.18)" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {COMPOSITION_DURATIONS.map((d) => (
                  <Bar
                    key={d}
                    dataKey={SHORT_DUR_LABEL[d]}
                    stackId="a"
                    fill={DURATION_COLORS[d]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Charts row 2: change + mobility + gender diff */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        <ChartCard
          title="Change in Long-Term Tenure (60+ months) Since First Available Year"
          description="Top 5 increases and top 5 decreases (percentage points)."
        >
          {changeData.length === 0 ? (
            <EmptyState message="No change data available." />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
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
                  label={{ value: "Percentage points", angle: -90, position: "insideLeft", fontSize: 11, fill: "#4a4b6b" }}
                />
                <Tooltip
                  formatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)} pp`}
                  contentStyle={{ borderRadius: 8, border: "1px solid rgba(33,56,133,0.18)" }}
                />
                <Bar dataKey="change" radius={[4, 4, 0, 0]}>
                  {changeData.map((d, i) => (
                    <Cell key={i} fill={d.change >= 0 ? "#3FA796" : "#C9347B"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title={`Labour Mobility Index (< 24 months) by Country (${year}) | ${sLabel}`}
          description="Combined share of 0–11 + 12–23 months. Higher = more recent job changes."
        >
          {mobilityYearVals.length === 0 ? (
            <EmptyState message="No mobility data available." />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(280, Math.min(mobilityYearVals.length, 15) * 24)}>
              <BarChart
                data={[...mobilityYearVals].sort((a, b) => b.value - a.value).slice(0, 15)}
                layout="vertical"
                margin={{ top: 8, right: 40, left: 8, bottom: 24 }}
              >
                <CartesianGrid horizontal={false} stroke="rgba(33,56,133,0.1)" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#4a4b6b" }}
                  label={{ value: "Share of employed persons (%)", position: "insideBottom", offset: -2, fontSize: 11, fill: "#4a4b6b" }}
                />
                <YAxis type="category" dataKey="country" width={120} tick={{ fontSize: 11, fill: "#070836" }} />
                <Tooltip
                  formatter={(v: number) => [`${v.toFixed(1)}%`, "Mobility (< 24 months)"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid rgba(33,56,133,0.18)" }}
                />
                <Bar dataKey="value" fill="#5F3475" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title={`Gender Difference in Long-Term Tenure (60+ months) (${year})`}
          description="Male − Female (percentage points). Positive = men have higher long-term share."
        >
          {genderDiffData.length === 0 ? (
            <EmptyState message="No gender comparison available for this year." />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(280, genderDiffData.length * 26)}>
              <BarChart data={genderDiffData} layout="vertical" margin={{ top: 8, right: 40, left: 8, bottom: 24 }}>
                <CartesianGrid horizontal={false} stroke="rgba(33,56,133,0.1)" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#4a4b6b" }}
                  label={{ value: "Percentage points", position: "insideBottom", offset: -2, fontSize: 11, fill: "#4a4b6b" }}
                />
                <YAxis type="category" dataKey="country" width={120} tick={{ fontSize: 11, fill: "#070836" }} />
                <Tooltip
                  formatter={(v: number) => [`${v > 0 ? "+" : ""}${v.toFixed(1)} pp`, "Male − Female"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid rgba(33,56,133,0.18)" }}
                />
                <Bar dataKey="diff" radius={[0, 4, 4, 0]}>
                  {genderDiffData.map((d, i) => (
                    <Cell key={i} fill={d.diff >= 0 ? "#3FA796" : "#C9347B"} />
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
          <h4 className="font-display text-base text-[var(--elms-ink)] mb-2 flex items-center gap-2">
            <Shield className="size-4 text-[var(--elms-plum)]" /> Data Quality Note
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Some observations include Eurostat flags such as provisional (p), estimated (e), or
            break in time series (b). These values are kept in the analysis but should be
            interpreted with caution.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            The "No response" category is excluded from composition and stability metrics unless
            explicitly selected.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="font-display text-base text-[var(--elms-ink)] mb-2 flex items-center gap-2">
            <Globe className="size-4 text-[var(--elms-plum)]" /> Source
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li><span className="text-foreground/70 font-medium">Source:</span> Eurostat open data</li>
            <li><span className="text-foreground/70 font-medium">Dataset:</span> Employed persons by job tenure</li>
            <li><span className="text-foreground/70 font-medium">Code:</span> LFSA_EGAD</li>
            <li><span className="text-foreground/70 font-medium">Unit:</span> Percentage (%)</li>
            <li><span className="text-foreground/70 font-medium">Age group:</span> 20–64 years</li>
            <li><span className="text-foreground/70 font-medium">Frequency:</span> Annual</li>
            <li><span className="text-foreground/70 font-medium">Years covered:</span> {allYears[0] ?? "—"}–{allYears[allYears.length - 1] ?? "—"}</li>
          </ul>
          <SourceNote>Eurostat — LFSA_EGAD</SourceNote>
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
  focusDuration: Duration;
  setFocusDuration: (d: Duration) => void;
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
    sex, setSex, focusDuration, setFocusDuration,
    sortDir, setSortDir, topN, setTopN, coverage, setCoverage, onReset,
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
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Duration focus</Label>
          <Select value={focusDuration} onValueChange={(v) => setFocusDuration(v as Duration)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FOCUS_DURATIONS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
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

void DURATIONS;
