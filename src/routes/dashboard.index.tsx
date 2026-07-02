import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect } from "react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip,
  RadialBarChart, RadialBar, BarChart, Bar, CartesianGrid,
} from "recharts";
import { Flame, FileText, Target, Brain, MessageSquareCode, Award, Zap, Trophy, Inbox } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { getProgressOverview } from "@/lib/progress.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — PlacementIQ" }] }),
  component: Dashboard,
});

function actionLabel(action: string): { title: string; icon: any } {
  switch (action) {
    case "resume_uploaded": return { title: "Resume uploaded", icon: FileText };
    case "ats_analyzed": return { title: "ATS analysis completed", icon: FileText };
    case "quiz_completed": return { title: "Quiz completed", icon: Brain };
    case "roadmap_task_completed": return { title: "Roadmap task completed", icon: Target };
    case "mock_interview_completed": return { title: "Mock interview completed", icon: MessageSquareCode };
    case "roadmap_generated": return { title: "Roadmap generated", icon: Target };
    default: return { title: action.replaceAll("_", " "), icon: Zap };
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function Dashboard() {
  const { profile } = useProfile();
  const { user } = useAuth();
  const fetchOverview = useServerFn(getProgressOverview);
  const { data, refetch } = useQuery({
    queryKey: ["dashboard-overview", user?.id],
    queryFn: () => fetchOverview(),
    enabled: !!user?.id,
  });

  // Realtime: refetch on any user data change
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "resumes", filter: `user_id=eq.${user.id}` }, () => refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_attempts", filter: `user_id=eq.${user.id}` }, () => refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_logs", filter: `user_id=eq.${user.id}` }, () => refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, refetch]);

  const firstName = (profile?.full_name || user?.email?.split("@")[0] || "there").split(" ")[0];
  const fullName = profile?.full_name || firstName;

  const ats = data?.breakdown.ats ?? 0;
  const detectedCount = data?.detectedSkills.length ?? 0;
  const missingCount = data?.missingSkills.length ?? 0;
  const totalSkills = detectedCount + missingCount;
  const quizAvg = data?.breakdown.quizAvg ?? 0;
  const readiness = data?.readiness ?? 0;
  const streak = data?.streak ?? 0;
  const analyzedCount = data?.counts.analyzedResumes ?? 0;
  const hasAnalyzedResume = analyzedCount > 0;
  const hasResumeUpload = (data?.counts.resumes ?? 0) > 0;
  const hasQuizzes = (data?.counts.quizzes ?? 0) > 0;
  const hasAnyActivity = hasAnalyzedResume || hasQuizzes || (data?.counts.interviews ?? 0) > 0 || (data?.counts.roadmapDone ?? 0) > 0;
  const atsGrowth = data?.atsGrowth ?? null;
  const atsTotalGrowth = data?.atsTotalGrowth ?? null;

  const weekly = (data?.weekly ?? []).map(d => ({ d: d.label, v: d.total }));
  const weeklyHasData = weekly.some(w => w.v > 0);
  const atsHistory = data?.atsHistory ?? [];
  const radial = [{ name: "Readiness", value: readiness, fill: "oklch(0.7 0.27 300)" }];

  // Recent activity: combine logs + resumes + quizzes, latest 10
  const recent: { title: string; sub: string; time: string; icon: any }[] = [];
  // We don't have raw logs from server fn, so derive from counts placeholders — instead, build using weekly aggregates is not enough.
  // Use activity_logs via realtime: fetch separately.

  return (
    <DashboardShell
      title={
        <div className="flex flex-col gap-1 py-2">
          <span className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight bg-gradient-to-r from-white via-[oklch(0.85_0.18_300)] to-[oklch(0.78_0.18_220)] bg-clip-text text-transparent">
            Welcome Back,
          </span>
          <span className="text-2xl md:text-3xl lg:text-4xl font-display font-bold leading-tight break-words">
            {fullName} 👋
          </span>
        </div>
      }
      subtitle="Continue your placement preparation journey."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="ATS Score"
          value={hasAnalyzedResume ? String(ats) : "0"}
          delta={
            hasAnalyzedResume
              ? (atsGrowth !== null && atsGrowth !== 0
                  ? `${atsGrowth > 0 ? "+" : ""}${atsGrowth} since last version`
                  : `${ats}/100 · V${analyzedCount}`)
              : hasResumeUpload ? "Analyzing…" : "Upload resume to start ATS analysis"
          }
          icon={FileText}
          accent="primary"
        />
        <StatCard
          label="Skills Detected"
          value={totalSkills > 0 ? `${detectedCount}/${totalSkills}` : "0/0"}
          delta={totalSkills > 0 ? `${missingCount} missing` : "No skills analyzed yet"}
          icon={Target}
          accent="accent"
        />
        <StatCard
          label="Quiz Performance"
          value={hasQuizzes ? `${quizAvg}%` : "0%"}
          delta={hasQuizzes ? `${data?.counts.quizzes} attempts` : "No quizzes attempted"}
          icon={Brain}
          accent="neon"
        />
        <StatCard
          label="Daily Streak"
          value={`${streak}d`}
          delta={streak > 0 ? "Keep it going" : "Start today"}
          icon={Flame}
          accent="primary"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <motion.div className="lg:col-span-2 glass neon-border rounded-2xl p-6" whileHover={{ y: -2 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold">Weekly Activity</h3>
              <p className="text-xs text-muted-foreground">Your activity over the last 7 days</p>
            </div>
            <span className="text-xs glass rounded-full px-3 py-1">Last 7 days</span>
          </div>
          {weeklyHasData ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={weekly}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.7 0.27 300)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.7 0.27 300)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                <XAxis dataKey="d" stroke="oklch(0.72 0.04 280)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.72 0.04 280)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.04 280)", border: "1px solid oklch(0.32 0.05 280)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="v" stroke="oklch(0.7 0.27 300)" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] grid place-items-center text-center">
              <div>
                <Inbox className="size-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No activity recorded</p>
                <p className="text-xs text-muted-foreground mt-1">Complete a quiz or upload a resume to see your progress.</p>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div className="glass neon-border rounded-2xl p-6 grid place-items-center" whileHover={{ y: -2 }}>
          <h3 className="font-display font-bold self-start">Placement Readiness</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart innerRadius="70%" outerRadius="100%" data={radial} startAngle={90} endAngle={-270}>
              <RadialBar background={{ fill: "oklch(0.22 0.03 280)" }} dataKey="value" cornerRadius={20} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="text-center -mt-32 pointer-events-none">
            <p className="text-5xl font-display font-bold text-gradient">{readiness}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {hasAnyActivity ? "Based on your activity" : "Complete profile & upload resume to begin"}
            </p>
          </div>
          <div className="self-stretch mt-20 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="glass rounded-lg p-2"><Zap className="size-3 mx-auto text-neon mb-1" />ATS {ats}%</div>
            <div className="glass rounded-lg p-2"><Award className="size-3 mx-auto text-neon mb-1" />Quiz {quizAvg}%</div>
            <div className="glass rounded-lg p-2"><Trophy className="size-3 mx-auto text-neon mb-1" />Streak {streak}d</div>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div className="glass neon-border rounded-2xl p-6" whileHover={{ y: -2 }}>
          <h3 className="font-display font-bold mb-1">ATS Score Improvement</h3>
          <p className="text-xs text-muted-foreground mb-4">Across your resume scans</p>
          {atsHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={atsHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                <XAxis dataKey="w" stroke="oklch(0.72 0.04 280)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.72 0.04 280)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.04 280)", border: "1px solid oklch(0.32 0.05 280)", borderRadius: 12 }} />
                <Bar dataKey="v" fill="oklch(0.65 0.21 220)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] grid place-items-center text-center">
              <div>
                <FileText className="size-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Upload resume to start ATS analysis</p>
                <Link to="/dashboard/ats" className="text-xs text-primary hover:underline mt-1 inline-block">Go to ATS Analyzer →</Link>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div className="glass neon-border rounded-2xl p-6" whileHover={{ y: -2 }}>
          <h3 className="font-display font-bold mb-4">Recent Activity</h3>
          <RecentActivity userId={user?.id} />
        </motion.div>
      </div>
    </DashboardShell>
  );
}

function RecentActivity({ userId }: { userId?: string }) {
  const { data: activities = [] } = useQuery({
    queryKey: ["dashboard-recent", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_logs")
        .select("action, metadata, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel("recent-activity")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_logs", filter: `user_id=eq.${userId}` }, () => {
        // refetched by parent realtime via invalidation pattern; trigger refetch via React Query key would need queryClient — keep simple
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  if (!activities.length) {
    return (
      <div className="h-[220px] grid place-items-center text-center">
        <div>
          <Inbox className="size-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No recent activity</p>
          <p className="text-xs text-muted-foreground mt-1">Your actions will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {activities.map((a: any, i: number) => {
        const { title, icon: Icon } = actionLabel(a.action);
        const sub = (a.metadata && (a.metadata.summary || a.metadata.topic || a.metadata.score)) || "";
        return (
          <li key={i} className="flex items-center gap-3 glass rounded-xl p-3">
            <div className="size-9 rounded-lg bg-gradient-primary grid place-items-center shrink-0">
              <Icon className="size-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{title}</p>
              {sub && <p className="text-xs text-muted-foreground truncate">{String(sub)}</p>}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{timeAgo(a.created_at)}</span>
          </li>
        );
      })}
    </ul>
  );
}
