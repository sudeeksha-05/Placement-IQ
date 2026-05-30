import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileSpreadsheet } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";

export const Route = createFileRoute("/dashboard/admin/analytics")({
  component: Analytics,
});

function Analytics() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [p, r] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("resumes").select("*"),
      ]);
      setProfiles(p.data || []);
      setResumes(r.data || []);
    })();
  }, []);

  // Most popular roles
  const roleCounts: Record<string, number> = {};
  profiles.forEach(p => { if (p.target_role) roleCounts[p.target_role] = (roleCounts[p.target_role] || 0) + 1; });
  const popularRoles = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([role, n]) => ({ role, n }));

  // Top performers by best ats
  const bestByUser: Record<string, number> = {};
  resumes.forEach(r => {
    if (r.ats_score != null && (!bestByUser[r.user_id] || r.ats_score > bestByUser[r.user_id])) bestByUser[r.user_id] = r.ats_score;
  });
  const topUsers = Object.entries(bestByUser)
    .map(([uid, score]) => ({ profile: profiles.find(p => p.id === uid), score }))
    .filter(x => x.profile).sort((a, b) => b.score - a.score).slice(0, 10);
  const lowUsers = [...topUsers].reverse().slice(0, 5);

  // Skill gap: aggregate missing_skills
  const skillCounts: Record<string, number> = {};
  resumes.forEach(r => {
    (r.missing_skills as any[] || []).forEach((s: any) => {
      const key = typeof s === "string" ? s : s?.name;
      if (key) skillCounts[key] = (skillCounts[key] || 0) + 1;
    });
  });
  const topGaps = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([skill, n]) => ({ skill, n }));

  // Readiness: avg score buckets
  const ready = resumes.filter(r => (r.ats_score || 0) >= 75).length;
  const partial = resumes.filter(r => (r.ats_score || 0) >= 50 && (r.ats_score || 0) < 75).length;
  const notReady = resumes.filter(r => (r.ats_score || 0) < 50).length;

  const exportCSV = () => {
    const rows = [["Name", "College", "Branch", "Target Role", "Best ATS"]];
    profiles.forEach(p => {
      rows.push([p.full_name || "", p.college || "", p.branch || "", p.target_role || "", String(bestByUser[p.id] ?? "")]);
    });
    const csv = rows.map(r => r.map(c => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `placementiq-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const exportPDF = () => window.print();

  return (
    <AdminShell title="Reports & Analytics" subtitle="Platform performance insights">
      <div className="flex gap-2 mb-4">
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg glass hover:bg-white/10 text-sm">
          <FileSpreadsheet className="size-4"/> Export CSV
        </button>
        <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 rounded-lg glass hover:bg-white/10 text-sm">
          <Download className="size-4"/> Print / PDF
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <Stat label="Placement Ready (75+)" value={ready} color="emerald"/>
        <Stat label="Almost Ready (50-74)" value={partial} color="amber"/>
        <Stat label="Needs Work (<50)" value={notReady} color="rose"/>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Most Popular Job Roles">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={popularRoles} layout="vertical">
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.3}/>
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11}/>
              <YAxis type="category" dataKey="role" stroke="hsl(var(--muted-foreground))" fontSize={11} width={120}/>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}/>
              <Bar dataKey="n" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Top Skill Gaps">
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={topGaps}>
              <PolarGrid stroke="hsl(var(--border))"/>
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}/>
              <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" fontSize={10}/>
              <Radar dataKey="n" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.4}/>
            </RadarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Top Performing Students">
          <table className="w-full text-sm">
            <thead><tr className="text-xs uppercase text-muted-foreground">
              <th className="text-left p-2">Name</th><th className="text-left p-2">Role</th><th className="text-right p-2">ATS</th>
            </tr></thead>
            <tbody>
              {topUsers.map((u, i) => (
                <tr key={i} className="border-t border-border/30">
                  <td className="p-2">{u.profile.full_name || "—"}</td>
                  <td className="p-2 text-muted-foreground">{u.profile.target_role || "—"}</td>
                  <td className="p-2 text-right font-semibold text-emerald-300">{u.score}</td>
                </tr>
              ))}
              {topUsers.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">No data</td></tr>}
            </tbody>
          </table>
        </Panel>

        <Panel title="Lowest ATS Scores">
          <table className="w-full text-sm">
            <thead><tr className="text-xs uppercase text-muted-foreground">
              <th className="text-left p-2">Name</th><th className="text-left p-2">Role</th><th className="text-right p-2">ATS</th>
            </tr></thead>
            <tbody>
              {lowUsers.map((u, i) => (
                <tr key={i} className="border-t border-border/30">
                  <td className="p-2">{u.profile.full_name || "—"}</td>
                  <td className="p-2 text-muted-foreground">{u.profile.target_role || "—"}</td>
                  <td className="p-2 text-right font-semibold text-rose-300">{u.score}</td>
                </tr>
              ))}
              {lowUsers.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">No data</td></tr>}
            </tbody>
          </table>
        </Panel>
      </div>
    </AdminShell>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass neon-border rounded-2xl p-5">
      <h3 className="font-display font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}
function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const map: Record<string, string> = {
    emerald: "from-emerald-500/30 to-emerald-500/0 text-emerald-300",
    amber: "from-amber-500/30 to-amber-500/0 text-amber-300",
    rose: "from-rose-500/30 to-rose-500/0 text-rose-300",
  };
  return (
    <div className={`glass neon-border rounded-2xl p-5 relative overflow-hidden`}>
      <div className={`absolute -top-12 -right-12 size-40 rounded-full bg-gradient-to-br ${map[color]} blur-2xl`}/>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`text-4xl font-display font-bold mt-2 ${map[color].split(" ").pop()}`}>{value}</div>
    </div>
  );
}
