import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";

export const Route = createFileRoute("/gender-pay-gap")({
  head: () => ({
    meta: [
      { title: "Gender Pay Gap — ELMS" },
      { name: "description", content: "Unadjusted gender pay gap across European countries." },
    ],
  }),
  component: () => (
    <DashboardLayout>
      <PageHeader
        eyebrow="Dataset · clean_gender_pay_gap.csv"
        title="Gender Pay Gap"
        description="Unadjusted gender pay gap in industry, construction and services across European countries."
      />
      <EmptyState message="This dashboard will be built when the page-specific instructions are uploaded." />
    </DashboardLayout>
  ),
});
