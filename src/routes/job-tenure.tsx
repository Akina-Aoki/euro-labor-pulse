import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";

export const Route = createFileRoute("/job-tenure")({
  head: () => ({
    meta: [
      { title: "Job Tenure by Sex — ELMS" },
      { name: "description", content: "Job tenure distribution by sex across European countries." },
    ],
  }),
  component: () => (
    <DashboardLayout>
      <PageHeader
        eyebrow="Dataset · clean_job_tenure.csv"
        title="Job Tenure by Sex"
        description="How long employees stay in their current job, by tenure band, country and sex."
      />
      <EmptyState message="This dashboard will be built when the page-specific instructions are uploaded." />
    </DashboardLayout>
  ),
});
