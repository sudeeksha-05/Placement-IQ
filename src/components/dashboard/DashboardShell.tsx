import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Bell, Search } from "lucide-react";

export function DashboardShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      <div className="fixed inset-0 grid-bg pointer-events-none -z-10" />
      <Sidebar />
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/60 border-b border-border/50 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 glass rounded-lg px-3 py-1.5 text-sm w-64">
              <Search className="size-4 text-muted-foreground" />
              <input
                placeholder="Search anything..."
                className="bg-transparent outline-none flex-1 placeholder:text-muted-foreground"
              />
            </div>
            <button className="size-9 grid place-items-center rounded-lg glass hover:bg-white/10 transition relative">
              <Bell className="size-4" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-neon animate-pulse" />
            </button>
            <div className="size-9 rounded-lg bg-gradient-primary grid place-items-center text-sm font-semibold glow">
              AR
            </div>
          </div>
        </header>
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
