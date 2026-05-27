import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Upload, Sparkles } from "lucide-react";

export const Route = createFileRoute("/profile-setup")({
  head: () => ({ meta: [{ title: "Profile Setup — PlacementIQ" }] }),
  component: ProfileSetup,
});

function ProfileSetup() {
  return (
    <div className="min-h-screen bg-background bg-hero relative px-4 py-16">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-3xl mx-auto glass-strong neon-border rounded-3xl p-8 md:p-10 glow"
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="size-4 text-neon" />
          <span className="text-xs uppercase tracking-widest text-neon-2">Step 1 of 1</span>
        </div>
        <h1 className="text-3xl font-display font-bold">Tell us about yourself</h1>
        <p className="text-sm text-muted-foreground mt-1">
          We'll personalize your AI roadmap based on this.
        </p>

        <form className="mt-8 grid md:grid-cols-2 gap-4" onSubmit={(e) => e.preventDefault()}>
          <Input label="Full Name" placeholder="Aditi Sharma" />
          <Input label="College Name" placeholder="IIT Bombay" />
          <Input label="Branch" placeholder="Computer Science" />
          <Input label="Graduation Year" placeholder="2027" />
          <Input label="Target Job Role" placeholder="Frontend Developer" />
          <Select label="Experience Level" options={["Fresher", "1-2 Years", "3-5 Years"]} />
          <Input label="LinkedIn URL" placeholder="linkedin.com/in/..." className="md:col-span-2" />
          <Input label="GitHub URL" placeholder="github.com/..." className="md:col-span-2" />
          <Input label="Skills (comma separated)" placeholder="React, Node.js, Python..." className="md:col-span-2" />
          <Input label="Interests" placeholder="Web Dev, AI/ML, Design..." className="md:col-span-2" />

          <div className="md:col-span-2">
            <label className="text-xs text-muted-foreground mb-1.5 block">Resume Upload</label>
            <div className="glass neon-border rounded-xl p-8 text-center cursor-pointer hover:bg-white/5 transition">
              <Upload className="size-6 mx-auto text-neon mb-2" />
              <p className="text-sm">Drop your PDF here or <span className="text-gradient font-semibold">browse</span></p>
              <p className="text-xs text-muted-foreground mt-1">Max 5MB · PDF only</p>
            </div>
          </div>

          <Link
            to="/dashboard"
            className="md:col-span-2 block text-center w-full py-3 rounded-xl bg-gradient-primary text-white font-semibold glow hover:scale-[1.01] transition mt-2"
          >
            Complete Setup & Open Dashboard
          </Link>
        </form>
      </motion.div>
    </div>
  );
}

function Input({ label, className = "", ...props }: any) {
  return (
    <div className={className}>
      <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
      <input
        {...props}
        className="w-full glass rounded-xl px-3 py-2.5 text-sm bg-transparent outline-none focus:ring-2 ring-primary transition placeholder:text-muted-foreground"
      />
    </div>
  );
}
function Select({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
      <select className="w-full glass rounded-xl px-3 py-2.5 text-sm bg-transparent outline-none focus:ring-2 ring-primary transition">
        {options.map((o) => <option key={o} className="bg-background">{o}</option>)}
      </select>
    </div>
  );
}
