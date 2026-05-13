import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  accent?: string;
}

export function KpiCard({ label, value, hint, icon: Icon, accent = "var(--elms-navy)" }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
          {label}
        </div>
        {Icon && (
          <div
            className="size-8 rounded-lg grid place-items-center text-white"
            style={{ background: accent }}
          >
            <Icon className="size-4" />
          </div>
        )}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-[var(--elms-ink)]">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
