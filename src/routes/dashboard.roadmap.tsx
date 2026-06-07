import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  CheckCircle2, Circle, Sparkles, BookOpen, Code, Briefcase, Loader2,
  RefreshCw, ExternalLink, Youtube, FileText, GraduationCap, Target,
  TrendingUp, Award, Lightbulb, Rocket,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { generateRoadmap } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/roadmap")({
  head: () => ({ meta: [{ title: "AI Roadmap — PlacementIQ" }] }),
  component: RoadmapPage,
});

type Resource = { title: string; type: string; url: string };
type WeekPlan = {
  week: number;
  title: string;
  learning_goals: string[];
  topics: string[];
  practice_tasks: string[];
  projects: { name: string; description: string }[];
  interview_prep: string[];
  resources: Resource[];
};
type Roadmap = {
  headline: string;
  summary: string;
  focus_areas: string[];
  weeks: WeekPlan[];
  recommended_projects: { name: string; description: string; skills: string[] }[];
  certifications: { name: string; provider: string; url: string }[];
  readiness: { career: number; skill_completion: number; ats: number; interview: number };
  context: {
    target_role: string;
    ats_score: number | null;
    quiz_avg: number | null;
    missing_skills: string[];
    weak_topics: string[];
    strong_topics: string[];
  };
};

const DONE_KEY = (uid: string) => `placementiq:roadmap:done:${uid}`;
const CACHE_KEY = (uid: string) => `placementiq:roadmap:cache:${uid}`;

const resIcon = (t: string) => {
  if (t === "youtube") return Youtube;
  if (t === "docs") return FileText;
  if (t === "certification") return Award;
  if (t === "course") return GraduationCap;
  if (t === "practice") return Code;
  return BookOpen;
};

function ReadinessRing({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="glass rounded-2xl p-4 flex flex-col items-center justify-center">
      <div className="relative size-20">
        <svg viewBox="0 0 36 36" className="size-20 -rotate-90">
          <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.915" fill="none"
            stroke={accent ? "url(#g1)" : "currentColor"}
            strokeOpacity={accent ? 1 : 0.7}
            strokeWidth="3"
            strokeDasharray={`${pct}, 100`}
            strokeLinecap="round"
            className={accent ? "" : "text-neon-2"}
          />
          <defs>
            <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--neon-2, 280 80% 60%))" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 grid place-items-center font-display font-bold text-lg">{pct}%</div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">{label}</p>
    </div>
  );
}

