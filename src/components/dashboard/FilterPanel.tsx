import { SlidersHorizontal } from "lucide-react";

export function FilterPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">
        <SlidersHorizontal className="size-3.5" />
        Filters
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">{children}</div>
    </div>
  );
}
