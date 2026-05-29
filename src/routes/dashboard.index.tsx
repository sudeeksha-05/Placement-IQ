import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip,
  RadialBarChart, RadialBar, BarChart, Bar, CartesianGrid,
} from "recharts";
import { Flame, FileText, Target, Brain, MessageSquareCode, Award, Zap, Trophy } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { useProfile } from "@/hooks/useProfile";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — PlacementIQ" }] }),
  component: Dashboard,
});

const weekly = [
  { d: "Mon", v: 32 }, { d: "Tue", v: 48 }, { d: "Wed", v: 41 },
  { d: "Thu", v: 65 }, { d: "Fri", v: 58 }, { d: "Sat", v: 78 }, { d: "Sun", v: 72 },
];
const ats = [
  { w: "W1", v: 52 }, { w: "W2", v: 61 }, { w: "W3", v: 70 },
  { w: "W4", v: 75 }, { w: "W5", v: 82 }, { w: "W6", v: 87 },
];
const radial = [{ name: "Readiness", value: 78, fill: "oklch(0.7 0.27 300)" }];

function Dashboard() {
  const { profile } = useProfile();
  const firstName = (profile?.full_name || "there").split(" ")[0];
  return (
    <DashboardShell title={`Welcome back, ${firstName} 👋`} subtitle="Here's how your placement prep is trending">

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="ATS Score" value="87" delta="+12 this week" icon={FileText} accent="primary" />
        <StatCard label="Skills Detected" value="24/32" delta="+3 new" icon={Target} accent="accent" />
        <StatCard label="Quiz Performance" value="82%" delta="+8%" icon={Brain} accent="neon" />
        <StatCard label="Daily Streak" value="14d" delta="Personal best" icon={Flame} accent="primary" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <motion.div className="lg:col-span-2 glass neon-border rounded-2xl p-6" whileHover={{ y: -2 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold">Weekly Activity</h3>
              <p className="text-xs text-muted-foreground">Hours spent prepping</p>
            </div>
            <span className="text-xs glass rounded-full px-3 py-1">Last 7 days</span>
          </div>
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
              <YAxis stroke="oklch(0.72 0.04 280)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "oklch(0.18 0.04 280)", border: "1px solid oklch(0.32 0.05 280)", borderRadius: 12 }} />
              <Area type="monotone" dataKey="v" stroke="oklch(0.7 0.27 300)" strokeWidth={2} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="glass neon-border rounded-2xl p-6 grid place-items-center" whileHover={{ y: -2 }}>
          <h3 className="font-display font-bold self-start">Placement Readiness</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart innerRadius="70%" outerRadius="100%" data={radial} startAngle={90} endAngle={-270}>
              <RadialBar background={{ fill: "oklch(0.22 0.03 280)" }} dataKey="value" cornerRadius={20} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="text-center -mt-32 pointer-events-none">
            <p className="text-5xl font-display font-bold text-gradient">78%</p>
            <p className="text-xs text-muted-foreground mt-1">Top 12% of cohort</p>
          </div>
          <div className="self-stretch mt-20 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="glass rounded-lg p-2"><Zap className="size-3 mx-auto text-neon mb-1" />Fast learner</div>
            <div className="glass rounded-lg p-2"><Award className="size-3 mx-auto text-neon mb-1" />5 badges</div>
            <div className="glass rounded-lg p-2"><Trophy className="size-3 mx-auto text-neon mb-1" />Rank #42</div>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div className="glass neon-border rounded-2xl p-6" whileHover={{ y: -2 }}>
          <h3 className="font-display font-bold mb-1">ATS Score Improvement</h3>
          <p className="text-xs text-muted-foreground mb-4">Last 6 weeks</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ats}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
              <XAxis dataKey="w" stroke="oklch(0.72 0.04 280)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.72 0.04 280)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "oklch(0.18 0.04 280)", border: "1px solid oklch(0.32 0.05 280)", borderRadius: 12 }} />
              <Bar dataKey="v" fill="oklch(0.65 0.21 220)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="glass neon-border rounded-2xl p-6" whileHover={{ y: -2 }}>
          <h3 className="font-display font-bold mb-4">Recent Activity</h3>
          <ul className="space-y-3">
            {[
              { i: MessageSquareCode, t: "Completed Mock Interview · Frontend", s: "Confidence 88%", time: "2h ago" },
              { i: Brain, t: "Aced DSA Quiz · Trees & Graphs", s: "9/10 correct", time: "5h ago" },
              { i: FileText, t: "Resume re-scanned", s: "ATS 82 → 87", time: "Yesterday" },
              { i: Target, t: "Added 3 new skills", s: "TypeScript, Docker, Redis", time: "2d ago" },
            ].map((a, i) => (
              <li key={i} className="flex items-center gap-3 glass rounded-xl p-3">
                <div className="size-9 rounded-lg bg-gradient-primary grid place-items-center shrink-0">
                  <a.i className="size-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.t}</p>
                  <p className="text-xs text-muted-foreground">{a.s}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{a.time}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
