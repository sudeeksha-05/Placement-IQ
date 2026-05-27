import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Sparkles, BookOpen, Code, Briefcase } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/dashboard/roadmap")({
  head: () => ({ meta: [{ title: "AI Roadmap — PlacementIQ" }] }),
  component: Roadmap,
});

const phases = [
  {
    icon: BookOpen,
    week: "Week 1–2",
    title: "Foundations Reinforcement",
    items: [
      { done: true, t: "Master ES6+ JavaScript patterns" },
      { done: true, t: "Solid React hooks fundamentals" },
      { done: false, t: "TypeScript generics deep-dive" },
    ],
  },
  {
    icon: Code,
    week: "Week 3–4",
    title: "Build Portfolio Project",
    items: [
      { done: false, t: "Full-stack project with auth & DB" },
      { done: false, t: "Deploy to Vercel + custom domain" },
      { done: false, t: "Write README with screenshots & demo" },
    ],
  },
  {
    icon: Briefcase,
    week: "Week 5–6",
    title: "Interview Sprint",
    items: [
      { done: false, t: "Daily DSA — Arrays, Strings, Trees" },
      { done: false, t: "5 mock interviews with feedback" },
      { done: false, t: "System Design — URL shortener, chat app" },
    ],
  },
];

function Roadmap() {
  return (
    <DashboardShell title="AI Career Roadmap" subtitle="6-week sprint to a Frontend Developer offer">
      <motion.div className="glass-strong neon-border rounded-2xl p-6 mb-6 flex items-center gap-4" whileHover={{ y: -2 }}>
        <div className="size-12 rounded-xl bg-gradient-primary grid place-items-center glow">
          <Sparkles className="size-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-neon-2">Personalized for Aditi</p>
          <h3 className="font-display font-bold text-lg">You're on a 14-day streak — keep going!</h3>
        </div>
        <div className="text-right">
          <p className="text-3xl font-display font-bold text-gradient">38%</p>
          <p className="text-xs text-muted-foreground">complete</p>
        </div>
      </motion.div>

      <div className="space-y-4">
        {phases.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass neon-border rounded-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-xl bg-gradient-primary grid place-items-center glow shrink-0">
                <p.icon className="size-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-neon-2">{p.week}</p>
                <h3 className="font-display font-bold text-lg mb-3">{p.title}</h3>
                <ul className="space-y-2">
                  {p.items.map((it, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      {it.done
                        ? <CheckCircle2 className="size-4 text-neon-2" />
                        : <Circle className="size-4 text-muted-foreground" />}
                      <span className={it.done ? "text-muted-foreground line-through" : ""}>{it.t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </DashboardShell>
  );
}
