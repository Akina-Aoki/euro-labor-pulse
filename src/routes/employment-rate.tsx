import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";

export const Route = createFileRoute("/employment-rate")({
  head: () => ({
    meta: [
      { title: "Employment Rate by Sex — ELMS" },
      { name: "description", content: "Employment rate (20–64) by sex across European countries." },
    ],
  }),
  component: () => (
    <DashboardLayout>
      <PageHeader
        eyebrow="Dataset · clean_employment_rate.csv"
        title="Employment Rate by Sex"
        description="Share of people aged 20–64 in employment, by country, year and sex."
      />
      <EmptyState message="This dashboard will be built when the page-specific instructions are uploaded." />
    </DashboardLayout>
  ),
});
