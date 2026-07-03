import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, BookOpen, Award, Sparkles, Loader2, TrendingUp, AlertTriangle,
  CheckCircle2, ExternalLink, RefreshCw, Zap, Clock, Github,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { analyzeSkillGap } from "@/lib/skills.functions";
import { useProfile } from "@/hooks/useProfile";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/dashboard/skills")({
  head: () => ({ meta: [{ title: "Skill Gap — PlacementIQ" }] }),
  component: Skills,
});

const ROLES = [
  "Data Scientist", "Data Analyst", "Machine Learning Engineer", "AI Engineer",
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "DevOps Engineer", "Cloud Engineer", "Cyber Security Analyst",
];

function Skills() {
  const { profile } = useProfile();
  const analyze = useServerFn(analyzeSkillGap);
  const [role, setRole] = useState<string>(profile?.target_role || "Full Stack Developer");

  const q = useQuery({
    queryKey: ["skill-gap", role],
    queryFn: () => analyze({ data: { targetRole: role } }),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const data = q.data;
  const loading = q.isLoading || q.isFetching;

  return (
    <DashboardShell title="Skill Gap Analyzer" subtitle="AI-personalized from your resume, profile & target role">
      {/* Role selector */}
      <div className="glass neon-border rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-neon-2" />
            <span className="text-xs uppercase tracking-widest text-neon-2">Target role</span>
          </div>
          <button
            onClick={() => q.refetch()}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg bg-gradient-primary text-white glow inline-flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
            {loading ? "Analyzing…" : "Regenerate"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`text-xs px-3 py-1.5 rounded-lg transition ${
                r === role
                  ? "bg-gradient-primary text-white glow"
                  : "glass hover:bg-white/10 text-foreground/80"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {q.isError && (
        <div className="glass neon-border rounded-2xl p-6 text-center text-destructive">
          {(q.error as Error).message}
        </div>
      )}

      {loading && !data && <SkeletonGrid />}

      {!loading && data && data.context.has_resume === false && (
        <div className="glass neon-border rounded-2xl p-4 mb-5 text-sm text-neon-2">
          Tip: upload a resume in <b>Resume ATS</b> for sharper skill detection. Currently using your profile skills only.
        </div>
      )}

      <AnimatePresence mode="wait">
        {data && (
          <motion.div
            key={role}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <Stat icon={Target} label="Skills Matched" value={`${data.matched_skills.length}/${data.required_skills.length}`} tone="primary" />
              <Stat icon={TrendingUp} label="Match %" value={`${data.match_percent}%`} tone="accent" />
              <Stat icon={Zap} label="Readiness" value={`${data.readiness_score}%`} tone="neon" />
              <Stat icon={Clock} label="Weeks to Ready" value={`${data.weeks_to_ready}w`} tone="accent" />
            </div>

            {/* AI summary */}
            {data.ai_summary && (
              <motion.div className="glass neon-border rounded-2xl p-6" whileHover={{ y: -2 }}>
                <h3 className="font-display font-bold mb-2 flex items-center gap-2">
                  <Sparkles className="size-4 text-neon" /> AI Verdict
                </h3>
                <p className="text-sm text-foreground/80 leading-relaxed">{data.ai_summary}</p>
              </motion.div>
            )}

            <div className="grid lg:grid-cols-5 gap-5">
              {/* Radar */}
              <div className="lg:col-span-2 glass neon-border rounded-2xl p-6">
                <h3 className="font-display font-bold mb-4">Skill Radar</h3>
                {data.required_skills.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={data.required_skills.slice(0, 8).map((s: any) => ({
                      skill: s.name.length > 12 ? s.name.slice(0, 11) + "…" : s.name,
                      you: s.user_level,
                      target: s.target_level,
                    }))}>
                      <PolarGrid stroke="oklch(0.3 0.03 280)" />
                      <PolarAngleAxis dataKey="skill" tick={{ fill: "oklch(0.7 0.05 280)", fontSize: 10 }} />
                      <PolarRadiusAxis stroke="oklch(0.3 0.03 280)" tick={false} domain={[0, 100]} />
                      <Radar dataKey="target" stroke="oklch(0.7 0.2 220)" fill="oklch(0.7 0.2 220)" fillOpacity={0.15} />
                      <Radar dataKey="you" stroke="oklch(0.7 0.27 300)" fill="oklch(0.7 0.27 300)" fillOpacity={0.45} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : <p className="text-xs text-muted-foreground">No data</p>}
              </div>

              {/* Skill bars */}
              <div className="lg:col-span-3 glass neon-border rounded-2xl p-6">
                <h3 className="font-display font-bold mb-1">Current vs Target</h3>
                <p className="text-xs text-muted-foreground mb-4">Personalized for {role}</p>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {data.required_skills.map((s: any) => (
                    <div key={s.name}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-xs text-muted-foreground">{s.user_level}% / {s.target_level}%</span>
                      </div>
                      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                            s.user_level >= s.target_level ? "bg-neon-2" : "bg-gradient-primary"
                          }`}
                          style={{ width: `${s.user_level}%` }}
                        />
                        <div className="absolute inset-y-0 w-0.5 bg-neon-2" style={{ left: `${s.target_level}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Strengths / weaknesses / missing */}
            <div className="grid md:grid-cols-3 gap-4">
              <ListCard
                icon={<CheckCircle2 className="size-4 text-neon-2" />}
                title="Strengths"
                items={data.strengths}
                tone="neon-2"
              />
              <ListCard
                icon={<AlertTriangle className="size-4 text-destructive" />}
                title="Weaknesses"
                items={data.weaknesses}
                tone="destructive"
              />
              <div className="glass neon-border rounded-2xl p-6">
                <h3 className="font-display font-bold mb-3 flex items-center gap-2">
                  <AlertTriangle className="size-4 text-destructive" /> Missing Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.missing_skills.length === 0 ? (
                    <p className="text-xs text-muted-foreground">None — you're covered 🎉</p>
                  ) : data.missing_skills.map((s: string) => (
                    <span key={s} className="text-xs px-3 py-1.5 rounded-lg glass border border-destructive/30 text-destructive">
                      + {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Projects */}
            <motion.div className="glass neon-border rounded-2xl p-6" whileHover={{ y: -2 }}>
              <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                <BookOpen className="size-4 text-neon" /> Suggested Projects
              </h3>
              {data.projects.length === 0 ? (
                <p className="text-xs text-muted-foreground">No projects generated</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {data.projects.map((p: any, i: number) => (
                    <div key={i} className="glass rounded-xl p-4 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">{p.title}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded glass shrink-0">{p.difficulty}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {(p.skills ?? []).slice(0, 4).map((s: string) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded glass text-neon-2">{s}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3" /> {p.weeks}w
                        </span>
                        <a
                          href={`https://github.com/search?q=${encodeURIComponent(p.github_query || p.title)}&type=repositories`}
                          target="_blank" rel="noreferrer"
                          className="text-[11px] px-2.5 py-1 rounded-md bg-gradient-primary text-white glow inline-flex items-center gap-1"
                        >
                          <Github className="size-3" /> Start
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Certifications */}
            <motion.div className="glass neon-border rounded-2xl p-6" whileHover={{ y: -2 }}>
              <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                <Award className="size-4 text-neon" /> Recommended Certifications
              </h3>
              {data.certifications.length === 0 ? (
                <p className="text-xs text-muted-foreground">No certifications generated</p>
              ) : (
                <ul className="grid md:grid-cols-2 gap-3">
                  {data.certifications.map((c: any, i: number) => (
                    <li key={i} className="glass rounded-xl p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.provider} · {c.duration} · {c.difficulty} · {c.cost}
                        </p>
                      </div>
                      <a
                        href={c.url || `https://www.google.com/search?q=${encodeURIComponent(c.name + " " + c.provider)}`}
                        target="_blank" rel="noreferrer"
                        className="text-xs px-3 py-1.5 rounded-lg bg-gradient-primary text-white glow inline-flex items-center gap-1 shrink-0"
                      >
                        Start <ExternalLink className="size-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}

function Stat({ icon: Icon, label, value }: any) {
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

function ListCard({ icon, title, items, tone }: { icon: React.ReactNode; title: string; items: string[]; tone: string }) {
  return (
    <div className="glass neon-border rounded-2xl p-6">
      <h3 className="font-display font-bold mb-3 flex items-center gap-2">{icon} {title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">—</p>
      ) : (
        <ul className="space-y-2">
          {items.map((s, i) => (
            <li key={i} className={`text-sm text-foreground/80 flex gap-2`}>
              <span className={`text-${tone} shrink-0`}>•</span>
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => <div key={i} className="glass neon-border rounded-2xl p-5 h-24 animate-pulse" />)}
      </div>
      <div className="glass neon-border rounded-2xl p-6 h-40 animate-pulse" />
      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 glass neon-border rounded-2xl p-6 h-72 animate-pulse" />
        <div className="lg:col-span-3 glass neon-border rounded-2xl p-6 h-72 animate-pulse" />
      </div>
    </div>
  );
}