function RoadmapPage() {
  const { user } = useAuth();
  const { profile, loading: profLoading } = useProfile();
  const runGenerate = useServerFn(generateRoadmap);

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});

  // Load cached roadmap + progress
  useEffect(() => {
    if (!user) return;
    try {
      const c = localStorage.getItem(CACHE_KEY(user.id));
      if (c) setRoadmap(JSON.parse(c));
    } catch {}
    try {
      const d = localStorage.getItem(DONE_KEY(user.id));
      if (d) setDone(JSON.parse(d));
    } catch {}
  }, [user?.id]);

  const fetchRoadmap = async (force = false) => {
    if (!user) return;
    if (force) setRefreshing(true); else setLoading(true);
    try {
      const r = (await runGenerate({ data: { weeks: 6 } })) as Roadmap;
      setRoadmap(r);
      localStorage.setItem(CACHE_KEY(user.id), JSON.stringify(r));
      if (force) toast.success("Roadmap regenerated with latest data");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate roadmap");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user || profLoading) return;
    // generate on first visit if no cache
    if (!roadmap) fetchRoadmap(false);
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profLoading]);

  const allKeys = useMemo(() => {
    if (!roadmap) return [];
    const k: string[] = [];
    roadmap.weeks.forEach((w, i) => {
      w.learning_goals.forEach((_, j) => k.push(`w${i}-g${j}`));
      w.practice_tasks.forEach((_, j) => k.push(`w${i}-p${j}`));
      w.interview_prep.forEach((_, j) => k.push(`w${i}-i${j}`));
    });
    return k;
  }, [roadmap]);

  const completed = allKeys.filter(k => done[k]).length;
  const pct = allKeys.length ? Math.round((completed / allKeys.length) * 100) : 0;

  const toggle = (k: string) => {
    if (!user) return;
    setDone(d => {
      const next = { ...d, [k]: !d[k] };
      localStorage.setItem(DONE_KEY(user.id), JSON.stringify(next));
      return next;
    });
  };

  if (loading || profLoading) {
    return (
      <DashboardShell title="AI Career Roadmap">
        <div className="glass-strong neon-border rounded-2xl p-10 grid place-items-center">
          <Loader2 className="size-8 animate-spin text-neon mb-3" />
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Analyzing your profile, ATS report, missing skills, weak topics and quiz history to craft a unique roadmap for you…
          </p>
        </div>
      </DashboardShell>
    );
  }

  if (!roadmap) {
    return (
      <DashboardShell title="AI Career Roadmap">
        <div className="glass-strong neon-border rounded-2xl p-10 text-center">
          <p className="text-sm text-muted-foreground mb-4">No roadmap yet.</p>
          <button onClick={() => fetchRoadmap(true)} className="px-4 py-2 rounded-xl bg-gradient-primary text-white text-sm font-medium glow">
            Generate my roadmap
          </button>
        </div>
      </DashboardShell>
    );
  }

  const firstName = (profile?.full_name || "there").split(" ")[0];
  const role = roadmap.context.target_role;

  return (
    <DashboardShell title="AI Career Roadmap" subtitle={`Personalized for ${role}`}>
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong neon-border rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-xl bg-gradient-primary grid place-items-center glow shrink-0">
            <Sparkles className="size-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-widest text-neon-2">Personalized for {firstName}</p>
            <h3 className="font-display font-bold text-xl">{roadmap.headline}</h3>
            {roadmap.summary && <p className="text-sm text-muted-foreground mt-2">{roadmap.summary}</p>}
            {!profile?.target_role && (
              <p className="text-xs text-muted-foreground mt-2">
                Tip: set a target role on <Link to="/dashboard/profile" className="underline text-gradient">your profile</Link> for sharper personalization.
              </p>
            )}
          </div>
          <button
            onClick={() => fetchRoadmap(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl glass hover:bg-white/5 text-sm shrink-0 disabled:opacity-50"
          >
            {refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Regenerate
          </button>
        </div>

        {roadmap.focus_areas.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {roadmap.focus_areas.map((f, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10">
                <Target className="size-3 inline mr-1 text-neon-2" />{f}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* Readiness scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <ReadinessRing label="Career Readiness" value={roadmap.readiness.career} accent />
        <ReadinessRing label="Skill Completion" value={roadmap.readiness.skill_completion} />
        <ReadinessRing label="ATS Readiness" value={roadmap.readiness.ats} />
        <ReadinessRing label="Interview Readiness" value={roadmap.readiness.interview} />
      </div>

      {/* Overall progress */}
      <div className="glass rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium flex items-center gap-2"><TrendingUp className="size-4 text-neon-2" /> Roadmap progress</p>
          <p className="text-sm text-muted-foreground">{completed}/{allKeys.length} tasks · {pct}%</p>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full bg-gradient-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Weeks */}
      <div className="space-y-4">
        {roadmap.weeks.map((w, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="glass neon-border rounded-2xl p-6"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="size-12 rounded-xl bg-gradient-primary grid place-items-center glow shrink-0">
                <BookOpen className="size-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-neon-2">Week {w.week}</p>
                <h3 className="font-display font-bold text-lg">{w.title}</h3>
                {w.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {w.topics.map((t, j) => (
                      <span key={j} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {w.learning_goals.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1"><Lightbulb className="size-3" /> Learning goals</p>
                  <ul className="space-y-1.5">
                    {w.learning_goals.map((g, j) => {
                      const k = `w${i}-g${j}`;
                      return (
                        <li key={j}>
                          <button onClick={() => toggle(k)} className="flex items-start gap-2 text-sm w-full text-left hover:bg-white/5 rounded px-1.5 py-0.5">
                            {done[k] ? <CheckCircle2 className="size-4 text-neon-2 shrink-0 mt-0.5" /> : <Circle className="size-4 text-muted-foreground shrink-0 mt-0.5" />}
                            <span className={done[k] ? "line-through text-muted-foreground" : ""}>{g}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {w.practice_tasks.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1"><Code className="size-3" /> Practice tasks</p>
                  <ul className="space-y-1.5">
                    {w.practice_tasks.map((t, j) => {
                      const k = `w${i}-p${j}`;
                      return (
                        <li key={j}>
                          <button onClick={() => toggle(k)} className="flex items-start gap-2 text-sm w-full text-left hover:bg-white/5 rounded px-1.5 py-0.5">
                            {done[k] ? <CheckCircle2 className="size-4 text-neon-2 shrink-0 mt-0.5" /> : <Circle className="size-4 text-muted-foreground shrink-0 mt-0.5" />}
                            <span className={done[k] ? "line-through text-muted-foreground" : ""}>{t}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {w.interview_prep.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1"><Briefcase className="size-3" /> Interview prep</p>
                  <ul className="space-y-1.5">
                    {w.interview_prep.map((t, j) => {
                      const k = `w${i}-i${j}`;
                      return (
                        <li key={j}>
                          <button onClick={() => toggle(k)} className="flex items-start gap-2 text-sm w-full text-left hover:bg-white/5 rounded px-1.5 py-0.5">
                            {done[k] ? <CheckCircle2 className="size-4 text-neon-2 shrink-0 mt-0.5" /> : <Circle className="size-4 text-muted-foreground shrink-0 mt-0.5" />}
                            <span className={done[k] ? "line-through text-muted-foreground" : ""}>{t}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {w.projects.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1"><Rocket className="size-3" /> Projects</p>
                  <ul className="space-y-2">
                    {w.projects.map((p, j) => (
                      <li key={j} className="text-sm">
                        <p className="font-medium">{p.name}</p>
                        {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {w.resources.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Resources</p>
                <div className="flex flex-wrap gap-2">
                  {w.resources.map((r, j) => {
                    const Icon = resIcon(r.type);
                    return (
                      <a
                        key={j}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-neon-2/40 transition"
                      >
                        <Icon className="size-3 text-neon-2" />
                        <span className="max-w-[220px] truncate">{r.title}</span>
                        <ExternalLink className="size-3 text-muted-foreground" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Recommended projects */}
      {roadmap.recommended_projects.length > 0 && (
        <div className="glass neon-border rounded-2xl p-6 mt-6">
          <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-4"><Rocket className="size-5 text-neon-2" /> Recommended portfolio projects</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {roadmap.recommended_projects.map((p, i) => (
              <div key={i} className="glass rounded-xl p-4">
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                {p.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.skills.map((s, j) => (
                      <span key={j} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {roadmap.certifications.length > 0 && (
        <div className="glass neon-border rounded-2xl p-6 mt-6">
          <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-4"><Award className="size-5 text-neon-2" /> Suggested certifications</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {roadmap.certifications.map((c, i) => (
              <a
                key={i}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass rounded-xl p-4 flex items-start justify-between gap-3 hover:bg-white/5 transition"
              >
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.provider}</p>
                </div>
                <ExternalLink className="size-4 text-muted-foreground shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
