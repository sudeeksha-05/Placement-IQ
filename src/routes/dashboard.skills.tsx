import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Target, BookOpen, Award } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/dashboard/skills")({
  head: () => ({ meta: [{ title: "Skill Gap — PlacementIQ" }] }),
  component: Skills,
});

const skills = [
  { name: "React", have: 90, need: 90 },
  { name: "TypeScript", have: 75, need: 85 },
  { name: "Node.js", have: 60, need: 80 },
  { name: "System Design", have: 30, need: 70 },
  { name: "Docker", have: 10, need: 60 },
  { name: "AWS", have: 5, need: 65 },
  { name: "Testing", have: 25, need: 70 },
];

function Skills() {
  return (
    <DashboardShell title="Skill Gap Analyzer" subtitle="Frontend Developer · Target: top product company">
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Stat icon={Target} label="Skills Matched" value="3 / 7" tone="primary" />
        <Stat icon={BookOpen} label="Avg Gap" value="36%" tone="accent" />
        <Stat icon={Award} label="Time to Ready" value="6 wks" tone="neon" />
      </div>

      <motion.div className="glass neon-border rounded-2xl p-6 mb-6" whileHover={{ y: -2 }}>
        <h3 className="font-display font-bold mb-1">Current vs Target</h3>
        <p className="text-xs text-muted-foreground mb-6">Hover to see exact %</p>
        <div className="space-y-4">
          {skills.map((s) => (
            <div key={s.name}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium">{s.name}</span>
                <span className="text-xs text-muted-foreground">{s.have}% / {s.need}%</span>
              </div>
              <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-gradient-primary rounded-full transition-all" style={{ width: `${s.have}%` }} />
                <div className="absolute inset-y-0 w-0.5 bg-neon-2" style={{ left: `${s.need}%` }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div className="glass neon-border rounded-2xl p-6" whileHover={{ y: -2 }}>
          <h3 className="font-display font-bold mb-4">Suggested Projects</h3>
          <ul className="space-y-3">
            {[
              "Build a Dockerized REST API with auth",
              "Deploy a Next.js app to AWS with CI/CD",
              "Write integration tests for a React app with Jest",
              "Design a URL shortener with system design write-up",
            ].map((p, i) => (
              <li key={i} className="glass rounded-xl p-3 text-sm flex gap-3">
                <span className="size-6 rounded-md bg-gradient-primary grid place-items-center text-xs font-bold shrink-0">{i + 1}</span>
                {p}
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div className="glass neon-border rounded-2xl p-6" whileHover={{ y: -2 }}>
          <h3 className="font-display font-bold mb-4">Recommended Certifications</h3>
          <ul className="space-y-3">
            {[
              { t: "AWS Certified Cloud Practitioner", time: "4 weeks" },
              { t: "Meta Frontend Developer Cert", time: "6 weeks" },
              { t: "Docker Certified Associate", time: "3 weeks" },
              { t: "JavaScript Algorithms — freeCodeCamp", time: "Self-paced" },
            ].map((c, i) => (
              <li key={i} className="glass rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{c.t}</p>
                  <p className="text-xs text-muted-foreground">{c.time}</p>
                </div>
                <button className="text-xs px-3 py-1.5 rounded-lg bg-gradient-primary text-white glow">Start</button>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </DashboardShell>
  );
}

function Stat({ icon: Icon, label, value, tone }: any) {
  return (
    <div className="glass neon-border rounded-2xl p-5 flex items-center gap-4">
      <div className="size-12 rounded-xl bg-gradient-primary grid place-items-center glow">
        <Icon className="size-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-display font-bold">{value}</p>
      </div>
    </div>
  );
}
