interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 mb-8 border-b border-border">
      <div className="max-w-3xl">
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--elms-magenta)] font-medium mb-3">
            {eyebrow}
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--elms-ink)]">{title}</h1>
        {description && (
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
