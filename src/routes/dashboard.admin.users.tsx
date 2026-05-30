import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Eye, Ban, Trash2, CheckCircle2 } from "lucide-react";
import { initialsOf } from "@/hooks/useProfile";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/users")({
  component: UsersAdmin,
});

function UsersAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [resumes, setResumes] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");
  const [role, setRole] = useState("");
  const [scoreMin, setScoreMin] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: rs }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("resumes").select("user_id, ats_score"),
    ]);
    const map: Record<string, number> = {};
    (rs || []).forEach((r: any) => {
      if (r.ats_score != null && (!map[r.user_id] || r.ats_score > map[r.user_id])) {
        map[r.user_id] = r.ats_score;
      }
    });
    setResumes(map);
    setRows(profiles || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter(r => {
    const score = resumes[r.id] ?? 0;
    if (q && !`${r.full_name ?? ""} ${r.target_role ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (college && r.college !== college) return false;
    if (branch && r.branch !== branch) return false;
    if (role && r.target_role !== role) return false;
    if (score < scoreMin) return false;
    return true;
  }), [rows, resumes, q, college, branch, role, scoreMin]);

  const unique = (k: string) => Array.from(new Set(rows.map(r => r[k]).filter(Boolean))) as string[];

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`User ${status}`); load(); }
  };

  const removeUser = async (id: string) => {
    if (!confirm("Delete this user profile? This cannot be undone.")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Profile deleted"); load(); }
  };

  return (
    <AdminShell title="User Management" subtitle={`${filtered.length} of ${rows.length} users`}>
      <div className="glass rounded-2xl p-4 mb-4 grid md:grid-cols-5 gap-3">
        <div className="md:col-span-2 flex items-center gap-2 glass rounded-lg px-3 py-2">
          <Search className="size-4 text-muted-foreground"/>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or role…"
            className="bg-transparent outline-none flex-1 text-sm"/>
        </div>
        <select value={college} onChange={e => setCollege(e.target.value)} className="glass rounded-lg px-3 py-2 text-sm bg-card">
          <option value="">All colleges</option>
          {unique("college").map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={branch} onChange={e => setBranch(e.target.value)} className="glass rounded-lg px-3 py-2 text-sm bg-card">
          <option value="">All branches</option>
          {unique("branch").map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={role} onChange={e => setRole(e.target.value)} className="glass rounded-lg px-3 py-2 text-sm bg-card">
          <option value="">All roles</option>
          {unique("target_role").map(c => <option key={c}>{c}</option>)}
        </select>
        <div className="md:col-span-5 flex items-center gap-3 text-xs text-muted-foreground">
          Min ATS: <input type="range" min={0} max={100} value={scoreMin} onChange={e => setScoreMin(+e.target.value)} className="flex-1"/>
          <span className="font-semibold text-foreground w-8">{scoreMin}</span>
        </div>
      </div>

      <div className="glass neon-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3">User</th>
                <th className="text-left p-3">College</th>
                <th className="text-left p-3">Branch</th>
                <th className="text-left p-3">Year</th>
                <th className="text-left p-3">Target</th>
                <th className="text-left p-3">ATS</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Loading…</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No users match filters</td></tr>}
              {filtered.map(r => {
                const score = resumes[r.id];
                const status = r.status || "active";
                return (
                  <tr key={r.id} className="border-t border-border/40 hover:bg-white/5">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center text-xs font-semibold">
                          {initialsOf(r.full_name, r.id)}
                        </div>
                        <div>
                          <div className="font-semibold">{r.full_name || "Unnamed"}</div>
                          <div className="text-xs text-muted-foreground">{r.location || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{r.college || "—"}</td>
                    <td className="p-3 text-muted-foreground">{r.branch || "—"}</td>
                    <td className="p-3 text-muted-foreground">{r.graduation_year || "—"}</td>
                    <td className="p-3">{r.target_role || "—"}</td>
                    <td className="p-3">
                      {score != null ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          score >= 75 ? "bg-emerald-500/20 text-emerald-300" :
                          score >= 50 ? "bg-amber-500/20 text-amber-300" :
                          "bg-rose-500/20 text-rose-300"
                        }`}>{score}</span>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${status === "disabled" ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                        {status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link to="/dashboard/admin/users/$userId" params={{ userId: r.id }}
                          className="size-8 grid place-items-center rounded-lg hover:bg-white/10" title="View">
                          <Eye className="size-4"/>
                        </Link>
                        {status === "disabled" ? (
                          <button onClick={() => setStatus(r.id, "active")} className="size-8 grid place-items-center rounded-lg hover:bg-emerald-500/20" title="Enable">
                            <CheckCircle2 className="size-4 text-emerald-400"/>
                          </button>
                        ) : (
                          <button onClick={() => setStatus(r.id, "disabled")} className="size-8 grid place-items-center rounded-lg hover:bg-amber-500/20" title="Disable">
                            <Ban className="size-4 text-amber-400"/>
                          </button>
                        )}
                        <button onClick={() => removeUser(r.id)} className="size-8 grid place-items-center rounded-lg hover:bg-rose-500/20" title="Delete">
                          <Trash2 className="size-4 text-rose-400"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
