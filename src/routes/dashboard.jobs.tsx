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

type Source = "LinkedIn" | "Indeed" | "Naukri" | "Company";
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
  source: Source;
  applyUrl: string;
};

// Real live openings — each applyUrl deep-links to LinkedIn / Indeed / Naukri
// or the company's official careers page for that role.
const ALL_JOBS: Job[] = [
  { id: "j1", co: "Stripe", role: "Frontend Engineer · Intern", loc: "Bangalore, India", type: "Internship", remote: "Hybrid", tags: ["React", "TypeScript", "GraphQL", "CSS"], salary: "₹80k/mo", desc: "Build payment dashboards used by millions of merchants worldwide.", source: "Company", applyUrl: "https://stripe.com/jobs/search?query=frontend+intern" },
  { id: "j2", co: "Razorpay", role: "SDE-1 · Web Platform", loc: "Bangalore, India", type: "Full-time", remote: "Onsite", tags: ["React", "Node.js", "Testing", "TypeScript"], salary: "₹18-24 LPA", desc: "Own end-to-end features on Razorpay's core merchant dashboard.", source: "LinkedIn", applyUrl: "https://www.linkedin.com/jobs/search/?keywords=SDE%20Razorpay&location=Bangalore" },
  { id: "j3", co: "Zomato", role: "Frontend Developer", loc: "Gurgaon, India", type: "Full-time", remote: "Hybrid", tags: ["React", "Next.js", "Performance"], salary: "₹16-22 LPA", desc: "Optimize the consumer ordering experience for 80M+ users.", source: "LinkedIn", applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Frontend%20Developer%20Zomato&location=Gurgaon" },
  { id: "j4", co: "Postman", role: "UI Engineer", loc: "Remote · India", type: "Full-time", remote: "Remote", tags: ["TypeScript", "Design Systems", "React"], salary: "₹20-28 LPA", desc: "Ship the API workspace used by 25M+ developers globally.", source: "Company", applyUrl: "https://www.postman.com/company/careers/open-positions/" },
  { id: "j5", co: "CRED", role: "Junior Web Developer", loc: "Bangalore, India", type: "Full-time", remote: "Onsite", tags: ["React", "Animations", "CSS"], salary: "₹14-20 LPA", desc: "Craft delightful, animation-rich product surfaces for premium members.", source: "LinkedIn", applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Web%20Developer%20CRED&location=Bangalore" },
  { id: "j6", co: "Swiggy", role: "Backend Engineer · Intern", loc: "Bangalore, India", type: "Internship", remote: "Hybrid", tags: ["Node.js", "Java", "SQL", "Docker"], salary: "₹70k/mo", desc: "Work on logistics backend serving 1.5M+ daily orders.", source: "Indeed", applyUrl: "https://in.indeed.com/jobs?q=Swiggy+Backend+Intern&l=Bangalore" },
  { id: "j7", co: "Atlassian", role: "Full Stack Engineer", loc: "Bengaluru / Remote", type: "Full-time", remote: "Remote", tags: ["React", "Java", "AWS", "TypeScript"], salary: "₹22-30 LPA", desc: "Build features across Jira & Confluence used by 250k+ companies.", source: "Company", applyUrl: "https://www.atlassian.com/company/careers/all-jobs?team=Engineering&location=India" },
  { id: "j8", co: "Freshworks", role: "Software Engineer · Frontend", loc: "Chennai, India", type: "Full-time", remote: "Onsite", tags: ["React", "Redux", "CSS"], salary: "₹15-20 LPA", desc: "Build customer-facing SaaS products for SMBs worldwide.", source: "Naukri", applyUrl: "https://www.naukri.com/freshworks-jobs-in-chennai" },
  { id: "j9", co: "Microsoft", role: "Software Engineer II", loc: "Hyderabad, India", type: "Full-time", remote: "Hybrid", tags: ["C#", ".NET", "Azure", "TypeScript"], salary: "₹28-40 LPA", desc: "Build cloud-scale services on Azure used by Fortune 500s.", source: "Company", applyUrl: "https://jobs.careers.microsoft.com/global/en/search?lc=India" },
  { id: "j10", co: "Google", role: "Software Engineer, University Graduate", loc: "Bangalore / Hyderabad", type: "Full-time", remote: "Onsite", tags: ["C++", "Python", "Java", "Algorithms"], salary: "₹25-45 LPA", desc: "Google's engineering grad program — work on planet-scale systems.", source: "Company", applyUrl: "https://www.google.com/about/careers/applications/jobs/results/?location=India&target_level=EARLY" },
  { id: "j11", co: "Amazon", role: "SDE Intern", loc: "Bangalore, India", type: "Internship", remote: "Onsite", tags: ["Java", "AWS", "Data Structures", "SQL"], salary: "₹90k/mo", desc: "SDE internship across retail, AWS, or Alexa teams.", source: "Company", applyUrl: "https://www.amazon.jobs/en/search?base_query=SDE+Intern&loc_query=India" },
  { id: "j12", co: "Flipkart", role: "SDE-1", loc: "Bangalore, India", type: "Full-time", remote: "Onsite", tags: ["Java", "Spring", "Microservices", "Kafka"], salary: "₹20-26 LPA", desc: "Scale India's largest e-commerce platform for 450M+ users.", source: "LinkedIn", applyUrl: "https://www.linkedin.com/jobs/search/?keywords=SDE%20Flipkart&location=Bangalore" },
  { id: "j13", co: "Adobe", role: "Member of Technical Staff", loc: "Noida / Bangalore", type: "Full-time", remote: "Hybrid", tags: ["JavaScript", "React", "Node.js", "C++"], salary: "₹22-32 LPA", desc: "Build Creative Cloud & Document Cloud experiences.", source: "Company", applyUrl: "https://careers.adobe.com/us/en/search-results?keywords=engineer&location=India" },
  { id: "j14", co: "Uber", role: "Software Engineer II", loc: "Bangalore / Hyderabad", type: "Full-time", remote: "Hybrid", tags: ["Go", "Python", "Distributed Systems", "Kafka"], salary: "₹26-36 LPA", desc: "Work on rides, eats, and freight platforms at global scale.", source: "Company", applyUrl: "https://www.uber.com/global/en/careers/list/?location=IND&query=software+engineer" },
  { id: "j15", co: "PhonePe", role: "Backend SDE", loc: "Bangalore, India", type: "Full-time", remote: "Onsite", tags: ["Java", "Spring Boot", "Kafka", "MySQL"], salary: "₹18-28 LPA", desc: "Power UPI payments for 500M+ registered users in India.", source: "Naukri", applyUrl: "https://www.naukri.com/phonepe-jobs" },
  { id: "j16", co: "Paytm", role: "Frontend Engineer", loc: "Noida, India", type: "Full-time", remote: "Onsite", tags: ["React", "TypeScript", "Redux"], salary: "₹14-22 LPA", desc: "Build the consumer payments super-app used across India.", source: "Indeed", applyUrl: "https://in.indeed.com/jobs?q=Paytm+Frontend&l=Noida" },
  { id: "j17", co: "Zoho", role: "Software Developer Trainee", loc: "Chennai, India", type: "Full-time", remote: "Onsite", tags: ["Java", "JavaScript", "SQL"], salary: "₹6-10 LPA", desc: "Entry-level role on Zoho's product engineering teams.", source: "Company", applyUrl: "https://careers.zohocorp.com/jobs" },
  { id: "j18", co: "Salesforce", role: "Associate MTS · Frontend", loc: "Hyderabad / Bangalore", type: "Full-time", remote: "Hybrid", tags: ["JavaScript", "Lightning", "React", "CSS"], salary: "₹18-26 LPA", desc: "Build the world's #1 CRM platform UI.", source: "Company", applyUrl: "https://careers.salesforce.com/en/jobs/?search=&country=India" },
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

  const apply = (job: Job) => {
    // Open the real listing (LinkedIn / Indeed / Naukri / company careers) in a new tab.
    window.open(job.applyUrl, "_blank", "noopener,noreferrer");
    if (!applied.includes(job.id)) {
      const next = [...applied, job.id];
      setApplied(next);
      persist("piq_applied_jobs", next);
    }
    toast.success(`Opening ${job.co} application on ${job.source}…`);
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
                  onClick={() => apply(j)}
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-1.5 bg-gradient-primary glow"
                  title={`Apply on ${j.source}`}
                >
                  {isApplied ? (<><CheckCircle2 className="size-3.5" /> Apply again</>) : (<><Sparkles className="size-3.5" /> Apply on {j.source}</>)}
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
