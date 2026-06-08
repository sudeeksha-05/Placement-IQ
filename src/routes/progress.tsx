import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Bar, AreaChart, Area, RadialBarChart, RadialBar,
} from "recharts";
import { Flame, Trophy, TrendingUp, Target, BookOpen, Sparkles, RefreshCw } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Progress } from "@/components/ui/progress";
import { getProgressOverview } from "@/lib/progress.functions";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress — PlacementIQ" }] }),
  component: ProgressPage,
});

const tooltipStyle = {
  background: "oklch(0.18 0.04 280)",
  border: "1px solid oklch(0.32 0.05 280)",
  borderRadius: 12,
  fontSize: 12,
};

function ProgressPage() {
  const fetchOverview = useServerFn(getProgressOverview);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["progress-overview"],
    queryFn: () => fetchOverview({}),
    staleTime: 30_000,
  });

  // realtime: refresh when relevant tables change for this user
  useEffect(() => {
    const ch = supabase
      .channel("progress-refresh")
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_attempts" }, () => refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "resumes" }, () => refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_logs" }, () => refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  if (isLoading || !data) {
    return (
      <DashboardShell title="Progress Analytics" subtitle="Loading your personalized analytics…">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass neon-border rounded-2xl h-28 animate-pulse" />
          ))}
        </div>
      </DashboardShell>
    );
  }

  const {
    readiness, breakdown, counts, weekly, atsHistory,
    topicAverages, strongTopics, weakTopics, quizTrend,
    skillProgress, missingSkills, streak, insights, profile,
  } = data;

  const radial = [{ name: "Readiness", value: readiness, fill: "oklch(0.7 0.27 300)" }];
  const radar = topicAverages.length
    ? topicAverages.slice(0, 6).map((t) => ({ skill: t.topic, v: t.avg }))
    : [{ skill: "No quizzes yet", v: 0 }];

  return (
    <DashboardShell
      title="Progress Analytics"
      subtitle={profile.targetRole ? `Personalized for ${profile.targetRole}` : "Your placement journey in numbers"}
    >
      <div className="flex justify-end mb-3">
        <button
          onClick={() => refetch()}
          className="glass neon-border rounded-full px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-white/5"
        >
          <RefreshCw className={`size-3 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Current Streak" value={`${streak}d`} delta={streak > 0 ? "Active" : "Start today"} icon={Flame} />
        <StatCard label="Quizzes Taken" value={String(counts.quizzes)} delta={quizTrend >= 0 ? `▲ ${quizTrend}%` : `▼ ${Math.abs(quizTrend)}%`} icon={Trophy} accent="accent" />
        <StatCard label="Quiz Avg" value={`${breakdown.quizAvg}%`} delta={`${counts.quizzes} attempts`} icon={TrendingUp} accent="neon" />
        <StatCard label="Roadmap Done" value={`${counts.roadmapDone}/${counts.roadmapTotal}`} delta={`${breakdown.roadmapCompletion}%`} icon={Target} />
      </div>

      {/* Row 1: Weekly + Readiness */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <motion.div whileHover={{ y: -2 }} className="lg:col-span-2 glass neon-border rounded-2xl p-6">
          <h3 className="font-display font-bold mb-1">Weekly Activity</h3>
          <p className="text-xs text-muted-foreground mb-4">Quizzes · roadmap tasks · interviews · ATS scans (last 7 days)</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
              <XAxis dataKey="label" stroke="oklch(0.72 0.04 280)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.72 0.04 280)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="quizzes" stackId="a" fill="oklch(0.7 0.27 300)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="roadmap" stackId="a" fill="oklch(0.7 0.2 220)" />
              <Bar dataKey="interviews" stackId="a" fill="oklch(0.75 0.18 180)" />
              <Bar dataKey="ats" stackId="a" fill="oklch(0.78 0.18 90)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6 grid place-items-center relative">
          <h3 className="font-display font-bold self-start">Placement Readiness</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart innerRadius="70%" outerRadius="100%" data={radial} startAngle={90} endAngle={-270}>
              <RadialBar background={{ fill: "oklch(0.22 0.03 280)" }} dataKey="value" cornerRadius={20} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="text-center -mt-32 pointer-events-none">
            <p className="text-5xl font-display font-bold text-gradient">{readiness}%</p>
            <p className="text-xs text-muted-foreground mt-1">based on your data</p>
          </div>
          <div className="self-stretch mt-16 space-y-1.5 text-xs">
            {[
              { l: "ATS", v: breakdown.ats, w: 25 },
              { l: "Skills", v: breakdown.skillCompletion, w: 25 },
              { l: "Quiz", v: breakdown.quizAvg, w: 20 },
              { l: "Roadmap", v: breakdown.roadmapCompletion, w: 20 },
              { l: "Interview", v: breakdown.interviewAvg, w: 10 },
            ].map((r) => (
              <div key={r.l} className="flex items-center gap-2">
                <span className="w-16 text-muted-foreground">{r.l}</span>
                <Progress value={r.v} className="h-1.5 flex-1" />
                <span className="w-10 text-right">{r.v}%</span>
                <span className="w-8 text-right text-muted-foreground">·{r.w}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Insights */}
      <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6 mb-4">
        <h3 className="font-display font-bold mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-neon" /> AI Insights
        </h3>
        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">Use the platform a bit more to unlock personalized insights.</p>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-2">
            {insights.map((s, i) => (
              <li key={i} className="glass rounded-xl p-3 text-sm flex gap-2">
                <Sparkles className="size-4 text-neon shrink-0 mt-0.5" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      {/* Row 2: Topic radar + Strong/Weak */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6">
          <h3 className="font-display font-bold mb-4">Quiz Topics Radar</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radar}>
              <PolarGrid stroke="oklch(1 0 0 / 0.1)" />
              <PolarAngleAxis dataKey="skill" stroke="oklch(0.72 0.04 280)" fontSize={11} />
              <Radar dataKey="v" stroke="oklch(0.7 0.27 300)" fill="oklch(0.7 0.27 300)" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6">
          <h3 className="font-display font-bold mb-3 flex items-center gap-2">
            <BookOpen className="size-4 text-neon" /> Strong Topics
          </h3>
          {strongTopics.length === 0 ? (
            <p className="text-sm text-muted-foreground">No quiz data yet.</p>
          ) : (
            <ul className="space-y-2">
              {strongTopics.map((t) => (
                <li key={t.topic} className="glass rounded-xl p-3">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium truncate">{t.topic}</span>
                    <span className="text-neon">{t.avg}%</span>
                  </div>
                  <Progress value={t.avg} className="h-1.5" />
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6">
          <h3 className="font-display font-bold mb-3">Weak Topics</h3>
          {weakTopics.length === 0 ? (
            <p className="text-sm text-muted-foreground">No quiz data yet.</p>
          ) : (
            <ul className="space-y-2">
              {weakTopics.map((t) => (
                <li key={t.topic} className="glass rounded-xl p-3">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium truncate">{t.topic}</span>
                    <span className="text-orange-400">{t.avg}%</span>
                  </div>
                  <Progress value={t.avg} className="h-1.5" />
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>

      {/* Row 3: ATS history + Skills */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6">
          <h3 className="font-display font-bold mb-1">ATS Score Trend</h3>
          <p className="text-xs text-muted-foreground mb-4">Across your resume scans</p>
          {atsHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Upload a resume to see your ATS trend.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={atsHistory}>
                <defs>
                  <linearGradient id="atsg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.7 0.27 300)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.7 0.27 300)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                <XAxis dataKey="w" stroke="oklch(0.72 0.04 280)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.72 0.04 280)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="v" stroke="oklch(0.7 0.27 300)" strokeWidth={2} fill="url(#atsg)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6">
          <h3 className="font-display font-bold mb-1">Skill Progress vs Target Role</h3>
          <p className="text-xs text-muted-foreground mb-4">{profile.targetRole || "Set a target role in profile"}</p>
          {skillProgress.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add skills to your profile or upload a resume.</p>
          ) : (
            <ul className="space-y-2.5">
              {skillProgress.map((s) => (
                <li key={s.skill}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate">{s.skill}</span>
                    <span className={s.value >= 80 ? "text-neon" : "text-muted-foreground"}>{s.value}%</span>
                  </div>
                  <Progress value={s.value} className="h-1.5" />
                </li>
              ))}
            </ul>
          )}
          {missingSkills.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-xs text-muted-foreground mb-2">Missing skills</p>
              <div className="flex flex-wrap gap-1.5">
                {missingSkills.slice(0, 8).map((s) => (
                  <span key={s} className="text-xs glass rounded-full px-2.5 py-1">{s}</span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Cumulative study trend */}
      <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6">
        <h3 className="font-display font-bold mb-1">Daily Study Hours (estimated)</h3>
        <p className="text-xs text-muted-foreground mb-4">Based on your tracked activity</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={weekly}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
            <XAxis dataKey="label" stroke="oklch(0.72 0.04 280)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="oklch(0.72 0.04 280)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="hours" stroke="oklch(0.75 0.18 180)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </DashboardShell>
  );
}
