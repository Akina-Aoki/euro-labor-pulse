import { Database } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export function EmptyState({
  title = "No data yet",
  message = "Data will appear here after the dataset is connected.",
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
      <div className="mx-auto size-12 rounded-full bg-[var(--elms-canvas)] grid place-items-center text-[var(--elms-navy)]">
        <Database className="size-5" />
      </div>
      <h4 className="mt-4 font-display text-lg text-[var(--elms-ink)]">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">{message}</p>
    </div>
  );
}
