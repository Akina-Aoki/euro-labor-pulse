interface ChartCardProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, description, actions, children, className = "" }: ChartCardProps) {
  return (
    <section className={`rounded-xl border border-border bg-card p-5 shadow-sm ${className}`}>
      <header className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display text-lg text-[var(--elms-ink)]">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {actions}
      </header>
      <div>{children}</div>
    </section>
  );
}
