import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Video, Mic, MessageSquareCode, Play, BarChart3 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/dashboard/interview")({
  head: () => ({ meta: [{ title: "Mock Interview — PlacementIQ" }] }),
  component: Interview,
});

const sessions = [
  { type: "Technical · Frontend", date: "Today, 14:00", score: 88 },
  { type: "HR Round", date: "Yesterday", score: 92 },
  { type: "Coding · DSA Medium", date: "2 days ago", score: 74 },
];

function Interview() {
  return (
    <DashboardShell title="Mock Interview" subtitle="AI-driven simulation · voice, video & coding rounds">
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {[
          { i: Video, t: "Technical Round", d: "DSA + system design questions", c: "from-primary/40 to-accent/20" },
          { i: Mic, t: "HR Round", d: "Behavioral & culture-fit questions", c: "from-accent/40 to-neon-2/20" },
          { i: MessageSquareCode, t: "Coding Round", d: "Live coding with AI feedback", c: "from-neon/40 to-primary/20" },
        ].map((s) => (
          <motion.div
            key={s.t}
            whileHover={{ y: -4 }}
            className="glass neon-border rounded-2xl p-6 cursor-pointer relative overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${s.c} opacity-40`} />
            <div className="relative">
              <div className="size-12 rounded-xl bg-gradient-primary grid place-items-center glow mb-3">
                <s.i className="size-5 text-white" />
              </div>
              <h3 className="font-display font-bold text-lg">{s.t}</h3>
              <p className="text-sm text-muted-foreground mt-1">{s.d}</p>
              <button className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-primary text-white text-xs glow">
                <Play className="size-3" /> Start Session
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div whileHover={{ y: -2 }} className="glass-strong neon-border rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-neon" />
            <h3 className="font-display font-bold">Latest Session Feedback</h3>
          </div>
          <span className="text-xs glass rounded-full px-3 py-1">Today, 14:00</span>
        </div>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { label: "Overall", v: 88, color: "text-gradient" },
            { label: "Confidence", v: 92, color: "text-neon-2" },
            { label: "Clarity", v: 84, color: "text-neon" },
            { label: "Technical Depth", v: 86, color: "text-accent" },
          ].map((m) => (
            <div key={m.label} className="glass rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{m.label}</p>
              <p className={`text-3xl font-display font-bold mt-2 ${m.color}`}>{m.v}</p>
              <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-primary" style={{ width: `${m.v}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 glass rounded-xl p-4 text-sm">
          <p className="text-xs uppercase text-neon-2 tracking-widest mb-2">AI Notes</p>
          <p>Strong communication and structured answers. Improve depth on <span className="text-neon-2">React reconciliation</span> and provide more concrete examples for <span className="text-neon-2">conflict resolution</span> questions.</p>
        </div>
      </motion.div>

      <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6">
        <h3 className="font-display font-bold mb-4">Recent Sessions</h3>
        <div className="space-y-2">
          {sessions.map((s, i) => (
            <div key={i} className="flex items-center justify-between glass rounded-xl p-3">
              <div>
                <p className="text-sm font-medium">{s.type}</p>
                <p className="text-xs text-muted-foreground">{s.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-display font-bold text-gradient">{s.score}</span>
                <button className="text-xs px-3 py-1.5 rounded-lg glass hover:bg-white/10">Replay</button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
