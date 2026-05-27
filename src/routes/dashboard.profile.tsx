import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Github, Linkedin, Mail, MapPin, GraduationCap, Briefcase, Pencil } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/dashboard/profile")({
  head: () => ({ meta: [{ title: "Profile — PlacementIQ" }] }),
  component: Profile,
});

function Profile() {
  return (
    <DashboardShell title="My Profile" subtitle="Manage your placement profile">
      <motion.div whileHover={{ y: -2 }} className="glass-strong neon-border rounded-2xl p-8 mb-6 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 size-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div className="size-24 rounded-2xl bg-gradient-primary grid place-items-center text-3xl font-display font-bold glow">AR</div>
          <div className="flex-1">
            <h2 className="text-3xl font-display font-bold">Aditi Roy</h2>
            <p className="text-muted-foreground">Frontend Developer · Final Year</p>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><GraduationCap className="size-3.5" /> IIT Bombay · CSE · 2027</span>
              <span className="flex items-center gap-1"><MapPin className="size-3.5" /> Mumbai, India</span>
              <span className="flex items-center gap-1"><Briefcase className="size-3.5" /> Open to internships</span>
            </div>
            <div className="flex gap-2 mt-4">
              <a className="glass rounded-lg p-2 hover:bg-white/10"><Github className="size-4" /></a>
              <a className="glass rounded-lg p-2 hover:bg-white/10"><Linkedin className="size-4" /></a>
              <a className="glass rounded-lg p-2 hover:bg-white/10"><Mail className="size-4" /></a>
            </div>
          </div>
          <button className="px-4 py-2 rounded-lg bg-gradient-primary text-white text-sm glow flex items-center gap-2">
            <Pencil className="size-3.5" /> Edit Profile
          </button>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6">
          <h3 className="font-display font-bold mb-3">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {["React", "TypeScript", "Node.js", "MongoDB", "Tailwind", "Next.js", "Git", "REST APIs"].map((s) => (
              <span key={s} className="text-xs px-3 py-1.5 rounded-lg glass border border-primary/30">{s}</span>
            ))}
          </div>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6">
          <h3 className="font-display font-bold mb-3">Achievements</h3>
          <ul className="space-y-2 text-sm">
            {[
              "🏆 Top 5% in DSA Quiz Arena",
              "🔥 14-day learning streak",
              "🎯 ATS score 87 — Excellent",
              "🚀 3 projects shipped this month",
            ].map((a) => (
              <li key={a} className="glass rounded-xl p-3">{a}</li>
            ))}
          </ul>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
