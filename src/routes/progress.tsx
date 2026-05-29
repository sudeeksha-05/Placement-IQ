import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, PolarRadiusAxis,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
  ComposedChart, RadialBarChart, RadialBar,
} from "recharts";
import { Flame, Trophy, TrendingUp, Target, Clock, BookOpen, Zap, Award } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { useMemo } from "react";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress — PlacementIQ" }] }),
  component: ProgressPage,
});

const trend = [
  { m: "Jul", ats: 45, quiz: 50, interview: 40 },
  { m: "Aug", ats: 58, quiz: 62, interview: 55 },
  { m: "Sep", ats: 67, quiz: 70, interview: 65 },
  { m: "Oct", ats: 75, quiz: 78, interview: 75 },
  { m: "Nov", ats: 82, quiz: 80, interview: 84 },
  { m: "Dec", ats: 87, quiz: 88, interview: 88 },
];

const radar = [
  { skill: "DSA", v: 78 },
  { skill: "Frontend", v: 92 },
  { skill: "Backend", v: 60 },
  { skill: "DB", v: 70 },
  { skill: "System Design", v: 45 },
  { skill: "Soft Skills", v: 85 },
];

const timeAllocation = [
  { name: "Coding", value: 42, color: "oklch(0.7 0.27 300)" },
  { name: "Mock Interview", value: 18, color: "oklch(0.7 0.2 220)" },
  { name: "Quizzes", value: 15, color: "oklch(0.75 0.18 180)" },
  { name: "Resume Work", value: 10, color: "oklch(0.78 0.18 90)" },
  { name: "Reading", value: 15, color: "oklch(0.72 0.2 30)" },
];

const weeklyHours = [
  { w: "W1", hours: 12, target: 15 },
  { w: "W2", hours: 18, target: 15 },
  { w: "W3", hours: 14, target: 15 },
  { w: "W4", hours: 22, target: 18 },
  { w: "W5", hours: 25, target: 18 },
  { w: "W6", hours: 28, target: 20 },
  { w: "W7", hours: 24, target: 20 },
  { w: "W8", hours: 30, target: 22 },
];

const quizCategory = [
  { c: "DSA", correct: 42, wrong: 8 },
  { c: "JS", correct: 38, wrong: 6 },
  { c: "React", correct: 45, wrong: 5 },
  { c: "SQL", correct: 28, wrong: 12 },
  { c: "System", correct: 18, wrong: 14 },
];

const consistency = [{ name: "Consistency", value: 87, fill: "oklch(0.7 0.27 300)" }];

const tooltipStyle = {
  background: "oklch(0.18 0.04 280)",
  border: "1px solid oklch(0.32 0.05 280)",
  borderRadius: 12,
  fontSize: 12,
};

