import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";

export const Route = createFileRoute("/in-work-poverty")({
  head: () => ({
    meta: [
      { title: "In-Work At-Risk-of-Poverty Rate by Sex — ELMS" },
      { name: "description", content: "Share of employed people at risk of poverty, by sex." },
    ],
  }),
  component: () => (
    <DashboardLayout>
      <PageHeader
        eyebrow="Dataset · clean_in_work_poverty.csv"
        title="In-Work At-Risk-of-Poverty Rate by Sex"
        description="Share of employed persons aged 18+ living at risk of poverty, by country and sex."
      />
      <EmptyState message="This dashboard will be built when the page-specific instructions are uploaded." />
    </DashboardLayout>
  ),
});
