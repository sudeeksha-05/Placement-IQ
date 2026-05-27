import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Building2, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/dashboard/jobs")({
  head: () => ({ meta: [{ title: "Job Match — PlacementIQ" }] }),
  component: Jobs,
});

const jobs = [
  { co: "Stripe", role: "Frontend Engineer · Intern", loc: "Bangalore (Hybrid)", match: 94, tags: ["React", "TypeScript", "GraphQL"] },
  { co: "Razorpay", role: "SDE-1 · Web Platform", loc: "Bangalore", match: 89, tags: ["React", "Node.js", "Testing"] },
  { co: "Zomato", role: "Frontend Developer", loc: "Gurgaon", match: 82, tags: ["React", "Next.js", "Performance"] },
  { co: "Postman", role: "UI Engineer", loc: "Remote", match: 78, tags: ["TypeScript", "Design Systems"] },
  { co: "CRED", role: "Junior Web Developer", loc: "Bangalore", match: 75, tags: ["React", "Animations"] },
];

function Jobs() {
  return (
    <DashboardShell title="Job Match Analyzer" subtitle="Live openings ranked against your skill profile">
      <div className="grid gap-4">
        {jobs.map((j, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -2 }}
            className="glass neon-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4"
          >
            <div className="size-14 rounded-xl bg-gradient-primary grid place-items-center glow shrink-0">
              <Building2 className="size-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <h3 className="font-display font-bold text-lg">{j.co}</h3>
                <span className="text-sm text-muted-foreground">{j.role}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><MapPin className="size-3" /> {j.loc}</span>
                <span className="flex items-center gap-1"><Briefcase className="size-3" /> Full-time</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {j.tags.map((t) => (
                  <span key={t} className="text-xs glass rounded-md px-2 py-0.5">{t}</span>
                ))}
              </div>
            </div>
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-gradient">{j.match}%</p>
              <p className="text-xs text-muted-foreground">match</p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-gradient-primary text-white text-sm font-medium glow flex items-center gap-1.5 shrink-0">
              <Sparkles className="size-3.5" /> Apply
            </button>
          </motion.div>
        ))}
      </div>
    </DashboardShell>
  );
}
