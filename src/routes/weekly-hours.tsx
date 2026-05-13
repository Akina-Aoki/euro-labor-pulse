import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";

export const Route = createFileRoute("/weekly-hours")({
  head: () => ({
    meta: [
      { title: "Mean Weekly Hours Worked by Sex — ELMS" },
      { name: "description", content: "Mean weekly hours usually worked per employee, by sex." },
    ],
  }),
  component: () => (
    <DashboardLayout>
      <PageHeader
        eyebrow="Dataset · clean_mean_weekly_hours.csv"
        title="Mean Weekly Hours Worked per Employee by Sex"
        description="Mean weekly hours usually worked per employee across countries, by sex."
      />
      <EmptyState message="This dashboard will be built when the page-specific instructions are uploaded." />
    </DashboardLayout>
  ),
});
