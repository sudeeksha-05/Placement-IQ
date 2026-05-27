import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight, FileText, Target, Brain, MessageSquareCode,
  TrendingUp, Sparkles, Bot, Zap, Shield, CheckCircle2, Star,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PlacementIQ — AI Placement Readiness for Students" },
      { name: "description", content: "Land your dream job with AI-powered resume analysis, mock interviews, skill gap tracking, and personalized career roadmaps." },
      { property: "og:title", content: "PlacementIQ — AI Placement Readiness" },
      { property: "og:description", content: "AI-powered placement readiness platform for students." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: FileText, title: "Resume ATS Analyzer", desc: "Upload your resume and get an instant ATS score with role-specific keyword suggestions." },
  { icon: Target, title: "Skill Gap Analyzer", desc: "Compare your skills against your target role and get a personalized closing plan." },
  { icon: Sparkles, title: "AI Career Roadmap", desc: "Daily, weekly, and monthly goals tailored to your target role and experience." },
  { icon: Brain, title: "Adaptive Quizzes", desc: "DSA, DBMS, OS, CN, Aptitude — timed, scored, leaderboard ranked." },
  { icon: MessageSquareCode, title: "Mock Interviews", desc: "AI-generated HR, technical, and coding interviews with confidence scoring." },
  { icon: Bot, title: "AI Career Assistant", desc: "24/7 chatbot for resume tips, coding help, and placement strategy." },
];

const stats = [
  { value: "50K+", label: "Students" },
  { value: "92%", label: "Placement Rate" },
  { value: "1.2M", label: "Quizzes Taken" },
  { value: "4.9★", label: "User Rating" },
];

const testimonials = [
  { name: "Aditi R.", role: "SWE @ Microsoft", text: "PlacementIQ's ATS analyzer caught everything my college portal missed. Got 3 offers in 6 weeks." },
  { name: "Rohan M.", role: "Data Analyst @ Flipkart", text: "The skill-gap roadmap was eerily accurate. It felt like having a senior mentor on speed dial." },
  { name: "Sneha K.", role: "AI Engineer @ Adobe", text: "Mock interviews here are brutal in the best way. Real interviews felt easier afterward." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <div className="absolute inset-0 bg-hero pointer-events-none" />
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      <Navbar />

      {/* HERO */}
      <section className="relative pt-40 pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs mb-8"
          >
            <span className="size-1.5 rounded-full bg-neon animate-pulse" />
            AI-powered · Built for Gen Z talent
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-bold leading-[1.05] tracking-tight"
          >
            Land Your Dream Job, <br />
            <span className="text-gradient">One Skill at a Time.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            AI-powered placement readiness platform for students. Resume analysis,
            mock interviews, skill tracking — all in one futuristic dashboard.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-primary text-white font-semibold glow-strong hover:scale-[1.03] transition"
            >
              Start Free Assessment
              <ArrowRight className="size-4 group-hover:translate-x-1 transition" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass-strong hover:bg-white/10 transition"
            >
              Login
            </Link>
          </motion.div>

          {/* Hero preview card */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-20 relative max-w-4xl mx-auto"
          >
            <div className="glass-strong neon-border rounded-3xl p-6 md:p-8 glow">
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { label: "ATS Score", value: "87", sub: "+12 this week", color: "from-primary to-accent" },
                  { label: "Skills Detected", value: "24", sub: "of 32 required", color: "from-accent to-neon-2" },
                  { label: "Interview Ready", value: "92%", sub: "Top 5% percentile", color: "from-neon to-primary" },
                ].map((c) => (
                  <div key={c.label} className="glass rounded-2xl p-5 text-left">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{c.label}</p>
                    <p className={`text-5xl font-display font-bold mt-2 bg-gradient-to-br ${c.color} bg-clip-text text-transparent`}>
                      {c.value}
                    </p>
                    <p className="text-xs text-neon-2 mt-1">{c.sub}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -inset-4 bg-gradient-primary opacity-20 blur-3xl -z-10 rounded-3xl" />
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm text-neon-2 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold">
              Everything you need to <span className="text-gradient">get hired</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -6 }}
                className="glass neon-border rounded-2xl p-6 group relative overflow-hidden"
              >
                <div className="absolute -top-20 -right-20 size-48 rounded-full bg-primary/20 blur-3xl group-hover:bg-primary/40 transition" />
                <div className="size-12 rounded-xl bg-gradient-primary grid place-items-center glow mb-4 relative">
                  <f.icon className="size-5 text-white" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2 relative">{f.title}</h3>
                <p className="text-sm text-muted-foreground relative">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto glass-strong neon-border rounded-3xl p-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-4xl md:text-5xl font-display font-bold text-gradient">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="about" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm text-neon-2 uppercase tracking-widest mb-3">Loved by students</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold">
              From dorm room to <span className="text-gradient">dream company</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="glass neon-border rounded-2xl p-6">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-neon text-neon" />
                  ))}
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">"{t.text}"</p>
                <div className="mt-5 pt-5 border-t border-border/50">
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto glass-strong neon-border rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-10" />
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-display font-bold">
              Ready to <span className="text-gradient">level up</span>?
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Join 50,000+ students using PlacementIQ to crack top tech companies.
            </p>
            <Link
              to="/signup"
              className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-primary text-white font-semibold glow-strong hover:scale-105 transition"
            >
              Get started free
              <ArrowRight className="size-4" />
            </Link>
            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-neon-2" /> No credit card</span>
              <span className="flex items-center gap-1.5"><Zap className="size-3.5 text-neon-2" /> Instant ATS scan</span>
              <span className="flex items-center gap-1.5"><Shield className="size-3.5 text-neon-2" /> Privacy first</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
