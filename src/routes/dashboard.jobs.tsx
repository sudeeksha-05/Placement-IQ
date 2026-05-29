import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import {
  Briefcase, MapPin, Building2, Sparkles, Search, Bookmark, BookmarkCheck,
  CheckCircle2, X, ExternalLink, Filter,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/jobs")({
  head: () => ({ meta: [{ title: "Job Match — PlacementIQ" }] }),
  component: Jobs,
});

type Job = {
  id: string;
  co: string;
  role: string;
  loc: string;
  type: "Full-time" | "Internship" | "Contract";
  remote: "Remote" | "Hybrid" | "Onsite";
  tags: string[];
  salary: string;
  desc: string;
};

const ALL_JOBS: Job[] = [
  { id: "j1", co: "Stripe", role: "Frontend Engineer · Intern", loc: "Bangalore", type: "Internship", remote: "Hybrid", tags: ["React", "TypeScript", "GraphQL", "CSS"], salary: "₹80k/mo", desc: "Build payment dashboards used by millions of merchants." },
  { id: "j2", co: "Razorpay", role: "SDE-1 · Web Platform", loc: "Bangalore", type: "Full-time", remote: "Onsite", tags: ["React", "Node.js", "Testing", "TypeScript"], salary: "₹18-24 LPA", desc: "Own end-to-end features on Razorpay's core dashboard." },
  { id: "j3", co: "Zomato", role: "Frontend Developer", loc: "Gurgaon", type: "Full-time", remote: "Hybrid", tags: ["React", "Next.js", "Performance"], salary: "₹16-22 LPA", desc: "Optimize the consumer ordering experience." },
  { id: "j4", co: "Postman", role: "UI Engineer", loc: "Remote", type: "Full-time", remote: "Remote", tags: ["TypeScript", "Design Systems", "React"], salary: "₹20-28 LPA", desc: "Ship the API workspace used by 25M developers." },
  { id: "j5", co: "CRED", role: "Junior Web Developer", loc: "Bangalore", type: "Full-time", remote: "Onsite", tags: ["React", "Animations", "CSS"], salary: "₹14-20 LPA", desc: "Craft delightful, animation-rich product surfaces." },
  { id: "j6", co: "Swiggy", role: "Backend Engineer · Intern", loc: "Bangalore", type: "Internship", remote: "Hybrid", tags: ["Node.js", "Java", "SQL", "Docker"], salary: "₹70k/mo", desc: "Work on logistics backend serving millions of orders." },
  { id: "j7", co: "Atlassian", role: "Full Stack Engineer", loc: "Remote", type: "Full-time", remote: "Remote", tags: ["React", "Java", "AWS", "TypeScript"], salary: "₹22-30 LPA", desc: "Build features across Jira & Confluence." },
  { id: "j8", co: "Freshworks", role: "Software Engineer · Frontend", loc: "Chennai", type: "Full-time", remote: "Onsite", tags: ["React", "Redux", "CSS"], salary: "₹15-20 LPA", desc: "Build customer-facing SaaS products." },
];

function computeMatch(jobTags: string[], userSkills: string[]) {
  if (!jobTags.length) return 0;
  if (!userSkills.length) return 60;
  const s = userSkills.map((x) => x.toLowerCase().trim());
  const hits = jobTags.filter((t) => s.includes(t.toLowerCase())).length;
  return Math.round(50 + (hits / jobTags.length) * 50);
}

