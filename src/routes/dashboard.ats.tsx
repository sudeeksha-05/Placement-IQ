import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Upload, CheckCircle2, AlertTriangle, Download, FileText, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/dashboard/ats")({
  head: () => ({ meta: [{ title: "Resume ATS — PlacementIQ" }] }),
  component: ATS,
});

const score = 87;
const detected = ["React", "TypeScript", "Node.js", "Git", "REST APIs", "MongoDB", "Tailwind", "Next.js"];
const missing = ["Docker", "AWS", "GraphQL", "Testing (Jest)"];
const roles = ["Frontend Developer", "Backend Developer", "Data Analyst", "AI/ML Engineer", "Java Developer"];

function ATS() {
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (score / 100) * circumference;

  return (
    <DashboardShell title="Resume ATS Analyzer" subtitle="AI scoring tuned to top-tier ATS systems">
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Upload */}
        <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="size-4 text-neon" />
            <span className="text-xs uppercase tracking-widest text-neon-2">Scan resume</span>
          </div>
          <div className="glass-strong neon-border rounded-xl p-10 text-center cursor-pointer hover:bg-white/5 transition">
            <Upload className="size-8 mx-auto text-neon mb-3" />
            <p className="font-medium">Drop your PDF resume here</p>
            <p className="text-xs text-muted-foreground mt-1">or click to browse · PDF · 5MB max</p>
          </div>
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Target role</p>
            <div className="flex flex-wrap gap-2">
              {roles.map((r, i) => (
                <button key={r} className={`text-xs px-3 py-1.5 rounded-lg transition ${i === 0 ? "bg-gradient-primary text-white glow" : "glass hover:bg-white/10"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Score circle */}
        <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6 grid place-items-center text-center">
          <p className="text-xs uppercase tracking-widest text-neon-2 self-start">ATS Score</p>
          <div className="relative size-44 my-2">
            <svg viewBox="0 0 160 160" className="size-full -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="oklch(0.22 0.03 280)" strokeWidth="12" fill="none" />
              <circle
                cx="80" cy="80" r="70" fill="none" strokeWidth="12" strokeLinecap="round"
                stroke="url(#grad)"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="oklch(0.7 0.27 300)" />
                  <stop offset="100%" stopColor="oklch(0.7 0.2 220)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div>
                <p className="text-5xl font-display font-bold text-gradient">{score}</p>
                <p className="text-xs text-muted-foreground">out of 100</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-neon-2 mb-3">Top 8% · Excellent match</p>
          <button className="text-xs px-4 py-2 rounded-lg bg-gradient-primary text-white glow flex items-center gap-2">
            <Download className="size-3.5" /> Download report
          </button>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6">
          <h3 className="font-display font-bold mb-1 flex items-center gap-2">
            <CheckCircle2 className="size-4 text-neon-2" /> Detected Skills
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Found in your resume</p>
          <div className="flex flex-wrap gap-2">
            {detected.map((s) => (
              <span key={s} className="text-xs px-3 py-1.5 rounded-lg glass border border-neon-2/30 text-neon-2">
                {s}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6">
          <h3 className="font-display font-bold mb-1 flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" /> Missing Keywords
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Recommended for Frontend Developer roles</p>
          <div className="flex flex-wrap gap-2">
            {missing.map((s) => (
              <span key={s} className="text-xs px-3 py-1.5 rounded-lg glass border border-destructive/30 text-destructive">
                + {s}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6">
        <h3 className="font-display font-bold mb-4">Improvement Suggestions</h3>
        <ul className="space-y-3">
          {[
            { ok: true, t: "Strong technical vocabulary in the skills section" },
            { ok: true, t: "Quantified impact in 4 of 5 bullet points" },
            { ok: false, t: "Add a dedicated 'Projects' section with GitHub links" },
            { ok: false, t: "Use stronger action verbs: 'architected', 'optimized', 'shipped'" },
            { ok: false, t: "Resume is 2 pages — recruiters prefer 1 page for fresher roles" },
          ].map((s, i) => (
            <li key={i} className="flex gap-3 glass rounded-xl p-3">
              {s.ok ? (
                <CheckCircle2 className="size-4 text-neon-2 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
              )}
              <span className="text-sm">{s.t}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6 mt-4">
        <h3 className="font-display font-bold mb-4 flex items-center gap-2">
          <FileText className="size-4" /> Resume History
        </h3>
        <div className="space-y-2">
          {[
            { v: "v6", date: "Today", score: 87 },
            { v: "v5", date: "5 days ago", score: 82 },
            { v: "v4", date: "2 weeks ago", score: 75 },
            { v: "v3", date: "1 month ago", score: 61 },
          ].map((h) => (
            <div key={h.v} className="flex items-center justify-between glass rounded-xl p-3">
              <div>
                <p className="text-sm font-medium">Resume {h.v}</p>
                <p className="text-xs text-muted-foreground">{h.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-display font-bold text-gradient">{h.score}</span>
                <button className="text-xs px-3 py-1.5 rounded-lg glass hover:bg-white/10">View</button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
