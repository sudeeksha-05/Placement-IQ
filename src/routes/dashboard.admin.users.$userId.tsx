import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { initialsOf } from "@/hooks/useProfile";
import { ArrowLeft, Github, Linkedin, Mail, MapPin } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/dashboard/admin/users/$userId")({
  component: UserDetail,
});

function UserDetail() {
  const { userId } = Route.useParams();
  const [profile, setProfile] = useState<any>(null);
  const [resumes, setResumes] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [p, r, l] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("resumes").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
        supabase.from("activity_logs" as any).select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      ]);
      setProfile(p.data);
      setResumes(r.data || []);
      setLogs((l.data as any[]) || []);
    })();
  }, [userId]);

  if (!profile) return <AdminShell title="Loading…">…</AdminShell>;

  const atsHistory = resumes.filter(r => r.ats_score != null).map((r, i) => ({
    idx: `#${i + 1}`, score: r.ats_score,
  }));

  const quizLogs = logs.filter(l => l.action === "quiz_completed");
  const interviewLogs = logs.filter(l => l.action === "interview_completed");

  return (
    <AdminShell title={profile.full_name || "User"} subtitle={profile.target_role || "—"}>
      <Link to="/dashboard/admin/users" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="size-3"/> Back to users
      </Link>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass neon-border rounded-2xl p-5 lg:col-span-1">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="size-20 rounded-2xl bg-gradient-to-br from-primary to-accent grid place-items-center text-2xl font-bold glow">
              {initialsOf(profile.full_name, profile.id)}
            </div>
            <h2 className="font-display font-bold text-lg mt-3">{profile.full_name || "Unnamed"}</h2>
            <p className="text-xs text-muted-foreground">{profile.experience_level || "—"}</p>
            <span className={`mt-2 px-2 py-0.5 rounded text-xs ${profile.status === "disabled" ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"}`}>
              {profile.status || "active"}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <Row icon={<MapPin className="size-4"/>} label={profile.location || "—"}/>
            <Row icon={<Github className="size-4"/>} label={profile.github_url || "—"}/>
            <Row icon={<Linkedin className="size-4"/>} label={profile.linkedin_url || "—"}/>
            <Row icon={<Mail className="size-4"/>} label={profile.id}/>
          </div>
          <div className="mt-4 pt-4 border-t border-border/40 text-sm space-y-1">
            <Info k="College" v={profile.college}/>
            <Info k="Branch" v={profile.branch}/>
            <Info k="Graduation" v={profile.graduation_year}/>
          </div>
          {profile.bio && <p className="mt-4 text-xs text-muted-foreground">{profile.bio}</p>}
          {profile.skills?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {profile.skills.map((s: string) => (
                <span key={s} className="px-2 py-0.5 rounded-full text-[10px] glass">{s}</span>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Resumes" value={resumes.length}/>
            <Stat label="Quizzes" value={quizLogs.length}/>
            <Stat label="Interviews" value={interviewLogs.length}/>
          </div>

          <div className="glass neon-border rounded-2xl p-5">
            <h3 className="font-display font-semibold mb-3">ATS Score History</h3>
            {atsHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={atsHistory}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.3}/>
                  <XAxis dataKey="idx" stroke="hsl(var(--muted-foreground))" fontSize={11}/>
                  <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11}/>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}/>
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2}/>
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground">No resume uploads yet.</p>}
          </div>

          <div className="glass neon-border rounded-2xl p-5">
            <h3 className="font-display font-semibold mb-3">Recent Activity</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {logs.length === 0 && <p className="text-sm text-muted-foreground">No activity recorded.</p>}
              {logs.map(l => (
                <div key={l.id} className="flex items-center justify-between text-sm py-2 border-b border-border/30 last:border-0">
                  <div>
                    <div className="font-medium">{l.action.replace(/_/g, " ")}</div>
                    {l.metadata?.score != null && <div className="text-xs text-muted-foreground">Score: {l.metadata.score}</div>}
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function Row({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <div className="flex items-center gap-2 text-muted-foreground"><span className="text-primary">{icon}</span><span className="truncate">{label}</span></div>;
}
function Info({ k, v }: { k: string; v: any }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{k}</span><span>{v || "—"}</span></div>;
}
function Stat({ label, value }: { label: string; value: number }) {
  return <div className="glass rounded-xl p-4 text-center"><div className="text-2xl font-display font-bold text-gradient">{value}</div><div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div></div>;
}
