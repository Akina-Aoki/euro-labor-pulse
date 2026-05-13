import { Link, useRouterState } from "@tanstack/react-router";
import { NAV_ITEMS } from "@/config/nav";
import { BarChart3 } from "lucide-react";

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-6 py-7 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-[var(--elms-canvas)] text-[var(--elms-navy-deep)] grid place-items-center">
            <BarChart3 className="size-5" />
          </div>
          <div>
            <div className="font-display text-lg leading-none">ELMS</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/60 mt-1">
              Labour Market
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/50">
          Dashboards
        </div>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={[
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-sidebar-foreground",
              ].join(" ")}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-5 border-t border-sidebar-border text-[11px] text-sidebar-foreground/60">
        <div className="font-medium text-sidebar-foreground/80">European Labour Market Statistics</div>
        <div className="mt-1">Eurostat & ILO sourced datasets</div>
      </div>
    </aside>
  );
}
