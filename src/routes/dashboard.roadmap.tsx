import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Sparkles, BookOpen, Code, Briefcase, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useProfile } from "@/hooks/useProfile";

export const Route = createFileRoute("/dashboard/roadmap")({
  head: () => ({ meta: [{ title: "AI Roadmap — PlacementIQ" }] }),
  component: Roadmap,
});

const STORAGE_KEY = "placementiq:roadmap:done";

function buildPhases(role: string, skills: string[]) {
  const r = role || "your target role";
  return [
    {
      icon: BookOpen,
      week: "Week 1–2",
      title: "Foundations Reinforcement",
      items: [
        `Refresh core CS fundamentals for ${r}`,
        skills[0] ? `Deep-dive into ${skills[0]} advanced patterns` : "Pick your primary tech stack",
        "Solve 20 easy DSA problems (Arrays, Strings)",
      ],
    },
    {
      icon: Code,
      week: "Week 3–4",
      title: "Build Portfolio Project",
      items: [
        `Ship a portfolio project for a ${r} role`,
        "Deploy live with custom domain",
        "Write a README with screenshots & demo",
      ],
    },
    {
      icon: Briefcase,
      week: "Week 5–6",
      title: "Interview Sprint",
      items: [
        "Daily DSA — Trees, Graphs, DP",
        "5 mock interviews with AI feedback",
        `System Design tailored to ${r}`,
      ],
    },
  ];
}

function Roadmap() {
  const { profile, loading } = useProfile();
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
  });

  const phases = useMemo(
    () => buildPhases(profile?.target_role ?? "", profile?.skills ?? []),
    [profile?.target_role, profile?.skills],
  );

  const allItems = phases.flatMap((p, i) => p.items.map((_, j) => `${i}-${j}`));
  const completed = allItems.filter((k) => done[k]).length;
  const pct = allItems.length ? Math.round((completed / allItems.length) * 100) : 0;

  const toggle = (k: string) => {
    setDone((d) => {
      const next = { ...d, [k]: !d[k] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  if (loading) {
    return (
      <DashboardShell title="AI Career Roadmap">
        <div className="grid place-items-center py-20"><Loader2 className="size-6 animate-spin text-neon" /></div>
      </DashboardShell>
    );
  }

  const firstName = (profile?.full_name || "there").split(" ")[0];
  const role = profile?.target_role || "your dream role";

  return (
    <DashboardShell title="AI Career Roadmap" subtitle={`6-week sprint toward ${role}`}>
      <motion.div className="glass-strong neon-border rounded-2xl p-6 mb-6 flex items-center gap-4" whileHover={{ y: -2 }}>
        <div className="size-12 rounded-xl bg-gradient-primary grid place-items-center glow">
          <Sparkles className="size-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-widest text-neon-2">Personalized for {firstName}</p>
          <h3 className="font-display font-bold text-lg truncate">
            {profile?.target_role
              ? `Your plan to land a ${profile.target_role} role`
              : <>Set a target role on <Link to="/dashboard/profile" className="underline text-gradient">your profile</Link> to personalize</>}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-3xl font-display font-bold text-gradient">{pct}%</p>
          <p className="text-xs text-muted-foreground">{completed}/{allItems.length} done</p>
        </div>
      </motion.div>

      <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-6">
        <div className="h-full bg-gradient-primary transition-all" style={{ width: `${pct}%` }} />
      </div>

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
                  {p.items.map((t, j) => {
                    const k = `${i}-${j}`;
                    const isDone = !!done[k];
                    return (
                      <li key={j}>
                        <button type="button" onClick={() => toggle(k)} className="flex items-center gap-2 text-sm text-left w-full hover:bg-white/5 rounded-md px-2 py-1 transition">
                          {isDone
                            ? <CheckCircle2 className="size-4 text-neon-2 shrink-0" />
                            : <Circle className="size-4 text-muted-foreground shrink-0" />}
                          <span className={isDone ? "text-muted-foreground line-through" : ""}>{t}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </DashboardShell>
  );
}