function ProgressPage() {
  // Deterministic heatmap so it doesn't change on re-render
  const heat = useMemo(
    () => Array.from({ length: 84 }, (_, i) => ((i * 73) % 100) / 100),
    []
  );

  return (
    <DashboardShell title="Progress Analytics" subtitle="Your placement journey in numbers">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Current Streak" value="14d" delta="Best ever" icon={Flame} />
        <StatCard label="Rank" value="#42" delta="↑ 18 spots" icon={Trophy} accent="accent" />
        <StatCard label="Overall Growth" value="+92%" delta="Last 6 months" icon={TrendingUp} accent="neon" />
        <StatCard label="Goals Hit" value="38 / 50" icon={Target} />
      </div>

      {/* Row 1: Trends + Radar */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <motion.div whileHover={{ y: -2 }} className="lg:col-span-2 glass neon-border rounded-2xl p-6">
          <h3 className="font-display font-bold mb-1">Performance Trends</h3>
          <p className="text-xs text-muted-foreground mb-4">ATS · Quiz · Interview scores over time</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
              <XAxis dataKey="m" stroke="oklch(0.72 0.04 280)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.72 0.04 280)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="ats" stroke="oklch(0.7 0.27 300)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="quiz" stroke="oklch(0.7 0.2 220)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="interview" stroke="oklch(0.75 0.18 180)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6">
          <h3 className="font-display font-bold mb-4">Skills Radar</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radar}>
              <PolarGrid stroke="oklch(1 0 0 / 0.1)" />
              <PolarAngleAxis dataKey="skill" stroke="oklch(0.72 0.04 280)" fontSize={11} />
              <PolarRadiusAxis stroke="oklch(0.72 0.04 280)" tick={false} axisLine={false} />
              <Radar dataKey="v" stroke="oklch(0.7 0.27 300)" fill="oklch(0.7 0.27 300)" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Row 2: Pie + Weekly + Consistency */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6">
          <h3 className="font-display font-bold mb-1 flex items-center gap-2">
            <Clock className="size-4 text-neon" /> Time Allocation
          </h3>
          <p className="text-xs text-muted-foreground mb-2">How you spend study hours</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={timeAllocation} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {timeAllocation.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 text-xs mt-2">
            {timeAllocation.map((t) => (
              <div key={t.name} className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: t.color }} />
                <span className="text-muted-foreground truncate">{t.name}</span>
                <span className="ml-auto">{t.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="lg:col-span-1 glass neon-border rounded-2xl p-6">
          <h3 className="font-display font-bold mb-1 flex items-center gap-2">
            <Zap className="size-4 text-neon" /> Weekly Hours vs Target
          </h3>
          <p className="text-xs text-muted-foreground mb-2">Last 8 weeks</p>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={weeklyHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
              <XAxis dataKey="w" stroke="oklch(0.72 0.04 280)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.72 0.04 280)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="hours" fill="oklch(0.7 0.27 300)" radius={[6, 6, 0, 0]} />
              <Line type="monotone" dataKey="target" stroke="oklch(0.75 0.18 180)" strokeWidth={2} dot={false} strokeDasharray="4 4" />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6 relative">
          <h3 className="font-display font-bold mb-1 flex items-center gap-2">
            <Award className="size-4 text-neon" /> Consistency Score
          </h3>
          <p className="text-xs text-muted-foreground mb-2">14-day rolling</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart innerRadius="70%" outerRadius="100%" data={consistency} startAngle={90} endAngle={-270}>
              <RadialBar background={{ fill: "oklch(0.22 0.03 280)" }} dataKey="value" cornerRadius={20} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 grid place-items-center pointer-events-none mt-12">
            <div className="text-center">
              <p className="text-4xl font-display font-bold text-gradient">87</p>
              <p className="text-xs text-muted-foreground">/ 100</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Row 3: Quiz stacked + Cumulative area */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6">
          <h3 className="font-display font-bold mb-1 flex items-center gap-2">
            <BookOpen className="size-4 text-neon" /> Quiz Accuracy by Category
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Correct vs incorrect answers</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={quizCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
              <XAxis dataKey="c" stroke="oklch(0.72 0.04 280)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.72 0.04 280)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="correct" stackId="a" fill="oklch(0.7 0.27 300)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="wrong" stackId="a" fill="oklch(0.65 0.2 30)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6">
          <h3 className="font-display font-bold mb-1">Cumulative Study Hours</h3>
          <p className="text-xs text-muted-foreground mb-4">Total time invested</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={weeklyHours.map((w, i, a) => ({
              w: w.w,
              total: a.slice(0, i + 1).reduce((s, x) => s + x.hours, 0),
            }))}>
              <defs>
                <linearGradient id="cum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.75 0.18 180)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="oklch(0.75 0.18 180)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
              <XAxis dataKey="w" stroke="oklch(0.72 0.04 280)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.72 0.04 280)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="total" stroke="oklch(0.75 0.18 180)" strokeWidth={2} fill="url(#cum)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Heatmap */}
      <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6 mb-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-display font-bold">Activity Heatmap · Last 12 weeks</h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Less
            <span className="size-3 rounded bg-muted" />
            <span className="size-3 rounded bg-primary/20" />
            <span className="size-3 rounded bg-primary/40" />
            <span className="size-3 rounded bg-primary/70" />
            <span className="size-3 rounded bg-primary" />
            More
          </div>
        </div>
        <div className="grid grid-cols-12 gap-1.5">
          {heat.map((intensity, i) => {
            const bg = intensity > 0.8 ? "bg-primary" :
                       intensity > 0.6 ? "bg-primary/70" :
                       intensity > 0.4 ? "bg-primary/40" :
                       intensity > 0.2 ? "bg-primary/20" : "bg-muted";
            return <div key={i} className={`aspect-square rounded ${bg}`} title={`Day ${i + 1}`} />;
          })}
        </div>
      </motion.div>

      {/* Milestones */}
      <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6">
        <h3 className="font-display font-bold mb-4">Recent Milestones</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { t: "First 90+ ATS", d: "ATS score crossed 90", c: "oklch(0.7 0.27 300)" },
            { t: "30 quizzes", d: "Completed your 30th quiz", c: "oklch(0.7 0.2 220)" },
            { t: "10 interviews", d: "Mock interviews milestone", c: "oklch(0.75 0.18 180)" },
            { t: "14-day streak", d: "New personal best", c: "oklch(0.78 0.18 90)" },
          ].map((m) => (
            <div key={m.t} className="glass rounded-xl p-4">
              <div className="size-8 rounded-lg mb-2 grid place-items-center" style={{ background: m.c }}>
                <Trophy className="size-4 text-white" />
              </div>
              <p className="text-sm font-semibold">{m.t}</p>
              <p className="text-xs text-muted-foreground">{m.d}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
