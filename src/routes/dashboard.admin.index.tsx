import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/ui/StatCard";
import { Users, FileText, Brain, MessageSquareCode, Briefcase, TrendingUp, UserPlus, Target } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { motion } from "framer-motion";

export const Route = createFileRoute("/dashboard/admin/")({
  component: AdminOverview,
});

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#22d3ee", "#a78bfa", "#f472b6"];

function AdminOverview() {
  const [stats, setStats] = useState({
    users: 0, active: 0, resumes: 0, avgAts: 0,
    quizzes: 0, interviews: 0, jobs: 0, newWeek: 0,
  });
  const [growth, setGrowth] = useState<any[]>([]);
  const [atsDist, setAtsDist] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [quizPerf, setQuizPerf] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [profilesRes, resumesRes, logsRes] = await Promise.all([
        supabase.from("profiles").select("id, created_at, status"),
        supabase.from("resumes").select("ats_score, created_at"),
        supabase.from("activity_logs" as any).select("action, created_at, metadata"),
      ]);
      const profiles = profilesRes.data || [];
      const resumes = resumesRes.data || [];
      const logs = (logsRes.data as any[]) || [];

      const weekAgo = Date.now() - 7 * 864e5;
      const validScores = resumes.filter(r => r.ats_score != null);
      const avg = validScores.length
        ? Math.round(validScores.reduce((s, r) => s + (r.ats_score || 0), 0) / validScores.length)
        : 0;

      setStats({
        users: profiles.length,
        active: profiles.filter((p: any) => p.status !== "disabled").length,
        resumes: resumes.length,
        avgAts: avg,
        quizzes: logs.filter(l => l.action === "quiz_completed").length,
        interviews: logs.filter(l => l.action === "interview_completed").length,
        jobs: logs.filter(l => l.action === "job_matched").length,
        newWeek: profiles.filter((p: any) => new Date(p.created_at).getTime() > weekAgo).length,
      });

      // Growth over 12 weeks
      const buckets: Record<string, number> = {};
      for (let i = 11; i >= 0; i--) {
        const d = new Date(Date.now() - i * 7 * 864e5);
        const k = `W${12 - i}`;
        buckets[k] = 0;
      }
      profiles.forEach((p: any) => {
        const weeks = Math.floor((Date.now() - new Date(p.created_at).getTime()) / (7 * 864e5));
        if (weeks < 12) buckets[`W${12 - weeks}`]++;
      });
      let cum = 0;
      setGrowth(Object.entries(buckets).map(([week, n]) => ({ week, total: (cum += n), new: n })));

      // ATS distribution
      const bands = [
        { range: "0-40", count: 0 }, { range: "40-60", count: 0 },
        { range: "60-75", count: 0 }, { range: "75-90", count: 0 }, { range: "90-100", count: 0 },
      ];
      validScores.forEach(r => {
        const s = r.ats_score || 0;
        if (s < 40) bands[0].count++;
        else if (s < 60) bands[1].count++;
        else if (s < 75) bands[2].count++;
        else if (s < 90) bands[3].count++;
        else bands[4].count++;
      });
      setAtsDist(bands);

      // Daily activity last 14 days
      const days: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 864e5);
        days[d.toISOString().slice(5, 10)] = 0;
      }
      logs.forEach(l => {
        const k = new Date(l.created_at).toISOString().slice(5, 10);
        if (k in days) days[k]++;
      });
      setActivity(Object.entries(days).map(([day, count]) => ({ day, count })));

      // Quiz performance by score (from metadata)
      const perfBuckets = [
        { name: "Excellent (80+)", value: 0 },
        { name: "Good (60-79)", value: 0 },
        { name: "Average (40-59)", value: 0 },
        { name: "Needs work (<40)", value: 0 },
      ];
      logs.filter(l => l.action === "quiz_completed").forEach(l => {
        const s = l.metadata?.score ?? 0;
        if (s >= 80) perfBuckets[0].value++;
        else if (s >= 60) perfBuckets[1].value++;
        else if (s >= 40) perfBuckets[2].value++;
        else perfBuckets[3].value++;
      });
      if (perfBuckets.every(b => b.value === 0)) perfBuckets[1].value = 1; // placeholder
      setQuizPerf(perfBuckets);
    })();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.users.toString(), icon: Users, accent: "primary" as const },
    { label: "Active Users", value: stats.active.toString(), icon: UserPlus, accent: "accent" as const },
    { label: "Resumes Uploaded", value: stats.resumes.toString(), icon: FileText, accent: "neon" as const },
    { label: "Avg ATS Score", value: `${stats.avgAts}`, icon: Target, accent: "primary" as const },
    { label: "Quizzes Done", value: stats.quizzes.toString(), icon: Brain, accent: "accent" as const },
    { label: "Mock Interviews", value: stats.interviews.toString(), icon: MessageSquareCode, accent: "neon" as const },
    { label: "Job Matches", value: stats.jobs.toString(), icon: Briefcase, accent: "primary" as const },
    { label: "New This Week", value: stats.newWeek.toString(), icon: TrendingUp, accent: "accent" as const },
  ];

  return (
    <AdminShell title="Admin Overview" subtitle="Platform-wide activity at a glance">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass neon-border rounded-2xl p-5">
          <h3 className="font-display font-semibold mb-4">User Growth (12 weeks)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={growth}>
              <defs>
                <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6}/>
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.3}/>
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={11}/>
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11}/>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}/>
              <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#gTotal)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass neon-border rounded-2xl p-5">
          <h3 className="font-display font-semibold mb-4">ATS Score Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={atsDist}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.3}/>
              <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" fontSize={11}/>
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11}/>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}/>
              <Bar dataKey="count" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass neon-border rounded-2xl p-5">
          <h3 className="font-display font-semibold mb-4">Daily Activity (14 days)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={activity}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.3}/>
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11}/>
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11}/>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}/>
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }}/>
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass neon-border rounded-2xl p-5">
          <h3 className="font-display font-semibold mb-4">Quiz Performance</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={quizPerf} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {quizPerf.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}/>
              <Legend wrapperStyle={{ fontSize: 11 }}/>
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </AdminShell>
  );
}
