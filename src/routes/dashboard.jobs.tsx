import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Briefcase, MapPin, Building2, Sparkles, Search, Bookmark, BookmarkCheck,
  CheckCircle2, X, ExternalLink, Filter, RefreshCw, TrendingUp, Loader2, GraduationCap,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useProfile } from "@/hooks/useProfile";
import { searchJobs } from "@/lib/jobs.functions";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/jobs")({
  head: () => ({ meta: [{ title: "Job Match — PlacementIQ" }] }),
  component: Jobs,
});

type Filters = {
  query: string;
  location: string;
  jobType: "all" | "Full-time" | "Internship" | "Contract";
  workMode: "all" | "Remote" | "Hybrid" | "Onsite";
  experience: "all" | "Fresher" | "0-2" | "2-5" | "5+";
};

function Jobs() {
  const { profile } = useProfile();
  const runSearch = useServerFn(searchJobs);

  const [filters, setFilters] = useState<Filters>({
    query: "",
    location: "",
    jobType: "all",
    workMode: "all",
    experience: "all",
  });
  const [applied, setApplied] = useState<Filters>(filters);
  const [saved, setSaved] = useState<string[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    setSaved(JSON.parse(localStorage.getItem("piq_saved_jobs") || "[]"));
    setAppliedIds(JSON.parse(localStorage.getItem("piq_applied_jobs") || "[]"));
  }, []);

  const persist = (key: string, val: string[]) =>
    localStorage.setItem(key, JSON.stringify(val));

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["jobs", applied, profile?.target_role, profile?.skills?.length ?? 0],
    queryFn: () => runSearch({ data: applied }),
    staleTime: 60_000,
  });

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      persist("piq_saved_jobs", next);
      toast(prev.includes(id) ? "Removed from saved" : "Saved to your list");
      return next;
    });
  };

  const apply = (job: any) => {
    window.open(job.applyUrl, "_blank", "noopener,noreferrer");
    if (!appliedIds.includes(job.id)) {
      const next = [...appliedIds, job.id];
      setAppliedIds(next);
      persist("piq_applied_jobs", next);
    }
    toast.success(`Opening ${job.company} on ${job.source}…`);
  };

  const jobs: any[] = data?.jobs ?? [];
  const stats = useMemo(() => {
    if (!jobs.length) return { total: 0, avg: 0, top: 0, fresh: 0 };
    const matches = jobs.map((j) => j.matchPercent);
    return {
      total: jobs.length,
      avg: Math.round(matches.reduce((a, b) => a + b, 0) / matches.length),
      top: Math.max(...matches),
      fresh: jobs.filter((j) => j.postedDaysAgo <= 7).length,
    };
  }, [jobs]);

  const runNow = () => setApplied(filters);
  const reset = () => {
    const empty: Filters = { query: "", location: "", jobType: "all", workMode: "all", experience: "all" };
    setFilters(empty);
    setApplied(empty);
  };

  const noResume = data && !data.context?.hasResume;

  return (
    <DashboardShell
      title="Job Match Analyzer"
      subtitle={
        profile?.target_role
          ? `Live openings for ${profile.target_role} matched to your resume`
          : "Live openings personalized to your skills"
      }
    >
      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Jobs Found" value={stats.total} sub={data?.context?.userSkills?.length ? `from ${data.context.userSkills.length} skills` : "add skills for better matches"} />
        <StatCard label="Avg Match" value={`${stats.avg}%`} sub="across current results" tone="gradient" />
        <StatCard label="Highest Match" value={`${stats.top}%`} sub="best-fit opening" tone="neon" />
        <StatCard label="Saved / Applied" value={`${saved.length} / ${appliedIds.length}`} sub="your pipeline" />
      </div>

      {noResume && (
        <div className="glass neon-border rounded-2xl p-4 mb-6 flex items-center gap-3">
          <GraduationCap className="size-5 text-neon-2 shrink-0" />
          <p className="text-sm text-muted-foreground flex-1">
            Upload a resume in the ATS Analyzer for skill-aware matching and accurate missing-skill callouts.
          </p>
          <Link to="/dashboard/ats" className="text-sm text-neon-2 hover:underline">Upload →</Link>
        </div>
      )}

      {/* Filters */}
      <div className="glass neon-border rounded-2xl p-4 mb-6 grid gap-3 md:grid-cols-[1fr_180px_140px_140px_140px_auto]">
        <div className="flex items-center gap-2 glass rounded-lg px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={filters.query}
            onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && runNow()}
            placeholder="Role, company or skill (e.g. Data Analyst)"
            className="bg-transparent outline-none flex-1 text-sm placeholder:text-muted-foreground"
          />
        </div>
        <input
          value={filters.location}
          onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && runNow()}
          placeholder="Location"
          className="glass rounded-lg px-3 py-2 text-sm bg-background/40 outline-none"
        />
        <select
          value={filters.jobType}
          onChange={(e) => setFilters((f) => ({ ...f, jobType: e.target.value as any }))}
          className="glass rounded-lg px-3 py-2 text-sm bg-background/40 outline-none"
        >
          <option value="all">All types</option>
          <option value="Full-time">Full-time</option>
          <option value="Internship">Internship</option>
          <option value="Contract">Contract</option>
        </select>
        <select
          value={filters.workMode}
          onChange={(e) => setFilters((f) => ({ ...f, workMode: e.target.value as any }))}
          className="glass rounded-lg px-3 py-2 text-sm bg-background/40 outline-none"
        >
          <option value="all">Any mode</option>
          <option value="Remote">Remote</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Onsite">Onsite</option>
        </select>
        <select
          value={filters.experience}
          onChange={(e) => setFilters((f) => ({ ...f, experience: e.target.value as any }))}
          className="glass rounded-lg px-3 py-2 text-sm bg-background/40 outline-none"
        >
          <option value="all">Any exp.</option>
          <option value="Fresher">Fresher</option>
          <option value="0-2">0-2 yrs</option>
          <option value="2-5">2-5 yrs</option>
          <option value="5+">5+ yrs</option>
        </select>
        <div className="flex gap-2">
          <button
            onClick={runNow}
            disabled={isFetching}
            className="px-4 py-2 rounded-lg bg-gradient-primary text-white text-sm font-medium glow flex items-center gap-1.5 disabled:opacity-60"
          >
            {isFetching ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Search
          </button>
          <button onClick={reset} className="glass rounded-lg px-3 py-2 text-sm flex items-center gap-1 hover:bg-white/10">
            <Filter className="size-3.5" /> Reset
          </button>
          <button onClick={() => refetch()} title="Refresh" className="glass rounded-lg px-3 py-2 text-sm hover:bg-white/10">
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* List */}
      {isLoading && (
        <div className="glass neon-border rounded-2xl p-10 text-center text-muted-foreground flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-neon-2" />
          Fetching live openings tailored to your profile…
        </div>
      )}

      {error && (
        <div className="glass neon-border rounded-2xl p-6 text-sm text-red-400">
          Couldn't fetch jobs: {(error as Error).message}
        </div>
      )}

      <div className="grid gap-4">
        {!isLoading && jobs.length === 0 && !error && (
          <div className="glass neon-border rounded-2xl p-10 text-center text-muted-foreground">
            No jobs found. Try broadening your search or setting a target role in your profile.
          </div>
        )}
        {jobs.map((j, i) => {
          const isSaved = saved.includes(j.id);
          const isApplied = appliedIds.includes(j.id);
          return (
            <motion.div
              key={j.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
              whileHover={{ y: -2 }}
              onClick={() => setSelected(j)}
              className="glass neon-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer"
            >
              <div className="size-14 rounded-xl bg-gradient-primary grid place-items-center glow shrink-0">
                <Building2 className="size-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h3 className="font-display font-bold text-lg">{j.company}</h3>
                  <span className="text-sm text-muted-foreground">{j.role}</span>
                  {j.postedDaysAgo <= 3 && (
                    <span className="text-[10px] bg-neon/20 text-neon-2 border border-neon/30 rounded px-1.5 py-0.5 uppercase tracking-wider">New</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                  <span className="flex items-center gap-1"><MapPin className="size-3" /> {j.location} · {j.workMode}</span>
                  <span className="flex items-center gap-1"><Briefcase className="size-3" /> {j.jobType} · {j.experience}</span>
                  <span>{j.salary}</span>
                  <span>· {j.postedDaysAgo === 0 ? "Today" : `${j.postedDaysAgo}d ago`}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {j.requiredSkills.slice(0, 8).map((t: string) => {
                    const has = j.matchedSkills.map((s: string) => s.toLowerCase()).includes(t.toLowerCase());
                    return (
                      <span
                        key={t}
                        className={`text-xs rounded-md px-2 py-0.5 ${has ? "bg-neon/20 text-neon-2 border border-neon/30" : "glass"}`}
                      >
                        {t}
                      </span>
                    );
                  })}
                </div>
                {j.missingSkills.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    <span className="text-orange-300">Missing:</span> {j.missingSkills.slice(0, 4).join(", ")}
                    {j.missingSkills.length > 4 ? ` +${j.missingSkills.length - 4}` : ""}
                  </p>
                )}
              </div>
              <div className="text-center">
                <p className="text-3xl font-display font-bold text-gradient">{j.matchPercent}%</p>
                <p className="text-xs text-muted-foreground">match</p>
              </div>
              <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => toggleSave(j.id)}
                  className="size-10 grid place-items-center rounded-lg glass hover:bg-white/10"
                  aria-label="Save"
                >
                  {isSaved ? <BookmarkCheck className="size-4 text-neon-2" /> : <Bookmark className="size-4" />}
                </button>
                <button
                  onClick={() => apply(j)}
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-1.5 bg-gradient-primary glow"
                >
                  {isApplied ? <CheckCircle2 className="size-3.5" /> : <Sparkles className="size-3.5" />}
                  Apply on {j.source}
                  <ExternalLink className="size-3" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm grid place-items-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass neon-border rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-display font-bold text-2xl">{selected.company}</h2>
                  <p className="text-sm text-muted-foreground">{selected.role}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-display font-bold text-gradient">{selected.matchPercent}%</p>
                  <p className="text-xs text-muted-foreground">match</p>
                </div>
                <button onClick={() => setSelected(null)} className="size-8 grid place-items-center rounded-lg glass">
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 flex-wrap">
                <span className="flex items-center gap-1"><MapPin className="size-3" /> {selected.location} · {selected.workMode}</span>
                <span className="flex items-center gap-1"><Briefcase className="size-3" /> {selected.jobType} · {selected.experience}</span>
                <span>{selected.salary}</span>
                <span>{selected.postedDaysAgo === 0 ? "Posted today" : `Posted ${selected.postedDaysAgo}d ago`}</span>
              </div>
              <p className="text-sm mb-4">{selected.description}</p>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Matched Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.matchedSkills.length === 0 && <span className="text-xs text-muted-foreground">None yet</span>}
                    {selected.matchedSkills.map((t: string) => (
                      <span key={t} className="text-xs rounded-md px-2 py-0.5 bg-neon/20 text-neon-2 border border-neon/30">✓ {t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Missing Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.missingSkills.length === 0 && <span className="text-xs text-neon-2">You match every required skill!</span>}
                    {selected.missingSkills.map((t: string) => (
                      <span key={t} className="text-xs rounded-md px-2 py-0.5 bg-orange-500/10 text-orange-300 border border-orange-500/20">{t}</span>
                    ))}
                  </div>
                  {selected.missingSkills.length > 0 && (
                    <Link
                      to="/dashboard/roadmap"
                      className="text-xs text-neon-2 hover:underline mt-2 inline-flex items-center gap-1"
                    >
                      <TrendingUp className="size-3" /> Learn these in your AI Roadmap
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { apply(selected); setSelected(null); }}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-primary text-white text-sm font-medium glow flex items-center justify-center gap-2"
                >
                  <Sparkles className="size-4" /> Apply on {selected.source}
                  <ExternalLink className="size-3.5" />
                </button>
                <button
                  onClick={() => toggleSave(selected.id)}
                  className="px-4 py-2.5 rounded-lg glass text-sm flex items-center gap-2 hover:bg-white/10"
                >
                  {saved.includes(selected.id) ? <BookmarkCheck className="size-4 text-neon-2" /> : <Bookmark className="size-4" />}
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}

function StatCard({
  label, value, sub, tone,
}: { label: string; value: string | number; sub?: string; tone?: "gradient" | "neon" }) {
  return (
    <div className="glass neon-border rounded-2xl p-5">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-display font-bold mt-2 ${tone === "gradient" ? "text-gradient" : tone === "neon" ? "text-neon-2" : ""}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
