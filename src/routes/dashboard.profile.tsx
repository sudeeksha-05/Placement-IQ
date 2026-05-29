import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Github, Linkedin, Mail, MapPin, GraduationCap, Briefcase, Save, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useProfile, initialsOf } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/dashboard/profile")({
  head: () => ({ meta: [{ title: "Profile — PlacementIQ" }] }),
  component: Profile,
});

function Profile() {
  const { profile, loading, save } = useProfile();
  const { user } = useAuth();
  const [form, setForm] = useState({
    full_name: "", target_role: "", college: "", branch: "", graduation_year: "",
    bio: "", skills: "", github_url: "", linkedin_url: "", location: "", experience_level: "Fresher",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        target_role: profile.target_role ?? "",
        college: profile.college ?? "",
        branch: profile.branch ?? "",
        graduation_year: profile.graduation_year ?? "",
        bio: profile.bio ?? "",
        skills: (profile.skills ?? []).join(", "),
        github_url: profile.github_url ?? "",
        linkedin_url: profile.linkedin_url ?? "",
        location: profile.location ?? "",
        experience_level: profile.experience_level ?? "Fresher",
      });
    }
  }, [profile]);

  const onChange = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await save({
      full_name: form.full_name.trim() || null,
      target_role: form.target_role.trim() || null,
      college: form.college.trim() || null,
      branch: form.branch.trim() || null,
      graduation_year: form.graduation_year.trim() || null,
      bio: form.bio.trim() || null,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      github_url: form.github_url.trim() || null,
      linkedin_url: form.linkedin_url.trim() || null,
      location: form.location.trim() || null,
      experience_level: form.experience_level,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  };

  if (loading) {
    return (
      <DashboardShell title="My Profile">
        <div className="grid place-items-center py-20"><Loader2 className="size-6 animate-spin text-neon" /></div>
      </DashboardShell>
    );
  }

  const initials = initialsOf(form.full_name, user?.email);
  const skillsList = form.skills.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <DashboardShell title="My Profile" subtitle="Manage your placement profile">
      <motion.div whileHover={{ y: -2 }} className="glass-strong neon-border rounded-2xl p-8 mb-6 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 size-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div className="size-24 rounded-2xl bg-gradient-primary grid place-items-center text-3xl font-display font-bold glow">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-display font-bold truncate">{form.full_name || "Your name"}</h2>
            <p className="text-muted-foreground truncate">
              {form.target_role || "Target role"}{form.experience_level ? ` · ${form.experience_level}` : ""}
            </p>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
              {(form.college || form.branch || form.graduation_year) && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="size-3.5" />
                  {[form.college, form.branch, form.graduation_year].filter(Boolean).join(" · ")}
                </span>
              )}
              {form.location && <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {form.location}</span>}
              <span className="flex items-center gap-1"><Mail className="size-3.5" /> {user?.email}</span>
            </div>
            <div className="flex gap-2 mt-4">
              {form.github_url && <a href={form.github_url} target="_blank" rel="noreferrer" className="glass rounded-lg p-2 hover:bg-white/10"><Github className="size-4" /></a>}
              {form.linkedin_url && <a href={form.linkedin_url} target="_blank" rel="noreferrer" className="glass rounded-lg p-2 hover:bg-white/10"><Linkedin className="size-4" /></a>}
            </div>
          </div>
        </div>
      </motion.div>

      <form onSubmit={onSave} className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass neon-border rounded-2xl p-6">
            <h3 className="font-display font-bold mb-4">Basic Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name"><input className={inp} value={form.full_name} onChange={onChange("full_name")} placeholder="Your name" /></Field>
              <Field label="Target Role"><input className={inp} value={form.target_role} onChange={onChange("target_role")} placeholder="Frontend Developer" /></Field>
              <Field label="College"><input className={inp} value={form.college} onChange={onChange("college")} placeholder="IIT Bombay" /></Field>
              <Field label="Branch"><input className={inp} value={form.branch} onChange={onChange("branch")} placeholder="Computer Science" /></Field>
              <Field label="Graduation Year"><input className={inp} value={form.graduation_year} onChange={onChange("graduation_year")} placeholder="2027" /></Field>
              <Field label="Experience Level">
                <select className={inp} value={form.experience_level} onChange={onChange("experience_level")}>
                  <option className="bg-background">Fresher</option>
                  <option className="bg-background">1-2 Years</option>
                  <option className="bg-background">3-5 Years</option>
                  <option className="bg-background">5+ Years</option>
                </select>
              </Field>
              <Field label="Location" className="sm:col-span-2"><input className={inp} value={form.location} onChange={onChange("location")} placeholder="Mumbai, India" /></Field>
              <Field label="Bio" className="sm:col-span-2">
                <textarea rows={3} className={inp} value={form.bio} onChange={onChange("bio")} placeholder="A short summary about you..." />
              </Field>
            </div>
          </div>

          <div className="glass neon-border rounded-2xl p-6">
            <h3 className="font-display font-bold mb-4">Links</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="GitHub URL"><input className={inp} value={form.github_url} onChange={onChange("github_url")} placeholder="https://github.com/..." /></Field>
              <Field label="LinkedIn URL"><input className={inp} value={form.linkedin_url} onChange={onChange("linkedin_url")} placeholder="https://linkedin.com/in/..." /></Field>
            </div>
          </div>

          <div className="glass neon-border rounded-2xl p-6">
            <h3 className="font-display font-bold mb-2">Skills</h3>
            <p className="text-xs text-muted-foreground mb-3">Comma separated</p>
            <textarea rows={2} className={inp} value={form.skills} onChange={onChange("skills")} placeholder="React, TypeScript, Node.js..." />
            {skillsList.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {skillsList.map((s) => (
                  <span key={s} className="text-xs px-3 py-1.5 rounded-lg glass border border-primary/30">{s}</span>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={saving} className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-primary text-white font-semibold glow hover:scale-[1.01] transition flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>

        <div className="space-y-4">
          <div className="glass neon-border rounded-2xl p-6">
            <h3 className="font-display font-bold mb-3 flex items-center gap-2"><Briefcase className="size-4 text-neon" /> Profile Strength</h3>
            <ProfileStrength form={form} />
          </div>
          <div className="glass neon-border rounded-2xl p-6">
            <h3 className="font-display font-bold mb-3">Tips</h3>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
              <li>Set a clear <b>target role</b> — the AI roadmap is built around it.</li>
              <li>Add 6+ <b>skills</b> for better job matching.</li>
              <li>Link <b>GitHub & LinkedIn</b> so recruiters can verify.</li>
            </ul>
          </div>
        </div>
      </form>
    </DashboardShell>
  );
}

const inp = "w-full glass rounded-xl px-3 py-2.5 text-sm bg-transparent outline-none focus:ring-2 ring-primary transition placeholder:text-muted-foreground";

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function ProfileStrength({ form }: { form: any }) {
  const fields = ["full_name", "target_role", "college", "branch", "graduation_year", "bio", "skills", "github_url", "linkedin_url", "location"];
  const filled = fields.filter((k) => (form[k] ?? "").toString().trim().length > 0).length;
  const pct = Math.round((filled / fields.length) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{filled} / {fields.length} fields</span>
        <span className="text-2xl font-display font-bold text-gradient">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full bg-gradient-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