function Jobs() {
  const { profile } = useProfile();
  const userSkills = profile?.skills ?? [];

  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<"all" | "Remote" | "Hybrid" | "Onsite">("all");
  const [type, setType] = useState<"all" | "Full-time" | "Internship" | "Contract">("all");
  const [saved, setSaved] = useState<string[]>([]);
  const [applied, setApplied] = useState<string[]>([]);
  const [selected, setSelected] = useState<Job | null>(null);

  useEffect(() => {
    setSaved(JSON.parse(localStorage.getItem("piq_saved_jobs") || "[]"));
    setApplied(JSON.parse(localStorage.getItem("piq_applied_jobs") || "[]"));
  }, []);

  const persist = (key: string, val: string[]) =>
    localStorage.setItem(key, JSON.stringify(val));

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      persist("piq_saved_jobs", next);
      toast(prev.includes(id) ? "Removed from saved" : "Saved to your list");
      return next;
    });
  };

  const apply = (id: string, co: string) => {
    if (applied.includes(id)) return;
    const next = [...applied, id];
    setApplied(next);
    persist("piq_applied_jobs", next);
    toast.success(`Application sent to ${co}`);
  };

  const jobs = useMemo(() => {
    return ALL_JOBS
      .map((j) => ({ ...j, match: computeMatch(j.tags, userSkills) }))
      .filter((j) => {
        if (remote !== "all" && j.remote !== remote) return false;
        if (type !== "all" && j.type !== type) return false;
        if (query) {
          const q = query.toLowerCase();
          if (
            !j.co.toLowerCase().includes(q) &&
            !j.role.toLowerCase().includes(q) &&
            !j.tags.some((t) => t.toLowerCase().includes(q))
          )
            return false;
        }
        return true;
      })
      .sort((a, b) => b.match - a.match);
  }, [query, remote, type, userSkills]);

  return (
    <DashboardShell title="Job Match Analyzer" subtitle="Live openings ranked against your skill profile">
      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="glass neon-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Matches</p>
          <p className="text-3xl font-display font-bold mt-2">{jobs.length}</p>
          <p className="text-xs text-muted-foreground mt-1">based on your {userSkills.length} skills</p>
        </div>
        <div className="glass neon-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Saved</p>
          <p className="text-3xl font-display font-bold mt-2 text-gradient">{saved.length}</p>
          <p className="text-xs text-muted-foreground mt-1">bookmarked jobs</p>
        </div>
        <div className="glass neon-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Applied</p>
          <p className="text-3xl font-display font-bold mt-2 text-neon-2">{applied.length}</p>
          <p className="text-xs text-muted-foreground mt-1">applications sent</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass neon-border rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-2 glass rounded-lg px-3 py-2 flex-1">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, role, or skill…"
            className="bg-transparent outline-none flex-1 text-sm placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={remote}
            onChange={(e) => setRemote(e.target.value as typeof remote)}
            className="glass rounded-lg px-3 py-2 text-sm bg-background/40 outline-none"
          >
            <option value="all">All locations</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Onsite">Onsite</option>
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="glass rounded-lg px-3 py-2 text-sm bg-background/40 outline-none"
          >
            <option value="all">All types</option>
            <option value="Full-time">Full-time</option>
            <option value="Internship">Internship</option>
            <option value="Contract">Contract</option>
          </select>
          {(query || remote !== "all" || type !== "all") && (
            <button
              onClick={() => { setQuery(""); setRemote("all"); setType("all"); }}
              className="glass rounded-lg px-3 py-2 text-sm flex items-center gap-1 hover:bg-white/10"
            >
              <Filter className="size-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="grid gap-4">
        {jobs.length === 0 && (
          <div className="glass neon-border rounded-2xl p-10 text-center text-muted-foreground">
            No jobs match your filters. Try resetting them.
          </div>
        )}
        {jobs.map((j, i) => {
          const isSaved = saved.includes(j.id);
          const isApplied = applied.includes(j.id);
          return (
            <motion.div
              key={j.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -2 }}
              onClick={() => setSelected(j)}
              className="glass neon-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer"
            >
              <div className="size-14 rounded-xl bg-gradient-primary grid place-items-center glow shrink-0">
                <Building2 className="size-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h3 className="font-display font-bold text-lg">{j.co}</h3>
                  <span className="text-sm text-muted-foreground">{j.role}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                  <span className="flex items-center gap-1"><MapPin className="size-3" /> {j.loc} · {j.remote}</span>
                  <span className="flex items-center gap-1"><Briefcase className="size-3" /> {j.type}</span>
                  <span>{j.salary}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {j.tags.map((t) => {
                    const has = userSkills.map((s) => s.toLowerCase()).includes(t.toLowerCase());
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
              </div>
              <div className="text-center">
                <p className="text-3xl font-display font-bold text-gradient">{j.match}%</p>
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
                  onClick={() => apply(j.id, j.co)}
                  disabled={isApplied}
                  className={`px-4 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-1.5 ${
                    isApplied ? "bg-neon-2/40 cursor-not-allowed" : "bg-gradient-primary glow"
                  }`}
                >
                  {isApplied ? (<><CheckCircle2 className="size-3.5" /> Applied</>) : (<><Sparkles className="size-3.5" /> Apply</>)}
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
              className="glass neon-border rounded-2xl p-6 max-w-xl w-full"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-display font-bold text-2xl">{selected.co}</h2>
                  <p className="text-sm text-muted-foreground">{selected.role}</p>
                </div>
                <button onClick={() => setSelected(null)} className="size-8 grid place-items-center rounded-lg glass">
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 flex-wrap">
                <span className="flex items-center gap-1"><MapPin className="size-3" /> {selected.loc} · {selected.remote}</span>
                <span className="flex items-center gap-1"><Briefcase className="size-3" /> {selected.type}</span>
                <span>{selected.salary}</span>
              </div>
              <p className="text-sm mb-4">{selected.desc}</p>
              <div className="flex flex-wrap gap-1.5 mb-6">
                {selected.tags.map((t) => (
                  <span key={t} className="text-xs glass rounded-md px-2 py-0.5">{t}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { apply(selected.id, selected.co); setSelected(null); }}
                  disabled={applied.includes(selected.id)}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-primary text-white text-sm font-medium glow flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {applied.includes(selected.id) ? <>Already Applied</> : <><Sparkles className="size-4" /> Apply now</>}
                </button>
                <button
                  onClick={() => toggleSave(selected.id)}
                  className="px-4 py-2.5 rounded-lg glass text-sm flex items-center gap-2 hover:bg-white/10"
                >
                  {saved.includes(selected.id) ? <BookmarkCheck className="size-4 text-neon-2" /> : <Bookmark className="size-4" />}
                  Save
                </button>
                <button className="px-4 py-2.5 rounded-lg glass text-sm hover:bg-white/10">
                  <ExternalLink className="size-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
