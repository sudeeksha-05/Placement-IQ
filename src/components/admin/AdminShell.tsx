import { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, FileEdit, BarChart3, Megaphone,
  Shield, ArrowLeft, Sparkles,
} from "lucide-react";
import { useProfile, initialsOf } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

const items = [
  { to: "/dashboard/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/admin/users", label: "Users", icon: Users },
  { to: "/dashboard/admin/content", label: "Content", icon: FileEdit },
  { to: "/dashboard/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/admin/notifications", label: "Notifications", icon: Megaphone },
];

export function AdminShell({ title, subtitle, children }: {
  title: string; subtitle?: string; children: ReactNode;
}) {
  const path = useRouterState({ select: s => s.location.pathname });
  const { profile } = useProfile();
  const { user } = useAuth();
  const initials = initialsOf(profile?.full_name, user?.email);

  return (
    <div className="min-h-screen flex bg-background">
      <div className="fixed inset-0 grid-bg pointer-events-none -z-10" />
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border/50 bg-sidebar/60 backdrop-blur-xl sticky top-0 h-screen p-4">
        <div className="flex items-center gap-2 px-2 py-2 mb-2">
          <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center glow">
            <Shield className="size-4 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-sm leading-tight">Admin</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">PlacementIQ</div>
          </div>
        </div>
        <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 mb-4">
          <ArrowLeft className="size-3" /> Back to app
        </Link>
        <nav className="flex-1 space-y-1">
          {items.map(it => {
            const active = it.exact ? path === it.to : path.startsWith(it.to);
            const Icon = it.icon;
            return (
              <Link key={it.to} to={it.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  active ? "bg-gradient-to-r from-primary to-accent text-white glow"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}>
                <Icon className="size-4" /> {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg glass">
          <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center text-xs font-semibold">{initials}</div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate">{profile?.full_name || "Admin"}</div>
            <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
              <Sparkles className="size-2.5" /> Administrator
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/60 border-b border-border/50 px-6 py-4">
          <h1 className="text-xl font-display font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </header>
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
