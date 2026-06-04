import { ReactNode, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { Bell, Search, User, Settings, LogOut, Sparkles, CheckCircle2 } from "lucide-react";
import { useProfile, initialsOf } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

const sampleNotifications = [
  { id: 1, title: "New job match", body: "3 new roles match your profile", time: "2m ago", unread: true },
  { id: 2, title: "Quiz reminder", body: "Continue your DSA quiz", time: "1h ago", unread: true },
  { id: 3, title: "ATS score updated", body: "Your resume score is now 87", time: "3h ago", unread: false },
  { id: 4, title: "Roadmap progress", body: "You completed 2 milestones this week", time: "1d ago", unread: false },
];

export function DashboardShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { profile } = useProfile();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = initialsOf(profile?.full_name, user?.email);
  const [openNotif, setOpenNotif] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setOpenNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setOpenProfile(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const unreadCount = sampleNotifications.filter(n => n.unread).length;

  return (
    <div className="min-h-screen flex bg-background">
      <div className="fixed inset-0 grid-bg pointer-events-none -z-10" />
      <Sidebar />
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/60 border-b border-border/50 px-6 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-display font-bold truncate">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 glass rounded-lg px-3 py-1.5 text-sm w-64">
              <Search className="size-4 text-muted-foreground" />
              <input
                placeholder="Search anything..."
                className="bg-transparent outline-none flex-1 placeholder:text-muted-foreground"
              />
            </div>

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setOpenNotif(v => !v); setOpenProfile(false); }}
                className="size-9 grid place-items-center rounded-lg glass hover:bg-white/10 transition relative"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 size-2 rounded-full bg-neon animate-pulse" />
                )}
              </button>
              {openNotif && (
                <div className="absolute right-0 mt-2 w-80 glass neon-border rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                    <div className="font-semibold text-sm">Notifications</div>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-primary/20 text-primary">{unreadCount} new</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {sampleNotifications.map(n => (
                      <div key={n.id} className={`px-4 py-3 border-b border-border/30 hover:bg-white/5 cursor-pointer ${n.unread ? "bg-primary/5" : ""}`}>
                        <div className="flex items-start gap-2">
                          {n.unread ? <span className="size-2 mt-1.5 rounded-full bg-neon shrink-0" /> : <CheckCircle2 className="size-3 mt-1 text-muted-foreground shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium">{n.title}</div>
                            <div className="text-xs text-muted-foreground">{n.body}</div>
                            <div className="text-[10px] text-muted-foreground mt-1">{n.time}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full px-4 py-2.5 text-xs text-primary hover:bg-white/5 font-medium">View all notifications</button>
                </div>
              )}
            </div>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setOpenProfile(v => !v); setOpenNotif(false); }}
                className="size-9 rounded-lg bg-gradient-primary grid place-items-center text-sm font-semibold glow hover:opacity-90 transition"
                aria-label="Profile menu"
              >
                {initials}
              </button>
              {openProfile && (
                <div className="absolute right-0 mt-2 w-64 glass neon-border rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-gradient-primary grid place-items-center text-sm font-semibold">{initials}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate">{profile?.full_name || "User"}</div>
                        <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] uppercase tracking-wider text-primary flex items-center gap-1">
                      <Sparkles className="size-2.5" /> {profile?.target_role || "Student"}
                    </div>
                  </div>
                  <div className="py-1">
                    <Link to="/dashboard/profile" onClick={() => setOpenProfile(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/5">
                      <User className="size-4" /> My Profile
                    </Link>
                    <Link to="/progress" onClick={() => setOpenProfile(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/5">
                      <Settings className="size-4" /> Progress & Settings
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-destructive/10 text-destructive">
                      <LogOut className="size-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

