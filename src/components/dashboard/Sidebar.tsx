import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, FileText, Target, TrendingUp, Brain,
  MessageSquareCode, Bot, User, LogOut, Sparkles, Briefcase, Shield,
} from "lucide-react";
import { useRole } from "@/hooks/useRole";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/ats", label: "Resume ATS", icon: FileText },
  { to: "/dashboard/skills", label: "Skill Gap", icon: Target },
  { to: "/dashboard/roadmap", label: "AI Roadmap", icon: Sparkles },
  { to: "/dashboard/quiz", label: "Quizzes", icon: Brain },
  { to: "/dashboard/interview", label: "Mock Interview", icon: MessageSquareCode },
  { to: "/dashboard/jobs", label: "Job Match", icon: Briefcase },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/dashboard/assistant", label: "AI Assistant", icon: Bot },
  { to: "/dashboard/profile", label: "Profile", icon: User },
];

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { isStaff } = useRole();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border/50 bg-sidebar/60 backdrop-blur-xl sticky top-0 h-screen p-4">
      <Link to="/" className="flex items-center gap-2 px-2 py-2 mb-6">
        <div className="size-8 rounded-lg bg-gradient-primary grid place-items-center glow">
          <Sparkles className="size-4 text-white" />
        </div>
        <span className="font-display font-bold text-lg">
          Placement<span className="text-gradient">IQ</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1">
        {items.map((it) => {
          const active = path === it.to;
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition group ${
                active
                  ? "bg-gradient-primary text-white glow"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <Icon className="size-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <Link
        to="/login"
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
      >
        <LogOut className="size-4" /> Logout
      </Link>
    </aside>
  );
}
