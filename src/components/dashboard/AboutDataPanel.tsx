import { Info } from "lucide-react";

interface AboutDataPanelProps {
  title?: string;
  children: React.ReactNode;
}

export function AboutDataPanel({ title = "About this data", children }: AboutDataPanelProps) {
  return (
    <aside className="rounded-xl border border-border bg-[var(--elms-canvas)]/60 p-5">
      <div className="flex items-center gap-2 mb-2">
        <Info className="size-4 text-[var(--elms-plum)]" />
        <h4 className="font-display text-base text-[var(--elms-ink)]">{title}</h4>
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </aside>
  );
}
