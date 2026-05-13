import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HeroBackdrop } from "@/components/home/HeroBackdrop";
import { ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ELMS — European Labour Market Statistics" },
      { name: "description", content: "An interactive dashboard for European labour market indicators across countries, years and sex." },
    ],
  }),
  component: HomePage,
});

const TOPICS = [
  {
    to: "/employment-rate",
    title: "Employment Rate by Sex",
    desc: "Share of people aged 20–64 in employment, compared across countries, years, and sex.",
    accent: "var(--elms-navy)",
  },
  {
    to: "/job-tenure",
    title: "Job Tenure by Sex",
    desc: "How long people stay in their current job, compared across tenure bands, countries, and sex.",
    accent: "var(--elms-plum)",
  },
  {
    to: "/weekly-hours",
    title: "Mean Weekly Hours Worked per Employee by Sex",
    desc: "Average weekly hours usually worked per employee, compared across countries and sex.",
    accent: "var(--elms-magenta)",
  },
  {
    to: "/gender-pay-gap",
    title: "Gender Pay Gap",
    desc: "Unadjusted gender pay gap across European countries, showing differences in hourly earnings.",
    accent: "var(--elms-navy-deep)",
  },
  {
    to: "/in-work-poverty",
    title: "In-Work At-Risk-of-Poverty Rate by Sex",
    desc: "Share of employed people at risk of poverty, compared across countries and sex.",
    accent: "var(--elms-plum)",
  },
] as const;

function HomePage() {
  return (
    <DashboardLayout>
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-2xl border-2 p-8 md:p-14 lg:p-16 min-h-[520px] flex items-center"
        style={{
          borderColor: "var(--elms-navy-deep)",
          background:
            "linear-gradient(135deg, #ECDFD2 0%, #F5ECE0 50%, #E7DBCE 100%)",
        }}
      >
        <HeroBackdrop />

        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--elms-navy)]/25 bg-white/70 backdrop-blur px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[var(--elms-navy)]">
            <Sparkles className="size-3" />
            ELMS Dashboard
          </div>
          <h1 className="mt-5 text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.05] text-[var(--elms-ink)]">
            European<br />
            <span className="text-[var(--elms-navy)]">Labour Market</span><br />
            Statistics
          </h1>
          <p className="mt-5 text-base md:text-lg text-[var(--elms-ink)]/75 max-w-xl leading-relaxed">
            Explore key labour market indicators across Europe through clear, interactive,
            and gender-aware data visualizations.
          </p>

          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-[var(--elms-ink)]/80 max-w-xl">
            <li className="flex items-center gap-2"><Dot /> Employment rate by sex</li>
            <li className="flex items-center gap-2"><Dot /> Job tenure by sex</li>
            <li className="flex items-center gap-2"><Dot /> Mean weekly hours by sex</li>
            <li className="flex items-center gap-2"><Dot /> Gender pay gap</li>
            <li className="flex items-center gap-2"><Dot /> In-work at-risk-of-poverty rate</li>
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/employment-rate"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--elms-navy)] text-white px-5 py-2.5 text-sm font-medium hover:bg-[var(--elms-navy-deep)] transition-colors shadow-sm"
            >
              Open dashboards <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/gender-pay-gap"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--elms-navy)]/30 bg-white/70 backdrop-blur px-5 py-2.5 text-sm font-medium text-[var(--elms-ink)] hover:bg-white"
            >
              Browse Gender Pay Gap
            </Link>
          </div>
        </div>
      </section>

      {/* Topics */}
      <section className="mt-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--elms-magenta)] font-medium mb-2">
              Five labour market topics
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-[var(--elms-ink)]">
              Each dataset, its own dashboard
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOPICS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="group relative rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col"
            >
              <div
                className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full"
                style={{ background: t.accent }}
              />
              <div className="pl-3 flex-1 flex flex-col">
                <h3 className="font-display text-xl text-[var(--elms-ink)] leading-snug">{t.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">{t.desc}</p>
                <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--elms-navy)] group-hover:gap-2.5 transition-all">
                  Explore <ArrowRight className="size-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer narrative */}
      <section className="mt-12 rounded-xl border border-border bg-card p-6 md:p-8">
        <div className="grid md:grid-cols-3 gap-6">
          <Stat label="Datasets" value="5" hint="Cleaned Eurostat & ILO sources" />
          <Stat label="Coverage" value="EU + neighbours" hint="Country-level granularity" />
          <Stat label="Dimensions" value="Country · Year · Sex" hint="Filterable across every page" />
        </div>
      </section>
    </DashboardLayout>
  );
}

function Dot() {
  return <span className="size-1.5 rounded-full bg-[var(--elms-magenta)]" />;
}
function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-display text-[var(--elms-ink)]">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{hint}</div>
    </div>
  );
}
