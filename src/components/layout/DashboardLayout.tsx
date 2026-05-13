import { Link, useRouterState } from "@tanstack/react-router";
import { NAV_ITEMS } from "@/config/nav";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = NAV_ITEMS.find((n) => n.to === pathname);

  return (
    <div className="min-h-screen w-full flex bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-4 md:px-8 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger className="md:hidden inline-flex size-9 items-center justify-center rounded-md border border-border">
                <Menu className="size-4" />
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
                <nav className="p-4 space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.to;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={[
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                          active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80",
                        ].join(" ")}
                      >
                        <Icon className="size-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
            <div className="text-sm text-muted-foreground">
              <span className="text-[var(--elms-navy)]">ELMS</span>
              {current && current.to !== "/" && (
                <>
                  <span className="mx-2 text-foreground/30">/</span>
                  <span className="text-foreground/80">{current.label}</span>
                </>
              )}
            </div>
          </div>
          <a
            href="https://ec.europa.eu/eurostat"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground"
          >
            Data: Eurostat · ILO
          </a>
        </header>

        <main className="flex-1 px-4 md:px-8 py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
