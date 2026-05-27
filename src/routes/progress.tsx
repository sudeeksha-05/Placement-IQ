import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, PolarRadiusAxis,
} from "recharts";
import { Flame, Trophy, TrendingUp, Target } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress — PlacementIQ" }] }),
  component: Progress,
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

function Progress() {
  return (
    <DashboardShell title="Progress Analytics" subtitle="Your placement journey in numbers">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Current Streak" value="14d" delta="Best ever" icon={Flame} />
        <StatCard label="Rank" value="#42" delta="↑ 18 spots" icon={Trophy} accent="accent" />
        <StatCard label="Overall Growth" value="+92%" delta="Last 6 months" icon={TrendingUp} accent="neon" />
        <StatCard label="Goals Hit" value="38 / 50" icon={Target} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div whileHover={{ y: -2 }} className="lg:col-span-2 glass neon-border rounded-2xl p-6">
          <h3 className="font-display font-bold mb-1">Performance Trends</h3>
          <p className="text-xs text-muted-foreground mb-4">ATS · Quiz · Interview scores over time</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
              <XAxis dataKey="m" stroke="oklch(0.72 0.04 280)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.72 0.04 280)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "oklch(0.18 0.04 280)", border: "1px solid oklch(0.32 0.05 280)", borderRadius: 12 }} />
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

      <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6 mt-4">
        <h3 className="font-display font-bold mb-4">Activity Heatmap · Last 12 weeks</h3>
        <div className="grid grid-cols-12 gap-1.5">
          {Array.from({ length: 84 }).map((_, i) => {
            const intensity = Math.random();
            const bg = intensity > 0.8 ? "bg-primary" :
                       intensity > 0.6 ? "bg-primary/70" :
                       intensity > 0.4 ? "bg-primary/40" :
                       intensity > 0.2 ? "bg-primary/20" : "bg-muted";
            return <div key={i} className={`aspect-square rounded ${bg}`} />;
          })}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
